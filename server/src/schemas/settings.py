# src/schemas/settings.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, time

class QuietHours(BaseModel):
    start: str  # HH:mm format
    end: str    # HH:mm format

class ScheduleSettings(BaseModel):
    fixed_times: List[str]  # List of HH:mm format times
    density_per_day: int
    enable_random: bool
    timezone: str

class SettingsResponse(BaseModel):
    persona: str
    quiet_hours: QuietHours
    channels: List[str]
    max_per_day: int
    persona_level: int
    silence_until: Optional[datetime] = None
    schedule: ScheduleSettings

class SettingsUpdateRequest(BaseModel):
    persona: Optional[str] = None
    quiet_hours: Optional[QuietHours] = None
    channels: Optional[List[str]] = None
    max_per_day: Optional[int] = None
    persona_level: Optional[int] = None
    fixed_times: Optional[List[str]] = None
    density_per_day: Optional[int] = None
    enable_random: Optional[bool] = None
    timezone: Optional[str] = None

class SettingsUpdateResponse(BaseModel):
    ok: bool

class SafewordActivateRequest(BaseModel):
    duration_minutes: int

class SafewordActivateResponse(BaseModel):
    ok: bool
    silence_until: datetime

class MoodResponse(BaseModel):
    mood: str
    score: float
    updated_at: datetime