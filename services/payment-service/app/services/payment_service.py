from datetime import datetime, timezone

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
    payments = get_payments_collection()
    payment = payments.find_one({"_id": _to_object_id(payment_id, "Payment not found")})

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    appointment = _get_appointment_or_404(payment["appointmentId"])
    patient = _get_patient_or_404(payment["patientId"])
    doctor = _get_doctor_or_404(appointment.get("doctorId"))

    current_status = payment.get("status")
    new_status = payload.status

    if new_status != current_status:
        allowed = VALID_PAYMENT_STATUS_TRANSITIONS.get(current_status, set())
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid payment status transition from {current_status} to {new_status}",
            )

    payments.update_one(
        {"_id": payment["_id"]},
        {
            "$set": {
                "status": new_status,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    if new_status == "PAID":
        refreshed_appointment = _get_appointment_or_404(payment["appointmentId"])
        if refreshed_appointment.get("status") == "PAYMENT_PENDING":
            _append_appointment_status(refreshed_appointment, "CONFIRMED")

    updated = payments.find_one({"_id": payment["_id"]})
    serialized = serialize_payment(updated)

    if new_status != current_status:
        appointment_text = _appointment_label(appointment)
        events = [
            {
                "user_id": patient.get("userId"),
                "title": "Payment Status Updated",
                "message": f"Your payment for the appointment on {appointment_text} changed from {current_status} to {new_status}.",
                "notification_type": "PAYMENT",
                "email_to": patient.get("email"),
                "email_subject": "Payment Status Updated - Smart Healthcare",
                "email_body": f"Hello {patient.get('fullName')},\n\nYour payment for the appointment on {appointment_text} changed from {current_status} to {new_status}.\n\nRegards,\nSmart Healthcare",
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

    return serialized
