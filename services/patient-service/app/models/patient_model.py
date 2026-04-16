from datetime import datetime, timezone


def build_patient_document(payload) -> dict:
    return {
        "userId": payload.userId,
        "fullName": payload.fullName.strip(),
        "email": payload.email.lower(),
        "phone": payload.phone,
        "dateOfBirth": payload.dateOfBirth,
        "gender": payload.gender,
        "address": payload.address.strip(),
        "emergencyContactName": payload.emergencyContactName.strip(),
        "emergencyContactPhone": payload.emergencyContactPhone,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }


def serialize_patient(document: dict) -> dict:
    return {
        "patientId": str(document["_id"]),
        "userId": document["userId"],
        "fullName": document["fullName"],
        "email": document["email"],
        "phone": document["phone"],
        "dateOfBirth": document["dateOfBirth"],
        "gender": document["gender"],
        "address": document["address"],
        "emergencyContactName": document["emergencyContactName"],
        "emergencyContactPhone": document["emergencyContactPhone"],
    }
