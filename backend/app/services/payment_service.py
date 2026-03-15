"""Payment business logic."""
from typing import List, Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.utils import get_current_month
from app.models.payment import PaymentCreate, PaymentResponse, PaymentUpdate
from app.repositories.payment_repository import PaymentRepository


class PaymentService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = PaymentRepository(db)

    async def create(self, data: PaymentCreate) -> PaymentResponse:
        return await self._repo.create(data)

    async def get_by_id(self, payment_id: str) -> PaymentResponse:
        payment = await self._repo.get_by_id(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment

    async def list(
        self,
        *,
        owner_id: Optional[str] = None,
        party_type: Optional[str] = None,
        party_id: Optional[str] = None,
        month: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[PaymentResponse]:
        skip = (page - 1) * limit
        return await self._repo.list(
            owner_id=owner_id,
            party_type=party_type,
            party_id=party_id,
            month=month,
            from_date=from_date,
            to_date=to_date,
            skip=skip,
            limit=limit,
        )

    async def monthly_total(
        self,
        month: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        party_type: Optional[str] = None,
    ) -> dict:
        if not (from_date or to_date) and not month:
            month = get_current_month()
        total = await self._repo.monthly_total(month=month, from_date=from_date, to_date=to_date, party_type=party_type)
        return {"month": month, "from_date": from_date, "to_date": to_date, "total": total}

    async def update(self, payment_id: str, data: PaymentUpdate) -> PaymentResponse:
        updated = await self._repo.update(payment_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Payment not found")
        return updated

    async def delete(self, payment_id: str) -> None:
        if not await self._repo.delete(payment_id):
            raise HTTPException(status_code=404, detail="Payment not found")
