"""FastAPI dependency injection."""
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.core.security import BcryptPasswordHasher, JWTTokenService
from app.repositories.admin_repository import AdminRepository
from app.services.auth_service import AuthService
from app.services.owner_service import OwnerService
from app.services.tenant_service import TenantService
from app.services.notice_service import NoticeService
from app.services.agreement_service import AgreementService
from app.services.agreement_document_service import AgreementDocumentService
from app.services.police_verification_service import PoliceVerificationService
from app.services.police_verification_document_service import PoliceVerificationDocumentService
from app.services.payment_service import PaymentService
from app.services.expense_service import ExpenseService
from app.services.dashboard_service import DashboardService
from app.services.company_service import CompanyService
from app.services.registration_link_service import RegistrationLinkService
from app.repositories.notice_repository import NoticeRepository
from app.repositories.notice_form_settings_repository import NoticeFormSettingsRepository
from app.repositories.tenant_repository import TenantRepository
from app.services.notice_form_service import NoticeFormService

security = HTTPBearer()


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db.get_database()


def get_auth_service(request: Request) -> AuthService:
    db = request.app.state.db.get_database()
    admin_repo = AdminRepository(db)
    return AuthService(
        admin_repo=admin_repo,
        password_hasher=BcryptPasswordHasher(),
        token_service=JWTTokenService(),
    )


def get_owner_service(request: Request) -> OwnerService:
    db = request.app.state.db.get_database()
    return OwnerService(db)


def get_tenant_service(request: Request) -> TenantService:
    db = request.app.state.db.get_database()
    return TenantService(db)


def get_notice_service(request: Request) -> NoticeService:
    db = request.app.state.db.get_database()
    return NoticeService(db)


def get_agreement_service(request: Request) -> AgreementService:
    db = request.app.state.db.get_database()
    return AgreementService(db)


def get_agreement_document_service(request: Request) -> AgreementDocumentService:
    db = request.app.state.db.get_database()
    return AgreementDocumentService(db)


def get_police_verification_service(request: Request) -> PoliceVerificationService:
    db = request.app.state.db.get_database()
    return PoliceVerificationService(db)


def get_payment_service(request: Request) -> PaymentService:
    db = request.app.state.db.get_database()
    return PaymentService(db)


def get_police_verification_document_service(
    request: Request,
) -> PoliceVerificationDocumentService:
    db = request.app.state.db.get_database()
    return PoliceVerificationDocumentService(db)


def get_expense_service(request: Request) -> ExpenseService:
    db = request.app.state.db.get_database()
    return ExpenseService(db)


def get_dashboard_service(request: Request) -> DashboardService:
    db = request.app.state.db.get_database()
    return DashboardService(db)


def get_registration_link_service(request: Request) -> RegistrationLinkService:
    db = request.app.state.db.get_database()
    return RegistrationLinkService(db)


def get_notice_form_service(request: Request) -> NoticeFormService:
    db = request.app.state.db.get_database()
    notice_repo = NoticeRepository(db)
    settings_repo = NoticeFormSettingsRepository(db)
    tenant_repo = TenantRepository(db)
    return NoticeFormService(notice_repo=notice_repo, settings_repo=settings_repo, tenant_repo=tenant_repo)


def get_company_service(request: Request) -> CompanyService:
    db = request.app.state.db.get_database()
    return CompanyService(db)


async def get_current_admin(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token_service = JWTTokenService()
    db: AsyncIOMotorDatabase = request.app.state.db.get_database()
    try:
        payload = token_service.decode_token(credentials.credentials)
        admin_id = payload.get("sub")
        if admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        admin = await db[CollectionNames.ADMINS].find_one(
            {"id": admin_id}, {"_id": 0}
        )
        if admin is None:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
