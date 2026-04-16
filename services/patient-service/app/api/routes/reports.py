from fastapi import APIRouter

from app.schemas.patient_schema import MedicalReportCreate, MedicalReportResponse
from app.services.patient_service import create_medical_report, list_medical_reports

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=MedicalReportResponse, status_code=201)
def create_report(payload: MedicalReportCreate):
    return create_medical_report(payload)


@router.get("/patient/{patient_id}", response_model=list[MedicalReportResponse])
def get_reports(patient_id: str):
    return list_medical_reports(patient_id)
