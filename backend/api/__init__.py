"""API routers module."""

from fastapi import APIRouter

from .arcade import arcade_ws_router
from .auth import auth_router
from .convex import convex_router
from .static import register_mimetypes, static_router
from .system import system_router

# Main API router combining all REST and WS routes
api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(system_router)
api_router.include_router(convex_router)
api_router.include_router(arcade_ws_router)

__all__ = [
    "api_router",
    "auth_router",
    "system_router",
    "convex_router",
    "arcade_ws_router",
    "static_router",
    "register_mimetypes",
]
