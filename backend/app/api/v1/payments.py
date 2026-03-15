from typing import List, Optional

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_payment_service
from app.models import PaymentCreate, PaymentResponse, PaymentUpdate
from app.services.payment_service import PaymentService

router = APIRouter()


@router.post("", response_model=PaymentResponse)
async def create_payment(
    payment: PaymentCreate,
    admin: dict = Depends(get_current_admin),
    service: PaymentService = Depends(get_payment_service),
):
    return await service.create(payment)


@router.get("", response_model=List[PaymentResponse])
async def get_payments(
    owner_id: Optional[str] = None,
    party_type: Optional[str] = None,
    party_id: Optional[str] = None,
    month: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    admin: dict = Depends(get_current_admin),
    service: PaymentService = Depends(get_payment_service),
):
    return await service.list(
        owner_id=owner_id,
        party_type=party_type,
        party_id=party_id,
        month=month,
        from_date=from_date,
        to_date=to_date,
        page=page,
        limit=limit,
    )


@router.get("/monthly-total")
async def get_monthly_payment_total(
    month: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    party_type: Optional[str] = None,
    admin: dict = Depends(get_current_admin),
    service: PaymentService = Depends(get_payment_service),
):
    return await service.monthly_total(month=month, from_date=from_date, to_date=to_date, party_type=party_type)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    admin: dict = Depends(get_current_admin),
    service: PaymentService = Depends(get_payment_service),
):
    return await service.get_by_id(payment_id)


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: str,
    payment: PaymentUpdate,
    admin: dict = Depends(get_current_admin),
    service: PaymentService = Depends(get_payment_service),
):
    return await service.update(payment_id, payment)


@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: str,
    admin: dict = Depends(get_current_admin),
    service: PaymentService = Depends(get_payment_service),
):
    await service.delete(payment_id)
    return {"message": "Payment deleted successfully"}
