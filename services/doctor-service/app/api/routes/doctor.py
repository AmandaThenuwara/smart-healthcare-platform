from fastapi import APIRouter

from app.schemas.doctor_schema import (
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorProfileResponse,
)
from app.services.doctor_service import (
    create_doctor_profile,
    get_doctor_profile,
    update_doctor_profile,
)

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.post("", response_model=DoctorProfileResponse, status_code=201)
def create_doctor(payload: DoctorProfileCreate):
    return create_doctor_profile(payload)


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
def get_doctor(doctor_id: str):
    return get_doctor_profile(doctor_id)


@router.put("/{doctor_id}", response_model=DoctorProfileResponse)
def update_doctor(doctor_id: str, payload: DoctorProfileUpdate):
    return update_doctor_profile(doctor_id, payload)