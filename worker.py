"""Cloudflare Workers entrypoint for Nori.Web.

HTTP API requests are served through Cloudflare's Python ASGI adapter. Static
frontend files are served by Workers Static Assets. Arcade WebSocket pairs are
routed by their signed ticket into a Durable Object so the main and media
channels share one in-memory WorldManager. Oversized static assets are streamed
from R2 while keeping their original public URL.
"""

from __future__ import annotations

import hashlib
from urllib.parse import urlsplit

from workers import DurableObject, Response, WorkerEntrypoint, asgi

from backend.core import config
from backend.session.manager import (
    WorldManager,
    bind_world_manager,
    reset_world_manager,
)
from backend.virtual_apps import live_pack
from server import create_app

_FASTAPI_APP = create_app(include_static=False)
_TRUE_VALUES = {"1", "true", "yes", "on"}
_R2_MODEL_PATH = "/datasea/cosmicweb.min.glb"
_R2_MODEL_KEY = "datasea/cosmicweb.min.glb"
_R2_MODEL_CONTENT_TYPE = "model/gltf-binary"
_R2_MODEL_CACHE_CONTROL = "public, max-age=604800, immutable"


def _configure_runtime(env) -> None:
    """Apply Workers vars/secrets before an ASGI request is dispatched."""
    config.apply_runtime_bindings(env)
    disabled = config.NORI_DISABLE_LIVE_PACK.strip().lower() in _TRUE_VALUES
    live_pack.set_disabled(disabled)


def _is_websocket(request) -> bool:
    return (request.headers.get("upgrade") or "").lower() == "websocket"


def _requested_protocols(request) -> list[str]:
    raw = request.headers.get("sec-websocket-protocol") or ""
    return [item.strip() for item in raw.split(",") if item.strip()]


def _ticket_from_request(request) -> str | None:
    for protocol in _requested_protocols(request):
        if protocol.startswith("ticket."):
            return protocol[len("ticket.") :]
    return None


def _durable_object_name(ticket: str | None) -> str:
    seed = ticket or "missing-ticket"
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()


def _r2_headers(obj) -> dict[str, str]:
    headers = {
        "Content-Type": _R2_MODEL_CONTENT_TYPE,
        "Cache-Control": _R2_MODEL_CACHE_CONTROL,
    }
    etag = getattr(obj, "httpEtag", None)
    if etag:
        headers["ETag"] = str(etag)
    size = getattr(obj, "size", None)
    if size is not None:
        headers["Content-Length"] = str(size)
    return headers


async def _serve_r2_model(env, request):
    """Stream the oversized DataSea GLB from the private R2 bucket."""
    if request.method == "HEAD":
        obj = await env.NORI_ASSETS_R2.head(_R2_MODEL_KEY)
        if obj is None:
            return Response("Object Not Found", status=404)
        return Response(None, status=200, headers=_r2_headers(obj))

    if request.method != "GET":
        return Response(
            "Method Not Allowed",
            status=405,
            headers={"Allow": "GET, HEAD"},
        )

    obj = await env.NORI_ASSETS_R2.get(_R2_MODEL_KEY)
    if obj is None:
        return Response("Object Not Found", status=404)

    return Response(obj.body, status=200, headers=_r2_headers(obj))


async def _cloudflare_asgi_app(scope, receive, send) -> None:
    """Patch Cloudflare's WebSocket ASGI scope with requested subprotocols.

    The current Workers ASGI adapter exposes the raw
    ``Sec-WebSocket-Protocol`` header but does not populate ASGI's
    ``scope['subprotocols']`` field. Starlette uses that field for WebSocket
    protocol negotiation, so populate it here before FastAPI receives the
    scope.
    """
    if scope.get("type") == "websocket" and not scope.get("subprotocols"):
        protocols: list[str] = []
        for key, value in scope.get("headers", []):
            if key.lower() == b"sec-websocket-protocol":
                protocols.extend(
                    item.strip()
                    for item in value.decode("latin-1").split(",")
                    if item.strip()
                )
        scope = dict(scope)
        scope["subprotocols"] = protocols
    await _FASTAPI_APP(scope, receive, send)


class NoriArcadeSession(DurableObject):
    """Pin both Arcade WebSockets for one ticket to a single state owner."""

    def __init__(self, ctx, env):
        super().__init__(ctx, env)
        self.manager = WorldManager()

    async def fetch(self, request):
        _configure_runtime(self.env)
        manager_token = bind_world_manager(self.manager)
        try:
            if _is_websocket(request):
                response = await asgi.websocket(_cloudflare_asgi_app, request, self.env)
                # Workers' ASGI WebSocket adapter currently ignores the
                # subprotocol selected by ``websocket.accept``. Echo the
                # protocol explicitly so browsers accept the upgrade.
                if "arcade.v1" in _requested_protocols(request):
                    response.headers.set("Sec-WebSocket-Protocol", "arcade.v1")
                return response
            return await asgi.fetch(_cloudflare_asgi_app, request, self.env)
        finally:
            reset_world_manager(manager_token)


class Default(WorkerEntrypoint):
    """Route API, R2 assets, and frontend traffic to the correct service."""

    async def fetch(self, request):
        _configure_runtime(self.env)
        path = urlsplit(request.url).path

        if path == _R2_MODEL_PATH:
            return await _serve_r2_model(self.env, request)

        if _is_websocket(request) and path.startswith("/api/arcade/web/v1"):
            ticket = _ticket_from_request(request)
            stub = self.env.NORI_ARCADE.getByName(_durable_object_name(ticket))
            return await stub.fetch(request)

        if path.startswith("/api/"):
            return await asgi.fetch(_cloudflare_asgi_app, request, self.env, self.ctx)

        return await self.env.ASSETS.fetch(request)
