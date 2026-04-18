from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.dependencies import require_roles
from app.schemas.doctor_schema import (
    DoctorBrowseResponse,
    DoctorProfileCreate,
    DoctorProfileResponse,
    DoctorProfileUpdate,
)
from app.services.doctor_service import (
    create_doctor_profile,
    get_doctor_profile,
    get_doctor_profile_by_user_id,
    get_public_doctor_profile,
    list_public_doctors,
    update_doctor_profile,
)

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("/browse", response_model=list[DoctorBrowseResponse])
def browse_doctors(
    search: str | None = Query(default=None),
    specialty: str | None = Query(default=None),
    hospital: str | None = Query(default=None),
):
    return list_public_doctors(search=search, specialty=specialty, hospital=hospital)


@router.get("/public/{doctor_id}", response_model=DoctorBrowseResponse)
def get_public_doctor(doctor_id: str):
    return get_public_doctor_profile(doctor_id)


@router.post("", response_model=DoctorProfileResponse, status_code=201)
def create_doctor(
    payload: DoctorProfileCreate,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        return create_doctor_profile(payload)

    enforced_payload = DoctorProfileCreate(
        **payload.model_dump(exclude={"userId", "fullName", "email"}),
        userId=str(current_user["_id"]),
        fullName=current_user.get("fullName", ""),
        email=current_user.get("email", ""),
    )
    return create_doctor_profile(enforced_payload)


@router.get("/me", response_model=DoctorProfileResponse)
def get_my_doctor_profile(
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        raise HTTPException(
            status_code=400,
            detail="Admin does not have a single doctor profile. Use specific doctor endpoints instead.",
        )
    return get_doctor_profile_by_user_id(str(current_user["_id"]))


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
def get_doctor(
    doctor_id: str,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    profile = get_doctor_profile(doctor_id)

    if current_user.get("role") != "ADMIN" and profile["userId"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You do not have permission to access this doctor profile")

    return profile


@router.put("/{doctor_id}", response_model=DoctorProfileResponse)
def update_doctor(
    doctor_id: str,
    payload: DoctorProfileUpdate,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    profile = get_doctor_profile(doctor_id)

    if current_user.get("role") != "ADMIN" and profile["userId"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You do not have permission to update this doctor profile")

    return update_doctor_profile(doctor_id, payload)