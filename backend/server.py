from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'estate-command-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="EstateCommand API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Admin Model
class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse

# Owner Model
class OwnerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    property_address: str
    flat_number: str

class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    property_address: Optional[str] = None
    flat_number: Optional[str] = None

class OwnerResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    property_address: str
    flat_number: str
    created_at: str
    updated_at: str

# Tenant Model
class TenantCreate(BaseModel):
    room_number: str
    tenant_name: str
    father_name: str
    dob: str
    gender: str
    occupation: str
    permanent_address: str
    aadhaar_number: str
    contact_number: str
    email: Optional[EmailStr] = None
    joining_date: str
    deposit_amount: float
    monthly_rent: float
    owner_id: str

class TenantUpdate(BaseModel):
    room_number: Optional[str] = None
    tenant_name: Optional[str] = None
    father_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    permanent_address: Optional[str] = None
    aadhaar_number: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    joining_date: Optional[str] = None
    deposit_amount: Optional[float] = None
    monthly_rent: Optional[float] = None
    owner_id: Optional[str] = None

class TenantResponse(BaseModel):
    id: str
    room_number: str
    tenant_name: str
    father_name: str
    dob: str
    gender: str
    occupation: str
    permanent_address: str
    aadhaar_number: str
    contact_number: str
    email: Optional[str] = None
    joining_date: str
    deposit_amount: float
    monthly_rent: float
    owner_id: str
    owner_name: Optional[str] = None
    created_at: str
    updated_at: str

# Notice Model
class NoticeCreate(BaseModel):
    tenant_id: str
    notice_date: str
    leaving_date: str
    reason: str

class NoticeUpdate(BaseModel):
    tenant_id: Optional[str] = None
    notice_date: Optional[str] = None
    leaving_date: Optional[str] = None
    reason: Optional[str] = None

class NoticeResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_name: Optional[str] = None
    notice_date: str
    leaving_date: str
    reason: str
    created_at: str
    updated_at: str

# Agreement Model
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

# Police Verification Model
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

# Payment Model
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

# Expense Model
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

