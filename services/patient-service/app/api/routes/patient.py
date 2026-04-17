from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import ensure_resource_owner_or_admin, require_roles
from app.schemas.patient_schema import (
    PatientProfileCreate,
    PatientProfileUpdate,
    PatientProfileResponse,
)
from app.services.patient_service import (
    create_patient_profile,
    get_patient_profile,
    get_patient_profile_by_user_id,
    update_patient_profile,
)

router = APIRouter(prefix="/patients", tags=["patients"])


def _extract_user_id(resource) -> str | None:
    if isinstance(resource, dict):
        return resource.get("userId")

    user_id = getattr(resource, "userId", None)
    if user_id is not None:
        return user_id

    if hasattr(resource, "model_dump"):
        return resource.model_dump().get("userId")

    return None


@router.post("", response_model=PatientProfileResponse, status_code=201)
def create_patient(
    payload: PatientProfileCreate,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        return create_patient_profile(payload)

    enforced_payload = PatientProfileCreate(
        **payload.model_dump(exclude={"userId", "fullName", "email"}),
        userId=str(current_user["_id"]),
        fullName=current_user.get("fullName", ""),
        email=current_user.get("email", ""),
    )
    return create_patient_profile(enforced_payload)


@router.get("/me", response_model=PatientProfileResponse)
def get_my_patient_profile(
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        raise HTTPException(
            status_code=400,
            detail="Admin does not have a single patient profile. Use specific patient endpoints instead.",
        )

    return get_patient_profile_by_user_id(str(current_user["_id"]))


@router.get("/{patient_id}", response_model=PatientProfileResponse)
def get_patient(
    patient_id: str,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    profile = get_patient_profile(patient_id)
    ensure_resource_owner_or_admin(_extract_user_id(profile), current_user)
    return profile


@router.put("/{patient_id}", response_model=PatientProfileResponse)
def update_patient(
    patient_id: str,
    payload: PatientProfileUpdate,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    profile = get_patient_profile(patient_id)
    ensure_resource_owner_or_admin(_extract_user_id(profile), current_user)
    return update_patient_profile(patient_id, payload)