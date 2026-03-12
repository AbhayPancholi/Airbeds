from fastapi import APIRouter

from . import (
    auth,
    owners,
    tenants,
    registration_links,
    notices,
    notice_form,
    agreements,
    police_verifications,
    payments,
    expenses,
    dashboard,
    company,
)


api_router = APIRouter()


@api_router.get("/")
async def root():
    return {"message": "EstateCommand API", "version": "1.0.0"}


api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(owners.router, prefix="/owners", tags=["owners"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(
    registration_links.router, prefix="/registration-links", tags=["registration-links"]
)
api_router.include_router(notices.router, prefix="/notices", tags=["notices"])
api_router.include_router(notice_form.router, prefix="/notice-form", tags=["notice-form"])
api_router.include_router(agreements.router, prefix="/agreements", tags=["agreements"])
api_router.include_router(
    police_verifications.router, prefix="/police-verifications", tags=["police-verifications"]
)
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(company.router, prefix="/company", tags=["company"])

