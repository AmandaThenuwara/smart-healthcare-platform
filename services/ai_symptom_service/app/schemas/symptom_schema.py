from typing import Literal

from pydantic import BaseModel, Field


UrgencyLevel = Literal["LOW", "MEDIUM", "HIGH", "EMERGENCY"]


class SymptomCheckCreate(BaseModel):
    symptoms: list[str] = Field(..., min_length=1)
    age: int | None = Field(default=None, ge=0, le=120)
    sex: str | None = Field(default=None, min_length=1, max_length=30)
    duration: str | None = Field(default=None, min_length=1, max_length=100)
    severity: Literal["MILD", "MODERATE", "SEVERE"] | None = None
    additionalNotes: str | None = Field(default=None, max_length=1000)


class SymptomCheckResponse(BaseModel):
    checkId: str
    patientId: str
    userId: str
    submittedSymptoms: list[str]
    summary: str
    urgencyLevel: UrgencyLevel
    possibleConditions: list[str]
    recommendation: str
    redFlags: list[str]
    disclaimer: str
    createdAt: str
