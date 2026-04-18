from datetime import datetime, timezone


def build_session_document(
    appointment_id: str,
    doctor_id: str,
    patient_id: str,
    provider: str,
    room_name: str,
    meeting_url: str,
    status: str,
) -> dict:
    return {
        "appointmentId": appointment_id,
        "doctorId": doctor_id,
        "patientId": patient_id,
        "provider": provider,
        "roomName": room_name.strip(),
        "meetingUrl": meeting_url.strip(),
        "status": status,
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
        "createdAt": document["createdAt"].isoformat()
        if hasattr(document["createdAt"], "isoformat")
        else str(document["createdAt"]),
    }
