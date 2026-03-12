from typing import Optional

from pydantic import BaseModel


class BankAccountCreate(BaseModel):
    bank_name: str
    account_name: str  # e.g. Company name or account holder
    account_number: str
    ifsc_code: str
    branch: str
    account_type: Optional[str] = None  # e.g. Current, Savings
    is_active: bool = True


class BankAccountUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch: Optional[str] = None
    account_type: Optional[str] = None
    is_active: Optional[bool] = None


class BankAccountResponse(BaseModel):
    id: str
    bank_name: str
    account_name: str
    account_number: str
    ifsc_code: str
    branch: str
    account_type: Optional[str] = None
    is_active: bool
    current_balance: float
    created_at: str
    updated_at: str


class InvestmentCreate(BaseModel):
    bank_account_id: str
    amount: float
    date: str
    description: Optional[str] = None


class InvestmentResponse(BaseModel):
    id: str
    bank_account_id: str
    amount: float
    date: str
    description: Optional[str] = None
    created_at: str

