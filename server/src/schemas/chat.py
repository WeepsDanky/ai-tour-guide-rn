# src/schemas/chat.py
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class MessageResponse(BaseModel):
    id: int
    user_id: int
    sender: str  # system|user
    type: str  # text|voice|card
    content: str
    meta: Optional[dict] = None
    created_at: datetime

class ChatListResponse(BaseModel):
    messages: List[MessageResponse]
    next_cursor: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str
    type: str = "text"

class SendMessageResponse(BaseModel):
    id: int
    created_at: datetime

class TriggerRequest(BaseModel):
    preset: str  # burst

class TriggerResponse(BaseModel):
    ok: bool
    delivery_id: int