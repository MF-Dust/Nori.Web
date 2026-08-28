"""Cloudflare Workers entrypoint for Nori.Web.

HTTP APIs are served through Cloudflare's Python ASGI adapter, static frontend
files through Workers Static Assets, and Arcade WebSockets through a Durable
Object. Large immutable assets and the live-world archive live in private R2.

The live archive is deliberately partitioned: only a small core is resident
when a world starts, artifact sections are fetched before the corresponding
WebSocket RPC is dispatched, and browser pages are loaded one shard at a time.
This avoids holding the original 11.7 MiB JSON as a large Python object inside
the 128 MiB Durable Object isolate.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
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

_R2_LIVE_PREFIX = "runtime/live"
_R2_LIVE_CORE_KEY = f"{_R2_LIVE_PREFIX}/core.json"
_R2_LIVE_SECTION_KEYS = {
    "mail_artifacts": f"{_R2_LIVE_PREFIX}/mail_artifacts.json",
    "file_artifacts": f"{_R2_LIVE_PREFIX}/file_artifacts.json",
    "signal_thread_artifacts": f"{_R2_LIVE_PREFIX}/signal_thread_artifacts.json",
    "signal_message_artifacts": f"{_R2_LIVE_PREFIX}/signal_message_artifacts.json",
}
_R2_BROWSER_INDEX_KEY = f"{_R2_LIVE_PREFIX}/browser-index.json"
_R2_BROWSER_SHARD_PREFIX = f"{_R2_LIVE_PREFIX}/browser"

_LIVE_PACK_LOAD_LOCK = asyncio.Lock()
_LIVE_PACK_RETRY_SECONDS = 60.0
_live_pack_retry_at = 0.0
_browser_index: dict[str, str] | None = None
_browser_loaded_shard: str | None = None


def _apply_runtime_bindings(env) -> None:
    config.apply_runtime_bindings(env)
    disabled = config.NORI_DISABLE_LIVE_PACK.strip().lower() in _TRUE_VALUES
    live_pack.set_disabled(disabled)


async def _r2_json(env, key: str):
    obj = await env.NORI_ASSETS_R2.get(key)
    if obj is None:
        return None
    return await obj.json()


async def _load_live_core_from_r2(env) -> bool:
    """Load only facts/variables/chip state needed to construct a world."""
    global _live_pack_retry_at

    if config.NORI_DISABLE_LIVE_PACK.strip().lower() in _TRUE_VALUES:
        return False
    if live_pack.has_loaded_pack():
        return True

    now = time.monotonic()
    if now < _live_pack_retry_at:
        return False

    async with _LIVE_PACK_LOAD_LOCK:
        if live_pack.has_loaded_pack():
            return True
        now = time.monotonic()
        if now < _live_pack_retry_at:
            return False
        try:
            data = await _r2_json(env, _R2_LIVE_CORE_KEY)
            if not isinstance(data, dict):
                print(
                    f"[live_pack] R2 core missing/invalid: {_R2_LIVE_CORE_KEY}; "
                    "run scripts/upload_cloudflare_live_pack.py"
                )
                _live_pack_retry_at = now + _LIVE_PACK_RETRY_SECONDS
                return False
            if not live_pack.install_core(data):
                _live_pack_retry_at = now + _LIVE_PACK_RETRY_SECONDS
                return False
            _live_pack_retry_at = 0.0
            print(f"[live_pack] core loaded from R2: {live_pack.summary()}")
            return True
        except Exception as exc:
            print(f"[live_pack] failed to load R2 core: {exc}")
            _live_pack_retry_at = now + _LIVE_PACK_RETRY_SECONDS
            return False


async def _ensure_live_section(env, section: str) -> bool:
    if live_pack.section_loaded(section):
        return True
    key = _R2_LIVE_SECTION_KEYS.get(section)
    if key is None:
        return False
    async with _LIVE_PACK_LOAD_LOCK:
        if live_pack.section_loaded(section):
            return True
        try:
            data = await _r2_json(env, key)
            if not isinstance(data, list):
                print(f"[live_pack] R2 section missing/invalid: {key}")
                return False
            live_pack.install_section(section, data)
            print(f"[live_pack] section loaded: {section}={len(data)}")
            return True
        except Exception as exc:
            print(f"[live_pack] failed section {section}: {exc}")
            return False


async def _get_browser_index(env) -> dict[str, str]:
    global _browser_index
    if _browser_index is not None:
        return _browser_index
    async with _LIVE_PACK_LOAD_LOCK:
        if _browser_index is not None:
            return _browser_index
        try:
            data = await _r2_json(env, _R2_BROWSER_INDEX_KEY)
            entries = data.get("entries") if isinstance(data, dict) else None
            if not isinstance(entries, dict):
                print(f"[live_pack] browser index missing/invalid: {_R2_BROWSER_INDEX_KEY}")
                _browser_index = {}
            else:
                _browser_index = {
                    str(key): str(value)
                    for key, value in entries.items()
                    if isinstance(key, str) and isinstance(value, (str, int))
                }
        except Exception as exc:
            print(f"[live_pack] failed browser index: {exc}")
            _browser_index = {}
    return _browser_index


def _lookup_browser_shard(
    index: dict[str, str],
    lookup_key: str,
    *,
    allow_contains: bool = False,
) -> str | None:
    for variant in live_pack.lookup_variants(lookup_key):
        shard = index.get(variant)
        if shard is not None:
            return shard

    canon = live_pack.canonical_lookup(lookup_key)
    base_no_q = canon.split("?", 1)[0]
    queryless = {
        shard
        for key, shard in index.items()
        if "?" not in key and key.split("?", 1)[0] == base_no_q
    }
    if len(queryless) == 1:
        return next(iter(queryless))

    if allow_contains and canon:
        matches = {shard for key, shard in index.items() if canon in key or key in canon}
        if len(matches) == 1:
            return next(iter(matches))
    return None


async def _ensure_browser_lookup(
    env,
    lookup_key: str,
    *,
    allow_contains: bool = False,
) -> bool:
    global _browser_loaded_shard
    index = await _get_browser_index(env)
    shard = _lookup_browser_shard(index, lookup_key, allow_contains=allow_contains)
    if shard is None:
        live_pack.replace_browser_pages([])
        _browser_loaded_shard = None
        return False

    if _browser_loaded_shard == shard and live_pack.section_loaded("browser_pages"):
        return True

    key = f"{_R2_BROWSER_SHARD_PREFIX}/{shard}.json"
    async with _LIVE_PACK_LOAD_LOCK:
        if _browser_loaded_shard == shard and live_pack.section_loaded("browser_pages"):
            return True
        try:
            data = await _r2_json(env, key)
            if not isinstance(data, list):
                print(f"[live_pack] browser shard missing/invalid: {key}")
                return False
            live_pack.replace_browser_pages(data)
            _browser_loaded_shard = shard
            print(f"[live_pack] browser shard loaded: {shard} pages={len(data)}")
            return True
        except Exception as exc:
            print(f"[live_pack] failed browser shard {shard}: {exc}")
            return False


async def _prefetch_for_arcade_message(env, raw: str) -> None:
    """Populate lazy archive sections before EventDispatcher handles an RPC."""
    try:
        message = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return
    if not isinstance(message, dict) or message.get("type") != "event":
        return

    channel = message.get("channel")
    payload = message.get("payload")
    payload = payload if isinstance(payload, dict) else {}

    if channel == "manifold.artifacts.request":
        req_type = payload.get("artifactType")
        mapping = {
            "mail": ("mail_artifacts",),
            "file": ("file_artifacts",),
            "signal_thread": ("signal_thread_artifacts",),
            "signal_message": ("signal_message_artifacts",),
            None: (
                "mail_artifacts",
                "file_artifacts",
                "signal_thread_artifacts",
                "signal_message_artifacts",
            ),
        }
        for section in mapping.get(req_type, ()):
            await _ensure_live_section(env, section)
        return

    if channel == "manifold.artifacts.fetch":
        if payload.get("artifactType") == "browser_page":
            lookup_key = payload.get("lookup_key")
            if isinstance(lookup_key, str) and lookup_key:
                await _ensure_browser_lookup(env, lookup_key)
        return

    if channel == "manifold.bounty.submit":
        if payload.get("fileId"):
            await _ensure_live_section(env, "file_artifacts")
        url = payload.get("url")
        if isinstance(url, str) and url:
            await _ensure_browser_lookup(env, url, allow_contains=True)


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
    """Patch subprotocols and lazily prefetch R2 sections for WS messages."""
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

    if scope.get("type") != "websocket":
        await _FASTAPI_APP(scope, receive, send)
        return

    env = scope.get("env")

    async def receive_with_prefetch():
        event = await receive()
        if event.get("type") == "websocket.receive" and env is not None:
            raw = event.get("text")
            if raw is None and isinstance(event.get("bytes"), (bytes, bytearray)):
                try:
                    raw = bytes(event["bytes"]).decode("utf-8")
                except UnicodeDecodeError:
                    raw = None
            if isinstance(raw, str):
                await _prefetch_for_arcade_message(env, raw)
        return event

    await _FASTAPI_APP(scope, receive_with_prefetch, send)


class NoriArcadeSession(DurableObject):
    """Pin both Arcade WebSockets for one ticket to a single state owner."""

    def __init__(self, ctx, env):
        super().__init__(ctx, env)
        self.manager = WorldManager()

    async def fetch(self, request):
        _apply_runtime_bindings(self.env)
        manager_token = bind_world_manager(self.manager)
        loader_token = live_pack.bind_runtime_loader(
            lambda: _load_live_core_from_r2(self.env)
        )
        try:
            if _is_websocket(request):
                response = await asgi.websocket(_cloudflare_asgi_app, request, self.env)
                if "arcade.v1" in _requested_protocols(request):
                    response.headers.set("Sec-WebSocket-Protocol", "arcade.v1")
                return response
            return await asgi.fetch(_cloudflare_asgi_app, request, self.env)
        finally:
            live_pack.reset_runtime_loader(loader_token)
            reset_world_manager(manager_token)


class Default(WorkerEntrypoint):
    """Route API, R2 assets, and frontend traffic to the correct service."""

    async def fetch(self, request):
        _apply_runtime_bindings(self.env)
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
