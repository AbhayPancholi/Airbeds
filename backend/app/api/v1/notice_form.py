"""Public notice form (fixed link): status, submit; admin: settings, open one-time window."""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_notice_form_service
from app.models import NoticeCreate, NoticeResponse
from app.models.notice_form_settings import (
    NoticeFormSettingsResponse,
    NoticeFormSettingsUpdate,
    NoticeFormStatusResponse,
)
from app.services.notice_form_service import NoticeFormService

router = APIRouter()


@router.get("/status", response_model=NoticeFormStatusResponse)
async def get_notice_form_status(
    service: NoticeFormService = Depends(get_notice_form_service),
):
    """Public. Returns whether the move out notice form is currently open for tenants."""
    return await service.get_status()


@router.post("/submit", response_model=NoticeResponse)
async def submit_notice_form(
    data: NoticeCreate,
    service: NoticeFormService = Depends(get_notice_form_service),
):
    """Public. Submit move out notice. Only accepted when form is open (recurring or one-time window)."""
    return await service.submit(data)


@router.get("/tenant-by-id")
async def get_tenant_by_customer_id(
    tenant_id: str,
    service: NoticeFormService = Depends(get_notice_form_service),
):
    """Public. When form is open, look up tenant by Customer ID (display tenant_id). Returns prefill data and internal id for linking the notice. 404 if not found."""
    return await service.get_tenant_for_prefill(tenant_id)


@router.get("/settings", response_model=NoticeFormSettingsResponse)
async def get_notice_form_settings(
    admin: dict = Depends(get_current_admin),
    service: NoticeFormService = Depends(get_notice_form_service),
):
    """Admin. Get notice form availability settings."""
    return await service.get_settings()


@router.put("/settings", response_model=NoticeFormSettingsResponse)
async def update_notice_form_settings(
    data: NoticeFormSettingsUpdate,
    admin: dict = Depends(get_current_admin),
    service: NoticeFormService = Depends(get_notice_form_service),
):
    """Admin. Update recurring monthly window (enabled, start day, end day)."""
    return await service.update_settings(data)


@router.post("/open-special", response_model=NoticeFormSettingsResponse)
async def open_notice_form_special(
    body: dict,
    admin: dict = Depends(get_current_admin),
    service: NoticeFormService = Depends(get_notice_form_service),
):
    """Admin. Open form for a one-time window (1–24 hours from now)."""
    hours = body.get("hours")
    if hours is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Missing 'hours' (1-24)")
    return await service.open_special_window(int(hours))
