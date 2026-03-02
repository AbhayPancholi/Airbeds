"""Admin data access."""
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.admin import AdminCreate, AdminResponse


class AdminRepository:
    """Admin persistence using MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.ADMINS]

    async def get_by_id(self, admin_id: str) -> Optional[Dict[str, Any]]:
        doc = await self._coll.find_one({"id": admin_id}, {"_id": 0})
        return doc

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        doc = await self._coll.find_one({"email": email}, {"_id": 0})
        return doc

    async def create(self, data: AdminCreate, hashed_password: str) -> AdminResponse:
        admin_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": admin_id,
            "email": data.email,
            "password": hashed_password,
            "name": data.name,
            "created_at": now,
            "updated_at": now,
        }
        await self._coll.insert_one(doc)
        return AdminResponse(id=admin_id, email=data.email, name=data.name, created_at=now)
