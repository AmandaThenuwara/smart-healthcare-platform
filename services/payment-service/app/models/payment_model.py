from datetime import datetime, timezone


def build_payment_document(
    appointment_id: str,
    patient_id: str,
    amount: float,
    currency: str,
    payment_method: str,
    provider: str,
    status: str,
) -> dict:
    return {
        "appointmentId": appointment_id,
        "patientId": patient_id,
        "amount": amount,
        "currency": currency,
        "paymentMethod": payment_method,
        "provider": provider,
        "status": status,
        "stripeSessionId": None,
        "stripePaymentIntentId": None,
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
        "createdAt": document["createdAt"].isoformat()
        if hasattr(document["createdAt"], "isoformat")
        else str(document["createdAt"]),
    }