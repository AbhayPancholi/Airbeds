from fastapi import APIRouter, Depends

from app.api.deps import get_auth_service, get_current_admin
from app.models import AdminCreate, AdminLogin, AdminResponse, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(admin: AdminCreate, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.register(admin)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: AdminLogin, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.login(credentials)


@router.get("/me", response_model=AdminResponse)
async def me(admin: dict = Depends(get_current_admin)):
    return AdminResponse(
        id=admin["id"],
        email=admin["email"],
        name=admin["name"],
        created_at=admin["created_at"],
    )
