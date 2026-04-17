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

_service_client = MongoClient(
    MONGO_URI,
    username=MONGO_USERNAME,
    password=MONGO_PASSWORD,
    authSource=MONGO_AUTH_SOURCE,
)

_patients_collection = _service_client["patient_db"]["patients"]
_doctors_collection = _service_client["doctor_db"]["doctors"]


def ensure_appointment_indexes():
    appointments = get_appointments_collection()
    appointments.create_index("patientId")
    appointments.create_index("doctorId")
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


def _appointment_label(appointment: dict) -> str:
    return f"{appointment.get('date')} at {appointment.get('timeSlot')}"


def create_appointment(payload):
    appointments = get_appointments_collection()

    patient = _get_patient_or_404(payload.patientId)
    doctor = _get_doctor_or_404(payload.doctorId)

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

    result = appointments.insert_one(build_appointment_document(payload))
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
    cursor = get_appointments_collection().find({"patientId": patient_id}).sort([("createdAt", -1)])
    return [serialize_appointment(doc) for doc in cursor]


def list_appointments_by_doctor(doctor_id: str):
    cursor = get_appointments_collection().find({"doctorId": doctor_id}).sort([("createdAt", -1)])
    return [serialize_appointment(doc) for doc in cursor]


def update_appointment_status(appointment_id: str, payload):
    appointments = get_appointments_collection()
    appointment = appointments.find_one({"_id": ObjectId(appointment_id)})

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = _get_patient_or_404(appointment.get("patientId"))
    doctor = _get_doctor_or_404(appointment.get("doctorId"))

    new_status = payload.status
    old_status = appointment.get("status")
    history = appointment.get("statusHistory", [])
    history.append(
        {
            "status": new_status,
            "changedAt": datetime.now(timezone.utc),
        }
    )

    appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {
            "$set": {
                "status": new_status,
                "statusHistory": history,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    updated = appointments.find_one({"_id": ObjectId(appointment_id)})
    serialized = serialize_appointment(updated)

    if new_status != old_status:
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

    return serialized
