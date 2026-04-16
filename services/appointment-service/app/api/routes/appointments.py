from fastapi import APIRouter, Depends

from app.core.dependencies import (
    ensure_appointment_belongs_to_doctor_or_admin,
    ensure_doctor_owner_or_admin,
    ensure_patient_owner_or_admin,
    get_current_doctor_profile_id,
    get_current_patient_profile_id,
    require_roles,
)
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
def create_new_appointment(
    payload: AppointmentCreate,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        return create_appointment(payload)

    enforced_payload = AppointmentCreate(
        **payload.model_dump(exclude={"patientId"}),
        patientId=get_current_patient_profile_id(current_user),
    )
    return create_appointment(enforced_payload)


@router.get("/patient/{patient_id}", response_model=list[AppointmentResponse])
def get_patient_appointments(
    patient_id: str,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    ensure_patient_owner_or_admin(patient_id, current_user)
    return list_appointments_by_patient(patient_id)


@router.get("/doctor/{doctor_id}", response_model=list[AppointmentResponse])
def get_doctor_appointments(
    doctor_id: str,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    ensure_doctor_owner_or_admin(doctor_id, current_user)
    return list_appointments_by_doctor(doctor_id)


@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
def change_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    ensure_appointment_belongs_to_doctor_or_admin(appointment_id, current_user)
    return update_appointment_status(appointment_id, payload)
