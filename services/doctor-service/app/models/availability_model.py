from datetime import datetime, timezone


def build_availability_document(payload) -> dict:
    return {
        "doctorId": payload.doctorId,
        "date": payload.date,
        "startTime": payload.startTime,
        "endTime": payload.endTime,
        "isAvailable": payload.isAvailable,
        "createdAt": datetime.now(timezone.utc),
    }


def serialize_availability(document: dict) -> dict:
    return {
        "slotId": str(document["_id"]),
        "doctorId": document["doctorId"],
        "date": document["date"],
        "startTime": document["startTime"],
        "endTime": document["endTime"],
        "isAvailable": document["isAvailable"],
    }