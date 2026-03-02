"""Payment data access."""
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.payment import PaymentCreate, PaymentResponse, PaymentUpdate


class PaymentRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.PAYMENTS]
        self._owners = db[CollectionNames.OWNERS]

    async def create(self, data: PaymentCreate) -> PaymentResponse:
        payment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc = {"id": payment_id, **data.model_dump(), "created_at": now, "updated_at": now}
        await self._coll.insert_one(doc)
        owner = await self._owners.find_one({"id": data.owner_id}, {"_id": 0, "name": 1})
        doc.pop("_id", None)
        doc["owner_name"] = owner["name"] if owner else None
        return PaymentResponse(**doc)

    async def get_by_id(self, payment_id: str) -> Optional[PaymentResponse]:
        doc = await self._coll.find_one({"id": payment_id}, {"_id": 0})
        if not doc:
            return None
        owner = await self._owners.find_one({"id": doc["owner_id"]}, {"_id": 0, "name": 1})
        doc["owner_name"] = owner["name"] if owner else None
        return PaymentResponse(**doc)

    async def list(
        self,
        *,
        owner_id: Optional[str] = None,
        month: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> List[PaymentResponse]:
        query = {}
        if owner_id:
            query["owner_id"] = owner_id
        if month:
            query["month"] = month
        cursor = self._coll.find(query, {"_id": 0}).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        owner_ids = list({p["owner_id"] for p in items})
        owners = await self._owners.find(
            {"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}
        ).to_list(len(owner_ids))
        owner_map = {o["id"]: o["name"] for o in owners}
        return [
            PaymentResponse(**dict(p, owner_name=owner_map.get(p["owner_id"])))
            for p in items
        ]

    async def monthly_total(self, month: str) -> float:
        pipeline = [
            {"$match": {"month": month}},
            {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}},
        ]
        result = await self._coll.aggregate(pipeline).to_list(1)
        return result[0]["total"] if result else 0

    async def update(self, payment_id: str, data: PaymentUpdate) -> Optional[PaymentResponse]:
        existing = await self._coll.find_one({"id": payment_id})
        if not existing:
            return None
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._coll.update_one({"id": payment_id}, {"$set": update_data})
        updated = await self._coll.find_one({"id": payment_id}, {"_id": 0})
        if not updated:
            return None
        owner = await self._owners.find_one({"id": updated["owner_id"]}, {"_id": 0, "name": 1})
        updated["owner_name"] = owner["name"] if owner else None
        return PaymentResponse(**updated)

    async def delete(self, payment_id: str) -> bool:
        result = await self._coll.delete_one({"id": payment_id})
        return result.deleted_count > 0
