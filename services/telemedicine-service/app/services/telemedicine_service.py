from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_sessions_collection
from app.models.telemedicine_model import build_session_document, serialize_session


def ensure_session_indexes():
    sessions = get_sessions_collection()
    sessions.create_index("appointmentId", unique=True)
    sessions.create_index("doctorId")
    sessions.create_index("patientId")


def create_session(payload):
    sessions = get_sessions_collection()

    existing = sessions.find_one({"appointmentId": payload.appointmentId})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telemedicine session already exists for this appointment",
        )

    result = sessions.insert_one(build_session_document(payload))
    created = sessions.find_one({"_id": result.inserted_id})
    return serialize_session(created)


def get_session_by_id(session_id: str):
    session = get_sessions_collection().find_one({"_id": ObjectId(session_id)})
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

    result = sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "status": payload.status,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Telemedicine session not found")

    updated = sessions.find_one({"_id": ObjectId(session_id)})
    return serialize_session(updated)
