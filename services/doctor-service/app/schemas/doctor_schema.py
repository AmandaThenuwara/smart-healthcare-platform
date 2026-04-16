from typing import Literal
from pydantic import BaseModel, Field


class DoctorProfileCreate(BaseModel):
    userId: str
    fullName: str = Field(..., min_length=3, max_length=100)
    email: str
    specialty: str = Field(..., min_length=2, max_length=100)
    qualifications: str = Field(..., min_length=2, max_length=300)
    hospital: str = Field(..., min_length=2, max_length=150)
    consultationFee: float = Field(..., ge=0)
    bio: str = Field(default="", max_length=500)
    approvalStatus: Literal["PENDING", "APPROVED", "REJECTED"] = "PENDING"


class DoctorProfileUpdate(BaseModel):
    fullName: str | None = Field(default=None, min_length=3, max_length=100)
    specialty: str | None = Field(default=None, min_length=2, max_length=100)
    qualifications: str | None = Field(default=None, min_length=2, max_length=300)
    hospital: str | None = Field(default=None, min_length=2, max_length=150)
    consultationFee: float | None = Field(default=None, ge=0)
    bio: str | None = Field(default=None, max_length=500)
    approvalStatus: Literal["PENDING", "APPROVED", "REJECTED"] | None = None


class DoctorProfileResponse(BaseModel):
    doctorId: str
    userId: str
    fullName: str
    email: str
    specialty: str
    qualifications: str
    hospital: str
    consultationFee: float
    bio: str
    approvalStatus: str


class AvailabilityCreate(BaseModel):
    doctorId: str
    date: str
    startTime: str
    endTime: str
    isAvailable: bool = True


class AvailabilityResponse(BaseModel):
    slotId: str
    doctorId: str
    date: str
    startTime: str
    endTime: str
    isAvailable: bool