from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from bson import ObjectId
from fastapi import HTTPException, UploadFile, status

from app.core.config import UPLOAD_DIR
from app.db.mongodb import get_patients_collection, get_reports_collection
from app.models.patient_model import build_patient_document, serialize_patient
from app.models.report_model import build_report_document, serialize_report

ALLOWED_REPORT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}


def ensure_patient_indexes():
    get_patients_collection().create_index("userId", unique=True)
    get_patients_collection().create_index("email", unique=True)
    get_reports_collection().create_index("patientId")
    get_reports_collection().create_index("uploadedAt")


def create_patient_profile(payload):
    patients = get_patients_collection()

    if patients.find_one({"userId": payload.userId}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient profile already exists for this user",
        )

    if patients.find_one({"email": payload.email.lower()}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient email is already registered",
        )

    result = patients.insert_one(build_patient_document(payload))
    created = patients.find_one({"_id": result.inserted_id})
    return serialize_patient(created)


def get_patient_profile(patient_id: str):
    document = get_patients_collection().find_one({"_id": ObjectId(patient_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return serialize_patient(document)


def get_patient_profile_by_user_id(user_id: str):
    document = get_patients_collection().find_one({"userId": user_id})
    if not document:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return serialize_patient(document)


def update_patient_profile(patient_id: str, payload):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    update_data["updatedAt"] = datetime.now(timezone.utc)

    result = get_patients_collection().update_one(
        {"_id": ObjectId(patient_id)},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    updated = get_patients_collection().find_one({"_id": ObjectId(patient_id)})
    return serialize_patient(updated)


def create_medical_report(payload):
    patient = get_patients_collection().find_one({"_id": ObjectId(payload.patientId)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    result = get_reports_collection().insert_one(build_report_document(payload))
    created = get_reports_collection().find_one({"_id": result.inserted_id})
    return serialize_report(created)


def create_uploaded_medical_report(
    patient_id: str,
    title: str,
    report_type: str,
    upload_file: UploadFile,
):
    patient = get_patients_collection().find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a name")

    extension = Path(upload_file.filename).suffix.lower()
    if extension not in ALLOWED_REPORT_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: pdf, png, jpg, jpeg, doc, docx",
        )

    unique_name = f"{uuid4().hex}{extension}"
    save_path = UPLOAD_DIR / unique_name

    with save_path.open("wb") as file_buffer:
        content = upload_file.file.read()
        file_buffer.write(content)

    document = {
        "patientId": patient_id,
        "title": title,
        "fileName": upload_file.filename,
        "fileUrl": f"/uploads/{unique_name}",
        "reportType": report_type,
        "uploadedAt": datetime.now(timezone.utc),
    }

    result = get_reports_collection().insert_one(document)
    created = get_reports_collection().find_one({"_id": result.inserted_id})
    return serialize_report(created)


def list_medical_reports(patient_id: str):
    cursor = get_reports_collection().find({"patientId": patient_id}).sort(
        [("uploadedAt", -1)]
    )
    return [serialize_report(doc) for doc in cursor]