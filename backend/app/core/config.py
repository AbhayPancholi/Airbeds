import os
from dataclasses import dataclass
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load .env from backend directory (parent of app/)
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BACKEND_DIR / ".env")


@dataclass(frozen=True)
class DatabaseConfig:
    uri: str
    name: str


@dataclass(frozen=True)
class JWTConfig:
    secret: str
    algorithm: str
    expiration_hours: int


@dataclass(frozen=True)
class AppConfig:
    name: str
    cors_origins: List[str]


class Settings:
    """
    Central application settings.

    This is intentionally simple and uses os.environ so we don't add
    new runtime dependencies beyond what the project already has.
    """

    def __init__(self) -> None:
        app_name = os.environ.get("APP_NAME", "EstateCommand API")

        cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
        cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

        mongo_url = os.environ.get("MONGO_URL", "")
        db_name = os.environ.get("DB_NAME", "")

        jwt_secret = os.environ.get("JWT_SECRET", "estate-command-secret-key-2024")
        jwt_algorithm = os.environ.get("JWT_ALGORITHM", "HS256")
        jwt_expiration_hours = int(os.environ.get("JWT_EXPIRATION_HOURS", "24"))

        self.app = AppConfig(name=app_name, cors_origins=cors_origins)
        self.database = DatabaseConfig(uri=mongo_url, name=db_name)
        self.jwt = JWTConfig(
            secret=jwt_secret,
            algorithm=jwt_algorithm,
            expiration_hours=jwt_expiration_hours,
        )


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

