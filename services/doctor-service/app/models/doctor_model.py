from datetime import datetime, timezone


def build_doctor_document(payload) -> dict:
    return {
        "userId": payload.userId,
        "fullName": payload.fullName.strip(),
        "email": payload.email.lower(),
        "specialty": payload.specialty.strip(),
        "qualifications": payload.qualifications.strip(),
        "hospital": payload.hospital.strip(),
        "consultationFee": payload.consultationFee,
        "bio": payload.bio.strip(),
        "approvalStatus": payload.approvalStatus,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }


def serialize_doctor(document: dict) -> dict:
    return {
        "doctorId": str(document["_id"]),
        "userId": document["userId"],
        "fullName": document["fullName"],
        "email": document["email"],
        "specialty": document["specialty"],
        "qualifications": document["qualifications"],
        "hospital": document["hospital"],
        "consultationFee": float(document["consultationFee"]),
        "bio": document["bio"],
        "approvalStatus": document["approvalStatus"],
    }


def serialize_doctor_public(document: dict) -> dict:
    return {
        "doctorId": str(document["_id"]),
        "fullName": document["fullName"],
        "specialty": document["specialty"],
        "qualifications": document["qualifications"],
        "hospital": document["hospital"],
        "consultationFee": float(document["consultationFee"]),
        "bio": document["bio"],
        "approvalStatus": document["approvalStatus"],
    }
