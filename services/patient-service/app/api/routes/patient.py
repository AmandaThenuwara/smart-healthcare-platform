from fastapi import APIRouter

from app.schemas.patient_schema import (
    PatientProfileCreate,
    PatientProfileUpdate,
    PatientProfileResponse,
)
from app.services.patient_service import (
    create_patient_profile,
    get_patient_profile,
    update_patient_profile,
)

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientProfileResponse, status_code=201)
def create_patient(payload: PatientProfileCreate):
    return create_patient_profile(payload)


@router.get("/{patient_id}", response_model=PatientProfileResponse)
def get_patient(patient_id: str):
    return get_patient_profile(patient_id)


@router.put("/{patient_id}", response_model=PatientProfileResponse)
def update_patient(patient_id: str, payload: PatientProfileUpdate):
    return update_patient_profile(patient_id, payload)
