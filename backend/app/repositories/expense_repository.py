"""Expense data access."""
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate


class ExpenseRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.EXPENSES]

    async def create(self, data: ExpenseCreate) -> ExpenseResponse:
        expense_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc = {"id": expense_id, **data.model_dump(), "created_at": now, "updated_at": now}
        await self._coll.insert_one(doc)
        doc.pop("_id", None)
        return ExpenseResponse(**doc)

    async def get_by_id(self, expense_id: str) -> Optional[ExpenseResponse]:
        doc = await self._coll.find_one({"id": expense_id}, {"_id": 0})
        return ExpenseResponse(**doc) if doc else None

    async def list(
        self,
        *,
        month: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> List[ExpenseResponse]:
        query = {}
        if month:
            query["date"] = {"$regex": f"^{month}"}
        cursor = self._coll.find(query, {"_id": 0}).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        return [ExpenseResponse(**e) for e in items]

    async def monthly_total(self, month: str) -> float:
        pipeline = [
            {"$match": {"date": {"$regex": f"^{month}"}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        result = await self._coll.aggregate(pipeline).to_list(1)
        return result[0]["total"] if result else 0

    async def update(self, expense_id: str, data: ExpenseUpdate) -> Optional[ExpenseResponse]:
        existing = await self._coll.find_one({"id": expense_id})
        if not existing:
            return None
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._coll.update_one({"id": expense_id}, {"$set": update_data})
        updated = await self._coll.find_one({"id": expense_id}, {"_id": 0})
        return ExpenseResponse(**updated) if updated else None

    async def delete(self, expense_id: str) -> bool:
        result = await self._coll.delete_one({"id": expense_id})
        return result.deleted_count > 0
