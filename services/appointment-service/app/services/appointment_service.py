from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_appointments_collection
from app.models.appointment_model import build_appointment_document, serialize_appointment

ACTIVE_CONFLICT_STATUSES = ["PAYMENT_PENDING", "PENDING", "CONFIRMED", "RESCHEDULED"]


def ensure_appointment_indexes():
    appointments = get_appointments_collection()
    appointments.create_index("patientId")
    appointments.create_index("doctorId")
    appointments.create_index([("doctorId", 1), ("date", 1), ("timeSlot", 1)])


def create_appointment(payload):
    appointments = get_appointments_collection()

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
    return serialize_appointment(created)


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

    new_status = payload.status
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
    return serialize_appointment(updated)