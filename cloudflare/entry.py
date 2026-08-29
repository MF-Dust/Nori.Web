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
    """Runtime-compatible hibernating Arcade Durable Object."""

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


__all__ = ["Default", "NoriArcadeSession"]
