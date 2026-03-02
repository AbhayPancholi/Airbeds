from typing import Optional

from pydantic import BaseModel


class PoliceVerificationCreate(BaseModel):
    tenant_id: str
    employer_details: str
    local_address: str
    emergency_contact: str
    photograph: Optional[str] = None  # Base64 encoded
    id_proof: Optional[str] = None  # Base64 encoded


class PoliceVerificationUpdate(BaseModel):
    tenant_id: Optional[str] = None
    employer_details: Optional[str] = None
    local_address: Optional[str] = None
    emergency_contact: Optional[str] = None
    photograph: Optional[str] = None
    id_proof: Optional[str] = None


class PoliceVerificationResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_name: Optional[str] = None
    employer_details: str
    local_address: str
    emergency_contact: str
    photograph: Optional[str] = None
    id_proof: Optional[str] = None
    created_at: str
    updated_at: str
