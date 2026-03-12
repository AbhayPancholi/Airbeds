"""Company bank accounts and investments data access."""
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.company import (
    BankAccountCreate,
    BankAccountResponse,
    BankAccountUpdate,
    InvestmentCreate,
    InvestmentResponse,
)


class CompanyRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._accounts = db[CollectionNames.COMPANY_ACCOUNTS]
        self._investments = db[CollectionNames.COMPANY_INVESTMENTS]

    # Bank accounts
    async def create_account(self, data: BankAccountCreate) -> BankAccountResponse:
        account_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": account_id,
            **data.model_dump(),
            "current_balance": 0.0,
            "created_at": now,
            "updated_at": now,
        }
        await self._accounts.insert_one(doc)
        doc.pop("_id", None)
        return BankAccountResponse(**doc)

    async def get_account(self, account_id: str) -> Optional[BankAccountResponse]:
        doc = await self._accounts.find_one({"id": account_id}, {"_id": 0})
        return BankAccountResponse(**doc) if doc else None

    async def list_accounts(self) -> List[BankAccountResponse]:
        cursor = self._accounts.find({}, {"_id": 0}).sort("created_at", 1)
        items = await cursor.to_list(None)
        return [BankAccountResponse(**a) for a in items]

    async def update_account(
        self, account_id: str, data: BankAccountUpdate
    ) -> Optional[BankAccountResponse]:
        existing = await self._accounts.find_one({"id": account_id})
        if not existing:
            return None
        update_data = {
            k: v for k, v in data.model_dump().items() if v is not None
        }
        if not update_data:
            updated = await self._accounts.find_one({"id": account_id}, {"_id": 0})
            return BankAccountResponse(**updated) if updated else None
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._accounts.update_one({"id": account_id}, {"$set": update_data})
        updated = await self._accounts.find_one({"id": account_id}, {"_id": 0})
        return BankAccountResponse(**updated) if updated else None

    # Investments
    async def create_investment(self, data: InvestmentCreate) -> Optional[InvestmentResponse]:
        account = await self._accounts.find_one({"id": data.bank_account_id})
        if not account:
            return None
        inv_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        inv_doc = {
            "id": inv_id,
            **data.model_dump(),
            "created_at": now,
        }
        await self._investments.insert_one(inv_doc)
        # increment account balance
        new_balance = float(account.get("current_balance", 0.0)) + float(data.amount)
        await self._accounts.update_one(
            {"id": data.bank_account_id},
            {
                "$set": {
                    "current_balance": new_balance,
                    "updated_at": now,
                }
            },
        )
        inv_doc.pop("_id", None)
        return InvestmentResponse(**inv_doc)

    async def list_investments(
        self, *, bank_account_id: Optional[str] = None
    ) -> List[InvestmentResponse]:
        query = {}
        if bank_account_id:
            query["bank_account_id"] = bank_account_id
        cursor = self._investments.find(query, {"_id": 0}).sort("date", 1)
        items = await cursor.to_list(None)
        return [InvestmentResponse(**i) for i in items]

