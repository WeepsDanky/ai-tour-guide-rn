# src/models/db_models.py
import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID

class UserDB(BaseModel):
    """Database model for users table"""
    id: uuid.UUID
    email: str
    display_name: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(BaseModel):
    id: UUID
    email: str
    google_sub: Optional[str] = None
    display_name: str = "你"
    persona: str = "needy"
    safeword: str = "停一下"
    tz: str = "Asia/Shanghai"
    locale: str = "zh-CN"
    created_at: datetime
    updated_at: datetime


class Device(BaseModel):
    id: int
    user_id: UUID
    push_token: str
    platform: Literal["ios", "android"]
    disabled: bool
    created_at: datetime