from typing import Optional

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    owner_id: str
    month: str
    amount_paid: float
    payment_date: str
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    owner_id: Optional[str] = None
    month: Optional[str] = None
    amount_paid: Optional[float] = None
    payment_date: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    owner_id: str
    owner_name: Optional[str] = None
    month: str
    amount_paid: float
    payment_date: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str
