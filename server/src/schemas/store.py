# src/schemas/store.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

class ProductResponse(BaseModel):
    id: str
    type: str  # SUBSCRIPTION | DLC
    title: str
    description: Optional[str] = None
    price: str  # String representation of decimal
    meta: Optional[Dict[str, Any]] = None

class ProductListResponse(BaseModel):
    products: List[ProductResponse]

class PurchaseResponse(BaseModel):
    id: int
    product_id: str
    status: str  # active | expired | refunded
    expires_at: Optional[datetime] = None
    purchased_at: datetime
    provider_tx_id: Optional[str] = None

class PurchaseListResponse(BaseModel):
    purchases: List[PurchaseResponse]

class CreatePurchaseRequest(BaseModel):
    product_id: str

class CreatePurchaseResponse(BaseModel):
    id: int
    product_id: str
    status: str
    expires_at: Optional[datetime] = None
    purchased_at: datetime