from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import CollectionInvalid

from .config import get_settings
from .constants import CollectionNames


class AbstractDatabase(ABC):
    @abstractmethod
    def get_client(self) -> AsyncIOMotorClient:
        ...

    @abstractmethod
    def get_database(self) -> AsyncIOMotorDatabase:
        ...

    @abstractmethod
    async def connect(self) -> None:
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        ...


class MongoDatabase(AbstractDatabase):
    """
    Motor-based MongoDB implementation of AbstractDatabase.
    """

    def __init__(self, uri: str, db_name: str) -> None:
        self._uri = uri
        self._db_name = db_name
        self._client: Optional[AsyncIOMotorClient] = None
        self._db: Optional[AsyncIOMotorDatabase] = None

    async def connect(self) -> None:
        if self._client is None:
            self._client = AsyncIOMotorClient(self._uri)
            self._db = self._client[self._db_name]
            # Verify connection with a ping
            await self._db.command("ping")

    async def ensure_collections(self) -> None:
        """Create all application collections if they do not exist."""
        if self._db is None:
            raise RuntimeError("MongoDatabase is not connected")
        for name in CollectionNames.all():
            try:
                await self._db.create_collection(name)
            except CollectionInvalid:
                # Collection already exists
                pass

    async def disconnect(self) -> None:
        if self._client is not None:
            self._client.close()
            self._client = None
            self._db = None

    def get_client(self) -> AsyncIOMotorClient:
        if self._client is None:
            raise RuntimeError("MongoDatabase client is not connected")
        return self._client

    def get_database(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("MongoDatabase database is not initialized")
        return self._db


def create_default_database() -> MongoDatabase:
    settings = get_settings()
    return MongoDatabase(uri=settings.database.uri, db_name=settings.database.name)

