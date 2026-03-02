"""Registration (occupancy form) link data access."""
from datetime import datetime, timezone
from typing import List, Optional
import secrets
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.registration_link import RegistrationLinkResponse


class RegistrationLinkRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._coll = db[CollectionNames.REGISTRATION_LINKS]

    def _new_token(self) -> str:
        return secrets.token_urlsafe(24)

    async def create(self, created_by_admin_id: Optional[str] = None) -> RegistrationLinkResponse:
        link_id = str(uuid.uuid4())
        token = self._new_token()
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": link_id,
            "token": token,
            "created_at": now,
            "used_at": None,
            "created_by_admin_id": created_by_admin_id,
        }
        await self._coll.insert_one(doc)
        doc.pop("_id", None)
        return RegistrationLinkResponse(**doc)

    async def get_by_token(self, token: str) -> Optional[RegistrationLinkResponse]:
        doc = await self._coll.find_one({"token": token}, {"_id": 0})
        if not doc:
            return None
        return RegistrationLinkResponse(**doc)

    async def mark_used(self, token: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        result = await self._coll.update_one(
            {"token": token, "used_at": None},
            {"$set": {"used_at": now}},
        )
        return result.modified_count > 0

    async def list_links(
        self,
        skip: int = 0,
        limit: int = 50,
    ) -> List[RegistrationLinkResponse]:
        cursor = (
            self._coll.find({}, {"_id": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        items = await cursor.to_list(limit)
        return [RegistrationLinkResponse(**t) for t in items]
