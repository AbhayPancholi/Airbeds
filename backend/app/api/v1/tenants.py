from typing import List, Optional

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_tenant_service
from app.models import TenantCreate, TenantResponse, TenantUpdate
from app.services.tenant_service import TenantService

router = APIRouter()


@router.post("", response_model=TenantResponse)
async def create_tenant(
    tenant: TenantCreate,
    admin: dict = Depends(get_current_admin),
    service: TenantService = Depends(get_tenant_service),
):
    return await service.create(tenant)


@router.get("", response_model=List[TenantResponse])
async def get_tenants(
    search: Optional[str] = None,
    owner_id: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    admin: dict = Depends(get_current_admin),
    service: TenantService = Depends(get_tenant_service),
):
    return await service.list(search=search, owner_id=owner_id, page=page, limit=limit)


@router.get("/all", response_model=List[TenantResponse])
async def get_all_tenants(
    admin: dict = Depends(get_current_admin),
    service: TenantService = Depends(get_tenant_service),
):
    return await service.list_all()


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    admin: dict = Depends(get_current_admin),
    service: TenantService = Depends(get_tenant_service),
):
    return await service.get_by_id(tenant_id)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    tenant: TenantUpdate,
    admin: dict = Depends(get_current_admin),
    service: TenantService = Depends(get_tenant_service),
):
    return await service.update(tenant_id, tenant)


@router.delete("/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    admin: dict = Depends(get_current_admin),
    service: TenantService = Depends(get_tenant_service),
):
    await service.delete(tenant_id)
    return {"message": "Tenant deleted successfully"}
