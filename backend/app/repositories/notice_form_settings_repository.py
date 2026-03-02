"""Notice form availability settings - single doc per app."""
from datetime import datetime, timezone
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.notice_form_settings import (
    NoticeFormSettingsResponse,
    NoticeFormSettingsUpdate,
)

SETTINGS_ID = "default"


class NoticeFormSettingsRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.NOTICE_FORM_SETTINGS]

    async def get(self) -> NoticeFormSettingsResponse:
        doc = await self._coll.find_one({"id": SETTINGS_ID}, {"_id": 0})
        if doc:
            return NoticeFormSettingsResponse(
                recurring_enabled=doc.get("recurring_enabled", False),
                recurring_start_day=doc.get("recurring_start_day", 1),
                recurring_end_day=doc.get("recurring_end_day", 5),
                special_window_ends_at=doc.get("special_window_ends_at"),
            )
        return NoticeFormSettingsResponse(
            recurring_enabled=False,
            recurring_start_day=1,
            recurring_end_day=5,
            special_window_ends_at=None,
        )

    async def update_recurring(self, data: NoticeFormSettingsUpdate) -> NoticeFormSettingsResponse:
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": SETTINGS_ID,
            "recurring_enabled": data.recurring_enabled,
            "recurring_start_day": data.recurring_start_day,
            "recurring_end_day": data.recurring_end_day,
            "updated_at": now,
        }
        await self._coll.update_one(
            {"id": SETTINGS_ID},
            {"$set": doc},
            upsert=True,
        )
        existing = await self._coll.find_one({"id": SETTINGS_ID}, {"_id": 0})
        return NoticeFormSettingsResponse(
            recurring_enabled=existing["recurring_enabled"],
            recurring_start_day=existing["recurring_start_day"],
            recurring_end_day=existing["recurring_end_day"],
            special_window_ends_at=existing.get("special_window_ends_at"),
        )

    async def set_special_window_hours(self, hours: int) -> NoticeFormSettingsResponse:
        """Set one-time open window: from now until now + hours (UTC)."""
        if hours < 1 or hours > 24:
            raise ValueError("Hours must be between 1 and 24")
        now = datetime.now(timezone.utc)
        from datetime import timedelta
        ends_at = (now + timedelta(hours=hours)).isoformat()
        await self._coll.update_one(
            {"id": SETTINGS_ID},
            {"$set": {"special_window_ends_at": ends_at, "updated_at": now.isoformat()}},
            upsert=True,
        )
        return await self.get()
