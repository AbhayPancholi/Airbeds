from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_police_verification_service
from app.models import (
    PoliceVerificationCreate,
    PoliceVerificationResponse,
    PoliceVerificationUpdate,
)
from app.services.police_verification_service import PoliceVerificationService

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
