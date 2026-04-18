from typing import Literal

from pydantic import BaseModel, Field


class TelemedicineSessionCreate(BaseModel):
    appointmentId: str
    doctorId: str
    patientId: str
    provider: Literal["JITSI"] = "JITSI"
    roomName: str = Field(..., min_length=3, max_length=120)
    meetingUrl: str = Field(..., min_length=5, max_length=500)
    status: Literal["SCHEDULED", "STARTED", "ENDED"] = "SCHEDULED"


class TelemedicineSessionStatusUpdate(BaseModel):
    status: Literal["SCHEDULED", "STARTED", "ENDED"]


class TelemedicineSessionResponse(BaseModel):
    sessionId: str
    appointmentId: str
    doctorId: str
    patientId: str
    provider: str
    roomName: str
    meetingUrl: str
    status: str
    createdAt: str
