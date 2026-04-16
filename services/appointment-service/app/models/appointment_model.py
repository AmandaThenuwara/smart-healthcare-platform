from datetime import datetime, timezone


def build_appointment_document(payload) -> dict:
    initial_status = "PAYMENT_PENDING" if payload.consultationType == "ONLINE" else "PENDING"

    return {
        "patientId": payload.patientId,
        "doctorId": payload.doctorId,
        "date": payload.date,
        "timeSlot": payload.timeSlot,
        "reason": payload.reason.strip(),
        "consultationType": payload.consultationType,
        "status": initial_status,
        "statusHistory": [
            {
                "status": initial_status,
                "changedAt": datetime.now(timezone.utc),
            }
        ],
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }


def serialize_appointment(document: dict) -> dict:
    return {
        "appointmentId": str(document["_id"]),
        "patientId": document["patientId"],
        "doctorId": document["doctorId"],
        "date": document["date"],
        "timeSlot": document["timeSlot"],
        "reason": document["reason"],
        "consultationType": document["consultationType"],
        "status": document["status"],
        "statusHistory": [
            {
                "status": item["status"],
                "changedAt": item["changedAt"].isoformat() if hasattr(item["changedAt"], "isoformat") else str(item["changedAt"]),
            }
            for item in document.get("statusHistory", [])
        ],
    }