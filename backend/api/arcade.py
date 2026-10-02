"""Arcade main and media WebSocket endpoints."""

from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..core.protocol import error_message
from ..services.ai_runtime_config import clear_runtime_ai_config, install_runtime_ai_config
from ..services.tts_runtime_config import clear_runtime_tts_config, install_runtime_tts_config
from ..session.manager import get_world_manager
from ..virtual_apps import live_pack

arcade_ws_router = APIRouter(tags=["arcade_ws"])


def _ticket_from_protocols(websocket: WebSocket) -> Optional[str]:
    for protocol in websocket.scope.get("subprotocols", []) or []:
        if protocol.startswith("ticket."):
            return protocol[len("ticket.") :]
    return None


def _is_player_chat_dispatch(message: dict) -> bool:
    return (
        message.get("type") == "dispatch"
        and message.get("cartridgeId") == "chat"
        and message.get("actor") == "player"
        and isinstance(message.get("cmd"), dict)
        and message["cmd"].get("type") == "playerMessage"
    )


def _install_dispatch_ai_config(message: dict) -> None:
    if not _is_player_chat_dispatch(message):
        return
    raw_config = message.pop("noriAiConfig", None)
    if isinstance(raw_config, dict):
        install_runtime_ai_config(raw_config)


def _install_dispatch_tts_config(message: dict) -> None:
    if not _is_player_chat_dispatch(message):
        return
    raw_config = message.pop("noriTtsConfig", None)
    if isinstance(raw_config, dict):
        install_runtime_tts_config(raw_config)


async def _accept_arcade_socket(websocket: WebSocket) -> Optional[str]:
    protocols = websocket.scope.get("subprotocols", []) or []
    ticket = _ticket_from_protocols(websocket)
    if "arcade.v1" not in protocols:
        await websocket.close(code=1002, reason="arcade.v1 subprotocol required")
        return None
    user_id = await get_world_manager().resolve_ticket(ticket)
    if user_id is None:
        await websocket.close(code=1008, reason="session_invalid")
        return None
    await websocket.accept(subprotocol="arcade.v1")
    return user_id


@arcade_ws_router.websocket("/api/arcade/web/v1")
async def arcade_websocket(websocket: WebSocket) -> None:
    manager = get_world_manager()
    user_id = await _accept_arcade_socket(websocket)
    if user_id is None:
        return

    # The socket is deliberately accepted before a cold Cloudflare Durable
    # Object downloads/decodes the large R2 live-world archive. This keeps the
    # browser's WebSocket upgrade from timing out while still guaranteeing that
    # the archive is ready before WorldSession builds its default cartridges.
    if not await live_pack.ensure_runtime_pack():
        print("[arcade] live-world archive unavailable; continuing with mock data")

    world = await manager.get_world(user_id)
    await world.add_client(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await world.send_direct(websocket, error_message("bad_request", "Invalid JSON"))
                continue
            if not isinstance(message, dict):
                await world.send_direct(websocket, error_message("bad_request", "message must be an object"))
                continue
            try:
                _install_dispatch_ai_config(message)
                _install_dispatch_tts_config(message)
                if message.get("type") == "reset_my_web_world":
                    new_world = await manager.reset_world(
                        user_id,
                        message.get("locale") if isinstance(message.get("locale"), str) else None,
                        full_unlock=message.get("fullUnlock") is not False,
                    )
                    await world.remove_client(websocket)
                    world = new_world
                    await world.add_client(websocket)
                    await world.send_direct(websocket, {"type": "web_world_reset_ack", "worldId": world.world_id})
                    await world.send_direct(
                        websocket,
                        {"type": "world_created", "world": world.world_payload(), "session": {"isAdmin": True}},
                    )
                    continue
                await world.handle_client_message(websocket, message)
            finally:
                # Child chat tasks capture the current ContextVar when spawned;
                # the receive loop itself must not retain a credential for the
                # next unrelated WebSocket frame.
                clear_runtime_ai_config()
                clear_runtime_tts_config()
    except WebSocketDisconnect:
        pass
    finally:
        await world.remove_client(websocket)


@arcade_ws_router.websocket("/api/arcade/web/v1/media")
async def arcade_media_websocket(websocket: WebSocket) -> None:
    manager = get_world_manager()
    user_id = await _accept_arcade_socket(websocket)
    if user_id is None:
        return
    world = None
    try:
        raw = await websocket.receive_text()
        message = json.loads(raw)
        if (
            not isinstance(message, dict)
            or message.get("type") != "open_media"
            or not isinstance(message.get("grant"), str)
            or not message["grant"]
        ):
            await websocket.close(code=4005, reason="media_grant_invalid")
            return
        world = await manager.world_for_grant(user_id, message["grant"])
        if world is None:
            await websocket.close(code=4005, reason="media_grant_invalid")
            return
        await world.add_media_client(websocket)
        # Keep the socket alive and consume future client frames without rebroadcasting
        while True:
            await websocket.receive()
    except WebSocketDisconnect:
        pass
    except (json.JSONDecodeError, RuntimeError):
        try:
            await websocket.close(code=1002, reason="invalid_media_open")
        except RuntimeError:
            pass
    finally:
        if world is not None:
            await world.remove_client(websocket)
