from pydantic import BaseModel, Field


class PatientProfileCreate(BaseModel):
    userId: str
    fullName: str = Field(..., min_length=3, max_length=100)
    email: str
    phone: str = Field(..., min_length=7, max_length=20)
    dateOfBirth: str
    gender: str
    address: str = Field(..., min_length=3, max_length=200)
    emergencyContactName: str = Field(..., min_length=3, max_length=100)
    emergencyContactPhone: str = Field(..., min_length=7, max_length=20)


class PatientProfileUpdate(BaseModel):
    fullName: str | None = Field(default=None, min_length=3, max_length=100)
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    dateOfBirth: str | None = None
    gender: str | None = None
    address: str | None = Field(default=None, min_length=3, max_length=200)
    emergencyContactName: str | None = Field(default=None, min_length=3, max_length=100)
    emergencyContactPhone: str | None = Field(default=None, min_length=7, max_length=20)


class PatientProfileResponse(BaseModel):
    patientId: str
    userId: str
    fullName: str
    email: str
    phone: str
    dateOfBirth: str
    gender: str
    address: str
    emergencyContactName: str
    emergencyContactPhone: str


class MedicalReportCreate(BaseModel):
    patientId: str
    title: str = Field(..., min_length=2, max_length=150)
    fileName: str = Field(..., min_length=2, max_length=200)
    fileUrl: str = Field(..., min_length=2, max_length=500)
    reportType: str = Field(..., min_length=2, max_length=100)


class MedicalReportResponse(BaseModel):
    reportId: str
    patientId: str
    title: str
    fileName: str
    fileUrl: str
    reportType: str
    uploadedAt: str
