"""Registration (occupancy form) links: admin creates links, public validates and submits."""
from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_registration_link_service
from app.models import TenantCreate, TenantResponse
from app.models.registration_link import RegistrationLinkResponse
from app.services.registration_link_service import RegistrationLinkService

router = APIRouter()


@router.post("", response_model=dict)
async def create_link(
    admin: dict = Depends(get_current_admin),
    service: RegistrationLinkService = Depends(get_registration_link_service),
):
    """Create a new one-time registration link. Admin only."""
    link = await service.create_link(created_by_admin_id=admin.get("id"))
    path = f"/register/{link.token}"
    return {
        "id": link.id,
        "token": link.token,
        "path": path,
        "created_at": link.created_at,
    }


@router.get("", response_model=List[RegistrationLinkResponse])
async def list_links(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_admin),
    service: RegistrationLinkService = Depends(get_registration_link_service),
):
    """List generated links (used and unused). Admin only."""
    return await service.list_links(skip=skip, limit=limit)


@router.get("/validate/{token}", response_model=dict)
async def validate_token(
    token: str,
    service: RegistrationLinkService = Depends(get_registration_link_service),
):
    """Check if a registration link is valid and not yet used. Public, no auth."""
    valid = await service.validate_token(token)
    if not valid:
        return {"valid": False, "message": "This link is invalid or has already been used."}
    return {"valid": True}


@router.post("/{token}/submit", response_model=TenantResponse)
async def submit_registration(
    token: str,
    data: TenantCreate,
    service: RegistrationLinkService = Depends(get_registration_link_service),
):
    """Submit occupancy form using a one-time link. Creates tenant and expires the link. Public, no auth."""
    return await service.submit_with_token(token, data)
