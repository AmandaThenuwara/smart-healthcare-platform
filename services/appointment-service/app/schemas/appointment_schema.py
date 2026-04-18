from typing import Literal
from pydantic import BaseModel, Field


AppointmentStatus = Literal[
    "PENDING",
    "PAYMENT_PENDING",
    "CONFIRMED",
    "REJECTED",
    "RESCHEDULED",
    "CANCELLED",
    "COMPLETED",
]


class AppointmentCreate(BaseModel):
    patientId: str
    doctorId: str
    date: str
    timeSlot: str
    reason: str = Field(..., min_length=3, max_length=300)
    consultationType: Literal["ONLINE", "PHYSICAL"] = "ONLINE"


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentResponse(BaseModel):
    appointmentId: str
    patientId: str
    doctorId: str
    date: str
    timeSlot: str
    reason: str
    consultationType: str
    status: str
    statusHistory: list[dict]
