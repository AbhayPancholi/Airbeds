from typing import List

from fastapi import APIRouter, Depends, Response

from app.api.deps import (
    get_current_admin,
    get_police_verification_service,
    get_police_verification_document_service,
)
from app.models import (
    PoliceVerificationCreate,
    PoliceVerificationResponse,
    PoliceVerificationUpdate,
)
from app.services.police_verification_service import PoliceVerificationService
from app.services.police_verification_document_service import (
    PoliceVerificationDocumentService,
)

router = APIRouter()


@router.post("", response_model=PoliceVerificationResponse)
async def create_police_verification(
    verification: PoliceVerificationCreate,
    admin: dict = Depends(get_current_admin),
    service: PoliceVerificationService = Depends(get_police_verification_service),
):
    return await service.create(verification)


@router.get("", response_model=List[PoliceVerificationResponse])
async def get_police_verifications(
    page: int = 1,
    limit: int = 10,
    admin: dict = Depends(get_current_admin),
    service: PoliceVerificationService = Depends(get_police_verification_service),
):
    return await service.list(page=page, limit=limit)


@router.get("/{verification_id}", response_model=PoliceVerificationResponse)
async def get_police_verification(
    verification_id: str,
    admin: dict = Depends(get_current_admin),
    service: PoliceVerificationService = Depends(get_police_verification_service),
):
    return await service.get_by_id(verification_id)


@router.put("/{verification_id}", response_model=PoliceVerificationResponse)
async def update_police_verification(
    verification_id: str,
    verification: PoliceVerificationUpdate,
    admin: dict = Depends(get_current_admin),
    service: PoliceVerificationService = Depends(get_police_verification_service),
):
    return await service.update(verification_id, verification)


@router.delete("/{verification_id}")
async def delete_police_verification(
    verification_id: str,
    admin: dict = Depends(get_current_admin),
    service: PoliceVerificationService = Depends(get_police_verification_service),
):
    await service.delete(verification_id)
    return {"message": "Police verification deleted successfully"}


@router.get("/{verification_id}/download-document")
async def download_police_verification_document(
    verification_id: str,
    admin: dict = Depends(get_current_admin),
    doc_service: PoliceVerificationDocumentService = Depends(
        get_police_verification_document_service
    ),
):
    pdf_bytes = await doc_service.to_pdf_bytes(verification_id)
    headers = {
        "Content-Disposition": f'attachment; filename="police_verification_{verification_id}.pdf"'
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
