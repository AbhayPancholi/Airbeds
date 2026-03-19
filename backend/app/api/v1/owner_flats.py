from typing import List

from fastapi import APIRouter, Depends, Response, HTTPException

from app.api.deps import get_current_admin
from app.api.deps import (
    get_owner_flat_document_service,
)
from app.models import (
    OwnerFlatDocumentCreate,
    OwnerFlatDocumentResponse,
    OwnerFlatListingResponse,
)


router = APIRouter()


@router.get("", response_model=List[OwnerFlatListingResponse])
async def list_owner_flats(
    admin: dict = Depends(get_current_admin),
    service=Depends(get_owner_flat_document_service),
):
    return await service.list_owner_flats()


@router.post("/documents", response_model=OwnerFlatDocumentResponse)
async def upload_owner_flat_document(
    doc: OwnerFlatDocumentCreate,
    admin: dict = Depends(get_current_admin),
    service=Depends(get_owner_flat_document_service),
):
    if not doc.pdf_base64:
        raise HTTPException(status_code=400, detail="pdf_base64 is required")
    try:
        return await service.upsert_document(doc)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/documents/{doc_id}/download")
async def download_owner_flat_document(
    doc_id: str,
    admin: dict = Depends(get_current_admin),
    service=Depends(get_owner_flat_document_service),
):
    try:
        pdf_bytes, file_name = await service.download_document_bytes(doc_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Document not found")

    headers = {
        "Content-Disposition": f'attachment; filename="{file_name}"',
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


@router.delete("/documents/{doc_id}")
async def delete_owner_flat_document(
    doc_id: str,
    admin: dict = Depends(get_current_admin),
    service=Depends(get_owner_flat_document_service),
):
    deleted = await service.delete_document(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}

