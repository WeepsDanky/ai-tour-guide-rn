# src/schemas/common.py
from pydantic import BaseModel
from typing import Optional, Any

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class ErrorResponse(BaseModel):
    error: ErrorDetail

class SuccessResponse(BaseModel):
    ok: bool = True
    message: Optional[str] = None