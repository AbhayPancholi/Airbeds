"""Tenant business logic."""
from typing import List, Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.tenant import TenantCreate, TenantResponse, TenantUpdate
from app.repositories.tenant_repository import TenantRepository


class TenantService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = TenantRepository(db)

    async def create(self, data: TenantCreate) -> TenantResponse:
        return await self._repo.create(data)

    async def get_by_id(self, tenant_id: str) -> TenantResponse:
        tenant = await self._repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return tenant

    async def list(
        self,
        *,
        search: Optional[str] = None,
        owner_id: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[TenantResponse]:
        skip = (page - 1) * limit
        return await self._repo.list(
            search=search, owner_id=owner_id, skip=skip, limit=limit
        )

    async def list_all(self) -> List[TenantResponse]:
        return await self._repo.list_all()

    async def update(self, tenant_id: str, data: TenantUpdate) -> TenantResponse:
        updated = await self._repo.update(tenant_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return updated

    async def delete(self, tenant_id: str) -> None:
        if not await self._repo.delete(tenant_id):
            raise HTTPException(status_code=404, detail="Tenant not found")
