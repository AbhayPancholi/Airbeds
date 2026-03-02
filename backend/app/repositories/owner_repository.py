"""Owner data access."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.owner import (
    AddressModel,
    OwnerCreate,
    OwnerResponse,
    OwnerUpdate,
    _address_to_flat_number,
    _address_to_property_address,
)


def _doc_to_response(doc: Dict[str, Any]) -> OwnerResponse:
    """Build OwnerResponse from DB doc; derive property_address/flat_number from first flat if missing."""
    doc = dict(doc)
    if not doc.get("property_address") or not doc.get("flat_number"):
        flats = doc.get("flats") or []
        first_flat = flats[0] if flats else None
        addr = None
        if first_flat and isinstance(first_flat, dict):
            addr = first_flat.get("address")
        if isinstance(addr, dict):
            addr = AddressModel(**addr)
        if not doc.get("flat_number"):
            doc["flat_number"] = doc.get("flat_number") or _address_to_flat_number(addr) or ""
        if not doc.get("property_address"):
            doc["property_address"] = doc.get("property_address") or _address_to_property_address(addr) or ""
    return OwnerResponse(**doc)


class OwnerRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.OWNERS]

    async def create(self, data: OwnerCreate) -> OwnerResponse:
        owner_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        payload = data.model_dump(exclude_none=False)
        # Derive legacy fields from first flat if not provided
        if not payload.get("property_address") or not payload.get("flat_number"):
            flats = payload.get("flats") or []
            first_flat = flats[0] if flats else None
            addr = None
            if first_flat and isinstance(first_flat, dict):
                addr = first_flat.get("address")
            if isinstance(addr, dict):
                addr = AddressModel(**addr)
            if not payload.get("flat_number"):
                payload["flat_number"] = _address_to_flat_number(addr) if addr else ""
            if not payload.get("property_address"):
                payload["property_address"] = _address_to_property_address(addr) if addr else ""
        doc = {"id": owner_id, **payload, "created_at": now, "updated_at": now}
        await self._coll.insert_one(doc)
        doc.pop("_id", None)
        return _doc_to_response(doc)

    async def get_by_id(self, owner_id: str) -> Optional[Dict[str, Any]]:
        return await self._coll.find_one({"id": owner_id}, {"_id": 0})

    async def get_by_id_response(self, owner_id: str) -> Optional[OwnerResponse]:
        doc = await self.get_by_id(owner_id)
        return _doc_to_response(doc) if doc else None

    async def list(
        self,
        *,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> List[OwnerResponse]:
        query = {}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"flat_number": {"$regex": search, "$options": "i"}},
            ]
        cursor = self._coll.find(query, {"_id": 0}).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        return [_doc_to_response(o) for o in items]

    async def list_all(self, limit: int = 1000) -> List[OwnerResponse]:
        cursor = self._coll.find({}, {"_id": 0}).limit(limit)
        items = await cursor.to_list(limit)
        return [_doc_to_response(o) for o in items]

    async def update(self, owner_id: str, data: OwnerUpdate) -> Optional[OwnerResponse]:
        existing = await self._coll.find_one({"id": owner_id})
        if not existing:
            return None
        update_data = {k: v for k, v in data.model_dump(exclude_none=True).items() if k != "id"}
        # Derive legacy fields from first flat when flats are being updated
        if "flats" in update_data and update_data["flats"]:
            first_flat = update_data["flats"][0]
            addr = first_flat.get("address") if isinstance(first_flat, dict) else None
            if isinstance(addr, dict):
                addr = AddressModel(**addr)
            update_data["flat_number"] = _address_to_flat_number(addr) if addr else ""
            update_data["property_address"] = _address_to_property_address(addr) if addr else ""
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._coll.update_one({"id": owner_id}, {"$set": update_data})
        updated = await self._coll.find_one({"id": owner_id}, {"_id": 0})
        return _doc_to_response(updated) if updated else None

    async def delete(self, owner_id: str) -> bool:
        result = await self._coll.delete_one({"id": owner_id})
        return result.deleted_count > 0
