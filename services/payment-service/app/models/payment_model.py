from datetime import datetime, timezone


def build_payment_document(payload) -> dict:
    return {
        "appointmentId": payload.appointmentId,
        "patientId": payload.patientId,
        "amount": payload.amount,
        "currency": payload.currency,
        "paymentMethod": payload.paymentMethod,
        "provider": payload.provider,
        "status": payload.status,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }


def serialize_payment(document: dict) -> dict:
    return {
        "paymentId": str(document["_id"]),
        "appointmentId": document["appointmentId"],
        "patientId": document["patientId"],
        "amount": float(document["amount"]),
        "currency": document["currency"],
        "paymentMethod": document["paymentMethod"],
        "provider": document["provider"],
        "status": document["status"],
        "createdAt": document["createdAt"].isoformat() if hasattr(document["createdAt"], "isoformat") else str(document["createdAt"]),
    }
