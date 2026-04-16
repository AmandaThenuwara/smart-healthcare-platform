from fastapi import APIRouter

from app.schemas.appointment_schema import (
    AppointmentCreate,
    AppointmentStatusUpdate,
    AppointmentResponse,
)
from app.services.appointment_service import (
    create_appointment,
    list_appointments_by_patient,
    list_appointments_by_doctor,
    update_appointment_status,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentResponse, status_code=201)
def create_new_appointment(payload: AppointmentCreate):
    return create_appointment(payload)


@router.get("/patient/{patient_id}", response_model=list[AppointmentResponse])
def get_patient_appointments(patient_id: str):
    return list_appointments_by_patient(patient_id)


@router.get("/doctor/{doctor_id}", response_model=list[AppointmentResponse])
def get_doctor_appointments(doctor_id: str):
    return list_appointments_by_doctor(doctor_id)


@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
def change_appointment_status(appointment_id: str, payload: AppointmentStatusUpdate):
    return update_appointment_status(appointment_id, payload)