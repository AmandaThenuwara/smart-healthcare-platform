from datetime import datetime, timezone

import stripe
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo import MongoClient

from app.core.config import (
    FRONTEND_BASE_URL,
    MONGO_AUTH_SOURCE,
    MONGO_PASSWORD,
    MONGO_URI,
    MONGO_USERNAME,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
)
from app.db.mongodb import get_payments_collection
from app.models.payment_model import build_payment_document, serialize_payment
from app.utils.notification_dispatcher import dispatch_bulk_notifications

VALID_PAYMENT_STATUS_TRANSITIONS = {
    "PENDING": {"PAID", "FAILED"},
    "PAID": {"REFUNDED"},
    "FAILED": set(),
    "REFUNDED": set(),
}

_service_client = MongoClient(
    MONGO_URI,
    username=MONGO_USERNAME,
    password=MONGO_PASSWORD,
    authSource=MONGO_AUTH_SOURCE,
)

_appointments_collection = _service_client["appointment_db"]["appointments"]
_doctors_collection = _service_client["doctor_db"]["doctors"]
_patients_collection = _service_client["patient_db"]["patients"]

stripe.api_key = STRIPE_SECRET_KEY


def ensure_payment_indexes():
    payments = get_payments_collection()

    existing_indexes = payments.index_information()
    appointment_index = existing_indexes.get("appointmentId_1")

    if appointment_index and not appointment_index.get("unique", False):
        payments.drop_index("appointmentId_1")

    payments.create_index("appointmentId", unique=True, name="appointmentId_1")
    payments.create_index("patientId")
    payments.create_index("createdAt")
    payments.create_index("status")
    payments.create_index("stripeSessionId")


def _to_object_id(value: str, not_found_detail: str):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=404, detail=not_found_detail) from exc


