from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    fullName: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["PATIENT", "DOCTOR", "ADMIN"]


class RegisterResponse(BaseModel):
    message: str
    userId: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserProfileResponse(BaseModel):
    userId: str
    fullName: str
    email: EmailStr
    role: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str
    user: UserProfileResponse