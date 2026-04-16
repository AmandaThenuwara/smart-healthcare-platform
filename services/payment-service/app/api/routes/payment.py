from fastapi import APIRouter

from app.schemas.payment_schema import PaymentCreate, PaymentResponse, PaymentStatusUpdate
from app.services.payment_service import (
    create_payment,
    get_payment_by_appointment,
    list_payments_by_patient,
    update_payment_status,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("", response_model=PaymentResponse, status_code=201)
def create_new_payment(payload: PaymentCreate):
    return create_payment(payload)


@router.get("/appointment/{appointment_id}", response_model=PaymentResponse)
def get_payment_for_appointment(appointment_id: str):
    return get_payment_by_appointment(appointment_id)


@router.get("/patient/{patient_id}", response_model=list[PaymentResponse])
def get_payments_for_patient(patient_id: str):
    return list_payments_by_patient(patient_id)


@router.put("/{payment_id}/status", response_model=PaymentResponse)
def change_payment_status(payment_id: str, payload: PaymentStatusUpdate):
    return update_payment_status(payment_id, payload)
