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
from app.db.mongodb import get_sessions_collection
from app.models.telemedicine_model import build_session_document, serialize_session

VALID_SESSION_STATUS_TRANSITIONS = {
    "SCHEDULED": {"STARTED"},
    "STARTED": {"ENDED"},
    "ENDED": set(),
}

_service_client = MongoClient(
    MONGO_URI,
    username=MONGO_USERNAME,
    password=MONGO_PASSWORD,
    authSource=MONGO_AUTH_SOURCE,
)

_appointments_collection = _service_client["appointment_db"]["appointments"]
_payments_collection = _service_client["payment_db"]["payments"]


def ensure_session_indexes():
    sessions = get_sessions_collection()
    sessions.create_index("appointmentId", unique=True)
    sessions.create_index("doctorId")
    sessions.create_index("patientId")
    sessions.create_index("createdAt")
    sessions.create_index("status")


def _to_object_id(value: str, not_found_detail: str):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=404, detail=not_found_detail) from exc


def _get_appointment_or_404(appointment_id: str):
    appointment = _appointments_collection.find_one(
        {"_id": _to_object_id(appointment_id, "Appointment not found")}
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


def _get_payment_or_404(appointment_id: str):
    payment = _payments_collection.find_one({"appointmentId": appointment_id})
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid telemedicine session requires a payment for the appointment",
        )
    return payment


def _generate_room_name(appointment_id: str) -> str:
    return f"consult-{appointment_id}".lower()


def _generate_meeting_url(room_name: str) -> str:
    return f"https://meet.jit.si/{room_name}"


def create_session(payload, appointment_document=None):
    sessions = get_sessions_collection()

    existing = sessions.find_one({"appointmentId": payload.appointmentId})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telemedicine session already exists for this appointment",
        )

    appointment = appointment_document or _get_appointment_or_404(payload.appointmentId)

    if appointment.get("consultationType") != "ONLINE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telemedicine is only allowed for online appointments",
        )

    if appointment.get("status") != "CONFIRMED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telemedicine session can only be created for confirmed appointments",
        )

    payment = _get_payment_or_404(payload.appointmentId)
    if payment.get("status") != "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telemedicine session can only be created after payment is completed",
        )

    doctor_id = appointment.get("doctorId")
    patient_id = appointment.get("patientId")
    room_name = _generate_room_name(payload.appointmentId)
    meeting_url = _generate_meeting_url(room_name)

    document = build_session_document(
        appointment_id=payload.appointmentId,
        doctor_id=doctor_id,
        patient_id=patient_id,
        provider="JITSI",
        room_name=room_name,
        meeting_url=meeting_url,
        status="SCHEDULED",
    )

    result = sessions.insert_one(document)
    created = sessions.find_one({"_id": result.inserted_id})
    return serialize_session(created)


def get_session_by_id(session_id: str):
    session = get_sessions_collection().find_one(
        {"_id": _to_object_id(session_id, "Telemedicine session not found")}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Telemedicine session not found")
    return serialize_session(session)


def get_session_by_appointment(appointment_id: str):
    session = get_sessions_collection().find_one({"appointmentId": appointment_id})
    if not session:
        raise HTTPException(status_code=404, detail="Telemedicine session not found")
    return serialize_session(session)


def update_session_status(session_id: str, payload):
    sessions = get_sessions_collection()
    session = sessions.find_one(
        {"_id": _to_object_id(session_id, "Telemedicine session not found")}
    )

    if not session:
        raise HTTPException(status_code=404, detail="Telemedicine session not found")

    current_status = session.get("status")
    new_status = payload.status

    if new_status != current_status:
        allowed = VALID_SESSION_STATUS_TRANSITIONS.get(current_status, set())
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid telemedicine status transition from {current_status} to {new_status}",
            )

    sessions.update_one(
        {"_id": session["_id"]},
        {
            "$set": {
                "status": new_status,
            }
        },
    )

    updated = sessions.find_one({"_id": session["_id"]})
    return serialize_session(updated)
