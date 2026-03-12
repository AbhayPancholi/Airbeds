from typing import List

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_tenants: int
    total_owners: int
    active_agreements: int
    pending_notices: int
    monthly_payments: float
    monthly_expenses: float
    monthly_invested: float
    recent_tenants: List[dict]
    recent_notices: List[dict]
    recent_expenses: List[dict]
