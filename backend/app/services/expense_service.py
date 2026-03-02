"""Expense business logic."""
from typing import List, Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.utils import get_current_month
from app.models.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.repositories.expense_repository import ExpenseRepository


class ExpenseService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = ExpenseRepository(db)

    async def create(self, data: ExpenseCreate) -> ExpenseResponse:
        return await self._repo.create(data)

    async def get_by_id(self, expense_id: str) -> ExpenseResponse:
        expense = await self._repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        return expense

    async def list(
        self,
        *,
        month: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[ExpenseResponse]:
        skip = (page - 1) * limit
        return await self._repo.list(month=month, skip=skip, limit=limit)

    async def monthly_total(self, month: Optional[str] = None) -> dict:
        if not month:
            month = get_current_month()
        total = await self._repo.monthly_total(month)
        return {"month": month, "total": total}

    async def update(self, expense_id: str, data: ExpenseUpdate) -> ExpenseResponse:
        updated = await self._repo.update(expense_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Expense not found")
        return updated

    async def delete(self, expense_id: str) -> None:
        if not await self._repo.delete(expense_id):
            raise HTTPException(status_code=404, detail="Expense not found")
