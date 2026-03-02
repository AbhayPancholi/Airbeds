from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from typing import Any, Dict

import bcrypt
import jwt

from .config import get_settings


class AbstractPasswordHasher(ABC):
    @abstractmethod
    def hash(self, password: str) -> str:
        ...

    @abstractmethod
    def verify(self, password: str, hashed: str) -> bool:
        ...


class BcryptPasswordHasher(AbstractPasswordHasher):
    def hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


class AbstractTokenService(ABC):
    @abstractmethod
    def create_access_token(self, subject: str, email: str) -> str:
        ...

    @abstractmethod
    def decode_token(self, token: str) -> Dict[str, Any]:
        ...


class JWTTokenService(AbstractTokenService):
    def __init__(self) -> None:
        settings = get_settings()
        self._secret = settings.jwt.secret
        self._algorithm = settings.jwt.algorithm
        self._expiration_hours = settings.jwt.expiration_hours

    def create_access_token(self, subject: str, email: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": subject,
            "email": email,
            "iat": now,
            "exp": now + timedelta(hours=self._expiration_hours),
        }
        return jwt.encode(payload, self._secret, algorithm=self._algorithm)

    def decode_token(self, token: str) -> Dict[str, Any]:
        return jwt.decode(token, self._secret, algorithms=[self._algorithm])

