from typing import List, Optional

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_expense_service
from app.models import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.services.expense_service import ExpenseService

router = APIRouter()


@router.post("", response_model=ExpenseResponse)
async def create_expense(
    expense: ExpenseCreate,
    admin: dict = Depends(get_current_admin),
    service: ExpenseService = Depends(get_expense_service),
):
    return await service.create(expense)


@router.get("", response_model=List[ExpenseResponse])
async def get_expenses(
    month: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    admin: dict = Depends(get_current_admin),
    service: ExpenseService = Depends(get_expense_service),
):
    return await service.list(month=month, from_date=from_date, to_date=to_date, page=page, limit=limit)


@router.get("/monthly-total")
async def get_monthly_expense_total(
    month: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: dict = Depends(get_current_admin),
    service: ExpenseService = Depends(get_expense_service),
):
    return await service.monthly_total(month=month, from_date=from_date, to_date=to_date)


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    admin: dict = Depends(get_current_admin),
    service: ExpenseService = Depends(get_expense_service),
):
    return await service.get_by_id(expense_id)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    expense: ExpenseUpdate,
    admin: dict = Depends(get_current_admin),
    service: ExpenseService = Depends(get_expense_service),
):
    return await service.update(expense_id, expense)


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    admin: dict = Depends(get_current_admin),
    service: ExpenseService = Depends(get_expense_service),
):
    await service.delete(expense_id)
    return {"message": "Expense deleted successfully"}
