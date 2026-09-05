"""Stable Cloudflare Worker entrypoint.

Wrangler's build hook populates this directory with the current Nori.Web
runtime before each dev/deploy invocation. Keeping the module root isolated
prevents tests, scraper tools, frontend binaries, and local virtual
environments from being counted against the Worker script-size limit.

Cloudflare's DurableObjectState WebSocket enumeration API is exposed as
``getWebSockets`` by the production runtime. Some Python-facing documentation
and SDK surfaces have also used ``get_websockets``. Keep the compatibility
bridge here so the hibernation runtime does not depend on one spelling.

The local compatibility server intentionally keeps small presentation delays so
its demo/game pacing feels natural. Durable Objects are billed by active wall
clock time, so the Cloudflare entrypoint specializes those follow-up methods:
text-mode chat settles immediately while configured TTS may synthesize in the
background, and game follow-ups keep ordering without artificial sleeps.
"""

import json

import worker_runtime as _runtime
from backend.cartridges.chat import ChatCartridge as _ChatCartridge
from backend.services.ai_event_bridge import install_ai_event_bridge as _install_settings_bridge
from backend.services.tts_runtime_config import (
    clear_runtime_tts_config as _clear_runtime_tts_config,
    get_runtime_tts_config as _get_runtime_tts_config,
    install_runtime_tts_config as _install_runtime_tts_config,
    sanitize_runtime_tts_config as _sanitize_runtime_tts_config,
)
from backend.session.world import WorldSession as _WorldSession


_DO_TTS_CONFIG_KEY = "nori:tts-public:v1"
_EDGE_CONVEX_PATHS = {
    "/api/query",
    "/api/mutation",
    "/api/action",
    "/api/function",
    "/api/query_at_ts",
}

# The local server installs this from server.py. Durable Object WebSocket
# traffic bypasses FastAPI, so production must install the same event/TTS hooks
# at the Worker entrypoint as well.
_install_settings_bridge()


async def _serve_edge_convex_api(path: str, request):
    """Serve the tiny Convex compatibility surface without FastAPI/ASGI."""
    method = request.method.upper()
    if path == "/api/query_ts" and method == "POST":
        return _runtime._json_response({"ts": "0"})
    if path not in _EDGE_CONVEX_PATHS or method != "POST":
        return None

    try:
        body = await request.json()
    except Exception:
        body = {}
    function_path = body.get("path") if isinstance(body, dict) else None

    if function_path == "auth/wsTickets:issueWebUserWsTicket":
        ticket = await _runtime._EDGE_TICKET_MANAGER.issue_ticket(
            _runtime._EDGE_GUEST_USER_ID
        )
        return _runtime._json_response(
            {"status": "success", "value": {"ticket": ticket}, "logLines": []}
        )

    if function_path == "auth/otpEmail:preflightOtpSend":
        return _runtime._json_response(
            {"status": "success", "value": None, "logLines": []}
        )

    return _runtime._json_response(
        {
            "status": "error",
            "errorMessage": (
                "Unsupported local Convex function: "
                f"{function_path or '<missing>'}"
            ),
            "logLines": [],
        }
    )


class Default(_runtime.Default):
    """Keep bootstrap and Convex compatibility requests off the ASGI cold path."""

    async def fetch(self, request):
        path = _runtime.urlsplit(request.url).path
        if path == "/api/query_ts" or path in _EDGE_CONVEX_PATHS:
            # Ticket signatures must use the runtime-bound SECRET_KEY.
            _runtime._apply_runtime_bindings(self.env)
            response = await _serve_edge_convex_api(path, request)
            if response is not None:
                return response
        return await super().fetch(request)


def _runtime_websockets(ctx):
    getter = getattr(ctx, "getWebSockets", None)
    if callable(getter):
        return getter()

    # Compatibility fallback for Python SDK/runtime variants that expose a
    # snake_case alias.
    getter = getattr(ctx, "get_websockets", None)
    if callable(getter):
        return getter()

    raise AttributeError(
        "DurableObjectState exposes neither getWebSockets nor get_websockets"
    )


