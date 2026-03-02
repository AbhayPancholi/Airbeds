"""Owner business logic."""
from typing import List, Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.owner import OwnerCreate, OwnerResponse, OwnerUpdate
from app.repositories.owner_repository import OwnerRepository


class OwnerService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = OwnerRepository(db)

    async def create(self, data: OwnerCreate) -> OwnerResponse:
        return await self._repo.create(data)

    async def get_by_id(self, owner_id: str) -> OwnerResponse:
        owner = await self._repo.get_by_id_response(owner_id)
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        return owner

    async def list(
        self,
        *,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[OwnerResponse]:
        skip = (page - 1) * limit
        return await self._repo.list(search=search, skip=skip, limit=limit)

    async def list_all(self) -> List[OwnerResponse]:
        return await self._repo.list_all()

    async def update(self, owner_id: str, data: OwnerUpdate) -> OwnerResponse:
        updated = await self._repo.update(owner_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Owner not found")
        return updated

    async def delete(self, owner_id: str) -> None:
        if not await self._repo.delete(owner_id):
            raise HTTPException(status_code=404, detail="Owner not found")
