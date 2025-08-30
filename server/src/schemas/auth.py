# src/schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    redirect_url: Optional[str] = None

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
    redirect_url: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    id: UUID # was str
    email: str
    display_name: str
    persona: str
    safeword: str
    tz: str
    locale: str
    created_at: datetime
    updated_at: datetime

class AuthResponse(BaseModel):
    token: str # access_token
    refresh_token: str
    user: UserResponse
    is_new_user: bool
    expires_in: int  # 新增：access 过期秒数

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None  # 若不传则用 Cookie

class RefreshResponse(BaseModel):
    token: TokenPair

class LogoutRequest(BaseModel):
    push_token: str

class LogoutResponse(BaseModel):
    ok: bool