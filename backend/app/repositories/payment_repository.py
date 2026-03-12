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
        self._tenants = db[CollectionNames.TENANTS]

    async def _resolve_party_name(self, party_type: str, party_id: str) -> Optional[str]:
        if party_type == "owner":
            rec = await self._owners.find_one({"id": party_id}, {"_id": 0, "name": 1})
            return rec.get("name") if rec else None
        elif party_type == "tenant":
            rec = await self._tenants.find_one({"id": party_id}, {"_id": 0, "tenant_name": 1})
            return (rec.get("tenant_name") or rec.get("name")) if rec else None
        return None

    async def _resolve_names_bulk(self, items: list) -> dict:
        """Return {party_id: name} for a list of payment docs."""
        owner_ids = list({p["party_id"] for p in items if p.get("party_type") == "owner"})
        tenant_ids = list({p["party_id"] for p in items if p.get("party_type") == "tenant"})
        name_map: dict[str, str] = {}
        if owner_ids:
            owners = await self._owners.find(
                {"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "name": 1}
            ).to_list(len(owner_ids))
            name_map.update({o["id"]: o["name"] for o in owners})
        if tenant_ids:
            tenants = await self._tenants.find(
                {"id": {"$in": tenant_ids}}, {"_id": 0, "id": 1, "tenant_name": 1}
            ).to_list(len(tenant_ids))
            name_map.update({t["id"]: (t.get("tenant_name") or t.get("name") or "") for t in tenants})
        return name_map

    def _normalize_doc(self, doc: dict) -> dict:
        """Fill in missing new fields for legacy docs that only have owner_id."""
        if "party_type" not in doc or not doc.get("party_type"):
            doc["party_type"] = "owner"
        if "party_id" not in doc or not doc.get("party_id"):
            doc["party_id"] = doc.get("owner_id", "")
        if "transaction_type" not in doc or not doc.get("transaction_type"):
            doc["transaction_type"] = "debit"
        return doc

    async def create(self, data: PaymentCreate) -> PaymentResponse:
        payment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        dump = data.model_dump(exclude_none=True)
        dump["owner_id"] = dump.get("owner_id") or data.party_id
        doc = {"id": payment_id, **dump, "created_at": now, "updated_at": now}
        await self._coll.insert_one(doc)
        doc.pop("_id", None)
        party_name = await self._resolve_party_name(data.party_type, data.party_id)
        doc["party_name"] = party_name
        doc["owner_name"] = party_name if data.party_type == "owner" else None
        return PaymentResponse(**self._normalize_doc(doc))

    async def get_by_id(self, payment_id: str) -> Optional[PaymentResponse]:
        doc = await self._coll.find_one({"id": payment_id}, {"_id": 0})
        if not doc:
            return None
        doc = self._normalize_doc(doc)
        party_name = await self._resolve_party_name(doc["party_type"], doc["party_id"])
        doc["party_name"] = party_name
        doc["owner_name"] = party_name if doc["party_type"] == "owner" else None
        return PaymentResponse(**doc)

    async def list(
        self,
        *,
        owner_id: Optional[str] = None,
        party_type: Optional[str] = None,
        party_id: Optional[str] = None,
        month: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> List[PaymentResponse]:
        query: dict = {}
        if owner_id:
            query["owner_id"] = owner_id
        if party_type == "owner":
            # Include legacy docs that only have owner_id (no party_type)
            query["$or"] = [
                {"party_type": "owner"},
                {"owner_id": {"$exists": True, "$ne": ""}, "party_type": {"$exists": False}},
            ]
        elif party_type == "tenant":
            query["party_type"] = "tenant"
        if party_id:
            query["party_id"] = party_id
        if from_date or to_date:
            range_q: dict = {}
            if from_date:
                range_q["$gte"] = from_date
            if to_date:
                range_q["$lte"] = to_date
            query["payment_date"] = range_q
        elif month:
            query["month"] = month
        cursor = self._coll.find(query, {"_id": 0}).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        items = [self._normalize_doc(p) for p in items]
        name_map = await self._resolve_names_bulk(items)
        results = []
        for p in items:
            pname = name_map.get(p["party_id"])
            p["party_name"] = pname
            p["owner_name"] = pname if p["party_type"] == "owner" else None
            results.append(PaymentResponse(**p))
        return results

    async def monthly_total(
        self,
        month: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> float:
        if from_date or to_date:
            match: dict = {}
            range_q: dict = {}
            if from_date:
                range_q["$gte"] = from_date
            if to_date:
                range_q["$lte"] = to_date
            match["payment_date"] = range_q
        else:
            if not month:
                return 0
            match = {"month": month}

        pipeline = [
            {"$match": match},
            {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}},
        ]
        result = await self._coll.aggregate(pipeline).to_list(1)
        return result[0]["total"] if result else 0

    async def update(self, payment_id: str, data: PaymentUpdate) -> Optional[PaymentResponse]:
        existing = await self._coll.find_one({"id": payment_id})
        if not existing:
            return None
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if "party_id" in update_data:
            update_data["owner_id"] = update_data["party_id"]
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._coll.update_one({"id": payment_id}, {"$set": update_data})
        updated = await self._coll.find_one({"id": payment_id}, {"_id": 0})
        if not updated:
            return None
        updated = self._normalize_doc(updated)
        party_name = await self._resolve_party_name(updated["party_type"], updated["party_id"])
        updated["party_name"] = party_name
        updated["owner_name"] = party_name if updated["party_type"] == "owner" else None
        return PaymentResponse(**updated)

    async def delete(self, payment_id: str) -> bool:
        result = await self._coll.delete_one({"id": payment_id})
        return result.deleted_count > 0
