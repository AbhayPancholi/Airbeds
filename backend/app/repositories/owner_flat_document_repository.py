"""Owner flat PDF document storage + owner-flat listing."""

import base64
from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional, Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import CollectionNames
from app.models.owner_flat_document import OwnerFlatDocumentCreate


def _strip_data_url_prefix(raw: str) -> str:
    if not raw:
        return ""
    if raw.startswith("data:"):
        return raw.split(",", 1)[1]
    return raw


class OwnerFlatDocumentRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._owners = db[CollectionNames.OWNERS]
        self._docs = db[CollectionNames.OWNER_FLAT_DOCUMENTS]

    def _owner_flat_doc_key(self, owner_id: str, flat_index: int, document_type: str) -> str:
        # Ensures we can store multiple document types per flat (agreement vs police verification).
        return f"{owner_id}:{flat_index}:{document_type}"

    async def list_owner_flats(self) -> List[Dict[str, Any]]:
        owners = await self._owners.find({}, {"_id": 0, "id": 1, "name": 1, "flats": 1}).to_list(1000)

        flat_rows: List[Dict[str, Any]] = []
        keys: List[str] = []

        for owner in owners:
            owner_id = owner.get("id")
            owner_name = owner.get("name") or ""
            flats = owner.get("flats") or []
            if not isinstance(flats, list):
                continue
            for flat_index, flat in enumerate(flats):
                addr = {}
                if isinstance(flat, dict):
                    addr = flat.get("address") or {}
                flat_no = addr.get("flat_no") if isinstance(addr, dict) else None
                building_no = addr.get("building_no") if isinstance(addr, dict) else None
                society = addr.get("society") if isinstance(addr, dict) else None

                agreement_with_poa = {}
                if isinstance(flat, dict):
                    agreement_with_poa = flat.get("agreement_with_poa") or {}
                agreement_start_date = (
                    agreement_with_poa.get("start_date")
                    if isinstance(agreement_with_poa, dict)
                    else None
                )
                agreement_end_date = (
                    agreement_with_poa.get("end_date")
                    if isinstance(agreement_with_poa, dict)
                    else None
                )

                # We'll fetch both document types for each flat.
                keys.append(self._owner_flat_doc_key(owner_id, flat_index, "agreement"))
                keys.append(self._owner_flat_doc_key(owner_id, flat_index, "police_verification"))

                flat_rows.append(
                    {
                        "owner_id": owner_id,
                        "owner_name": owner_name,
                        "flat_index": flat_index,
                        "flat_no": flat_no,
                        "building_no": building_no,
                        "society": society,
                        "agreement_document_id": None,
                        "agreement_document_file_name": None,
                        "police_verification_document_id": None,
                        "police_verification_document_file_name": None,
                        "agreement_start_date": agreement_start_date,
                        "agreement_end_date": agreement_end_date,
                    }
                )

        if not keys:
            return []

        docs = await self._docs.find(
            {"owner_flat_doc_key": {"$in": keys}},
            {"_id": 0, "id": 1, "owner_flat_doc_key": 1, "document_type": 1, "file_name": 1},
        ).to_list(len(keys))

        doc_map: Dict[str, Dict[str, Any]] = {d["owner_flat_doc_key"]: d for d in docs if d.get("owner_flat_doc_key")}

        for row in flat_rows:
            base_doc_key = f"{row['owner_id']}:{row['flat_index']}"
            agreement_key = f"{base_doc_key}:agreement"
            police_key = f"{base_doc_key}:police_verification"

            agreement_doc = doc_map.get(agreement_key)
            if agreement_doc:
                row["agreement_document_id"] = agreement_doc.get("id")
                row["agreement_document_file_name"] = agreement_doc.get("file_name")

            police_doc = doc_map.get(police_key)
            if police_doc:
                row["police_verification_document_id"] = police_doc.get("id")
                row["police_verification_document_file_name"] = police_doc.get("file_name")

        return flat_rows

    async def upsert_document(self, data: OwnerFlatDocumentCreate) -> Dict[str, Any]:
        if data.document_type not in {"agreement", "police_verification"}:
            raise ValueError("Invalid document_type")

        now = datetime.now(timezone.utc).isoformat()
        pdf_base64 = _strip_data_url_prefix(data.pdf_base64 or "")
        if not pdf_base64:
            raise ValueError("pdf_base64 is required")

        # Validate base64 quickly to avoid corrupt documents.
        try:
            base64.b64decode(pdf_base64, validate=True)
        except Exception as e:
            raise ValueError("Invalid pdf_base64") from e

        owner_flat_doc_key = self._owner_flat_doc_key(data.owner_id, data.flat_index, data.document_type)
        update = {
            "$set": {
                "owner_id": data.owner_id,
                "flat_index": data.flat_index,
                "document_type": data.document_type,
                "pdf_base64": pdf_base64,
                "file_name": data.file_name,
                "updated_at": now,
            },
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "owner_flat_doc_key": owner_flat_doc_key,
                "created_at": now,
            },
        }

        await self._docs.update_one(
            {"owner_flat_doc_key": owner_flat_doc_key},
            update,
            upsert=True,
        )

        doc = await self._docs.find_one({"owner_flat_doc_key": owner_flat_doc_key}, {"_id": 0})
        return doc or {}

    async def get_download_bytes(self, doc_id: str) -> Tuple[bytes, str]:
        doc = await self._docs.find_one({"id": doc_id}, {"_id": 0, "pdf_base64": 1, "file_name": 1})
        if not doc:
            raise KeyError("Document not found")

        pdf_base64 = _strip_data_url_prefix(doc.get("pdf_base64") or "")
        if not pdf_base64:
            raise KeyError("Document content missing")

        pdf_bytes = base64.b64decode(pdf_base64)
        file_name = doc.get("file_name") or f"owner_flat_{doc_id}.pdf"
        return pdf_bytes, file_name

    async def delete_document(self, doc_id: str) -> bool:
        result = await self._docs.delete_one({"id": doc_id})
        return result.deleted_count > 0

