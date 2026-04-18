from typing import Literal

from pydantic import BaseModel, Field


PaymentStatus = Literal["PENDING", "PAID", "FAILED", "REFUNDED"]


class PaymentCreate(BaseModel):
    appointmentId: str
    patientId: str
    amount: float = Field(..., ge=0)
    currency: str = Field(default="LKR", min_length=3, max_length=3)
    paymentMethod: Literal["CARD", "CASH", "ONLINE"] = "ONLINE"
    provider: Literal["STRIPE_SANDBOX"] = "STRIPE_SANDBOX"
    status: PaymentStatus = "PENDING"


class PaymentStatusUpdate(BaseModel):
    status: PaymentStatus


class CheckoutSessionResponse(BaseModel):
    paymentId: str
    checkoutUrl: str
    sessionId: str


class StripeWebhookResponse(BaseModel):
    received: bool


class PaymentResponse(BaseModel):
    paymentId: str
    appointmentId: str
    patientId: str
    amount: float
    currency: str
    paymentMethod: str
    provider: str
    status: str
    createdAt: str