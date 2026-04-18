from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo import MongoClient

from app.core.config import (
    MONGO_URI,
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_AUTH_SOURCE,
)
from app.db.mongodb import get_appointments_collection
from app.models.appointment_model import build_appointment_document, serialize_appointment
from app.utils.notification_dispatcher import dispatch_bulk_notifications

ACTIVE_CONFLICT_STATUSES = ["PAYMENT_PENDING", "PENDING", "CONFIRMED", "RESCHEDULED"]

DOCTOR_ALLOWED_STATUS_TRANSITIONS = {
    "PAYMENT_PENDING": {"CONFIRMED", "REJECTED", "CANCELLED"},
    "PENDING": {"CONFIRMED", "REJECTED", "CANCELLED"},
    "CONFIRMED": {"COMPLETED", "CANCELLED"},
    "REJECTED": set(),
    "RESCHEDULED": set(),
    "CANCELLED": set(),
    "COMPLETED": set(),
}

PATIENT_ALLOWED_STATUS_TRANSITIONS = {
    "PAYMENT_PENDING": {"CANCELLED"},
    "PENDING": {"CANCELLED"},
    "CONFIRMED": {"CANCELLED"},
    "REJECTED": set(),
    "RESCHEDULED": set(),
    "CANCELLED": set(),
    "COMPLETED": set(),
}

_service_client = MongoClient(
    MONGO_URI,
    username=MONGO_USERNAME,
    password=MONGO_PASSWORD,
    authSource=MONGO_AUTH_SOURCE,
)

_patients_collection = _service_client["patient_db"]["patients"]
_doctors_collection = _service_client["doctor_db"]["doctors"]
_availability_collection = _service_client["doctor_db"]["availability_slots"]


def ensure_appointment_indexes():
    appointments = get_appointments_collection()
    appointments.create_index("patientId")
    appointments.create_index("doctorId")
    appointments.create_index("slotId")
    appointments.create_index([("doctorId", 1), ("date", 1), ("timeSlot", 1)])


def _to_object_id(value: str, not_found_detail: str):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=404, detail=not_found_detail) from exc


