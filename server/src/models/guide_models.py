# src/models/guide_models.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class IdentifySession(BaseModel):
    """Database model for identify_sessions table"""
    identify_id: str
    device_id: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy_m: Optional[int] = None
    spot: Optional[str] = None
    confidence: Optional[float] = None
    bbox: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Guide(BaseModel):
    """Database model for guides table"""
    guide_id: str
    device_id: Optional[str] = None
    spot: Optional[str] = None
    title: Optional[str] = None
    confidence: Optional[float] = None
    transcript: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GuideSegment(BaseModel):
    """Database model for guide_segments table"""
    guide_id: str
    seq: int
    start_ms: Optional[int] = None
    end_ms: Optional[int] = None
    format: Optional[str] = None
    bitrate_kbps: Optional[int] = None
    bytes_len: Optional[int] = None
    object_key: Optional[str] = None

    class Config:
        from_attributes = True
