"""Tenant data access."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.tenant import TenantCreate, TenantResponse, TenantUpdate


def _tenant_id_from_phone(contact_number: Optional[str]) -> str:
    """Generate tenant_id as AIR-<last 5 digits of phone>."""
    if not contact_number:
        return "AIR-00000"
    digits = "".join(c for c in str(contact_number).strip() if c.isdigit())
    last5 = digits[-5:] if len(digits) >= 5 else digits.zfill(5)[:5]
    return "AIR-" + last5


class TenantRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.TENANTS]
        self._owners = db[CollectionNames.OWNERS]

    async def _owner_name(self, owner_id: str) -> Optional[str]:
        o = await self._owners.find_one({"id": owner_id}, {"_id": 0, "name": 1})
        return o["name"] if o else None

    async def _enrich(self, doc: Dict[str, Any]) -> TenantResponse:
        doc = dict(doc)
        # Backward compat: old docs may have customer_id
        if "tenant_id" not in doc and "customer_id" in doc:
            doc["tenant_id"] = doc.get("customer_id")
        doc["owner_name"] = await self._owner_name(doc.get("owner_id") or "")
        return TenantResponse(**doc)

    async def create(self, data: TenantCreate) -> TenantResponse:
        doc_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        tenant_id_display = _tenant_id_from_phone(data.contact_number)
        doc = {
            "id": doc_id,
            "tenant_id": tenant_id_display,
            **data.model_dump(),
            "created_at": now,
            "updated_at": now,
        }
        await self._coll.insert_one(doc)
        doc.pop("_id", None)
        doc["owner_name"] = await self._owner_name(data.owner_id or "")
        return TenantResponse(**doc)

    async def get_by_id(self, tenant_id: str) -> Optional[TenantResponse]:
        doc = await self._coll.find_one({"id": tenant_id}, {"_id": 0})
        if not doc:
            return None
        return await self._enrich(doc)

    async def get_by_tenant_id(self, tenant_id_display: str) -> Optional[Dict[str, Any]]:
        """Find tenant by display tenant_id (e.g. AIR-43210) or legacy customer_id. Returns raw doc for prefill."""
        key = (tenant_id_display or "").strip()
        if not key:
            return None
        doc = await self._coll.find_one(
            {"$or": [{"tenant_id": key}, {"customer_id": key}]}, {"_id": 0}
        )
        return doc

    async def list(
        self,
        *,
        search: Optional[str] = None,
        owner_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> List[TenantResponse]:
        query = {}
        if search:
            query["$or"] = [
                {"tenant_name": {"$regex": search, "$options": "i"}},
                {"contact_number": {"$regex": search, "$options": "i"}},
                {"aadhaar_number": {"$regex": search, "$options": "i"}},
                {"society_name": {"$regex": search, "$options": "i"}},
                {"flat_number": {"$regex": search, "$options": "i"}},
            ]
        if owner_id:
            query["owner_id"] = owner_id
        cursor = self._coll.find(query, {"_id": 0}).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        owner_ids = list({t["owner_id"] for t in items})
        owners = await self._owners.find(
            {"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}
        ).to_list(len(owner_ids))
        owner_map = {o["id"]: o["name"] for o in owners}
        result = []
        for t in items:
            t["owner_name"] = owner_map.get(t["owner_id"])
            if "tenant_id" not in t and "customer_id" in t:
                t["tenant_id"] = t.get("customer_id")
            result.append(TenantResponse(**t))
        return result

    async def list_all(self, limit: int = 1000) -> List[TenantResponse]:
        cursor = self._coll.find({}, {"_id": 0}).limit(limit)
        items = await cursor.to_list(limit)
        owner_ids = list({t["owner_id"] for t in items})
        owners = await self._owners.find(
            {"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}
        ).to_list(len(owner_ids))
        owner_map = {o["id"]: o["name"] for o in owners}
        for t in items:
            t["owner_name"] = owner_map.get(t["owner_id"])
            if "tenant_id" not in t and "customer_id" in t:
                t["tenant_id"] = t.get("customer_id")
        return [TenantResponse(**t) for t in items]

    async def update(self, tenant_id: str, data: TenantUpdate) -> Optional[TenantResponse]:
        existing = await self._coll.find_one({"id": tenant_id})
        if not existing:
            return None
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if "contact_number" in update_data:
            update_data["tenant_id"] = _tenant_id_from_phone(update_data["contact_number"])
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._coll.update_one({"id": tenant_id}, {"$set": update_data})
        updated = await self._coll.find_one({"id": tenant_id}, {"_id": 0})
        return await self._enrich(updated) if updated else None

    async def delete(self, tenant_id: str) -> bool:
        result = await self._coll.delete_one({"id": tenant_id})
        return result.deleted_count > 0
