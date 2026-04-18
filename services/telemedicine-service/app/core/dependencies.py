from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo import MongoClient

from app.core.config import (
    MONGO_URI,
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_AUTH_SOURCE,
)
from app.core.security import decode_access_token
from app.db.mongodb import get_sessions_collection

bearer_scheme = HTTPBearer(auto_error=True)

_auth_client = MongoClient(
    MONGO_URI,
    username=MONGO_USERNAME,
    password=MONGO_PASSWORD,
    authSource=MONGO_AUTH_SOURCE,
)
_auth_users_collection = _auth_client["auth_db"]["users"]
_patients_collection = _auth_client["patient_db"]["patients"]
_doctors_collection = _auth_client["doctor_db"]["doctors"]
_appointments_collection = _auth_client["appointment_db"]["appointments"]


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials
    payload = decode_access_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        ) from exc

    user = _auth_users_collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def require_roles(*allowed_roles: str):
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return current_user

    return role_checker


def get_current_patient_profile_id(current_user: dict) -> str:
    profile = _patients_collection.find_one({"userId": str(current_user["_id"])})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found for current user",
        )
    return str(profile["_id"])


def get_current_doctor_profile_id(current_user: dict) -> str:
    profile = _doctors_collection.find_one({"userId": str(current_user["_id"])})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for current user",
        )
    return str(profile["_id"])


def ensure_appointment_participant_or_admin(appointment_id: str, current_user: dict):
    try:
        object_id = ObjectId(appointment_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        ) from exc

    appointment = _appointments_collection.find_one({"_id": object_id})
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    if current_user.get("role") == "ADMIN":
        return appointment

    if current_user.get("role") == "PATIENT":
        if appointment.get("patientId") != get_current_patient_profile_id(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this appointment",
            )
        return appointment

    if current_user.get("role") == "DOCTOR":
        if appointment.get("doctorId") != get_current_doctor_profile_id(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this appointment",
            )
        return appointment

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this appointment",
    )


def ensure_session_participant_or_admin(session_id: str, current_user: dict):
    try:
        object_id = ObjectId(session_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telemedicine session not found",
        ) from exc

    session = get_sessions_collection().find_one({"_id": object_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telemedicine session not found",
        )

    if current_user.get("role") == "ADMIN":
        return session

    if current_user.get("role") == "PATIENT":
        if session.get("patientId") != get_current_patient_profile_id(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this session",
            )
        return session

    if current_user.get("role") == "DOCTOR":
        if session.get("doctorId") != get_current_doctor_profile_id(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this session",
            )
        return session

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this session",
    )
