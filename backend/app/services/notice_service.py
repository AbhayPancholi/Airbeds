"""Notice business logic."""
from typing import List

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.notice import NoticeCreate, NoticeResponse, NoticeUpdate
from app.repositories.notice_repository import NoticeRepository


class NoticeService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = NoticeRepository(db)

    async def create(self, data: NoticeCreate) -> NoticeResponse:
        return await self._repo.create(data)

    async def get_by_id(self, notice_id: str) -> NoticeResponse:
        notice = await self._repo.get_by_id(notice_id)
        if not notice:
            raise HTTPException(status_code=404, detail="Notice not found")
        return notice

    async def list(self, *, page: int = 1, limit: int = 10) -> List[NoticeResponse]:
        skip = (page - 1) * limit
        return await self._repo.list(skip=skip, limit=limit)

    async def update(self, notice_id: str, data: NoticeUpdate) -> NoticeResponse:
        updated = await self._repo.update(notice_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Notice not found")
        return updated

    async def delete(self, notice_id: str) -> None:
        if not await self._repo.delete(notice_id):
            raise HTTPException(status_code=404, detail="Notice not found")