def _cloudflare_archive_list(section: str):
    """Shallow-copy a resident R2 section without duplicating artifact trees."""
    return list(_runtime.live_pack._section_view(section))


# The local compatibility API intentionally returns defensive deep copies.
# Inside a Cloudflare isolate these consumers are trusted read-only paths; a
# detached list shell is enough for Mail's runtime append behavior while the
# large archived dict/string graph remains single-copy in memory.
_runtime.live_pack.mail_artifacts = lambda: _cloudflare_archive_list("mail_artifacts")
_runtime.live_pack.file_artifacts = lambda: _cloudflare_archive_list("file_artifacts")
_runtime.live_pack.signal_thread_artifacts = lambda: _cloudflare_archive_list(
    "signal_thread_artifacts"
)
_runtime.live_pack.signal_message_artifacts = lambda: _cloudflare_archive_list(
    "signal_message_artifacts"
)


async def _prefetch_parsed_arcade_message(env, message: dict) -> None:
    """Populate lazy R2 sections from an already-decoded Arcade message."""
    if message.get("type") != "event":
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
            await _runtime._ensure_live_section(env, section)
        return

    if channel == "manifold.artifacts.fetch":
        if payload.get("artifactType") == "browser_page":
            lookup_key = payload.get("lookup_key")
            if isinstance(lookup_key, str) and lookup_key:
                await _runtime._ensure_browser_lookup(env, lookup_key)
        return

    if channel == "manifold.bounty.submit":
        if payload.get("fileId"):
            await _runtime._ensure_live_section(env, "file_artifacts")
        url = payload.get("url")
        if isinstance(url, str) and url:
            await _runtime._ensure_browser_lookup(env, url, allow_contains=True)


def _prune_transition_history(world) -> None:
    """Drop transition bodies once their wire messages and snapshot are built."""
    for cartridge in world.cartridges.values():
        cartridge.transitions.clear()


def _public_tts_config(config_value: dict) -> dict:
    return {key: value for key, value in config_value.items() if key != "apiKey"}


async def _cloudflare_run_chat_reply(self, user_text: str) -> None:
    """Generate a reply without billing presentation-only wall-clock delays."""
    chat = self.cartridges.get("chat")
    if not isinstance(chat, _ChatCartridge):
        return

    # The local runtime inserts 150 ms of theatrical latency before starting
    # generation. It has no protocol meaning and only extends DO active time.
    emotion, reply = await chat.generate_reply(user_text)
    operation_id, message_id, commands = chat.build_agent_turn(reply, emotion)
    for command in commands:
        await self._dispatch_internal("chat", "agent", command)

    # Production live-pack worlds default to text presentation. Text is already
    # visible after ingestBlock, but an explicitly enabled browser TTS provider
    # still gets a synthesis task. Disabled TTS keeps the old zero-audio fast
    # path and avoids generating the compatibility tone.
    if chat.state.get("presentationMode") == "text":
        if _get_runtime_tts_config().get("enabled") is True:
            self._spawn(self._stream_chat_fallback(operation_id, message_id, reply))
        await self._dispatch_internal(
            "chat",
            "agent",
            {
                "type": "operationSettled",
                "operationId": operation_id,
                "outcome": "completed",
            },
        )
        return

    # Audio mode keeps the existing fallback/audio-ack timeout behavior. The
    # stream hook is replaced by the configured TTS bridge when enabled.
    self._spawn(self._stream_chat_fallback(operation_id, message_id, reply))
    self._spawn(self._ensure_chat_progress(operation_id))


async def _cloudflare_settle_chat_after_audio(self, operation_id: str) -> None:
    """Audio completion is already an acknowledgement; settle without 100 ms."""
    await self._dispatch_internal(
        "chat",
        "agent",
        {
            "type": "operationSettled",
            "operationId": operation_id,
            "outcome": "completed",
        },
    )


