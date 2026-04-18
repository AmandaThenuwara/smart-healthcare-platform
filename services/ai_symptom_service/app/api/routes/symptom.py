from fastapi import APIRouter, Depends, status

from app.core.dependencies import (
    ensure_symptom_check_owner_or_admin,
    get_current_patient_profile_id,
    get_current_user,
    require_roles,
)
from app.schemas.symptom_schema import SymptomCheckCreate, SymptomCheckResponse
from app.services.symptom_service import (
    create_symptom_check,
    get_symptom_check_by_id,
    list_my_symptom_checks,
)

router = APIRouter(prefix="/symptom-checks", tags=["symptom-checks"])


@router.post("", response_model=SymptomCheckResponse, status_code=status.HTTP_201_CREATED)
def create_new_symptom_check(
    payload: SymptomCheckCreate,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    patient_id = get_current_patient_profile_id(current_user)
    return create_symptom_check(
        payload=payload,
        patient_id=patient_id,
        user_id=str(current_user["_id"]),
    )


@router.get("/me", response_model=list[SymptomCheckResponse])
def get_my_symptom_checks(
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    return list_my_symptom_checks(str(current_user["_id"]))


@router.get("/{check_id}", response_model=SymptomCheckResponse)
def get_single_symptom_check(
    check_id: str,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    ensure_symptom_check_owner_or_admin(check_id, current_user)
    return get_symptom_check_by_id(check_id)
