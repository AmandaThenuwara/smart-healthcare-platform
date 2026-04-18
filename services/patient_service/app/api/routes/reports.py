from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.core.dependencies import (
    ensure_patient_owner_or_admin,
    get_current_patient_profile_id,
    require_roles,
)
from app.schemas.patient_schema import MedicalReportCreate, MedicalReportResponse
from app.services.patient_service import (
    create_medical_report,
    create_uploaded_medical_report,
    list_medical_reports,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=MedicalReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: MedicalReportCreate,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        return create_medical_report(payload)

    enforced_payload = MedicalReportCreate(
        **payload.model_dump(exclude={"patientId"}),
        patientId=get_current_patient_profile_id(current_user),
    )
    return create_medical_report(enforced_payload)


@router.post(
    "/upload",
    response_model=MedicalReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_report(
    title: str = Form(...),
    reportType: str = Form(...),
    file: UploadFile = File(...),
    patientId: str | None = Form(default=None),
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        if not patientId:
            raise ValueError("patientId is required for admin uploads")
        target_patient_id = patientId
    else:
        target_patient_id = get_current_patient_profile_id(current_user)

    return create_uploaded_medical_report(
        patient_id=target_patient_id,
        title=title,
        report_type=reportType,
        upload_file=file,
    )


@router.get("/patient/{patient_id}", response_model=list[MedicalReportResponse])
def get_reports(
    patient_id: str,
    current_user=Depends(require_roles("PATIENT", "ADMIN")),
):
    ensure_patient_owner_or_admin(patient_id, current_user)
    return list_medical_reports(patient_id)
