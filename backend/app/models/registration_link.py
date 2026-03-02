from typing import Optional

from pydantic import BaseModel


class RegistrationLinkResponse(BaseModel):
    id: str
    token: str
    created_at: str
    used_at: Optional[str] = None
    created_by_admin_id: Optional[str] = None