# Dashboard Stats
class DashboardStats(BaseModel):
    total_tenants: int
    total_owners: int
    active_agreements: int
    pending_notices: int
    monthly_payments: float
    monthly_expenses: float
    recent_tenants: List[dict]
    recent_notices: List[dict]
    recent_expenses: List[dict]

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin_id = payload.get("sub")
        if admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
        if admin is None:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_month():
    return datetime.now(timezone.utc).strftime("%Y-%m")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_admin(admin: AdminCreate):
    existing = await db.admins.find_one({"email": admin.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    admin_doc = {
        "id": admin_id,
        "email": admin.email,
        "password": hash_password(admin.password),
        "name": admin.name,
        "created_at": now,
        "updated_at": now
    }
    
    await db.admins.insert_one(admin_doc)
    
    token = create_token(admin_id, admin.email)
    return TokenResponse(
        access_token=token,
        admin=AdminResponse(id=admin_id, email=admin.email, name=admin.name, created_at=now)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_admin(credentials: AdminLogin):
    admin = await db.admins.find_one({"email": credentials.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(admin["id"], admin["email"])
    return TokenResponse(
        access_token=token,
        admin=AdminResponse(id=admin["id"], email=admin["email"], name=admin["name"], created_at=admin["created_at"])
    )

@api_router.get("/auth/me", response_model=AdminResponse)
async def get_current_admin(admin: dict = Depends(verify_token)):
    return AdminResponse(id=admin["id"], email=admin["email"], name=admin["name"], created_at=admin["created_at"])

# ==================== OWNER ROUTES ====================

@api_router.post("/owners", response_model=OwnerResponse)
async def create_owner(owner: OwnerCreate, admin: dict = Depends(verify_token)):
    owner_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    owner_doc = {
        "id": owner_id,
        **owner.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.owners.insert_one(owner_doc)
    return OwnerResponse(**{k: v for k, v in owner_doc.items() if k != "_id"})

@api_router.get("/owners", response_model=List[OwnerResponse])
async def get_owners(search: Optional[str] = None, page: int = 1, limit: int = 10, admin: dict = Depends(verify_token)):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"flat_number": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    owners = await db.owners.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return [OwnerResponse(**owner) for owner in owners]

@api_router.get("/owners/all", response_model=List[OwnerResponse])
async def get_all_owners(admin: dict = Depends(verify_token)):
    owners = await db.owners.find({}, {"_id": 0}).to_list(1000)
    return [OwnerResponse(**owner) for owner in owners]

@api_router.get("/owners/{owner_id}", response_model=OwnerResponse)
async def get_owner(owner_id: str, admin: dict = Depends(verify_token)):
    owner = await db.owners.find_one({"id": owner_id}, {"_id": 0})
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    return OwnerResponse(**owner)

@api_router.put("/owners/{owner_id}", response_model=OwnerResponse)
async def update_owner(owner_id: str, owner: OwnerUpdate, admin: dict = Depends(verify_token)):
    existing = await db.owners.find_one({"id": owner_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    update_data = {k: v for k, v in owner.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.owners.update_one({"id": owner_id}, {"$set": update_data})
    updated = await db.owners.find_one({"id": owner_id}, {"_id": 0})
    return OwnerResponse(**updated)

@api_router.delete("/owners/{owner_id}")
async def delete_owner(owner_id: str, admin: dict = Depends(verify_token)):
    result = await db.owners.delete_one({"id": owner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Owner not found")
    return {"message": "Owner deleted successfully"}

# ==================== TENANT ROUTES ====================

@api_router.post("/tenants", response_model=TenantResponse)
async def create_tenant(tenant: TenantCreate, admin: dict = Depends(verify_token)):
    tenant_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get owner name
    owner = await db.owners.find_one({"id": tenant.owner_id}, {"_id": 0, "name": 1})
    owner_name = owner["name"] if owner else None
    
    tenant_doc = {
        "id": tenant_id,
        **tenant.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.tenants.insert_one(tenant_doc)
    response_data = {k: v for k, v in tenant_doc.items() if k != "_id"}
    response_data["owner_name"] = owner_name
    return TenantResponse(**response_data)

@api_router.get("/tenants", response_model=List[TenantResponse])
async def get_tenants(search: Optional[str] = None, owner_id: Optional[str] = None, page: int = 1, limit: int = 10, admin: dict = Depends(verify_token)):
    query = {}
    if search:
        query["$or"] = [
            {"tenant_name": {"$regex": search, "$options": "i"}},
            {"room_number": {"$regex": search, "$options": "i"}},
            {"contact_number": {"$regex": search, "$options": "i"}}
        ]
    if owner_id:
        query["owner_id"] = owner_id
    
    skip = (page - 1) * limit
    tenants = await db.tenants.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Get owner names
    owner_ids = list(set(t["owner_id"] for t in tenants))
    owners = await db.owners.find({"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(owner_ids))
    owner_map = {o["id"]: o["name"] for o in owners}
    
    result = []
    for tenant in tenants:
        tenant["owner_name"] = owner_map.get(tenant["owner_id"])
        result.append(TenantResponse(**tenant))
    return result

@api_router.get("/tenants/all", response_model=List[TenantResponse])
async def get_all_tenants(admin: dict = Depends(verify_token)):
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    
    owner_ids = list(set(t["owner_id"] for t in tenants))
    owners = await db.owners.find({"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(owner_ids))
    owner_map = {o["id"]: o["name"] for o in owners}
    
    result = []
    for tenant in tenants:
        tenant["owner_name"] = owner_map.get(tenant["owner_id"])
        result.append(TenantResponse(**tenant))
    return result

@api_router.get("/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str, admin: dict = Depends(verify_token)):
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    owner = await db.owners.find_one({"id": tenant["owner_id"]}, {"_id": 0, "name": 1})
    tenant["owner_name"] = owner["name"] if owner else None
    return TenantResponse(**tenant)

@api_router.put("/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(tenant_id: str, tenant: TenantUpdate, admin: dict = Depends(verify_token)):
    existing = await db.tenants.find_one({"id": tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    update_data = {k: v for k, v in tenant.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tenants.update_one({"id": tenant_id}, {"$set": update_data})
    updated = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    
    owner = await db.owners.find_one({"id": updated["owner_id"]}, {"_id": 0, "name": 1})
    updated["owner_name"] = owner["name"] if owner else None
    return TenantResponse(**updated)

@api_router.delete("/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str, admin: dict = Depends(verify_token)):
    result = await db.tenants.delete_one({"id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {"message": "Tenant deleted successfully"}

# ==================== NOTICE ROUTES ====================

@api_router.post("/notices", response_model=NoticeResponse)
async def create_notice(notice: NoticeCreate, admin: dict = Depends(verify_token)):
    notice_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    tenant = await db.tenants.find_one({"id": notice.tenant_id}, {"_id": 0, "tenant_name": 1})
    tenant_name = tenant["tenant_name"] if tenant else None
    
    notice_doc = {
        "id": notice_id,
        **notice.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.notices.insert_one(notice_doc)
    response_data = {k: v for k, v in notice_doc.items() if k != "_id"}
    response_data["tenant_name"] = tenant_name
    return NoticeResponse(**response_data)

@api_router.get("/notices", response_model=List[NoticeResponse])
async def get_notices(page: int = 1, limit: int = 10, admin: dict = Depends(verify_token)):
    skip = (page - 1) * limit
    notices = await db.notices.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    tenant_ids = list(set(n["tenant_id"] for n in notices))
    tenants = await db.tenants.find({"id": {"$in": tenant_ids}}, {"_id": 0, "id": 1, "tenant_name": 1}).to_list(len(tenant_ids))
    tenant_map = {t["id"]: t["tenant_name"] for t in tenants}
    
    result = []
    for notice in notices:
        notice["tenant_name"] = tenant_map.get(notice["tenant_id"])
        result.append(NoticeResponse(**notice))
    return result

@api_router.get("/notices/{notice_id}", response_model=NoticeResponse)
async def get_notice(notice_id: str, admin: dict = Depends(verify_token)):
    notice = await db.notices.find_one({"id": notice_id}, {"_id": 0})
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    tenant = await db.tenants.find_one({"id": notice["tenant_id"]}, {"_id": 0, "tenant_name": 1})
    notice["tenant_name"] = tenant["tenant_name"] if tenant else None
    return NoticeResponse(**notice)

@api_router.put("/notices/{notice_id}", response_model=NoticeResponse)
async def update_notice(notice_id: str, notice: NoticeUpdate, admin: dict = Depends(verify_token)):
    existing = await db.notices.find_one({"id": notice_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    update_data = {k: v for k, v in notice.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.notices.update_one({"id": notice_id}, {"$set": update_data})
    updated = await db.notices.find_one({"id": notice_id}, {"_id": 0})
    
    tenant = await db.tenants.find_one({"id": updated["tenant_id"]}, {"_id": 0, "tenant_name": 1})
    updated["tenant_name"] = tenant["tenant_name"] if tenant else None
    return NoticeResponse(**updated)

@api_router.delete("/notices/{notice_id}")
async def delete_notice(notice_id: str, admin: dict = Depends(verify_token)):
    result = await db.notices.delete_one({"id": notice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notice not found")
    return {"message": "Notice deleted successfully"}

# ==================== AGREEMENT ROUTES ====================

@api_router.post("/agreements", response_model=AgreementResponse)
async def create_agreement(agreement: AgreementCreate, admin: dict = Depends(verify_token)):
    agreement_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    tenant = await db.tenants.find_one({"id": agreement.tenant_id}, {"_id": 0, "tenant_name": 1})
    owner = await db.owners.find_one({"id": agreement.owner_id}, {"_id": 0, "name": 1})
    
    # Determine status
    today = datetime.now(timezone.utc).date()
    end_date = datetime.fromisoformat(agreement.end_date).date()
    status = "active" if end_date >= today else "expired"
    
    agreement_doc = {
        "id": agreement_id,
        **agreement.model_dump(),
        "status": status,
        "created_at": now,
        "updated_at": now
    }
    
    await db.agreements.insert_one(agreement_doc)
    response_data = {k: v for k, v in agreement_doc.items() if k != "_id"}
    response_data["tenant_name"] = tenant["tenant_name"] if tenant else None
    response_data["owner_name"] = owner["name"] if owner else None
    return AgreementResponse(**response_data)

@api_router.get("/agreements", response_model=List[AgreementResponse])
async def get_agreements(page: int = 1, limit: int = 10, admin: dict = Depends(verify_token)):
    skip = (page - 1) * limit
    agreements = await db.agreements.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    tenant_ids = list(set(a["tenant_id"] for a in agreements))
    owner_ids = list(set(a["owner_id"] for a in agreements))
    
    tenants = await db.tenants.find({"id": {"$in": tenant_ids}}, {"_id": 0, "id": 1, "tenant_name": 1}).to_list(len(tenant_ids))
    owners = await db.owners.find({"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(owner_ids))
    
    tenant_map = {t["id"]: t["tenant_name"] for t in tenants}
    owner_map = {o["id"]: o["name"] for o in owners}
    
    result = []
    for agreement in agreements:
        agreement["tenant_name"] = tenant_map.get(agreement["tenant_id"])
        agreement["owner_name"] = owner_map.get(agreement["owner_id"])
        result.append(AgreementResponse(**agreement))
    return result

@api_router.get("/agreements/{agreement_id}", response_model=AgreementResponse)
async def get_agreement(agreement_id: str, admin: dict = Depends(verify_token)):
    agreement = await db.agreements.find_one({"id": agreement_id}, {"_id": 0})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    
    tenant = await db.tenants.find_one({"id": agreement["tenant_id"]}, {"_id": 0, "tenant_name": 1})
    owner = await db.owners.find_one({"id": agreement["owner_id"]}, {"_id": 0, "name": 1})
    agreement["tenant_name"] = tenant["tenant_name"] if tenant else None
    agreement["owner_name"] = owner["name"] if owner else None
    return AgreementResponse(**agreement)

@api_router.put("/agreements/{agreement_id}", response_model=AgreementResponse)
async def update_agreement(agreement_id: str, agreement: AgreementUpdate, admin: dict = Depends(verify_token)):
    existing = await db.agreements.find_one({"id": agreement_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Agreement not found")
    
    update_data = {k: v for k, v in agreement.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update status if end_date changed
    if "end_date" in update_data:
        today = datetime.now(timezone.utc).date()
        end_date = datetime.fromisoformat(update_data["end_date"]).date()
        update_data["status"] = "active" if end_date >= today else "expired"
    
    await db.agreements.update_one({"id": agreement_id}, {"$set": update_data})
    updated = await db.agreements.find_one({"id": agreement_id}, {"_id": 0})
    
    tenant = await db.tenants.find_one({"id": updated["tenant_id"]}, {"_id": 0, "tenant_name": 1})
    owner = await db.owners.find_one({"id": updated["owner_id"]}, {"_id": 0, "name": 1})
    updated["tenant_name"] = tenant["tenant_name"] if tenant else None
    updated["owner_name"] = owner["name"] if owner else None
    return AgreementResponse(**updated)

@api_router.delete("/agreements/{agreement_id}")
async def delete_agreement(agreement_id: str, admin: dict = Depends(verify_token)):
    result = await db.agreements.delete_one({"id": agreement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agreement not found")
    return {"message": "Agreement deleted successfully"}

# ==================== POLICE VERIFICATION ROUTES ====================

@api_router.post("/police-verifications", response_model=PoliceVerificationResponse)
async def create_police_verification(verification: PoliceVerificationCreate, admin: dict = Depends(verify_token)):
    verification_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    tenant = await db.tenants.find_one({"id": verification.tenant_id}, {"_id": 0, "tenant_name": 1})
    
    verification_doc = {
        "id": verification_id,
        **verification.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.police_verifications.insert_one(verification_doc)
    response_data = {k: v for k, v in verification_doc.items() if k != "_id"}
    response_data["tenant_name"] = tenant["tenant_name"] if tenant else None
    return PoliceVerificationResponse(**response_data)

@api_router.get("/police-verifications", response_model=List[PoliceVerificationResponse])
async def get_police_verifications(page: int = 1, limit: int = 10, admin: dict = Depends(verify_token)):
    skip = (page - 1) * limit
    verifications = await db.police_verifications.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    tenant_ids = list(set(v["tenant_id"] for v in verifications))
    tenants = await db.tenants.find({"id": {"$in": tenant_ids}}, {"_id": 0, "id": 1, "tenant_name": 1}).to_list(len(tenant_ids))
    tenant_map = {t["id"]: t["tenant_name"] for t in tenants}
    
    result = []
    for verification in verifications:
        verification["tenant_name"] = tenant_map.get(verification["tenant_id"])
        result.append(PoliceVerificationResponse(**verification))
    return result

@api_router.get("/police-verifications/{verification_id}", response_model=PoliceVerificationResponse)
async def get_police_verification(verification_id: str, admin: dict = Depends(verify_token)):
    verification = await db.police_verifications.find_one({"id": verification_id}, {"_id": 0})
    if not verification:
        raise HTTPException(status_code=404, detail="Police verification not found")
    
    tenant = await db.tenants.find_one({"id": verification["tenant_id"]}, {"_id": 0, "tenant_name": 1})
    verification["tenant_name"] = tenant["tenant_name"] if tenant else None
    return PoliceVerificationResponse(**verification)

@api_router.put("/police-verifications/{verification_id}", response_model=PoliceVerificationResponse)
async def update_police_verification(verification_id: str, verification: PoliceVerificationUpdate, admin: dict = Depends(verify_token)):
    existing = await db.police_verifications.find_one({"id": verification_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Police verification not found")
    
    update_data = {k: v for k, v in verification.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.police_verifications.update_one({"id": verification_id}, {"$set": update_data})
    updated = await db.police_verifications.find_one({"id": verification_id}, {"_id": 0})
    
    tenant = await db.tenants.find_one({"id": updated["tenant_id"]}, {"_id": 0, "tenant_name": 1})
    updated["tenant_name"] = tenant["tenant_name"] if tenant else None
    return PoliceVerificationResponse(**updated)

@api_router.delete("/police-verifications/{verification_id}")
async def delete_police_verification(verification_id: str, admin: dict = Depends(verify_token)):
    result = await db.police_verifications.delete_one({"id": verification_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Police verification not found")
    return {"message": "Police verification deleted successfully"}

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate, admin: dict = Depends(verify_token)):
    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    owner = await db.owners.find_one({"id": payment.owner_id}, {"_id": 0, "name": 1})
    
    payment_doc = {
        "id": payment_id,
        **payment.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.payments.insert_one(payment_doc)
    response_data = {k: v for k, v in payment_doc.items() if k != "_id"}
    response_data["owner_name"] = owner["name"] if owner else None
    return PaymentResponse(**response_data)

@api_router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(owner_id: Optional[str] = None, month: Optional[str] = None, page: int = 1, limit: int = 10, admin: dict = Depends(verify_token)):
    query = {}
    if owner_id:
        query["owner_id"] = owner_id
    if month:
        query["month"] = month
    
    skip = (page - 1) * limit
    payments = await db.payments.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    owner_ids = list(set(p["owner_id"] for p in payments))
    owners = await db.owners.find({"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(owner_ids))
    owner_map = {o["id"]: o["name"] for o in owners}
    
    result = []
    for payment in payments:
        payment["owner_name"] = owner_map.get(payment["owner_id"])
        result.append(PaymentResponse(**payment))
    return result

@api_router.get("/payments/monthly-total")
async def get_monthly_payment_total(month: Optional[str] = None, admin: dict = Depends(verify_token)):
    if not month:
        month = get_current_month()
    
    pipeline = [
        {"$match": {"month": month}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]
    
    result = await db.payments.aggregate(pipeline).to_list(1)
    return {"month": month, "total": result[0]["total"] if result else 0}

@api_router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, admin: dict = Depends(verify_token)):
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    owner = await db.owners.find_one({"id": payment["owner_id"]}, {"_id": 0, "name": 1})
    payment["owner_name"] = owner["name"] if owner else None
    return PaymentResponse(**payment)

@api_router.put("/payments/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: str, payment: PaymentUpdate, admin: dict = Depends(verify_token)):
    existing = await db.payments.find_one({"id": payment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = {k: v for k, v in payment.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.payments.update_one({"id": payment_id}, {"$set": update_data})
    updated = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    
    owner = await db.owners.find_one({"id": updated["owner_id"]}, {"_id": 0, "name": 1})
    updated["owner_name"] = owner["name"] if owner else None
    return PaymentResponse(**updated)

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, admin: dict = Depends(verify_token)):
    result = await db.payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted successfully"}

# ==================== EXPENSE ROUTES ====================

@api_router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate, admin: dict = Depends(verify_token)):
    expense_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    expense_doc = {
        "id": expense_id,
        **expense.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.expenses.insert_one(expense_doc)
    return ExpenseResponse(**{k: v for k, v in expense_doc.items() if k != "_id"})

@api_router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(month: Optional[str] = None, page: int = 1, limit: int = 10, admin: dict = Depends(verify_token)):
    query = {}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    skip = (page - 1) * limit
    expenses = await db.expenses.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return [ExpenseResponse(**expense) for expense in expenses]

@api_router.get("/expenses/monthly-total")
async def get_monthly_expense_total(month: Optional[str] = None, admin: dict = Depends(verify_token)):
    if not month:
        month = get_current_month()
    
    pipeline = [
        {"$match": {"date": {"$regex": f"^{month}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    
    result = await db.expenses.aggregate(pipeline).to_list(1)
    return {"month": month, "total": result[0]["total"] if result else 0}

@api_router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: str, admin: dict = Depends(verify_token)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return ExpenseResponse(**expense)

@api_router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: str, expense: ExpenseUpdate, admin: dict = Depends(verify_token)):
    existing = await db.expenses.find_one({"id": expense_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = {k: v for k, v in expense.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
    updated = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return ExpenseResponse(**updated)

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, admin: dict = Depends(verify_token)):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(admin: dict = Depends(verify_token)):
    current_month = get_current_month()
    
    # Get counts
    total_tenants = await db.tenants.count_documents({})
    total_owners = await db.owners.count_documents({})
    active_agreements = await db.agreements.count_documents({"status": "active"})
    pending_notices = await db.notices.count_documents({})
    
    # Get monthly totals
    payment_pipeline = [
        {"$match": {"month": current_month}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]
    payment_result = await db.payments.aggregate(payment_pipeline).to_list(1)
    monthly_payments = payment_result[0]["total"] if payment_result else 0
    
    expense_pipeline = [
        {"$match": {"date": {"$regex": f"^{current_month}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    expense_result = await db.expenses.aggregate(expense_pipeline).to_list(1)
    monthly_expenses = expense_result[0]["total"] if expense_result else 0
    
    # Get recent items
    recent_tenants = await db.tenants.find({}, {"_id": 0, "id": 1, "tenant_name": 1, "room_number": 1, "joining_date": 1}).sort("created_at", -1).limit(5).to_list(5)
    recent_notices = await db.notices.find({}, {"_id": 0, "id": 1, "tenant_id": 1, "notice_date": 1, "leaving_date": 1}).sort("created_at", -1).limit(5).to_list(5)
    recent_expenses = await db.expenses.find({}, {"_id": 0, "id": 1, "expense_type": 1, "amount": 1, "date": 1}).sort("created_at", -1).limit(5).to_list(5)
    
    # Get tenant names for notices
    if recent_notices:
        tenant_ids = [n["tenant_id"] for n in recent_notices]
        tenants = await db.tenants.find({"id": {"$in": tenant_ids}}, {"_id": 0, "id": 1, "tenant_name": 1}).to_list(len(tenant_ids))
        tenant_map = {t["id"]: t["tenant_name"] for t in tenants}
        for notice in recent_notices:
            notice["tenant_name"] = tenant_map.get(notice["tenant_id"], "Unknown")
    
    return DashboardStats(
        total_tenants=total_tenants,
        total_owners=total_owners,
        active_agreements=active_agreements,
        pending_notices=pending_notices,
        monthly_payments=monthly_payments,
        monthly_expenses=monthly_expenses,
        recent_tenants=recent_tenants,
        recent_notices=recent_notices,
        recent_expenses=recent_expenses
    )

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "EstateCommand API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
