"""Notice form (public move-out form) availability settings."""
from typing import Optional

from pydantic import BaseModel, Field


class NoticeFormSettingsUpdate(BaseModel):
    """Admin updates to recurring window. Days are 1-28 (month day)."""
    recurring_enabled: bool = False
    recurring_start_day: int = Field(ge=1, le=28, default=1)
    recurring_end_day: int = Field(ge=1, le=28, default=5)


class NoticeFormSettingsResponse(BaseModel):
    recurring_enabled: bool
    recurring_start_day: int
    recurring_end_day: int
    special_window_ends_at: Optional[str] = None  # ISO datetime UTC


class NoticeFormStatusResponse(BaseModel):
    """Public response: is the form open for tenants."""
    open: bool
    message: Optional[str] = None
    recurring: Optional[dict] = None  # { start_day, end_day } when recurring is configured
