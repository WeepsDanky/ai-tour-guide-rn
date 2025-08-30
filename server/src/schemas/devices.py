# src/schemas/devices.py
from pydantic import BaseModel
from datetime import datetime

class DeviceRegisterRequest(BaseModel):
    push_token: str
    platform: str  # ios|android

class DeviceRegisterResponse(BaseModel):
    ok: bool
    id: int

class DeviceDeleteRequest(BaseModel):
    push_token: str

class DeviceDeleteResponse(BaseModel):
    ok: bool