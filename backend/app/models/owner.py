from typing import List, Optional

from pydantic import BaseModel, EmailStr, field_validator


# Reusable address (owner, POA, flat) – standard format
class AddressModel(BaseModel):
    flat_no: str = ""
    building_no: str = ""
    society: str = ""
    block_sector: str = ""
    street_landmark: str = ""
    city: str = ""
    state: str = ""
    pin_code: str = ""


# Power of Attorney
class POAModel(BaseModel):
    name: str = ""
    dob: Optional[str] = None
    occupation: str = ""
    address: Optional[AddressModel] = None
    phone: str = ""
    email: Optional[EmailStr] = None


# Agreement with POA (per flat)
class AgreementWithPOAModel(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    one_time_deposit: Optional[float] = None
    monthly_rent: Optional[float] = None


# Flat details (one or multiple per owner)
class FlatModel(BaseModel):
    address: Optional[AddressModel] = None
    measurement_sqft: Optional[float] = None
    floor_no: Optional[str] = None
    bhk: str = ""  # e.g. "1 BHK", "2 BHK"
    car_parking: bool = False
    agreement_with_poa: Optional[AgreementWithPOAModel] = None


def _address_to_flat_number(addr: Optional[AddressModel]) -> str:
    if not addr:
        return ""
    return addr.flat_no or ""


def _address_to_property_address(addr: Optional[AddressModel]) -> str:
    if not addr:
        return ""
    parts = [
        addr.flat_no,
        addr.building_no,
        addr.society,
        addr.block_sector,
        addr.street_landmark,
        addr.city,
        addr.state,
        addr.pin_code,
    ]
    return ", ".join(p for p in parts if p)


class OwnerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    # Legacy fields (optional; derived from first flat if flats provided)
    property_address: Optional[str] = None
    flat_number: Optional[str] = None
    # New detailed fields
    dob: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[AddressModel] = None
    poa: Optional[POAModel] = None
    flats: Optional[List[FlatModel]] = None
    # Identity / documents
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_card_doc: Optional[str] = None   # PDF base64
    aadhaar_card_doc: Optional[str] = None   # PDF base64
    photo: Optional[str] = None   # base64 or data URL
    sign: Optional[str] = None    # base64 or data URL

    @field_validator("address", mode="before")
    @classmethod
    def coerce_address(cls, v):
        if v is None or isinstance(v, AddressModel):
            return v
        return AddressModel(**v) if isinstance(v, dict) else v

    @field_validator("poa", mode="before")
    @classmethod
    def coerce_poa(cls, v):
        if v is None or isinstance(v, POAModel):
            return v
        return POAModel(**v) if isinstance(v, dict) else v

    @field_validator("flats", mode="before")
    @classmethod
    def coerce_flats(cls, v):
        if v is None:
            return v
        if isinstance(v, list):
            return [FlatModel(**x) if isinstance(x, dict) else x for x in v]
        return v


class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    property_address: Optional[str] = None
    flat_number: Optional[str] = None
    dob: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[AddressModel] = None
    poa: Optional[POAModel] = None
    flats: Optional[List[FlatModel]] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_card_doc: Optional[str] = None
    aadhaar_card_doc: Optional[str] = None
    photo: Optional[str] = None
    sign: Optional[str] = None

    @field_validator("address", mode="before")
    @classmethod
    def coerce_address(cls, v):
        if v is None or isinstance(v, AddressModel):
            return v
        return AddressModel(**v) if isinstance(v, dict) else v

    @field_validator("poa", mode="before")
    @classmethod
    def coerce_poa(cls, v):
        if v is None or isinstance(v, POAModel):
            return v
        return POAModel(**v) if isinstance(v, dict) else v

    @field_validator("flats", mode="before")
    @classmethod
    def coerce_flats(cls, v):
        if v is None:
            return v
        if isinstance(v, list):
            return [FlatModel(**x) if isinstance(x, dict) else x for x in v]
        return v


class OwnerResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    property_address: str
    flat_number: str
    created_at: str
    updated_at: str
    dob: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[AddressModel] = None
    poa: Optional[POAModel] = None
    flats: Optional[List[FlatModel]] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_card_doc: Optional[str] = None
    aadhaar_card_doc: Optional[str] = None
    photo: Optional[str] = None
    sign: Optional[str] = None
    tenant_count: Optional[int] = None  # Filled when listing owners

    @field_validator("address", mode="before")
    @classmethod
    def coerce_address(cls, v):
        if v is None or isinstance(v, AddressModel):
            return v
        return AddressModel(**v) if isinstance(v, dict) else v

    @field_validator("poa", mode="before")
    @classmethod
    def coerce_poa(cls, v):
        if v is None or isinstance(v, POAModel):
            return v
        return POAModel(**v) if isinstance(v, dict) else v

    @field_validator("flats", mode="before")
    @classmethod
    def coerce_flats(cls, v):
        if v is None:
            return v
        if isinstance(v, list):
            return [FlatModel(**x) if isinstance(x, dict) else x for x in v]
        return v
