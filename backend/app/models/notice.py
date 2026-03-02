from typing import Optional

from pydantic import BaseModel, EmailStr


class NoticeCreate(BaseModel):
    # Optional link to tenant (for prefill / display)
    tenant_id: Optional[str] = None

    # Property information
    society_name: str
    building_name: str
    flat_number: str
    selected_room: str
    occupancy_type: str

    # Identity
    salutation: str
    tenant_name: str  # full name
    email: Optional[EmailStr] = None
    contact_number: str

    # Bank account details
    bank_name: Optional[str] = None
    beneficiary_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None


class NoticeUpdate(BaseModel):
    tenant_id: Optional[str] = None
    society_name: Optional[str] = None
    building_name: Optional[str] = None
    flat_number: Optional[str] = None
    selected_room: Optional[str] = None
    occupancy_type: Optional[str] = None
    salutation: Optional[str] = None
    tenant_name: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_number: Optional[str] = None
    bank_name: Optional[str] = None
    beneficiary_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None


class NoticeResponse(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    society_name: Optional[str] = None
    building_name: Optional[str] = None
    flat_number: Optional[str] = None
    selected_room: Optional[str] = None
    occupancy_type: Optional[str] = None
    salutation: Optional[str] = None
    tenant_name: Optional[str] = None
    email: Optional[str] = None
    contact_number: Optional[str] = None
    bank_name: Optional[str] = None
    beneficiary_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    created_at: str
    updated_at: str
