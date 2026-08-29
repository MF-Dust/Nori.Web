"""Stable Cloudflare Worker entrypoint.

Wrangler's build hook populates this directory with the current Nori.Web
runtime before each dev/deploy invocation. Keeping the module root isolated
prevents tests, scraper tools, frontend binaries, and local virtual
environments from being counted against the Worker script-size limit.

Cloudflare's DurableObjectState WebSocket enumeration API is exposed as
``getWebSockets`` by the production runtime. Some Python-facing documentation
and SDK surfaces have also used ``get_websockets``. Keep the compatibility
bridge here so the hibernation runtime does not depend on one spelling.
"""

import json

import worker_runtime as _runtime

Default = _runtime.Default


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


class NoriArcadeSession(_runtime.NoriArcadeSession):
    """Runtime-compatible and persistence-efficient Arcade Durable Object."""

    def __init__(self, ctx, env):
        super().__init__(ctx, env)
        self._persisted_world_snapshot: str | None = None

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
        # snapshot already stored in SQLite. The base implementation serializes
        # both before and after every message; this removes the pre-message copy
        # and avoids redundant writes when a message does not mutate the world.
        snapshot = _runtime.world_snapshot_json(world)
        if force or snapshot != self._persisted_world_snapshot:
            await self.ctx.storage.put(_runtime._DO_WORLD_STATE_KEY, snapshot)
            self._persisted_world_snapshot = snapshot
        return snapshot

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

        await _runtime._prefetch_for_arcade_message(self.env, raw)
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

        attachment = await self._capture_ai_settings(websocket, attachment, message)

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


__all__ = ["Default", "NoriArcadeSession"]