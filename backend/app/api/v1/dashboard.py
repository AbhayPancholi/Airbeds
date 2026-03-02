from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_dashboard_service
from app.models import DashboardStats
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: dict = Depends(get_current_admin),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.get_stats()
