from datetime import datetime, timezone


def build_session_document(payload) -> dict:
    return {
        "appointmentId": payload.appointmentId,
        "doctorId": payload.doctorId,
        "patientId": payload.patientId,
        "provider": payload.provider,
        "roomName": payload.roomName.strip(),
        "meetingUrl": payload.meetingUrl.strip(),
        "status": payload.status,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }


def serialize_session(document: dict) -> dict:
    return {
        "sessionId": str(document["_id"]),
        "appointmentId": document["appointmentId"],
        "doctorId": document["doctorId"],
        "patientId": document["patientId"],
        "provider": document["provider"],
        "roomName": document["roomName"],
        "meetingUrl": document["meetingUrl"],
        "status": document["status"],
        "createdAt": document["createdAt"].isoformat() if hasattr(document["createdAt"], "isoformat") else str(document["createdAt"]),
    }
