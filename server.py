"""NoriOS local compatibility server.

Run with `python server.py` and open http://127.0.0.1:4173.
"""

from __future__ import annotations

from typing import Any


class _LazyASGIApp:
    """Build the FastAPI application only when it actually receives traffic.

    Cloudflare Durable Object invocations import ``worker.py`` and therefore
    import this module, but Arcade WebSocket handling does not need the HTTP
    router stack. Keeping the application lazy avoids initializing FastAPI,
    routers, middleware, mimetypes, and the HTTP AI bridge on every cold DO
    wake. Local Uvicorn usage remains compatible because this object is a
    normal ASGI callable and proxies attribute access to the realized app.
    """

    def __init__(self, *, include_static: bool) -> None:
        self.include_static = include_static
        self._app: Any | None = None

    def _realize(self):
        if self._app is None:
            self._app = _build_app(include_static=self.include_static)
        return self._app

    async def __call__(self, scope, receive, send) -> None:
        await self._realize()(scope, receive, send)

    def __getattr__(self, name: str):
        return getattr(self._realize(), name)


def _build_app(*, include_static: bool):
    """Import and construct the full HTTP stack on first use."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.middleware.gzip import GZipMiddleware

    from backend.api import api_router, register_mimetypes, static_router
    from backend.services.ai_event_bridge import install_ai_event_bridge

    register_mimetypes()
    install_ai_event_bridge()

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
    if include_static:
        application.include_router(static_router)
    return application


def create_app(*, include_static: bool = True) -> _LazyASGIApp:
    """Return a lazily initialized local/Cloudflare HTTP application."""
    return _LazyASGIApp(include_static=include_static)


app = create_app()

if __name__ == "__main__":
    import uvicorn

    from backend.core.config import DEBUG, HOST, PORT
    from backend.virtual_apps import live_pack

    print(f"NoriOS local compatibility server: http://{HOST}:{PORT}")
    print(f"Arcade WebSocket: ws://{HOST}:{PORT}/api/arcade/web/v1")
    print(live_pack.summary())
    uvicorn.run("server:app", host=HOST, port=PORT, reload=DEBUG)
