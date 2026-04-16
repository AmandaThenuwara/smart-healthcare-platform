from fastapi import APIRouter, Depends

from app.core.dependencies import ensure_resource_owner_or_admin, require_roles
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


def _extract_user_id(resource) -> str | None:
    if isinstance(resource, dict):
        return resource.get("userId")

    user_id = getattr(resource, "userId", None)
    if user_id is not None:
        return user_id

    if hasattr(resource, "model_dump"):
        return resource.model_dump().get("userId")

    return None


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


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
def get_doctor(
    doctor_id: str,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    profile = get_doctor_profile(doctor_id)
    ensure_resource_owner_or_admin(_extract_user_id(profile), current_user)
    return profile


@router.put("/{doctor_id}", response_model=DoctorProfileResponse)
def update_doctor(
    doctor_id: str,
    payload: DoctorProfileUpdate,
    current_user=Depends(require_roles("DOCTOR", "ADMIN")),
):
    profile = get_doctor_profile(doctor_id)
    ensure_resource_owner_or_admin(_extract_user_id(profile), current_user)
    return update_doctor_profile(doctor_id, payload)
