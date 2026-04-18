from fastapi import APIRouter, Depends, status

from app.core.dependencies import (
    ensure_appointment_participant_or_admin,
    ensure_session_participant_or_admin,
    require_roles,
)
from app.schemas.telemedicine_schema import (
    TelemedicineSessionCreate,
    TelemedicineSessionResponse,
    TelemedicineSessionStatusUpdate,
)
from app.services.telemedicine_service import (
    create_session,
    get_session_by_id,
    get_session_by_appointment,
    update_session_status,
)

router = APIRouter(prefix="/telemedicine", tags=["telemedicine"])


@router.post("", response_model=TelemedicineSessionResponse, status_code=status.HTTP_201_CREATED)
def create_new_session(
    payload: TelemedicineSessionCreate,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    appointment = ensure_appointment_participant_or_admin(payload.appointmentId, current_user)
    return create_session(payload, appointment_document=appointment)


@router.get("/{session_id}", response_model=TelemedicineSessionResponse)
def get_session(
    session_id: str,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    ensure_session_participant_or_admin(session_id, current_user)
    return get_session_by_id(session_id)


@router.get("/appointment/{appointment_id}", response_model=TelemedicineSessionResponse)
def get_session_for_appointment(
    appointment_id: str,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    ensure_appointment_participant_or_admin(appointment_id, current_user)
    return get_session_by_appointment(appointment_id)


@router.put("/{session_id}/status", response_model=TelemedicineSessionResponse)
def change_session_status(
    session_id: str,
    payload: TelemedicineSessionStatusUpdate,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    ensure_session_participant_or_admin(session_id, current_user)
    return update_session_status(session_id, payload)
