"""Cloudflare Workers entrypoint for Nori.Web.

HTTP APIs are served through Cloudflare's Python ASGI adapter, static frontend
files through Workers Static Assets, and Arcade WebSockets through a Durable
Object. Large immutable assets and the live-world archive live in private R2.

Arcade sockets use Cloudflare's WebSocket Hibernation API. Idle browsers keep
their connections without pinning a 128 MiB Durable Object in memory, while a
small JSON world snapshot in SQLite storage restores cartridge progress after a
hibernate/wake cycle.

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
import secrets
import time
from urllib.parse import urlsplit

from workers import DurableObject, Response, WorkerEntrypoint, asgi

try:
    from js import WebSocketPair
except ImportError:  # Local CPython compile/tests; available inside Python Workers.
    WebSocketPair = None

from backend.core import config
from backend.core.protocol import error_message
from backend.services.ai_runtime_config import (
    clear_runtime_ai_config,
    install_runtime_ai_config,
    sanitize_runtime_ai_config,
)
from backend.session.manager import (
    WorldManager,
    bind_world_manager,
    reset_world_manager,
)
from backend.session.persistence import world_from_snapshot_json, world_snapshot_json
from backend.virtual_apps import live_pack
from server import create_app

_FASTAPI_APP = create_app(include_static=False)
_TRUE_VALUES = {"1", "true", "yes", "on"}
_EDGE_TICKET_MANAGER = WorldManager()

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

_DO_WORLD_STATE_KEY = "nori:world:v1"
_DO_AI_CONFIG_KEY = "nori:ai-public:v1"
_SOCKET_ATTACHMENT_VERSION = 1

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


def _durable_object_name(user_id: str | None) -> str:
    seed = user_id or "missing-user"
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
    """Patch subprotocols for non-Durable-Object ASGI WebSocket callers."""
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


class _HibernatingSocketAdapter:
    """Duck-type the subset of FastAPI WebSocket used by WorldSession."""

    def __init__(self, websocket, socket_id: str):
        self.websocket = websocket
        self.socket_id = socket_id

    def __hash__(self) -> int:
        return hash(self.socket_id)

    def __eq__(self, other) -> bool:
        return (
            isinstance(other, _HibernatingSocketAdapter)
            and self.socket_id == other.socket_id
        )

    async def send_text(self, text: str) -> None:
        self.websocket.send(text)

    async def send_bytes(self, data: bytes) -> None:
        self.websocket.send(data)

    async def close(self, code: int = 1000, reason: str = "") -> None:
        self.websocket.close(code, reason)


def _socket_attachment(websocket) -> dict:
    try:
        raw = websocket.deserializeAttachment()
    except Exception:
        return {}
    if isinstance(raw, dict):
        return dict(raw)
    if not isinstance(raw, str) or not raw:
        return {}
    try:
        decoded = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return decoded if isinstance(decoded, dict) else {}


def _save_socket_attachment(websocket, attachment: dict) -> None:
    websocket.serializeAttachment(
        json.dumps(attachment, ensure_ascii=False, separators=(",", ":"))
    )


def _public_ai_config(config_value: dict) -> dict:
    return {key: value for key, value in config_value.items() if key != "apiKey"}


async def _drain_world_tasks(world) -> None:
    """Finish short follow-up work before persisting and allowing hibernation."""
    for _ in range(16):
        tasks = list(world._tasks)
        if not tasks:
            return
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, Exception):
                print(f"[arcade] background task failed: {result}")
    if world._tasks:
        print(f"[arcade] {len(world._tasks)} background tasks remain after drain limit")


class NoriArcadeSession(DurableObject):
    """Hibernatable state owner for one user's Arcade main/media sockets."""

    def __init__(self, ctx, env):
        super().__init__(ctx, env)
        self.manager = WorldManager()
        self._world_load_lock = asyncio.Lock()
        self._public_ai_config_cache: dict | None = None

    async def _load_world(self, user_id: str):
        world = self.manager.worlds_by_user.get(user_id)
        if world is not None:
            return world

        async with self._world_load_lock:
            world = self.manager.worlds_by_user.get(user_id)
            if world is not None:
                return world

            if not await live_pack.ensure_runtime_pack():
                print("[arcade] live-world archive unavailable; continuing with mock data")

            raw = await self.ctx.storage.get(_DO_WORLD_STATE_KEY)
            world = world_from_snapshot_json(raw)
            if world is None or world.owner_id != user_id:
                world = await self.manager.get_world(user_id)
            else:
                self.manager.worlds_by_user[user_id] = world
                print(f"[arcade] restored hibernated world {world.world_id}")
            return world

    async def _persist_world(self, world, *, force: bool = False, before: str | None = None) -> str:
        snapshot = world_snapshot_json(world)
        if force or snapshot != before:
            await self.ctx.storage.put(_DO_WORLD_STATE_KEY, snapshot)
        return snapshot

    async def _load_public_ai_config(self) -> dict:
        if self._public_ai_config_cache is not None:
            return dict(self._public_ai_config_cache)
        raw = await self.ctx.storage.get(_DO_AI_CONFIG_KEY)
        config_value = {}
        if isinstance(raw, str) and raw:
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = None
            if isinstance(parsed, dict):
                config_value = parsed
        self._public_ai_config_cache = dict(config_value)
        return config_value

    async def _install_ai_for_socket(self, attachment: dict) -> None:
        config_value = await self._load_public_ai_config()
        api_key = attachment.get("apiKey")
        if isinstance(api_key, str) and api_key:
            config_value["apiKey"] = api_key
        install_runtime_ai_config(config_value)

    async def _capture_ai_settings(self, websocket, attachment: dict, message: dict) -> dict:
        if message.get("type") != "event" or message.get("channel") != "nori.ai.config":
            return attachment
        payload = message.get("payload") if isinstance(message.get("payload"), dict) else {}
        config_value = sanitize_runtime_ai_config(payload)
        public = _public_ai_config(config_value)
        await self.ctx.storage.put(
            _DO_AI_CONFIG_KEY,
            json.dumps(public, ensure_ascii=False, separators=(",", ":")),
        )
        self._public_ai_config_cache = dict(public)
        attachment = dict(attachment)
        attachment["apiKey"] = str(config_value.get("apiKey") or "")
        _save_socket_attachment(websocket, attachment)
        install_runtime_ai_config(config_value)
        return attachment

    def _refresh_world_clients(self, world) -> None:
        main_clients = set()
        media_clients = set()
        for websocket in self.ctx.get_websockets():
            attachment = _socket_attachment(websocket)
            if attachment.get("userId") != world.owner_id:
                continue
            socket_id = attachment.get("socketId")
            if not isinstance(socket_id, str) or not socket_id:
                continue
            role = attachment.get("role")
            adapter = _HibernatingSocketAdapter(websocket, socket_id)
            if role == "main":
                main_clients.add(adapter)
            elif role == "media" and attachment.get("worldId") == world.world_id:
                media_clients.add(adapter)
        world.clients = main_clients
        world.media_clients = media_clients

    async def fetch(self, request):
        _apply_runtime_bindings(self.env)
        if not _is_websocket(request):
            return Response("WebSocket upgrade required", status=426)
        protocols = _requested_protocols(request)
        if "arcade.v1" not in protocols:
            return Response("arcade.v1 subprotocol required", status=400)

        ticket = _ticket_from_request(request)
        user_id = await self.manager.resolve_ticket(ticket)
        if user_id is None:
            return Response("session_invalid", status=401)
        if WebSocketPair is None:
            return Response("WebSocketPair unavailable", status=500)

        client, server = WebSocketPair.new().object_values()
        path = urlsplit(request.url).path
        role = "pending_media" if path.endswith("/media") else "main"
        attachment = {
            "version": _SOCKET_ATTACHMENT_VERSION,
            "socketId": secrets.token_urlsafe(12),
            "userId": user_id,
            "role": role,
        }
        _save_socket_attachment(server, attachment)
        self.ctx.acceptWebSocket(server)

        return Response(
            None,
            status=101,
            headers={"Sec-WebSocket-Protocol": "arcade.v1"},
            web_socket=client,
        )

    async def _handle_pending_media(self, websocket, attachment: dict, message) -> None:
        if not isinstance(message, str):
            websocket.close(1002, "invalid_media_open")
            return
        try:
            parsed = json.loads(message)
        except json.JSONDecodeError:
            websocket.close(1002, "invalid_media_open")
            return
        if (
            not isinstance(parsed, dict)
            or parsed.get("type") != "open_media"
            or not isinstance(parsed.get("grant"), str)
            or not parsed["grant"]
        ):
            websocket.close(4005, "media_grant_invalid")
            return

        user_id = attachment.get("userId")
        if not isinstance(user_id, str):
            websocket.close(1008, "session_invalid")
            return
        world = await self._load_world(user_id)
        if parsed["grant"] not in world.media_grants:
            websocket.close(4005, "media_grant_invalid")
            return

        updated = dict(attachment)
        updated["role"] = "media"
        updated["worldId"] = world.world_id
        updated.pop("apiKey", None)
        _save_socket_attachment(websocket, updated)
        self._refresh_world_clients(world)

    async def _handle_main_message(self, websocket, attachment: dict, raw: str) -> None:
        user_id = attachment.get("userId")
        if not isinstance(user_id, str) or not user_id:
            websocket.close(1008, "session_invalid")
            return

        world = await self._load_world(user_id)
        self._refresh_world_clients(world)
        socket_id = attachment.get("socketId")
        if not isinstance(socket_id, str) or not socket_id:
            websocket.close(1008, "session_invalid")
            return
        adapter = _HibernatingSocketAdapter(websocket, socket_id)
        before = world_snapshot_json(world)

        await _prefetch_for_arcade_message(self.env, raw)
        try:
            message = json.loads(raw)
        except json.JSONDecodeError:
            await world.send_direct(adapter, error_message("bad_request", "Invalid JSON"))
            return
        if not isinstance(message, dict):
            await world.send_direct(
                adapter,
                error_message("bad_request", "message must be an object"),
            )
            return

        attachment = await self._capture_ai_settings(websocket, attachment, message)

        if message.get("type") == "reset_my_web_world":
            locale = message.get("locale") if isinstance(message.get("locale"), str) else None
            world = await self.manager.reset_world(user_id, locale)
            self._refresh_world_clients(world)
            await self._persist_world(world, force=True)
            await world.send_direct(
                adapter,
                {"type": "web_world_reset_ack", "worldId": world.world_id},
            )
            await world.send_direct(
                adapter,
                {
                    "type": "world_created",
                    "world": world.world_payload(),
                    "session": {"isAdmin": True},
                },
            )
            return

        await world.handle_client_message(adapter, message)
        await _drain_world_tasks(world)
        await self._persist_world(world, before=before)

    async def webSocketMessage(self, websocket, message):
        _apply_runtime_bindings(self.env)
        attachment = _socket_attachment(websocket)
        role = attachment.get("role")
        manager_token = bind_world_manager(self.manager)
        loader_token = live_pack.bind_runtime_loader(
            lambda: _load_live_core_from_r2(self.env)
        )
        try:
            if role == "pending_media":
                await self._handle_pending_media(websocket, attachment, message)
                return
            if role == "media":
                # Media is server-to-browser. Client frames are intentionally ignored.
                return
            if role != "main" or not isinstance(message, str):
                websocket.close(1002, "invalid_arcade_message")
                return

            await self._install_ai_for_socket(attachment)
            await self._handle_main_message(websocket, attachment, message)
        except Exception as exc:
            print(f"[arcade] hibernation message error: {exc}")
            try:
                websocket.close(1011, "arcade_runtime_error")
            except Exception:
                pass
        finally:
            clear_runtime_ai_config()
            live_pack.reset_runtime_loader(loader_token)
            reset_world_manager(manager_token)

    async def webSocketClose(self, websocket, code, reason, was_clean):
        # With compatibility_date >= 2026-04-07 Cloudflare automatically
        # replies to peer Close frames. No world state needs to be persisted for
        # connection membership; ctx.get_websockets() is the source of truth.
        try:
            websocket.close(code, reason)
        except Exception:
            pass

    async def webSocketError(self, websocket, error):
        print(f"[arcade] WebSocket error: {error}")


class Default(WorkerEntrypoint):
    """Route API, R2 assets, and frontend traffic to the correct service."""

    async def fetch(self, request):
        _apply_runtime_bindings(self.env)
        path = urlsplit(request.url).path

        if path == _R2_MODEL_PATH:
            return await _serve_r2_model(self.env, request)

        if _is_websocket(request) and path.startswith("/api/arcade/web/v1"):
            ticket = _ticket_from_request(request)
            user_id = await _EDGE_TICKET_MANAGER.resolve_ticket(ticket)
            if user_id is None:
                return Response("session_invalid", status=401)
            stub = self.env.NORI_ARCADE.getByName(_durable_object_name(user_id))
            return await stub.fetch(request)

        if path.startswith("/api/"):
            return await asgi.fetch(_cloudflare_asgi_app, request, self.env, self.ctx)

        return await self.env.ASSETS.fetch(request)