def _get_patient_or_404(patient_id: str):
    patient = _patients_collection.find_one(
        {"_id": _to_object_id(patient_id, "Patient profile not found")}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


def _get_doctor_or_404(doctor_id: str):
    doctor = _doctors_collection.find_one(
        {"_id": _to_object_id(doctor_id, "Doctor profile not found")}
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return doctor


def _get_available_slot_or_400(doctor_id: str, date: str, start_time: str):
    slot = _availability_collection.find_one(
        {
            "doctorId": doctor_id,
            "date": date,
            "startTime": start_time,
            "isAvailable": True,
        }
    )
    if not slot:
        raise HTTPException(
            status_code=400,
            detail="Selected slot is not available for booking",
        )
    return slot


def _reserve_slot(slot: dict):
    result = _availability_collection.update_one(
        {"_id": slot["_id"], "isAvailable": True},
        {
            "$set": {
                "isAvailable": False,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )
    if result.modified_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Selected slot is no longer available",
        )


def _release_slot(appointment: dict):
    slot_id = appointment.get("slotId")
    if slot_id:
        _availability_collection.update_one(
            {"_id": _to_object_id(slot_id, "Availability slot not found")},
            {
                "$set": {
                    "isAvailable": True,
                    "updatedAt": datetime.now(timezone.utc),
                }
            },
        )
        return

    _availability_collection.update_one(
        {
            "doctorId": appointment["doctorId"],
            "date": appointment["date"],
            "startTime": appointment["timeSlot"],
        },
        {
            "$set": {
                "isAvailable": True,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )


def _appointment_label(appointment: dict) -> str:
    return f"{appointment.get('date')} at {appointment.get('timeSlot')}"


def _append_status_history(appointment: dict, new_status: str):
    history = appointment.get("statusHistory", [])
    history.append(
        {
            "status": new_status,
            "changedAt": datetime.now(timezone.utc),
        }
    )
    return history


def _apply_status_change(appointment: dict, new_status: str):
    history = _append_status_history(appointment, new_status)

    get_appointments_collection().update_one(
        {"_id": appointment["_id"]},
        {
            "$set": {
                "status": new_status,
                "statusHistory": history,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    updated = get_appointments_collection().find_one({"_id": appointment["_id"]})
    return updated


def _dispatch_status_notifications(updated: dict, old_status: str, new_status: str):
    patient = _get_patient_or_404(updated.get("patientId"))
    doctor = _get_doctor_or_404(updated.get("doctorId"))
    appointment_text = _appointment_label(updated)

    dispatch_bulk_notifications(
        [
            {
                "user_id": patient.get("userId"),
                "title": "Appointment Status Updated",
                "message": f"Your appointment with {doctor.get('fullName')} on {appointment_text} changed from {old_status} to {new_status}.",
                "notification_type": "APPOINTMENT",
                "email_to": patient.get("email"),
                "email_subject": "Appointment Status Updated - Smart Healthcare",
                "email_body": f"Hello {patient.get('fullName')},\n\nYour appointment with {doctor.get('fullName')} on {appointment_text} changed from {old_status} to {new_status}.\n\nRegards,\nSmart Healthcare",
            },
            {
                "user_id": doctor.get("userId"),
                "title": "Appointment Status Updated",
                "message": f"Appointment with {patient.get('fullName')} on {appointment_text} changed from {old_status} to {new_status}.",
                "notification_type": "APPOINTMENT",
                "email_to": doctor.get("email"),
                "email_subject": "Appointment Status Updated - Smart Healthcare",
                "email_body": f"Hello {doctor.get('fullName')},\n\nThe appointment with {patient.get('fullName')} on {appointment_text} changed from {old_status} to {new_status}.\n\nRegards,\nSmart Healthcare",
            },
        ]
    )


def create_appointment(payload):
    appointments = get_appointments_collection()

    patient = _get_patient_or_404(payload.patientId)
    doctor = _get_doctor_or_404(payload.doctorId)

    if doctor.get("approvalStatus") != "APPROVED":
        raise HTTPException(
            status_code=400,
            detail="Appointments can only be booked with approved doctors",
        )

    existing = appointments.find_one(
        {
            "doctorId": payload.doctorId,
            "date": payload.date,
            "timeSlot": payload.timeSlot,
            "status": {"$in": ACTIVE_CONFLICT_STATUSES},
        }
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This doctor already has an active appointment for the selected slot",
        )

    slot = _get_available_slot_or_400(
        payload.doctorId,
        payload.date,
        payload.timeSlot,
    )

    _reserve_slot(slot)

    try:
        result = appointments.insert_one(
            build_appointment_document(
                payload=payload,
                slot_id=str(slot["_id"]),
                slot_end_time=slot["endTime"],
            )
        )
    except Exception:
        _availability_collection.update_one(
            {"_id": slot["_id"]},
            {"$set": {"isAvailable": True, "updatedAt": datetime.now(timezone.utc)}},
        )
        raise

    created = appointments.find_one({"_id": result.inserted_id})
    serialized = serialize_appointment(created)

    appointment_text = _appointment_label(created)
    consultation_type = str(created.get("consultationType", "ONLINE")).lower()
    current_status = created.get("status", "PENDING")

    dispatch_bulk_notifications(
        [
            {
                "user_id": patient.get("userId"),
                "title": "Appointment Created",
                "message": f"Your {consultation_type} appointment with {doctor.get('fullName')} on {appointment_text} was created. Current status: {current_status}.",
                "notification_type": "APPOINTMENT",
                "email_to": patient.get("email"),
                "email_subject": "Appointment Created - Smart Healthcare",
                "email_body": f"Hello {patient.get('fullName')},\n\nYour {consultation_type} appointment with {doctor.get('fullName')} on {appointment_text} was created successfully.\nCurrent status: {current_status}.\n\nRegards,\nSmart Healthcare",
            },
            {
                "user_id": doctor.get("userId"),
                "title": "New Appointment Request",
                "message": f"New {consultation_type} appointment request from {patient.get('fullName')} for {appointment_text}. Current status: {current_status}.",
                "notification_type": "APPOINTMENT",
                "email_to": doctor.get("email"),
                "email_subject": "New Appointment Request - Smart Healthcare",
                "email_body": f"Hello {doctor.get('fullName')},\n\nA new {consultation_type} appointment request from {patient.get('fullName')} has been created for {appointment_text}.\nCurrent status: {current_status}.\n\nRegards,\nSmart Healthcare",
            },
        ]
    )

    return serialized


def list_appointments_by_patient(patient_id: str):
    cursor = get_appointments_collection().find({"patientId": patient_id}).sort(
        [("date", 1), ("timeSlot", 1), ("createdAt", -1)]
    )
    return [serialize_appointment(doc) for doc in cursor]


def list_appointments_by_doctor(doctor_id: str):
    cursor = get_appointments_collection().find({"doctorId": doctor_id}).sort(
        [("date", 1), ("timeSlot", 1), ("createdAt", -1)]
    )
    return [serialize_appointment(doc) for doc in cursor]


def get_appointment_by_id(appointment_id: str):
    appointment = get_appointments_collection().find_one(
        {"_id": _to_object_id(appointment_id, "Appointment not found")}
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return serialize_appointment(appointment)


def update_appointment_status(appointment_id: str, payload):
    appointments = get_appointments_collection()
    appointment = appointments.find_one({"_id": _to_object_id(appointment_id, "Appointment not found")})

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    old_status = appointment.get("status")
    new_status = payload.status

    allowed = DOCTOR_ALLOWED_STATUS_TRANSITIONS.get(old_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid appointment status transition from {old_status} to {new_status}",
        )

    updated = _apply_status_change(appointment, new_status)

    if new_status in {"REJECTED", "CANCELLED"}:
        _release_slot(updated)
        updated = get_appointments_collection().find_one({"_id": appointment["_id"]})

    _dispatch_status_notifications(updated, old_status, new_status)
    return serialize_appointment(updated)


def cancel_appointment_by_patient(appointment_id: str):
    appointments = get_appointments_collection()
    appointment = appointments.find_one({"_id": _to_object_id(appointment_id, "Appointment not found")})

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    old_status = appointment.get("status")
    new_status = "CANCELLED"

    allowed = PATIENT_ALLOWED_STATUS_TRANSITIONS.get(old_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Patient cannot cancel appointment when status is {old_status}",
        )

    updated = _apply_status_change(appointment, new_status)
    _release_slot(updated)
    updated = get_appointments_collection().find_one({"_id": appointment["_id"]})

    _dispatch_status_notifications(updated, old_status, new_status)
    return serialize_appointment(updated)
