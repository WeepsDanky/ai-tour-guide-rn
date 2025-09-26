# src/schemas/guide.py
from pydantic import BaseModel, Field, model_validator
from typing import List, Literal, Union, Optional, Dict, Any

# 1.1 REST API: /v1/identify
class Geo(BaseModel):
    """Geographic coordinates with accuracy"""
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    accuracyM: int = Field(..., description="Accuracy in meters", alias="accuracyM")

class IdentifyRequest(BaseModel):
    """Request payload for image identification"""
    imageBase64: Optional[str] = Field(None, description="Base64 string or data URL (data:image/*;base64,...) ")
    imageUrl: Optional[str] = Field(None, description="Direct https URL to the image")
    geo: Geo = Field(..., description="Geographic location")
    deviceId: str = Field(..., description="Device identifier")

    @model_validator(mode="after")
    def _validate_image_source(self) -> "IdentifyRequest":
        if not self.imageBase64 and not self.imageUrl:
            raise ValueError("Either imageBase64 or imageUrl must be provided")
        return self

class Candidate(BaseModel):
    """Identified location candidate"""
    spot: str = Field(..., description="Location name")
    confidence: float = Field(..., description="Confidence score between 0 and 1")
    bbox: Optional[Dict[str, Any]] = Field(None, description="Bounding box coordinates")

class IdentifyResponse(BaseModel):
    """Response from image identification"""
    identifyId: str = Field(..., description="Unique identification session ID")
    candidates: List[Candidate] = Field(..., description="List of location candidates")

# 1.2 WebSocket Messages - Client to Server
class InitMessage(BaseModel):
    """Initialize guide streaming session"""
    type: Literal["init"]
    deviceId: str = Field(..., description="Device identifier")
    imageBase64: Optional[str] = Field(None, description="Base64 string or data URL")
    imageUrl: Optional[str] = Field(None, description="Direct https URL to the image")
    identifyId: Optional[str] = Field(None, description="Optional identify session ID")
    geo: Geo = Field(..., description="Geographic location")
    prefs: Dict[str, Any] = Field(default_factory=dict, description="User preferences")

    @model_validator(mode="after")
    def _validate_image_source(self) -> "InitMessage":
        if not self.imageBase64 and not self.imageUrl:
            raise ValueError("Either imageBase64 or imageUrl must be provided")
        return self

class ReplayMessage(BaseModel):
    """Request to replay from specific position"""
    type: Literal["replay"]
    guideId: str = Field(..., description="Guide identifier")
    fromMs: int = Field(..., description="Start position in milliseconds")

class NackMessage(BaseModel):
    """Negative acknowledgment for audio segment"""
    type: Literal["nack"]
    seq: int = Field(..., description="Sequence number of missing segment")

class CloseMessage(BaseModel):
    """Close the streaming session"""
    type: Literal["close"]

# Keep-alive ping from client
class PingMessage(BaseModel):
    type: Literal["ping"]
    ts: Optional[int] = Field(None, description="Client timestamp (ms)")

# Union type for all client messages
ClientMessage = Union[InitMessage, ReplayMessage, NackMessage, CloseMessage, PingMessage]

# 1.3 WebSocket Messages - Server to Client
class MetaMessage(BaseModel):
    """Metadata about the guide"""
    type: Literal["meta"]
    guideId: str = Field(..., description="Unique guide identifier")
    title: str = Field(..., description="Guide title")
    spot: str = Field(..., description="Location name")
    confidence: float = Field(..., description="Confidence score")
    estimatedDurationMs: int = Field(..., description="Estimated duration in milliseconds")

class TextMessage(BaseModel):
    """Text content delta"""
    type: Literal["text"]
    delta: str = Field(..., description="Text content chunk")

class EosMessage(BaseModel):
    """End of stream marker"""
    type: Literal["eos"]
    guideId: str = Field(..., description="Guide identifier")
    totalDurationMs: int = Field(..., description="Total duration in milliseconds")
    transcript: str = Field(..., description="Complete transcript")

class ErrorMessage(BaseModel):
    """Error notification"""
    type: Literal["error"]
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

# Server pong response
class PongMessage(BaseModel):
    type: Literal["pong"]
    ts: int = Field(..., description="Server timestamp (ms)")

# Union type for all server messages
ServerMessage = Union[MetaMessage, TextMessage, EosMessage, ErrorMessage, PongMessage]

# 1.4 Additional helper schemas
class UserPreferences(BaseModel):
    """User preferences for guide generation"""
    language: str = Field(default="zh-CN", description="Preferred language")
    voice_speed: float = Field(default=1.0, description="Voice playback speed")
    detail_level: str = Field(default="medium", description="Level of detail (brief, medium, detailed)")
    interests: List[str] = Field(default_factory=list, description="User interests")

class AudioSegmentInfo(BaseModel):
    """Information about an audio segment"""
    seq: int = Field(..., description="Sequence number")
    start_ms: int = Field(..., description="Start time in milliseconds")
    end_ms: int = Field(..., description="End time in milliseconds")
    format: str = Field(default="mp3", description="Audio format")
    bitrate_kbps: int = Field(default=128, description="Bitrate in kbps")
    bytes_len: int = Field(..., description="Size in bytes")
    object_key: str = Field(..., description="Storage object key")
