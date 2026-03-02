from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_agreement_service
from app.models import AgreementCreate, AgreementResponse, AgreementUpdate
from app.services.agreement_service import AgreementService

router = APIRouter()


@router.post("", response_model=AgreementResponse)
async def create_agreement(
    agreement: AgreementCreate,
    admin: dict = Depends(get_current_admin),
    service: AgreementService = Depends(get_agreement_service),
):
    return await service.create(agreement)


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
