from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.schemas.auth_schema import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    TokenResponse,
    UserProfileResponse,
)
from app.services.auth_service import register_user, login_user, get_profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    return register_user(payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    return login_user(payload)


@router.get("/profile", response_model=UserProfileResponse)
def profile(current_user=Depends(get_current_user)):
    return get_profile(current_user)