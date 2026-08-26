"""NoriOS local compatibility server.

Run with `python server.py` and open http://127.0.0.1:4173.
"""

from __future__ import annotations

import json
import mimetypes
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from backend.auth import auth_router, get_current_user_id
from backend.config import DEBUG, HOST, PORT, PUBLIC_DIR
from backend.protocol import error_message
from backend.world_session import WORLD_MANAGER

mimetypes.add_type("audio/mp4", ".m4a")
mimetypes.add_type("audio/mpeg", ".mp3")
mimetypes.add_type("audio/wav", ".wav")
mimetypes.add_type("audio/ogg", ".ogg")
mimetypes.add_type("application/octet-stream", ".moc3")
mimetypes.add_type("application/javascript", ".worklet")
mimetypes.add_type("model/gltf-binary", ".glb")

app = FastAPI(title="NoriOS Local Compatibility Server", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(auth_router)

MACHINE_ID = os.getenv("NORI_MACHINE_ID", "nori-local")


@app.get("/api/entry-status")
async def entry_status() -> Dict[str, str]:
    # Matches the public unauthenticated endpoint's useful payload shape.
    return {"status": "ok", "machineId": MACHINE_ID}


@app.get("/api/version")
async def version() -> Dict[str, str]:
    return {"version": "2.0.0", "service": "NoriOS local compatibility server"}


@app.post("/api/arcade/ws-ticket")
async def issue_ws_ticket(request: Request) -> Dict[str, str]:
    user_id = get_current_user_id(request)
    if not user_id:
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return {"ticket": await WORLD_MANAGER.issue_ticket(user_id)}


async def _convex_local_response(request: Request) -> Dict[str, Any]:
    """Minimal Convex HTTP compatibility for direct local integrations.

    The restored Arcade bridge uses `/api/arcade/ws-ticket`; this endpoint
    still supports the publicly visible ticket mutation body for tools that
    invoke it directly.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}
    path = body.get("path") if isinstance(body, dict) else None
    if path == "auth/wsTickets:issueWebUserWsTicket":
        user_id = get_current_user_id(request)
        if not user_id:
            return {"status": "error", "errorMessage": "Unauthorized", "logLines": []}
        return {"status": "success", "value": {"ticket": await WORLD_MANAGER.issue_ticket(user_id)}, "logLines": []}
    if path == "auth/otpEmail:preflightOtpSend":
        return {"status": "success", "value": None, "logLines": []}
    return {"status": "error", "errorMessage": f"Unsupported local Convex function: {path or '<missing>'}", "logLines": []}


@app.post("/api/mutation")
@app.post("/api/query")
@app.post("/api/action")
@app.post("/api/function")
async def convex_function(request: Request):
    return await _convex_local_response(request)


@app.post("/api/query_ts")
async def convex_timestamp() -> Dict[str, str]:
    return {"ts": "0"}


@app.post("/api/query_at_ts")
async def convex_query_at_timestamp(request: Request):
    return await _convex_local_response(request)


def _ticket_from_protocols(websocket: WebSocket) -> Optional[str]:
    for protocol in websocket.scope.get("subprotocols", []) or []:
        if protocol.startswith("ticket."):
            return protocol[len("ticket.") :]
    return None


async def _accept_arcade_socket(websocket: WebSocket) -> Optional[str]:
    protocols = websocket.scope.get("subprotocols", []) or []
    ticket = _ticket_from_protocols(websocket)
    if "arcade.v1" not in protocols:
        await websocket.close(code=1002, reason="arcade.v1 subprotocol required")
        return None
    user_id = await WORLD_MANAGER.resolve_ticket(ticket)
    if user_id is None:
        await websocket.close(code=1008, reason="session_invalid")
        return None
    await websocket.accept(subprotocol="arcade.v1")
    return user_id


@app.websocket("/api/arcade/web/v1")
async def arcade_websocket(websocket: WebSocket) -> None:
    user_id = await _accept_arcade_socket(websocket)
    if user_id is None:
        return
    world = await WORLD_MANAGER.get_world(user_id)
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
            if message.get("type") == "reset_my_web_world":
                new_world = await WORLD_MANAGER.reset_world(user_id, message.get("locale") if isinstance(message.get("locale"), str) else None)
                await world.remove_client(websocket)
                world = new_world
                await world.add_client(websocket)
                await world.send_direct(websocket, {"type": "web_world_reset_ack", "worldId": world.world_id})
                # The client parser requires world_created.session to contain
                # only isAdmin (mediaGrant belongs to world_joined).
                await world.send_direct(websocket, {"type": "world_created", "world": world.world_payload(), "session": {"isAdmin": True}})
                continue
            await world.handle_client_message(websocket, message)
    except WebSocketDisconnect:
        pass
    finally:
        await world.remove_client(websocket)


@app.websocket("/api/arcade/web/v1/media")
async def arcade_media_websocket(websocket: WebSocket) -> None:
    user_id = await _accept_arcade_socket(websocket)
    if user_id is None:
        return
    world = None
    try:
        raw = await websocket.receive_text()
        message = json.loads(raw)
        if not isinstance(message, dict) or message.get("type") != "open_media" or not isinstance(message.get("grant"), str) or not message["grant"]:
            await websocket.close(code=4005, reason="media_grant_invalid")
            return
        world = await WORLD_MANAGER.world_for_grant(user_id, message["grant"])
        if world is None:
            await websocket.close(code=4005, reason="media_grant_invalid")
            return
        await world.add_media_client(websocket)
        # The public media transport is server-push only. Keep the socket alive
        # and consume any future client frames without rebroadcasting them.
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


def _safe_static_path(full_path: str) -> Optional[Path]:
    requested = (PUBLIC_DIR / full_path).resolve()
    try:
        requested.relative_to(PUBLIC_DIR.resolve())
    except ValueError:
        return None
    return requested


@app.get("/{full_path:path}")
async def serve_static_or_spa(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    file_path = _safe_static_path(full_path)
    if file_path and file_path.is_file():
        media_type, _ = mimetypes.guess_type(str(file_path))
        return FileResponse(
            file_path,
            media_type=media_type or "application/octet-stream",
            headers={"Cache-Control": "no-cache" if file_path.suffix == ".html" else "public, max-age=31536000, immutable"},
        )
    index = PUBLIC_DIR / "index.html"
    if index.is_file():
        return FileResponse(index, media_type="text/html; charset=utf-8", headers={"Cache-Control": "no-cache"})
    raise HTTPException(status_code=404, detail="Not found")


if __name__ == "__main__":
    import uvicorn

    print(f"NoriOS local compatibility server: http://{HOST}:{PORT}")
    print(f"Arcade WebSocket: ws://{HOST}:{PORT}/api/arcade/web/v1")
    uvicorn.run("server:app", host=HOST, port=PORT, reload=DEBUG)
