from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_notice_service
from app.models import NoticeCreate, NoticeResponse, NoticeUpdate
from app.services.notice_service import NoticeService

router = APIRouter()


@router.post("", response_model=NoticeResponse)
async def create_notice(
    notice: NoticeCreate,
    admin: dict = Depends(get_current_admin),
    service: NoticeService = Depends(get_notice_service),
):
    return await service.create(notice)


@router.get("", response_model=List[NoticeResponse])
async def get_notices(
    page: int = 1,
    limit: int = 10,
    admin: dict = Depends(get_current_admin),
    service: NoticeService = Depends(get_notice_service),
):
    return await service.list(page=page, limit=limit)


@router.get("/{notice_id}", response_model=NoticeResponse)
async def get_notice(
    notice_id: str,
    admin: dict = Depends(get_current_admin),
    service: NoticeService = Depends(get_notice_service),
):
    return await service.get_by_id(notice_id)


@router.put("/{notice_id}", response_model=NoticeResponse)
async def update_notice(
    notice_id: str,
    notice: NoticeUpdate,
    admin: dict = Depends(get_current_admin),
    service: NoticeService = Depends(get_notice_service),
):
    return await service.update(notice_id, notice)


@router.delete("/{notice_id}")
async def delete_notice(
    notice_id: str,
    admin: dict = Depends(get_current_admin),
    service: NoticeService = Depends(get_notice_service),
):
    await service.delete(notice_id)
    return {"message": "Notice deleted successfully"}
