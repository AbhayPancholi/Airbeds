"""Police verification business logic."""
from typing import List

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.police_verification import (
    PoliceVerificationCreate,
    PoliceVerificationResponse,
    PoliceVerificationUpdate,
)
from app.repositories.police_verification_repository import PoliceVerificationRepository


class PoliceVerificationService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = PoliceVerificationRepository(db)

    async def create(self, data: PoliceVerificationCreate) -> PoliceVerificationResponse:
        return await self._repo.create(data)

    async def get_by_id(self, verification_id: str) -> PoliceVerificationResponse:
        v = await self._repo.get_by_id(verification_id)
        if not v:
            raise HTTPException(status_code=404, detail="Police verification not found")
        return v

    async def list(self, *, page: int = 1, limit: int = 10) -> List[PoliceVerificationResponse]:
        skip = (page - 1) * limit
        return await self._repo.list(skip=skip, limit=limit)

    async def update(
        self, verification_id: str, data: PoliceVerificationUpdate
    ) -> PoliceVerificationResponse:
        updated = await self._repo.update(verification_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Police verification not found")
        return updated

    async def delete(self, verification_id: str) -> None:
        if not await self._repo.delete(verification_id):
            raise HTTPException(status_code=404, detail="Police verification not found")
