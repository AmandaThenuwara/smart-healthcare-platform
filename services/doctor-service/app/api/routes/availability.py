from fastapi import APIRouter

from app.schemas.doctor_schema import AvailabilityCreate, AvailabilityResponse
from app.services.doctor_service import create_availability_slot, list_availability_slots

router = APIRouter(prefix="/availability", tags=["availability"])


@router.post("", response_model=AvailabilityResponse, status_code=201)
def create_availability(payload: AvailabilityCreate):
    return create_availability_slot(payload)


@router.get("/{doctor_id}", response_model=list[AvailabilityResponse])
def get_availability(doctor_id: str):
    return list_availability_slots(doctor_id)