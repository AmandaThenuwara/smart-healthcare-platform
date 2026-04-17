from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.dependencies import require_roles
from app.schemas.doctor_schema import (
    AvailabilityCreate,
    AvailabilityResponse,
    AvailabilityUpdate,
)
from app.services.doctor_service import (
    create_availability_slot,
    delete_availability_slot,
    get_availability_slot,
    get_doctor_profile_by_user_id,
    list_availability_slots,
    update_availability_slot,
)

router = APIRouter(prefix="/availability", tags=["availability"])


@router.post("", response_model=AvailabilityResponse, status_code=201)
def create_availability(
    payload: AvailabilityCreate,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        return create_availability_slot(payload)

    my_profile = get_doctor_profile_by_user_id(str(current_user["_id"]))
    enforced_payload = AvailabilityCreate(
        **payload.model_dump(exclude={"doctorId"}),
        doctorId=my_profile["doctorId"],
    )
    return create_availability_slot(enforced_payload)


@router.get("/{doctor_id}", response_model=list[AvailabilityResponse])
def get_availability(
    doctor_id: str,
    availableOnly: bool = Query(default=False),
):
    return list_availability_slots(doctor_id, only_available=availableOnly)


@router.get("/slot/{slot_id}", response_model=AvailabilityResponse)
def get_single_availability(slot_id: str):
    return get_availability_slot(slot_id)


@router.put("/slot/{slot_id}", response_model=AvailabilityResponse)
def update_single_availability(
    slot_id: str,
    payload: AvailabilityUpdate,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    slot = get_availability_slot(slot_id)

    if current_user.get("role") != "ADMIN":
        my_profile = get_doctor_profile_by_user_id(str(current_user["_id"]))
        if slot["doctorId"] != my_profile["doctorId"]:
            raise HTTPException(status_code=403, detail="You do not have permission to update this slot")

    return update_availability_slot(slot_id, payload)


@router.delete("/slot/{slot_id}")
def delete_single_availability(
    slot_id: str,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    slot = get_availability_slot(slot_id)

    if current_user.get("role") != "ADMIN":
        my_profile = get_doctor_profile_by_user_id(str(current_user["_id"]))
        if slot["doctorId"] != my_profile["doctorId"]:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this slot")

    return delete_availability_slot(slot_id)
