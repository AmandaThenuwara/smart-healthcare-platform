from fastapi import APIRouter, Depends, HTTPException

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
    cancel_appointment_by_patient,
    create_appointment,
    get_appointment_by_id,
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


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_single_appointment(
    appointment_id: str,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    appointment = get_appointment_by_id(appointment_id)

    if current_user.get("role") == "ADMIN":
        return appointment

    if current_user.get("role") == "PATIENT":
        current_patient_id = get_current_patient_profile_id(current_user)
        if appointment["patientId"] != current_patient_id:
            raise HTTPException(status_code=403, detail="You do not have permission to access this appointment")
        return appointment

    current_doctor_id = get_current_doctor_profile_id(current_user)
    if appointment["doctorId"] != current_doctor_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this appointment")
    return appointment


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


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_my_appointment(
    appointment_id: str,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    appointment = get_appointment_by_id(appointment_id)

    if current_user.get("role") != "ADMIN":
        current_patient_id = get_current_patient_profile_id(current_user)
        if appointment["patientId"] != current_patient_id:
            raise HTTPException(status_code=403, detail="You do not have permission to cancel this appointment")

    return cancel_appointment_by_patient(appointment_id)
