from typing import Any, Dict, List

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.owner_flat_document import OwnerFlatDocumentCreate
from app.repositories.owner_flat_document_repository import OwnerFlatDocumentRepository


class OwnerFlatDocumentService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = OwnerFlatDocumentRepository(db)

    async def list_owner_flats(self) -> List[Dict[str, Any]]:
        return await self._repo.list_owner_flats()

    async def upsert_document(self, data: OwnerFlatDocumentCreate) -> Dict[str, Any]:
        return await self._repo.upsert_document(data)

    async def download_document_bytes(self, doc_id: str):
        return await self._repo.get_download_bytes(doc_id)

    async def delete_document(self, doc_id: str) -> bool:
        return await self._repo.delete_document(doc_id)

