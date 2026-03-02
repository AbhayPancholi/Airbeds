from typing import List, Optional

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_owner_service
from app.models import OwnerCreate, OwnerResponse, OwnerUpdate
from app.services.owner_service import OwnerService

router = APIRouter()


@router.post("", response_model=OwnerResponse)
async def create_owner(
    owner: OwnerCreate,
    admin: dict = Depends(get_current_admin),
    service: OwnerService = Depends(get_owner_service),
):
    return await service.create(owner)


@router.get("", response_model=List[OwnerResponse])
async def get_owners(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    admin: dict = Depends(get_current_admin),
    service: OwnerService = Depends(get_owner_service),
):
    return await service.list(search=search, page=page, limit=limit)


@router.get("/all", response_model=List[OwnerResponse])
async def get_all_owners(
    admin: dict = Depends(get_current_admin),
    service: OwnerService = Depends(get_owner_service),
):
    return await service.list_all()


@router.get("/{owner_id}", response_model=OwnerResponse)
async def get_owner(
    owner_id: str,
    admin: dict = Depends(get_current_admin),
    service: OwnerService = Depends(get_owner_service),
):
    return await service.get_by_id(owner_id)


@router.put("/{owner_id}", response_model=OwnerResponse)
async def update_owner(
    owner_id: str,
    owner: OwnerUpdate,
    admin: dict = Depends(get_current_admin),
    service: OwnerService = Depends(get_owner_service),
):
    return await service.update(owner_id, owner)


@router.delete("/{owner_id}")
async def delete_owner(
    owner_id: str,
    admin: dict = Depends(get_current_admin),
    service: OwnerService = Depends(get_owner_service),
):
    await service.delete(owner_id)
    return {"message": "Owner deleted successfully"}
