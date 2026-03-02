"""Agreement data access."""
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import AgreementStatus, CollectionNames
from app.models.agreement import AgreementCreate, AgreementResponse, AgreementUpdate


class AgreementRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.AGREEMENTS]
        self._tenants = db[CollectionNames.TENANTS]
        self._owners = db[CollectionNames.OWNERS]

    def _status(self, end_date_str: str) -> str:
        today = datetime.now(timezone.utc).date()
        end = datetime.fromisoformat(end_date_str).date()
        return AgreementStatus.ACTIVE if end >= today else AgreementStatus.EXPIRED

    async def create(self, data: AgreementCreate) -> AgreementResponse:
        agreement_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        status = self._status(data.end_date)
        doc = {
            "id": agreement_id,
            **data.model_dump(),
            "status": status,
            "created_at": now,
            "updated_at": now,
        }
        await self._coll.insert_one(doc)
        tenant = await self._tenants.find_one({"id": data.tenant_id}, {"_id": 0, "tenant_name": 1})
        owner = await self._owners.find_one({"id": data.owner_id}, {"_id": 0, "name": 1})
        doc.pop("_id", None)
        doc["tenant_name"] = tenant["tenant_name"] if tenant else None
        doc["owner_name"] = owner["name"] if owner else None
        return AgreementResponse(**doc)

    async def get_by_id(self, agreement_id: str) -> Optional[AgreementResponse]:
        doc = await self._coll.find_one({"id": agreement_id}, {"_id": 0})
        if not doc:
            return None
        tenant = await self._tenants.find_one({"id": doc["tenant_id"]}, {"_id": 0, "tenant_name": 1})
        owner = await self._owners.find_one({"id": doc["owner_id"]}, {"_id": 0, "name": 1})
        doc["tenant_name"] = tenant["tenant_name"] if tenant else None
        doc["owner_name"] = owner["name"] if owner else None
        return AgreementResponse(**doc)

    async def list(self, *, skip: int = 0, limit: int = 10) -> List[AgreementResponse]:
        cursor = self._coll.find({}, {"_id": 0}).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        tenant_ids = list({a["tenant_id"] for a in items})
        owner_ids = list({a["owner_id"] for a in items})
        tenants = await self._tenants.find(
            {"id": {"$in": tenant_ids}}, {"_id": 0, "id": 1, "tenant_name": 1}
        ).to_list(len(tenant_ids))
        owners = await self._owners.find(
            {"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}
        ).to_list(len(owner_ids))
        tenant_map = {t["id"]: t["tenant_name"] for t in tenants}
        owner_map = {o["id"]: o["name"] for o in owners}
        return [
            AgreementResponse(**dict(a, tenant_name=tenant_map.get(a["tenant_id"]), owner_name=owner_map.get(a["owner_id"])))
            for a in items
        ]

    async def update(self, agreement_id: str, data: AgreementUpdate) -> Optional[AgreementResponse]:
        existing = await self._coll.find_one({"id": agreement_id})
        if not existing:
            return None
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        if "end_date" in update_data:
            update_data["status"] = self._status(update_data["end_date"])
        await self._coll.update_one({"id": agreement_id}, {"$set": update_data})
        updated = await self._coll.find_one({"id": agreement_id}, {"_id": 0})
        if not updated:
            return None
        tenant = await self._tenants.find_one({"id": updated["tenant_id"]}, {"_id": 0, "tenant_name": 1})
        owner = await self._owners.find_one({"id": updated["owner_id"]}, {"_id": 0, "name": 1})
        updated["tenant_name"] = tenant["tenant_name"] if tenant else None
        updated["owner_name"] = owner["name"] if owner else None
        return AgreementResponse(**updated)

    async def delete(self, agreement_id: str) -> bool:
        result = await self._coll.delete_one({"id": agreement_id})
        return result.deleted_count > 0