async def _cloudflare_run_agent_turns(self, cartridge_id: str) -> None:
    """Preserve ordered agent turns without 350 ms of billed delay per turn."""
    for _ in range(8):
        # Yield cooperatively without scheduling a real timer. This preserves
        # event-loop fairness while avoiding presentation-only wall time.
        await _runtime.asyncio.sleep(0)
        cartridge = self.cartridges.get(cartridge_id)
        if cartridge is None:
            return
        command = getattr(cartridge, "agent_next_command", lambda: None)()
        if not command:
            return
        commit = await self._dispatch_internal(cartridge_id, "agent", command)
        if commit is None:
            return


async def _cloudflare_start_next_pictionary_round(self) -> None:
    """Start the next valid round without a presentation-only 1.2 s wait."""
    cartridge = self.cartridges.get("pictionary")
    if cartridge is None:
        return
    game = cartridge.state.get("gameState")
    if (
        isinstance(game, dict)
        and game.get("phase") == "PLAYING"
        and game.get("round", {}).get("status") != "active"
    ):
        await self._dispatch_internal(
            "pictionary",
            "agent",
            {"type": "startNextRound", "atMs": int(_runtime.time.time() * 1000)},
        )


# Apply pacing specialization only in the Cloudflare build entrypoint. Local
# Uvicorn continues using backend.session.world's original human-facing delays.
_WorldSession._run_chat_reply = _cloudflare_run_chat_reply
_WorldSession._settle_chat_after_audio = _cloudflare_settle_chat_after_audio
_WorldSession._run_agent_turns = _cloudflare_run_agent_turns
_WorldSession._start_next_pictionary_round = _cloudflare_start_next_pictionary_round


