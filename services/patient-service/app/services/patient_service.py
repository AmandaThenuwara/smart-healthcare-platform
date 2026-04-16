from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_patients_collection, get_reports_collection
from app.models.patient_model import build_patient_document, serialize_patient
from app.models.report_model import build_report_document, serialize_report


def ensure_patient_indexes():
    get_patients_collection().create_index("userId", unique=True)
    get_patients_collection().create_index("email", unique=True)
    get_reports_collection().create_index("patientId")


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


def list_medical_reports(patient_id: str):
    cursor = get_reports_collection().find({"patientId": patient_id}).sort([("uploadedAt", -1)])
    return [serialize_report(doc) for doc in cursor]
