from fastapi import APIRouter, Depends, Header, Request, status

from app.core.dependencies import (
    ensure_patient_owner_or_admin,
    ensure_payment_owner_or_admin,
    get_current_patient_profile_id,
    require_roles,
)
from app.schemas.payment_schema import (
    CheckoutSessionResponse,
    PaymentCreate,
    PaymentResponse,
    PaymentStatusUpdate,
    StripeWebhookResponse,
)
from app.services.payment_service import (
    create_checkout_session,
    create_payment,
    get_payment_by_appointment,
    list_payments_by_patient,
    process_stripe_webhook,
    update_payment_status,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook", response_model=StripeWebhookResponse, include_in_schema=True)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
):
    payload = (await request.body()).decode("utf-8")
    return process_stripe_webhook(payload, stripe_signature)


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_new_payment(
    payload: PaymentCreate,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        return create_payment(payload)

    enforced_payload = PaymentCreate(
        **payload.model_dump(exclude={"patientId", "provider", "status"}),
        patientId=get_current_patient_profile_id(current_user),
        provider="STRIPE_SANDBOX",
        status="PENDING",
    )
    return create_payment(enforced_payload)


@router.post("/{payment_id}/checkout-session", response_model=CheckoutSessionResponse)
def create_payment_checkout_session(
    payment_id: str,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    ensure_payment_owner_or_admin(payment_id, current_user)
    return create_checkout_session(payment_id)


@router.get("/appointment/{appointment_id}", response_model=PaymentResponse)
def get_payment_for_appointment(
    appointment_id: str,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    payment = get_payment_by_appointment(appointment_id)
    ensure_patient_owner_or_admin(payment["patientId"], current_user)
    return payment


@router.get("/patient/{patient_id}", response_model=list[PaymentResponse])
def get_payments_for_patient(
    patient_id: str,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    ensure_patient_owner_or_admin(patient_id, current_user)
    return list_payments_by_patient(patient_id)


@router.put("/{payment_id}/status", response_model=PaymentResponse)
def change_payment_status(
    payment_id: str,
    payload: PaymentStatusUpdate,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    ensure_payment_owner_or_admin(payment_id, current_user)
    return update_payment_status(payment_id, payload)