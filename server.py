"""NoriOS local compatibility server.

Run with `python server.py` and open http://127.0.0.1:4173.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from backend.api import api_router, register_mimetypes, static_router
from backend.core.config import DEBUG, HOST, PORT

register_mimetypes()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(title="NoriOS Local Compatibility Server", version="2.0.0")
    application.add_middleware(GZipMiddleware, minimum_size=500)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    application.include_router(api_router)
    application.include_router(static_router)
    return application


app = create_app()

if __name__ == "__main__":
    import uvicorn

    from backend.virtual_apps import live_pack

    print(f"NoriOS local compatibility server: http://{HOST}:{PORT}")
    print(f"Arcade WebSocket: ws://{HOST}:{PORT}/api/arcade/web/v1")
    print(live_pack.summary())
    uvicorn.run("server:app", host=HOST, port=PORT, reload=DEBUG)
