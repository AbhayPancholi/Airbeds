from typing import Optional

from pydantic import BaseModel, EmailStr


class TenantCreate(BaseModel):
    # Property possession (tenant_id derived from contact_number: AIR-<last 5 digits>)
    society_name: str
    building_name: str
    flat_number: str
    selected_room: str
    occupancy_type: str  # Single | Sharing

    # Identity
    salutation: str
    tenant_name: str
    gender: str
    dob: str
    age: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_number: str
    whatsapp_number: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: str
    residential_address: str
    pin_code: str
    state: str
    country: str

    # Institute / office
    institute_office_name: Optional[str] = None
    employment_type: Optional[str] = None  # Self-employed | Employed | Student
    occupancy_details: Optional[str] = None  # position or course
    alternate_contact_number: Optional[str] = None
    office_address: Optional[str] = None
    office_pin_code: Optional[str] = None
    office_state: Optional[str] = None
    office_country: Optional[str] = None

    # Documents (base64 or URL)
    passport_photo: Optional[str] = None
    aadhaar_front: Optional[str] = None
    aadhaar_back: Optional[str] = None
    pan_card_doc: Optional[str] = None
    office_institute_id_doc: Optional[str] = None

    # Optional link to owner
    owner_id: Optional[str] = None


class TenantUpdate(BaseModel):
    tenant_id: Optional[str] = None  # Recomputed from contact_number if contact_number is updated
    society_name: Optional[str] = None
    building_name: Optional[str] = None
    flat_number: Optional[str] = None
    selected_room: Optional[str] = None
    occupancy_type: Optional[str] = None
    salutation: Optional[str] = None
    tenant_name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_number: Optional[str] = None
    whatsapp_number: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    residential_address: Optional[str] = None
    pin_code: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    institute_office_name: Optional[str] = None
    employment_type: Optional[str] = None
    occupancy_details: Optional[str] = None
    alternate_contact_number: Optional[str] = None
    office_address: Optional[str] = None
    office_pin_code: Optional[str] = None
    office_state: Optional[str] = None
    office_country: Optional[str] = None
    passport_photo: Optional[str] = None
    aadhaar_front: Optional[str] = None
    aadhaar_back: Optional[str] = None
    pan_card_doc: Optional[str] = None
    office_institute_id_doc: Optional[str] = None
    owner_id: Optional[str] = None


class TenantResponse(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    society_name: Optional[str] = None
    building_name: Optional[str] = None
    flat_number: Optional[str] = None
    selected_room: Optional[str] = None
    occupancy_type: Optional[str] = None
    salutation: Optional[str] = None
    tenant_name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[str] = None
    email: Optional[str] = None
    contact_number: Optional[str] = None
    whatsapp_number: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    residential_address: Optional[str] = None
    pin_code: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    institute_office_name: Optional[str] = None
    employment_type: Optional[str] = None
    occupancy_details: Optional[str] = None
    alternate_contact_number: Optional[str] = None
    office_address: Optional[str] = None
    office_pin_code: Optional[str] = None
    office_state: Optional[str] = None
    office_country: Optional[str] = None
    passport_photo: Optional[str] = None
    aadhaar_front: Optional[str] = None
    aadhaar_back: Optional[str] = None
    pan_card_doc: Optional[str] = None
    office_institute_id_doc: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    created_at: str
    updated_at: str
