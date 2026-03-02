"""Shared utilities (time, ids, etc.)."""
from datetime import datetime, timezone


def get_current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")
