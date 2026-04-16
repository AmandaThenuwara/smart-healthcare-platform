from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_doctors_collection, get_availability_collection
from app.models.doctor_model import build_doctor_document, serialize_doctor
from app.models.availability_model import build_availability_document, serialize_availability


def ensure_doctor_indexes():
    get_doctors_collection().create_index("userId", unique=True)
    get_doctors_collection().create_index("email", unique=True)
    get_availability_collection().create_index(
        [("doctorId", 1), ("date", 1), ("startTime", 1), ("endTime", 1)],
        unique=True,
    )


def create_doctor_profile(payload):
    doctors = get_doctors_collection()

    if doctors.find_one({"userId": payload.userId}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor profile already exists for this user",
        )

    if doctors.find_one({"email": payload.email.lower()}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor email is already registered",
        )

    result = doctors.insert_one(build_doctor_document(payload))
    created = doctors.find_one({"_id": result.inserted_id})
    return serialize_doctor(created)


def get_doctor_profile(doctor_id: str):
    document = get_doctors_collection().find_one({"_id": ObjectId(doctor_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return serialize_doctor(document)


def update_doctor_profile(doctor_id: str, payload):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    update_data["updatedAt"] = datetime.now(timezone.utc)

    result = get_doctors_collection().update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    updated = get_doctors_collection().find_one({"_id": ObjectId(doctor_id)})
    return serialize_doctor(updated)


def create_availability_slot(payload):
    availability = get_availability_collection()

    existing = availability.find_one(
        {
            "doctorId": payload.doctorId,
            "date": payload.date,
            "startTime": payload.startTime,
            "endTime": payload.endTime,
        }
    )
    if existing:
        raise HTTPException(status_code=400, detail="Availability slot already exists")

    result = availability.insert_one(build_availability_document(payload))
    created = availability.find_one({"_id": result.inserted_id})
    return serialize_availability(created)


def list_availability_slots(doctor_id: str):
    cursor = get_availability_collection().find(
        {"doctorId": doctor_id}
    ).sort([("date", 1), ("startTime", 1)])

    return [serialize_availability(doc) for doc in cursor]