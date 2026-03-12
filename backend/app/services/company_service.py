"""Company bank accounts and investments business logic."""
from typing import List, Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.company import (
    BankAccountCreate,
    BankAccountResponse,
    BankAccountUpdate,
    InvestmentCreate,
    InvestmentResponse,
)
from app.repositories.company_repository import CompanyRepository


class CompanyService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = CompanyRepository(db)

    # Accounts
    async def create_account(self, data: BankAccountCreate) -> BankAccountResponse:
        return await self._repo.create_account(data)

    async def list_accounts(self) -> List[BankAccountResponse]:
        return await self._repo.list_accounts()

    async def get_account(self, account_id: str) -> BankAccountResponse:
        account = await self._repo.get_account(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Bank account not found")
        return account

    async def update_account(
        self, account_id: str, data: BankAccountUpdate
    ) -> BankAccountResponse:
        updated = await self._repo.update_account(account_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Bank account not found")
        return updated

    # Investments
    async def create_investment(self, data: InvestmentCreate) -> InvestmentResponse:
        inv = await self._repo.create_investment(data)
        if not inv:
            raise HTTPException(status_code=404, detail="Bank account not found")
        return inv

    async def list_investments(
        self, *, bank_account_id: Optional[str] = None
    ) -> List[InvestmentResponse]:
        return await self._repo.list_investments(bank_account_id=bank_account_id)

