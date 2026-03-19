from typing import Optional

from pydantic import BaseModel


class OwnerFlatDocumentCreate(BaseModel):
    owner_id: str
    flat_index: int
    # 'agreement' | 'police_verification'
    document_type: str
    pdf_base64: str  # base64 without data URL prefix
    file_name: Optional[str] = None


class OwnerFlatDocumentResponse(BaseModel):
    id: str
    owner_id: str
    flat_index: int
    document_type: str
    file_name: Optional[str] = None
    created_at: str
    updated_at: str


class OwnerFlatListingResponse(BaseModel):
    owner_id: str
    owner_name: str
    flat_index: int
    flat_no: Optional[str] = None
    building_no: Optional[str] = None
    society: Optional[str] = None
    agreement_document_id: Optional[str] = None
    agreement_document_file_name: Optional[str] = None
    police_verification_document_id: Optional[str] = None
    police_verification_document_file_name: Optional[str] = None
    agreement_start_date: Optional[str] = None
    agreement_end_date: Optional[str] = None

