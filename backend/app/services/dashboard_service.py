"""Dashboard aggregation logic."""
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import AgreementStatus, CollectionNames, DashboardLimits
from app.core.utils import get_current_month
from app.models.dashboard import DashboardStats


class DashboardService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._limit = DashboardLimits.RECENT_ITEMS_LIMIT

    async def get_stats(self) -> DashboardStats:
        current_month = get_current_month()
        tenants = self._db[CollectionNames.TENANTS]
        owners = self._db[CollectionNames.OWNERS]
        agreements = self._db[CollectionNames.AGREEMENTS]
        notices = self._db[CollectionNames.NOTICES]
        payments = self._db[CollectionNames.PAYMENTS]
        expenses = self._db[CollectionNames.EXPENSES]

        total_tenants = await tenants.count_documents({})
        total_owners = await owners.count_documents({})
        active_agreements = await agreements.count_documents({"status": AgreementStatus.ACTIVE})
        pending_notices = await notices.count_documents({})

        payment_pipeline = [
            {"$match": {"month": current_month}},
            {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}},
        ]
        payment_result = await payments.aggregate(payment_pipeline).to_list(1)
        monthly_payments = payment_result[0]["total"] if payment_result else 0

        expense_pipeline = [
            {"$match": {"date": {"$regex": f"^{current_month}"}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        expense_result = await expenses.aggregate(expense_pipeline).to_list(1)
        monthly_expenses = expense_result[0]["total"] if expense_result else 0

        recent_tenants = (
            await tenants.find(
                {},
                {"_id": 0, "id": 1, "tenant_name": 1, "room_number": 1, "joining_date": 1},
            )
            .sort("created_at", -1)
            .limit(self._limit)
            .to_list(self._limit)
        )
        recent_notices = (
            await notices.find(
                {},
                {"_id": 0, "id": 1, "tenant_id": 1, "notice_date": 1, "leaving_date": 1},
            )
            .sort("created_at", -1)
            .limit(self._limit)
            .to_list(self._limit)
        )
        recent_expenses = (
            await expenses.find(
                {},
                {"_id": 0, "id": 1, "expense_type": 1, "amount": 1, "date": 1},
            )
            .sort("created_at", -1)
            .limit(self._limit)
            .to_list(self._limit)
        )

        if recent_notices:
            tenant_ids = [n["tenant_id"] for n in recent_notices]
            tenant_docs = await tenants.find(
                {"id": {"$in": tenant_ids}}, {"_id": 0, "id": 1, "tenant_name": 1}
            ).to_list(len(tenant_ids))
            tenant_map = {t["id"]: t["tenant_name"] for t in tenant_docs}
            for notice in recent_notices:
                notice["tenant_name"] = tenant_map.get(notice["tenant_id"], "Unknown")

        return DashboardStats(
            total_tenants=total_tenants,
            total_owners=total_owners,
            active_agreements=active_agreements,
            pending_notices=pending_notices,
            monthly_payments=monthly_payments,
            monthly_expenses=monthly_expenses,
            recent_tenants=recent_tenants,
            recent_notices=recent_notices,
            recent_expenses=recent_expenses,
        )
