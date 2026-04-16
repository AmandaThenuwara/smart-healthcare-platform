from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_payments_collection
from app.models.payment_model import build_payment_document, serialize_payment


def ensure_payment_indexes():
    payments = get_payments_collection()
    payments.create_index("appointmentId")
    payments.create_index("patientId")


def create_payment(payload):
    result = get_payments_collection().insert_one(build_payment_document(payload))
    created = get_payments_collection().find_one({"_id": result.inserted_id})
    return serialize_payment(created)


def get_payment_by_appointment(appointment_id: str):
    payment = get_payments_collection().find_one({"appointmentId": appointment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return serialize_payment(payment)


def list_payments_by_patient(patient_id: str):
    cursor = get_payments_collection().find({"patientId": patient_id}).sort([("createdAt", -1)])
    return [serialize_payment(doc) for doc in cursor]


def update_payment_status(payment_id: str, payload):
    payments = get_payments_collection()

    result = payments.update_one(
        {"_id": ObjectId(payment_id)},
        {
            "$set": {
                "status": payload.status,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")

    updated = payments.find_one({"_id": ObjectId(payment_id)})
    return serialize_payment(updated)