class NoriArcadeSession(_runtime.NoriArcadeSession):
    """Runtime-compatible and persistence-efficient Arcade Durable Object."""

    def __init__(self, ctx, env):
        super().__init__(ctx, env)
        self._persisted_world_snapshot: str | None = None
        self._public_tts_config_cache: dict | None = None

    async def _load_world(self, user_id: str):
        world = self.manager.worlds_by_user.get(user_id)
        if world is not None:
            return world

        async with self._world_load_lock:
            world = self.manager.worlds_by_user.get(user_id)
            if world is not None:
                return world

            if not await _runtime.live_pack.ensure_runtime_pack():
                print("[arcade] live-world archive unavailable; continuing with mock data")

            raw = await self.ctx.storage.get(_runtime._DO_WORLD_STATE_KEY)
            world = _runtime.world_from_snapshot_json(raw)
            if world is None or world.owner_id != user_id:
                self._persisted_world_snapshot = None
                world = await self.manager.get_world(user_id)
            else:
                self._persisted_world_snapshot = raw if isinstance(raw, str) else None
                self.manager.worlds_by_user[user_id] = world
                print(f"[arcade] restored hibernated world {world.world_id}")
            return world

    async def _persist_world(self, world, *, force: bool = False, before=None) -> str:
        # Serialize once after message processing and compare against the exact
        # snapshot already stored in SQLite. The JSON serializer references the
        # live cartridge states directly, avoiding a second full world graph.
        snapshot = _runtime.world_snapshot_json(world)

        # Transition bodies have already been emitted over the wire and are not
        # part of durable snapshots. Release them before awaiting SQLite I/O so
        # a long-lived isolate does not accumulate one deep-copied transition
        # per commit.
        _prune_transition_history(world)

        if force or snapshot != self._persisted_world_snapshot:
            await self.ctx.storage.put(_runtime._DO_WORLD_STATE_KEY, snapshot)
            self._persisted_world_snapshot = snapshot
        return snapshot

    async def _load_public_tts_config(self) -> dict:
        if self._public_tts_config_cache is not None:
            return dict(self._public_tts_config_cache)
        try:
            raw = await self.ctx.storage.get(_DO_TTS_CONFIG_KEY)
        except Exception:
            raw = None
        if isinstance(raw, str) and raw:
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = {}
        else:
            parsed = {}
        self._public_tts_config_cache = parsed if isinstance(parsed, dict) else {}
        return dict(self._public_tts_config_cache)

    async def _persist_public_tts_config(self, config_value: dict) -> None:
        public = _public_tts_config(config_value)
        if self._public_tts_config_cache == public:
            return
        raw = json.dumps(public, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        await self.ctx.storage.put(_DO_TTS_CONFIG_KEY, raw)
        self._public_tts_config_cache = public

    async def _capture_tts_settings(self, websocket, attachment: dict, message: dict) -> dict:
        if message.get("type") != "event":
            return attachment
        channel = message.get("channel")
        payload = message.get("payload")
        payload = payload if isinstance(payload, dict) else {}
        if channel == "nori.tts.config":
            raw_config = payload
        elif channel == "nori.tts.test" and isinstance(payload.get("config"), dict):
            raw_config = payload["config"]
        else:
            return attachment

        sanitized = _sanitize_runtime_tts_config(raw_config)
        await self._persist_public_tts_config(sanitized)
        updated = dict(attachment)
        api_key = sanitized.get("apiKey")
        old_key = updated.get("ttsApiKey")
        if isinstance(api_key, str) and api_key:
            updated["ttsApiKey"] = api_key
        else:
            updated.pop("ttsApiKey", None)
        if old_key != updated.get("ttsApiKey"):
            _runtime._save_socket_attachment(websocket, updated)
        return updated

    async def _install_tts_for_socket(self, attachment: dict) -> None:
        public = await self._load_public_tts_config()
        config_value = dict(public)
        api_key = attachment.get("ttsApiKey")
        if isinstance(api_key, str) and api_key:
            config_value["apiKey"] = api_key
        _install_runtime_tts_config(config_value)

    def _refresh_world_clients(self, world) -> None:
        main_clients = set()
        media_clients = set()
        for websocket in _runtime_websockets(self.ctx):
            attachment = _runtime._socket_attachment(websocket)
            if attachment.get("userId") != world.owner_id:
                continue
            socket_id = attachment.get("socketId")
            if not isinstance(socket_id, str) or not socket_id:
                continue
            role = attachment.get("role")
            adapter = _runtime._HibernatingSocketAdapter(websocket, socket_id)
            if role == "main":
                main_clients.add(adapter)
            elif role == "media" and attachment.get("worldId") == world.world_id:
                media_clients.add(adapter)
        world.clients = main_clients
        world.media_clients = media_clients

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
        adapter = _runtime._HibernatingSocketAdapter(websocket, socket_id)

        # Decode once. The old path parsed here and then parsed the same raw
        # payload again inside `_prefetch_for_arcade_message`.
        try:
            message = json.loads(raw)
        except json.JSONDecodeError:
            await world.send_direct(
                adapter,
                _runtime.error_message("bad_request", "Invalid JSON"),
            )
            return
        if not isinstance(message, dict):
            await world.send_direct(
                adapter,
                _runtime.error_message("bad_request", "message must be an object"),
            )
            return

        await _prefetch_parsed_arcade_message(self.env, message)
        attachment = await self._capture_ai_settings(websocket, attachment, message)
        attachment = await self._capture_tts_settings(websocket, attachment, message)
        await self._install_tts_for_socket(attachment)

        if message.get("type") == "reset_my_web_world":
            locale = message.get("locale") if isinstance(message.get("locale"), str) else None
            world = await self.manager.reset_world(user_id, locale)
            self._persisted_world_snapshot = None
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
        await _runtime._drain_world_tasks(world)
        await self._persist_world(world)

    async def webSocketMessage(self, websocket, message):
        try:
            return await super().webSocketMessage(websocket, message)
        finally:
            _clear_runtime_tts_config()


__all__ = ["Default", "NoriArcadeSession"]