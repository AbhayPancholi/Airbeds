from typing import Optional

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    party_type: str  # "owner" or "tenant"
    party_id: str
    transaction_type: str  # "credit" or "debit"
    month: str
    amount_paid: float
    payment_date: str
    notes: Optional[str] = None
    bank_account_id: Optional[str] = None
    # Legacy field kept for backward compat reads
    owner_id: Optional[str] = None


class PaymentUpdate(BaseModel):
    party_type: Optional[str] = None
    party_id: Optional[str] = None
    transaction_type: Optional[str] = None
    owner_id: Optional[str] = None
    month: Optional[str] = None
    amount_paid: Optional[float] = None
    payment_date: Optional[str] = None
    notes: Optional[str] = None
    bank_account_id: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    party_type: str
    party_id: str
    party_name: Optional[str] = None
    transaction_type: str
    month: str
    amount_paid: float
    payment_date: str
    notes: Optional[str] = None
    bank_account_id: Optional[str] = None
    # Legacy
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    created_at: str
    updated_at: str
