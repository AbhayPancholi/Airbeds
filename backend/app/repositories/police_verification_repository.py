"""Police verification data access."""
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.police_verification import (
    PoliceVerificationCreate,
    PoliceVerificationResponse,
    PoliceVerificationUpdate,
)


class PoliceVerificationRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.POLICE_VERIFICATIONS]
        self._tenants = db[CollectionNames.TENANTS]

    async def create(self, data: PoliceVerificationCreate) -> PoliceVerificationResponse:
        verification_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc = {"id": verification_id, **data.model_dump(), "created_at": now, "updated_at": now}
        await self._coll.insert_one(doc)
        tenant = await self._tenants.find_one({"id": data.tenant_id}, {"_id": 0, "tenant_name": 1})
        doc.pop("_id", None)
        doc["tenant_name"] = tenant["tenant_name"] if tenant else None
        return PoliceVerificationResponse(**doc)

    async def get_by_id(self, verification_id: str) -> Optional[PoliceVerificationResponse]:
        doc = await self._coll.find_one({"id": verification_id}, {"_id": 0})
        if not doc:
            return None
        tenant = await self._tenants.find_one({"id": doc["tenant_id"]}, {"_id": 0, "tenant_name": 1})
        doc["tenant_name"] = tenant["tenant_name"] if tenant else None
        return PoliceVerificationResponse(**doc)

    async def list(self, *, skip: int = 0, limit: int = 10) -> List[PoliceVerificationResponse]:
        cursor = self._coll.find({}, {"_id": 0}).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        tenant_ids = list({v["tenant_id"] for v in items})
        tenants = await self._tenants.find(
            {"id": {"$in": tenant_ids}}, {"_id": 0, "id": 1, "tenant_name": 1}
        ).to_list(len(tenant_ids))
        tenant_map = {t["id"]: t["tenant_name"] for t in tenants}
        return [
            PoliceVerificationResponse(**dict(v, tenant_name=tenant_map.get(v["tenant_id"])))
            for v in items
        ]

    async def update(
        self, verification_id: str, data: PoliceVerificationUpdate
    ) -> Optional[PoliceVerificationResponse]:
        existing = await self._coll.find_one({"id": verification_id})
        if not existing:
            return None
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._coll.update_one({"id": verification_id}, {"$set": update_data})
        updated = await self._coll.find_one({"id": verification_id}, {"_id": 0})
        if not updated:
            return None
        tenant = await self._tenants.find_one({"id": updated["tenant_id"]}, {"_id": 0, "tenant_name": 1})
        updated["tenant_name"] = tenant["tenant_name"] if tenant else None
        return PoliceVerificationResponse(**updated)

    async def delete(self, verification_id: str) -> bool:
        result = await self._coll.delete_one({"id": verification_id})
        return result.deleted_count > 0