def _get_payment_or_404(payment_id: str):
    payment = get_payments_collection().find_one(
        {"_id": _to_object_id(payment_id, "Payment not found")}
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


def _get_appointment_or_404(appointment_id: str):
    appointment = _appointments_collection.find_one(
        {"_id": _to_object_id(appointment_id, "Appointment not found")}
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


def _get_doctor_or_404(doctor_id: str):
    doctor = _doctors_collection.find_one(
        {"_id": _to_object_id(doctor_id, "Doctor profile not found")}
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return doctor


def _get_patient_or_404(patient_id: str):
    patient = _patients_collection.find_one(
        {"_id": _to_object_id(patient_id, "Patient profile not found")}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


def _appointment_label(appointment: dict) -> str:
    return f"{appointment.get('date')} at {appointment.get('timeSlot')}"


def _append_appointment_status(appointment: dict, new_status: str):
    history = appointment.get("statusHistory", [])
    history.append(
        {
            "status": new_status,
            "changedAt": datetime.now(timezone.utc),
        }
    )

    _appointments_collection.update_one(
        {"_id": appointment["_id"]},
        {
            "$set": {
                "status": new_status,
                "statusHistory": history,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )


def _dispatch_payment_notifications(payment: dict, appointment: dict, old_status: str, new_status: str):
    patient = _get_patient_or_404(payment["patientId"])
    doctor = _get_doctor_or_404(appointment.get("doctorId"))
    appointment_text = _appointment_label(appointment)

    events = [
        {
            "user_id": patient.get("userId"),
            "title": "Payment Status Updated",
            "message": f"Your payment for the appointment on {appointment_text} changed from {old_status} to {new_status}.",
            "notification_type": "PAYMENT",
            "email_to": patient.get("email"),
            "email_subject": "Payment Status Updated - Smart Healthcare",
            "email_body": f"Hello {patient.get('fullName')},\n\nYour payment for the appointment on {appointment_text} changed from {old_status} to {new_status}.\n\nRegards,\nSmart Healthcare",
        }
    ]

    if new_status in {"PAID", "REFUNDED"}:
        events.append(
            {
                "user_id": doctor.get("userId"),
                "title": "Payment Status Updated",
                "message": f"Payment for the appointment with {patient.get('fullName')} on {appointment_text} is now {new_status}.",
                "notification_type": "PAYMENT",
                "email_to": doctor.get("email"),
                "email_subject": "Payment Status Updated - Smart Healthcare",
                "email_body": f"Hello {doctor.get('fullName')},\n\nPayment for the appointment with {patient.get('fullName')} on {appointment_text} is now {new_status}.\n\nRegards,\nSmart Healthcare",
            }
        )

    if new_status == "PAID":
        events.extend(
            [
                {
                    "user_id": patient.get("userId"),
                    "title": "Appointment Confirmed",
                    "message": f"Your appointment with {doctor.get('fullName')} on {appointment_text} is now CONFIRMED.",
                    "notification_type": "APPOINTMENT",
                    "email_to": patient.get("email"),
                    "email_subject": "Appointment Confirmed - Smart Healthcare",
                    "email_body": f"Hello {patient.get('fullName')},\n\nYour appointment with {doctor.get('fullName')} on {appointment_text} is now CONFIRMED.\n\nRegards,\nSmart Healthcare",
                },
                {
                    "user_id": doctor.get("userId"),
                    "title": "Appointment Confirmed",
                    "message": f"The appointment with {patient.get('fullName')} on {appointment_text} is now CONFIRMED.",
                    "notification_type": "APPOINTMENT",
                    "email_to": doctor.get("email"),
                    "email_subject": "Appointment Confirmed - Smart Healthcare",
                    "email_body": f"Hello {doctor.get('fullName')},\n\nThe appointment with {patient.get('fullName')} on {appointment_text} is now CONFIRMED.\n\nRegards,\nSmart Healthcare",
                },
            ]
        )

    dispatch_bulk_notifications(events)


def _apply_payment_status_change(
    payment: dict,
    new_status: str,
    stripe_session_id: str | None = None,
    stripe_payment_intent_id: str | None = None,
):
    current_status = payment.get("status")

    if new_status == current_status:
        updates = {"updatedAt": datetime.now(timezone.utc)}
        if stripe_session_id:
            updates["stripeSessionId"] = stripe_session_id
        if stripe_payment_intent_id:
            updates["stripePaymentIntentId"] = stripe_payment_intent_id

        get_payments_collection().update_one(
            {"_id": payment["_id"]},
            {"$set": updates},
        )

        current = get_payments_collection().find_one({"_id": payment["_id"]})
        return serialize_payment(current)

    allowed = VALID_PAYMENT_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment status transition from {current_status} to {new_status}",
        )

    updates = {
        "status": new_status,
        "updatedAt": datetime.now(timezone.utc),
    }
    if stripe_session_id:
        updates["stripeSessionId"] = stripe_session_id
    if stripe_payment_intent_id:
        updates["stripePaymentIntentId"] = stripe_payment_intent_id

    get_payments_collection().update_one(
        {"_id": payment["_id"]},
        {"$set": updates},
    )

    appointment = _get_appointment_or_404(payment["appointmentId"])

    if new_status == "PAID":
        refreshed_appointment = _get_appointment_or_404(payment["appointmentId"])
        if refreshed_appointment.get("status") == "PAYMENT_PENDING":
            _append_appointment_status(refreshed_appointment, "CONFIRMED")
            appointment = _get_appointment_or_404(payment["appointmentId"])

    updated = get_payments_collection().find_one({"_id": payment["_id"]})

    try:
        _dispatch_payment_notifications(updated, appointment, current_status, new_status)
    except Exception as exc:
        print(f"[stripe-webhook] notification dispatch failed: {exc}")

    return serialize_payment(updated)


def create_payment(payload):
    payments = get_payments_collection()

    existing = payments.find_one({"appointmentId": payload.appointmentId})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already exists for this appointment",
        )

    appointment = _get_appointment_or_404(payload.appointmentId)

    if appointment.get("consultationType") != "ONLINE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payments are only allowed for online appointments",
        )

    if appointment.get("status") not in {"PAYMENT_PENDING", "CONFIRMED"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This appointment is not in a valid state for payment",
        )

    if appointment.get("patientId") != payload.patientId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payment patient does not match appointment patient",
        )

    patient = _get_patient_or_404(appointment.get("patientId"))
    doctor = _get_doctor_or_404(appointment.get("doctorId"))
    derived_amount = float(doctor.get("consultationFee", payload.amount))

    document = build_payment_document(
        appointment_id=payload.appointmentId,
        patient_id=appointment.get("patientId"),
        amount=derived_amount,
        currency=payload.currency,
        payment_method=payload.paymentMethod,
        provider="STRIPE_SANDBOX",
        status="PENDING",
    )

    result = payments.insert_one(document)
    created = payments.find_one({"_id": result.inserted_id})
    serialized = serialize_payment(created)

    appointment_text = _appointment_label(appointment)
    dispatch_bulk_notifications(
        [
            {
                "user_id": patient.get("userId"),
                "title": "Payment Created",
                "message": f"A payment record for your appointment with {doctor.get('fullName')} on {appointment_text} has been created. Amount: {derived_amount:.2f} {payload.currency}. Current status: PENDING.",
                "notification_type": "PAYMENT",
                "email_to": patient.get("email"),
                "email_subject": "Payment Created - Smart Healthcare",
                "email_body": f"Hello {patient.get('fullName')},\n\nA payment record for your appointment with {doctor.get('fullName')} on {appointment_text} has been created.\nAmount: {derived_amount:.2f} {payload.currency}\nCurrent status: PENDING.\n\nRegards,\nSmart Healthcare",
            }
        ]
    )

    return serialized


def get_payment_by_appointment(appointment_id: str):
    payment = get_payments_collection().find_one({"appointmentId": appointment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return serialize_payment(payment)


def list_payments_by_patient(patient_id: str):
    cursor = get_payments_collection().find({"patientId": patient_id}).sort(
        [("createdAt", -1)]
    )
    return [serialize_payment(doc) for doc in cursor]


def update_payment_status(payment_id: str, payload):
    payment = _get_payment_or_404(payment_id)
    return _apply_payment_status_change(payment, payload.status)


def create_checkout_session(payment_id: str):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="STRIPE_SECRET_KEY is not configured")

    payment = _get_payment_or_404(payment_id)

    if payment.get("status") not in {"PENDING", "FAILED"}:
        raise HTTPException(
            status_code=400,
            detail="Stripe Checkout can only be started for pending or failed payments",
        )

    appointment = _get_appointment_or_404(payment["appointmentId"])
    patient = _get_patient_or_404(payment["patientId"])
    doctor = _get_doctor_or_404(appointment.get("doctorId"))

    amount_cents = int(round(float(payment["amount"]) * 100))
    if amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    metadata = {
        "paymentId": str(payment["_id"]),
        "appointmentId": payment["appointmentId"],
        "patientId": payment["patientId"],
    }

    appointment_text = _appointment_label(appointment)

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            success_url=f"{FRONTEND_BASE_URL}/patient/payments?stripe=success&payment_id={str(payment['_id'])}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_BASE_URL}/patient/payments?stripe=cancel&payment_id={str(payment['_id'])}",
            customer_email=patient.get("email"),
            client_reference_id=str(payment["_id"]),
            metadata=metadata,
            payment_intent_data={
                "metadata": metadata,
            },
            line_items=[
                {
                    "quantity": 1,
                    "price_data": {
                        "currency": str(payment["currency"]).lower(),
                        "unit_amount": amount_cents,
                        "product_data": {
                            "name": f"Consultation with {doctor.get('fullName')}",
                            "description": f"Online appointment on {appointment_text}",
                        },
                    },
                }
            ],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to create Stripe Checkout Session: {str(exc)}",
        ) from exc

    get_payments_collection().update_one(
        {"_id": payment["_id"]},
        {
            "$set": {
                "stripeSessionId": session.id,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    return {
        "paymentId": str(payment["_id"]),
        "checkoutUrl": session.url,
        "sessionId": session.id,
    }


def _stripe_value(obj, key, default=None):
    if obj is None:
        return default

    try:
        if key in obj:
            return obj[key]
    except Exception:
        return default

    return default


def process_stripe_webhook(payload: str, stripe_signature: str | None):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="STRIPE_SECRET_KEY is not configured")

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="STRIPE_WEBHOOK_SECRET is not configured")

    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            stripe_signature,
            STRIPE_WEBHOOK_SECRET,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid Stripe webhook: {str(exc)}") from exc

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        metadata = _stripe_value(data, "metadata", None)
        payment_id = _stripe_value(metadata, "paymentId", None) or _stripe_value(
            data, "client_reference_id", None
        )

        if payment_id:
            payment = _get_payment_or_404(payment_id)
            _apply_payment_status_change(
                payment,
                "PAID",
                stripe_session_id=_stripe_value(data, "id", None),
                stripe_payment_intent_id=_stripe_value(data, "payment_intent", None),
            )

    elif event_type == "checkout.session.expired":
        metadata = _stripe_value(data, "metadata", None)
        payment_id = _stripe_value(metadata, "paymentId", None) or _stripe_value(
            data, "client_reference_id", None
        )

        if payment_id:
            payment = _get_payment_or_404(payment_id)
            if payment.get("status") == "PENDING":
                _apply_payment_status_change(
                    payment,
                    "FAILED",
                    stripe_session_id=_stripe_value(data, "id", None),
                    stripe_payment_intent_id=_stripe_value(data, "payment_intent", None),
                )

    return {"received": True}