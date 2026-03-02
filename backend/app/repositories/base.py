from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, List, Optional, TypeVar


TModel = TypeVar("TModel")
TCreate = TypeVar("TCreate")
TUpdate = TypeVar("TUpdate")


class AbstractRepository(ABC, Generic[TModel, TCreate, TUpdate]):
    """
    Generic repository interface enforcing a consistent CRUD contract.
    """

    @abstractmethod
    async def create(self, data: TCreate) -> TModel:
        ...

    @abstractmethod
    async def get_by_id(self, entity_id: str) -> Optional[TModel]:
        ...

    @abstractmethod
    async def list(self, *, skip: int = 0, limit: int = 100) -> List[TModel]:
        ...

    @abstractmethod
    async def update(self, entity_id: str, data: TUpdate) -> Optional[TModel]:
        ...

    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        ...

