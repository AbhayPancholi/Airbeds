from typing import List, Optional

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_company_service
from app.models.company import (
    BankAccountCreate,
    BankAccountResponse,
    BankAccountUpdate,
    InvestmentCreate,
    InvestmentResponse,
)
from app.services.company_service import CompanyService


router = APIRouter()


@router.get("")
async def company_root():
    """Verify company routes are mounted. Returns 200 when /api/company is registered."""
    return {"status": "ok", "module": "company"}


@router.post("/accounts", response_model=BankAccountResponse)
async def create_bank_account(
    account: BankAccountCreate,
    admin: dict = Depends(get_current_admin),
    service: CompanyService = Depends(get_company_service),
):
    return await service.create_account(account)


@router.get("/accounts", response_model=List[BankAccountResponse])
async def list_bank_accounts(
    admin: dict = Depends(get_current_admin),
    service: CompanyService = Depends(get_company_service),
):
    return await service.list_accounts()


@router.get("/accounts/{account_id}", response_model=BankAccountResponse)
async def get_bank_account(
    account_id: str,
    admin: dict = Depends(get_current_admin),
    service: CompanyService = Depends(get_company_service),
):
    return await service.get_account(account_id)


@router.put("/accounts/{account_id}", response_model=BankAccountResponse)
async def update_bank_account(
    account_id: str,
    account: BankAccountUpdate,
    admin: dict = Depends(get_current_admin),
    service: CompanyService = Depends(get_company_service),
):
    return await service.update_account(account_id, account)


@router.post("/investments", response_model=InvestmentResponse)
async def add_investment(
    investment: InvestmentCreate,
    admin: dict = Depends(get_current_admin),
    service: CompanyService = Depends(get_company_service),
):
    return await service.create_investment(investment)


@router.get("/investments", response_model=List[InvestmentResponse])
async def list_investments(
    bank_account_id: Optional[str] = None,
    admin: dict = Depends(get_current_admin),
    service: CompanyService = Depends(get_company_service),
):
    return await service.list_investments(bank_account_id=bank_account_id)

