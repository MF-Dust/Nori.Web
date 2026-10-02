"""Reject cross-origin browser access without excluding native/local clients."""

from __future__ import annotations

from urllib.parse import urlsplit


def is_same_origin_request(origin: str | None, request_url: str) -> bool:
    if origin is None:
        return True  # Native clients do not send Origin.
    try:
        if any(char.isspace() for char in origin):
            return False
        source = urlsplit(origin)
        target = urlsplit(str(request_url))
        if (source.scheme not in {"http", "https"} or not source.hostname
                or source.username is not None or source.password is not None
                or source.path not in {"", "/"} or source.query or source.fragment):
            return False
        target_scheme = {"ws": "http", "wss": "https"}.get(target.scheme, target.scheme)
        source_port = source.port or (443 if source.scheme == "https" else 80)
        target_port = target.port or (443 if target_scheme == "https" else 80)
        return (source.scheme, source.hostname, source_port) == (
            target_scheme, target.hostname, target_port
        )
    except ValueError:
        return False


class SameOriginMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in {"http", "websocket"} and scope["path"].startswith("/api/"):
            # Keep Starlette off the Worker edge's import path.
            from starlette.datastructures import Headers, URL
            from starlette.responses import JSONResponse

            if not is_same_origin_request(Headers(scope=scope).get("origin"), str(URL(scope=scope))):
                if scope["type"] == "websocket":
                    await send({"type": "websocket.close", "code": 1008, "reason": "origin_forbidden"})
                else:
                    await JSONResponse({"error": "origin_forbidden"}, status_code=403)(scope, receive, send)
                return
        await self.app(scope, receive, send)
