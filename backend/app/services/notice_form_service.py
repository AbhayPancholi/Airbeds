"""Notice form (public link) availability and submit logic."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from fastapi import HTTPException

from app.models.notice import NoticeCreate, NoticeResponse
from app.models.notice_form_settings import NoticeFormStatusResponse
from app.repositories.notice_form_settings_repository import NoticeFormSettingsRepository
from app.repositories.notice_repository import NoticeRepository

if TYPE_CHECKING:
    from app.repositories.tenant_repository import TenantRepository


def _is_form_open(
    recurring_enabled: bool,
    recurring_start_day: int,
    recurring_end_day: int,
    special_window_ends_at: Optional[str],
) -> bool:
    now = datetime.now(timezone.utc)
    if special_window_ends_at:
        try:
            ends_at = datetime.fromisoformat(special_window_ends_at.replace("Z", "+00:00"))
            if now < ends_at:
                return True
        except (ValueError, TypeError):
            pass
    if recurring_enabled:
        day = now.day
        if recurring_start_day <= recurring_end_day:
            if recurring_start_day <= day <= recurring_end_day:
                return True
        else:
            # e.g. 25 to 3 (span month end)
            if day >= recurring_start_day or day <= recurring_end_day:
                return True
    return False


class NoticeFormService:
    def __init__(
        self,
        notice_repo: NoticeRepository,
        settings_repo: NoticeFormSettingsRepository,
        tenant_repo: "TenantRepository",
    ) -> None:
        self._notice_repo = notice_repo
        self._settings_repo = settings_repo
        self._tenant_repo = tenant_repo

    async def get_status(self) -> NoticeFormStatusResponse:
        settings = await self._settings_repo.get()
        open_ = _is_form_open(
            settings.recurring_enabled,
            settings.recurring_start_day,
            settings.recurring_end_day,
            settings.special_window_ends_at,
        )
        message = None
        recurring = None
        if settings.recurring_enabled:
            recurring = {
                "start_day": settings.recurring_start_day,
                "end_day": settings.recurring_end_day,
            }
            if not open_:
                message = f"This form is open from day {settings.recurring_start_day} to day {settings.recurring_end_day} of every month."
        if not open_ and not message:
            message = "The move out notice form is currently closed."
        return NoticeFormStatusResponse(open=open_, message=message, recurring=recurring)

    async def submit(self, data: NoticeCreate) -> NoticeResponse:
        settings = await self._settings_repo.get()
        if not _is_form_open(
            settings.recurring_enabled,
            settings.recurring_start_day,
            settings.recurring_end_day,
            settings.special_window_ends_at,
        ):
            raise HTTPException(
                status_code=403,
                detail="The move out notice form is currently closed. Please submit during the open period.",
            )
        return await self._notice_repo.create(data)

    async def get_tenant_for_prefill(self, tenant_id_display: str) -> dict:
        """Public. Returns tenant prefill data by Customer ID (tenant_id) when form is open. 404 if not found or form closed."""
        settings = await self._settings_repo.get()
        if not _is_form_open(
            settings.recurring_enabled,
            settings.recurring_start_day,
            settings.recurring_end_day,
            settings.special_window_ends_at,
        ):
            raise HTTPException(status_code=403, detail="The move out notice form is currently closed.")
        tenant = await self._tenant_repo.get_by_tenant_id((tenant_id_display or "").strip())
        if not tenant:
            raise HTTPException(status_code=404, detail="Customer ID not found. You must be a registered tenant to submit a move out notice.")
        display_id = tenant.get("tenant_id") or tenant.get("customer_id")
        return {
            "id": tenant["id"],
            "tenant_id": display_id,
            "society_name": tenant.get("society_name") or "",
            "building_name": tenant.get("building_name") or "",
            "flat_number": tenant.get("flat_number") or "",
            "selected_room": tenant.get("selected_room") or "",
            "occupancy_type": tenant.get("occupancy_type") or "",
            "salutation": tenant.get("salutation") or "",
            "tenant_name": tenant.get("tenant_name") or "",
            "email": tenant.get("email") or "",
            "contact_number": tenant.get("contact_number") or "",
        }

    async def get_settings(self):
        return await self._settings_repo.get()

    async def update_settings(self, data):
        return await self._settings_repo.update_recurring(data)

    async def open_special_window(self, hours: int):
        if hours < 1 or hours > 24:
            raise HTTPException(status_code=400, detail="Hours must be between 1 and 24")
        return await self._settings_repo.set_special_window_hours(hours)
