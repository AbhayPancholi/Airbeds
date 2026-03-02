from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.database import create_default_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = create_default_database()
    try:
        await db.connect()
        await db.ensure_collections()
        app.state.db = db
        print("INFO:     Database connected successfully (MongoDB).")
    except Exception as e:
        print(f"ERROR:    Database connection failed: {e}")
        raise
    try:
        yield
    finally:
        await db.disconnect()
        print("INFO:     Database disconnected.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title=settings.app.name, lifespan=lifespan)

    # Routers
    app.include_router(api_router, prefix="/api")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.app.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


app = create_app()

