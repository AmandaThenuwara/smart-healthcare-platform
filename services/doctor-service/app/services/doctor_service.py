from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.db.mongodb import get_doctors_collection, get_availability_collection
from app.models.doctor_model import (
    build_doctor_document,
    serialize_doctor,
    serialize_doctor_public,
)
from app.models.availability_model import build_availability_document, serialize_availability


def ensure_doctor_indexes():
    get_doctors_collection().create_index("userId", unique=True)
    get_doctors_collection().create_index("email", unique=True)
    get_doctors_collection().create_index("approvalStatus")
    get_doctors_collection().create_index("specialty")
    get_doctors_collection().create_index("hospital")
    get_availability_collection().create_index("doctorId")
    get_availability_collection().create_index(
        [("doctorId", 1), ("date", 1), ("startTime", 1), ("endTime", 1)],
        unique=True,
    )


def _to_object_id(value: str, not_found_detail: str):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=404, detail=not_found_detail) from exc


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned if cleaned else None


def _parse_minutes(time_text: str) -> int:
    try:
        hours, minutes = time_text.split(":")
        return int(hours) * 60 + int(minutes)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid time format: {time_text}. Use HH:MM",
        ) from exc


def _validate_time_range(start_time: str, end_time: str):
    if _parse_minutes(start_time) >= _parse_minutes(end_time):
        raise HTTPException(
            status_code=400,
            detail="End time must be later than start time",
        )


def _ensure_doctor_exists(doctor_id: str):
    doctor = get_doctors_collection().find_one(
        {"_id": _to_object_id(doctor_id, "Doctor profile not found")}
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return doctor


def _ensure_no_overlapping_slot(
    doctor_id: str,
    date: str,
    start_time: str,
    end_time: str,
    exclude_slot_id: str | None = None,
):
    start_minutes = _parse_minutes(start_time)
    end_minutes = _parse_minutes(end_time)

    cursor = get_availability_collection().find(
        {
            "doctorId": doctor_id,
            "date": date,
        }
    )

    for slot in cursor:
        if exclude_slot_id and str(slot["_id"]) == exclude_slot_id:
            continue

        slot_start = _parse_minutes(slot["startTime"])
        slot_end = _parse_minutes(slot["endTime"])

        overlaps = start_minutes < slot_end and end_minutes > slot_start
        if overlaps:
            raise HTTPException(
                status_code=400,
                detail="Availability slot overlaps with an existing slot",
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
    document = get_doctors_collection().find_one(
        {"_id": _to_object_id(doctor_id, "Doctor profile not found")}
    )
    if not document:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return serialize_doctor(document)


def get_doctor_profile_by_user_id(user_id: str):
    document = get_doctors_collection().find_one({"userId": user_id})
    if not document:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return serialize_doctor(document)


def update_doctor_profile(doctor_id: str, payload):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    if "fullName" in update_data:
        update_data["fullName"] = update_data["fullName"].strip()
    if "specialty" in update_data:
        update_data["specialty"] = update_data["specialty"].strip()
    if "qualifications" in update_data:
        update_data["qualifications"] = update_data["qualifications"].strip()
    if "hospital" in update_data:
        update_data["hospital"] = update_data["hospital"].strip()
    if "bio" in update_data:
        update_data["bio"] = update_data["bio"].strip()

    update_data["updatedAt"] = datetime.now(timezone.utc)

    result = get_doctors_collection().update_one(
        {"_id": _to_object_id(doctor_id, "Doctor profile not found")},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    updated = get_doctors_collection().find_one(
        {"_id": _to_object_id(doctor_id, "Doctor profile not found")}
    )
    return serialize_doctor(updated)


def list_public_doctors(
    search: str | None = None,
    specialty: str | None = None,
    hospital: str | None = None,
):
    query: dict = {"approvalStatus": "APPROVED"}

    search = _normalize_text(search)
    specialty = _normalize_text(specialty)
    hospital = _normalize_text(hospital)

    if specialty:
        query["specialty"] = {"$regex": specialty, "$options": "i"}

    if hospital:
        query["hospital"] = {"$regex": hospital, "$options": "i"}

    if search:
        query["$or"] = [
            {"fullName": {"$regex": search, "$options": "i"}},
            {"specialty": {"$regex": search, "$options": "i"}},
            {"hospital": {"$regex": search, "$options": "i"}},
            {"qualifications": {"$regex": search, "$options": "i"}},
        ]

    cursor = get_doctors_collection().find(query).sort(
        [("fullName", 1), ("specialty", 1)]
    )
    return [serialize_doctor_public(doc) for doc in cursor]


def get_public_doctor_profile(doctor_id: str):
    document = get_doctors_collection().find_one(
        {
            "_id": _to_object_id(doctor_id, "Doctor profile not found"),
            "approvalStatus": "APPROVED",
        }
    )
    if not document:
        raise HTTPException(status_code=404, detail="Approved doctor not found")
    return serialize_doctor_public(document)


def create_availability_slot(payload):
    _ensure_doctor_exists(payload.doctorId)
    _validate_time_range(payload.startTime, payload.endTime)
    _ensure_no_overlapping_slot(
        payload.doctorId,
        payload.date,
        payload.startTime,
        payload.endTime,
    )

    availability = get_availability_collection()
    result = availability.insert_one(build_availability_document(payload))
    created = availability.find_one({"_id": result.inserted_id})
    return serialize_availability(created)


def list_availability_slots(doctor_id: str, only_available: bool = False):
    _ensure_doctor_exists(doctor_id)

    query: dict = {"doctorId": doctor_id}
    if only_available:
        query["isAvailable"] = True

    cursor = get_availability_collection().find(query).sort(
        [("date", 1), ("startTime", 1)]
    )
    return [serialize_availability(doc) for doc in cursor]


def get_availability_slot(slot_id: str):
    document = get_availability_collection().find_one(
        {"_id": _to_object_id(slot_id, "Availability slot not found")}
    )
    if not document:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    return serialize_availability(document)


def update_availability_slot(slot_id: str, payload):
    availability = get_availability_collection()
    existing = availability.find_one(
        {"_id": _to_object_id(slot_id, "Availability slot not found")}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Availability slot not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    next_date = update_data.get("date", existing["date"])
    next_start = update_data.get("startTime", existing["startTime"])
    next_end = update_data.get("endTime", existing["endTime"])

    _validate_time_range(next_start, next_end)
    _ensure_no_overlapping_slot(
        existing["doctorId"],
        next_date,
        next_start,
        next_end,
        exclude_slot_id=slot_id,
    )

    update_data["updatedAt"] = datetime.now(timezone.utc)

    availability.update_one(
        {"_id": existing["_id"]},
        {"$set": update_data},
    )

    updated = availability.find_one({"_id": existing["_id"]})
    return serialize_availability(updated)


def delete_availability_slot(slot_id: str):
    availability = get_availability_collection()
    existing = availability.find_one(
        {"_id": _to_object_id(slot_id, "Availability slot not found")}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Availability slot not found")

    availability.delete_one({"_id": existing["_id"]})
    return {"message": "Availability slot deleted successfully"}
