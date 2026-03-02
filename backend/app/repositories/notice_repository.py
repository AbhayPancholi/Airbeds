"""Notice data access."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.notice import NoticeCreate, NoticeResponse, NoticeUpdate


class NoticeRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.NOTICES]
        self._tenants = db[CollectionNames.TENANTS]

    async def _tenant_name(self, tenant_id: Optional[str]) -> Optional[str]:
        if not tenant_id:
            return None
        t = await self._tenants.find_one({"id": tenant_id}, {"_id": 0, "tenant_name": 1})
        return t["tenant_name"] if t else None

    async def _enrich(self, doc: Dict[str, Any]) -> NoticeResponse:
        doc = dict(doc)
        # Use stored name; fallback to linked tenant name for backward compat
        if not doc.get("tenant_name") and doc.get("tenant_id"):
            doc["tenant_name"] = await self._tenant_name(doc["tenant_id"])
        elif not doc.get("tenant_name"):
            doc["tenant_name"] = None
        return NoticeResponse(**doc)

    async def create(self, data: NoticeCreate) -> NoticeResponse:
        notice_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc = {"id": notice_id, **data.model_dump(), "created_at": now, "updated_at": now}
        await self._coll.insert_one(doc)
        doc.pop("_id", None)
        return await self._enrich(doc)

    async def get_by_id(self, notice_id: str) -> Optional[NoticeResponse]:
        doc = await self._coll.find_one({"id": notice_id}, {"_id": 0})
        if not doc:
            return None
        return await self._enrich(doc)

    async def list(self, *, skip: int = 0, limit: int = 10) -> List[NoticeResponse]:
        cursor = self._coll.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        result = []
        for n in items:
            result.append(await self._enrich(n))
        return result

    async def update(self, notice_id: str, data: NoticeUpdate) -> Optional[NoticeResponse]:
        existing = await self._coll.find_one({"id": notice_id})
        if not existing:
            return None
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._coll.update_one({"id": notice_id}, {"$set": update_data})
        updated = await self._coll.find_one({"id": notice_id}, {"_id": 0})
        return await self._enrich(updated) if updated else None

    async def delete(self, notice_id: str) -> bool:
        result = await self._coll.delete_one({"id": notice_id})
        return result.deleted_count > 0
