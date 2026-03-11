from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_admin, get_agreement_service, get_agreement_document_service
from app.models import AgreementCreate, AgreementResponse, AgreementUpdate
from app.services.agreement_service import AgreementService
from app.services.agreement_document_service import AgreementDocumentService

router = APIRouter()


@router.post("", response_model=AgreementResponse)
async def create_agreement(
    agreement: AgreementCreate,
    admin: dict = Depends(get_current_admin),
    service: AgreementService = Depends(get_agreement_service),
):
    return await service.create(agreement)


@router.post("/download-document")
async def download_agreement_document(
    body: dict,
    admin: dict = Depends(get_current_admin),
    doc_service: AgreementDocumentService = Depends(get_agreement_document_service),
):
    """Generate Leave and Licence agreement from selected owner, tenant, flat and dates; return as PDF or DOCX."""
    format_type = (body.get("format") or "pdf").lower()
    if format_type not in ("pdf", "docx"):
        raise HTTPException(status_code=400, detail="format must be 'pdf' or 'docx'")
    owner_id = body.get("owner_id")
    tenant_id = body.get("tenant_id")
    if not owner_id or not tenant_id:
        raise HTTPException(status_code=400, detail="owner_id and tenant_id are required")
    flat_index = int(body.get("flat_index", 0))
    agreement_date = body.get("agreement_date") or body.get("start_date") or ""
    start_date = body.get("start_date") or ""
    end_date = body.get("end_date") or ""
    monthly_rent = float(body.get("monthly_rent", 0))
    deposit_amount = float(body.get("deposit_amount", 0))
    filled_text = await doc_service.build_filled_text(
        owner_id=owner_id,
        tenant_id=tenant_id,
        flat_index=flat_index,
        agreement_date=agreement_date,
        start_date=start_date,
        end_date=end_date,
        monthly_rent=monthly_rent,
        deposit_amount=deposit_amount,
    )
    if format_type == "pdf":
        content_type = "application/pdf"
        filename = "Leave_and_Licence_Agreement.pdf"
        bytes_data = doc_service.to_pdf_bytes(filled_text)
    else:
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = "Leave_and_Licence_Agreement.docx"
        bytes_data = doc_service.to_docx_bytes(filled_text)
    return StreamingResponse(
        iter([bytes_data]),
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("", response_model=List[AgreementResponse])
async def get_agreements(
    page: int = 1,
    limit: int = 10,
    admin: dict = Depends(get_current_admin),
    service: AgreementService = Depends(get_agreement_service),
):
    return await service.list(page=page, limit=limit)


@router.get("/{agreement_id}", response_model=AgreementResponse)
async def get_agreement(
    agreement_id: str,
    admin: dict = Depends(get_current_admin),
    service: AgreementService = Depends(get_agreement_service),
):
    return await service.get_by_id(agreement_id)


@router.put("/{agreement_id}", response_model=AgreementResponse)
async def update_agreement(
    agreement_id: str,
    agreement: AgreementUpdate,
    admin: dict = Depends(get_current_admin),
    service: AgreementService = Depends(get_agreement_service),
):
    return await service.update(agreement_id, agreement)


@router.delete("/{agreement_id}")
async def delete_agreement(
    agreement_id: str,
    admin: dict = Depends(get_current_admin),
    service: AgreementService = Depends(get_agreement_service),
):
    await service.delete(agreement_id)
    return {"message": "Agreement deleted successfully"}
