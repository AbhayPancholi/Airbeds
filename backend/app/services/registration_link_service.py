"""Registration (occupancy form) link business logic."""
from typing import List, Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.registration_link import RegistrationLinkResponse
from app.models.tenant import TenantCreate, TenantResponse
from app.repositories.registration_link_repository import RegistrationLinkRepository
from app.repositories.tenant_repository import TenantRepository


class RegistrationLinkService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._link_repo = RegistrationLinkRepository(db)
        self._tenant_repo = TenantRepository(db)

    async def create_link(
        self, created_by_admin_id: Optional[str] = None
    ) -> RegistrationLinkResponse:
        return await self._link_repo.create(created_by_admin_id=created_by_admin_id)

    async def validate_token(self, token: str) -> bool:
        link = await self._link_repo.get_by_token(token)
        return link is not None and link.used_at is None

    async def submit_with_token(
        self, token: str, data: TenantCreate
    ) -> TenantResponse:
        link = await self._link_repo.get_by_token(token)
        if link is None:
            raise HTTPException(status_code=404, detail="Invalid or unknown link")
        if link.used_at is not None:
            raise HTTPException(
                status_code=410,
                detail="This link has already been used and has expired.",
            )
        tenant = await self._tenant_repo.create(data)
        await self._link_repo.mark_used(token)
        return tenant

    async def list_links(
        self, skip: int = 0, limit: int = 50
    ) -> List[RegistrationLinkResponse]:
        return await self._link_repo.list_links(skip=skip, limit=limit)
