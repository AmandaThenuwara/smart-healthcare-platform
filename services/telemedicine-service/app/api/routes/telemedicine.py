from fastapi import APIRouter

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


@router.post("", response_model=TelemedicineSessionResponse, status_code=201)
def create_new_session(payload: TelemedicineSessionCreate):
    return create_session(payload)


@router.get("/{session_id}", response_model=TelemedicineSessionResponse)
def get_session(session_id: str):
    return get_session_by_id(session_id)


@router.get("/appointment/{appointment_id}", response_model=TelemedicineSessionResponse)
def get_session_for_appointment(appointment_id: str):
    return get_session_by_appointment(appointment_id)


@router.put("/{session_id}/status", response_model=TelemedicineSessionResponse)
def change_session_status(session_id: str, payload: TelemedicineSessionStatusUpdate):
    return update_session_status(session_id, payload)
