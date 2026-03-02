"""Authentication business logic."""
from fastapi import HTTPException

from app.core.security import BcryptPasswordHasher, JWTTokenService
from app.models.admin import AdminCreate, AdminLogin, AdminResponse, TokenResponse
from app.repositories.admin_repository import AdminRepository


class AuthService:
    """Handles registration, login, and token creation."""

    def __init__(
        self,
        admin_repo: AdminRepository,
        password_hasher: BcryptPasswordHasher,
        token_service: JWTTokenService,
    ) -> None:
        self._admin_repo = admin_repo
        self._password_hasher = password_hasher
        self._token_service = token_service

    async def register(self, data: AdminCreate) -> TokenResponse:
        existing = await self._admin_repo.get_by_email(data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = self._password_hasher.hash(data.password)
        admin = await self._admin_repo.create(data, hashed)
        token = self._token_service.create_access_token(admin.id, admin.email)
        return TokenResponse(access_token=token, admin=admin)

    async def login(self, data: AdminLogin) -> TokenResponse:
        admin = await self._admin_repo.get_by_email(data.email)
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not self._password_hasher.verify(data.password, admin["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = self._token_service.create_access_token(admin["id"], admin["email"])
        return TokenResponse(
            access_token=token,
            admin=AdminResponse(
                id=admin["id"],
                email=admin["email"],
                name=admin["name"],
                created_at=admin["created_at"],
            ),
        )
