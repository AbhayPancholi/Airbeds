from typing import Optional

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    expense_type: str
    amount: float
    date: str
    description: Optional[str] = None


class ExpenseUpdate(BaseModel):
    expense_type: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: str
    expense_type: str
    amount: float
    date: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
