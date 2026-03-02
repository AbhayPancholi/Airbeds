"""Agreement business logic."""
from typing import List

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.agreement import AgreementCreate, AgreementResponse, AgreementUpdate
from app.repositories.agreement_repository import AgreementRepository


class AgreementService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = AgreementRepository(db)

    async def create(self, data: AgreementCreate) -> AgreementResponse:
        return await self._repo.create(data)

    async def get_by_id(self, agreement_id: str) -> AgreementResponse:
        agreement = await self._repo.get_by_id(agreement_id)
        if not agreement:
            raise HTTPException(status_code=404, detail="Agreement not found")
        return agreement

    async def list(self, *, page: int = 1, limit: int = 10) -> List[AgreementResponse]:
        skip = (page - 1) * limit
        return await self._repo.list(skip=skip, limit=limit)

    async def update(self, agreement_id: str, data: AgreementUpdate) -> AgreementResponse:
        updated = await self._repo.update(agreement_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Agreement not found")
        return updated

    async def delete(self, agreement_id: str) -> None:
        if not await self._repo.delete(agreement_id):
            raise HTTPException(status_code=404, detail="Agreement not found")
