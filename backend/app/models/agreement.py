from typing import Optional

from pydantic import BaseModel


class AgreementCreate(BaseModel):
    tenant_id: str
    owner_id: str
    start_date: str
    end_date: str
    rent_amount: float
    deposit_amount: float


class AgreementUpdate(BaseModel):
    tenant_id: Optional[str] = None
    owner_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    rent_amount: Optional[float] = None
    deposit_amount: Optional[float] = None


class AgreementResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_name: Optional[str] = None
    owner_id: str
    owner_name: Optional[str] = None
    start_date: str
    end_date: str
    rent_amount: float
    deposit_amount: float
    status: str
    created_at: str
    updated_at: str
