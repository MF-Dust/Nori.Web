"""Black-box checks for the verified local Arcade compatibility contract."""

from __future__ import annotations

import asyncio
import json
import threading
import time
from typing import Any, Dict, Tuple

import httpx
import uvicorn
import websockets

from server import app

HOST = "127.0.0.1"
PORT = 4179
HTTP = f"http://{HOST}:{PORT}"
WS = f"ws://{HOST}:{PORT}/api/arcade/web/v1"
MEDIA_WS = f"ws://{HOST}:{PORT}/api/arcade/web/v1/media"


def run_server() -> None:
    uvicorn.run(app, host=HOST, port=PORT, log_level="warning")


def assert_runtime_transition(message: Dict[str, Any]) -> None:
    assert message["type"] == "runtime_transition"
    assert isinstance(message["worldId"], str)
    assert isinstance(message["cartridgeId"], str)
    assert isinstance(message["version"], int)
    transition = message["transition"]
    assert isinstance(transition["actor"], str)
    assert isinstance(transition["cmd"], dict) and isinstance(transition["cmd"]["type"], str)
    assert isinstance(transition["patches"], list)
    assert isinstance(transition["events"], list)
    for index, event in enumerate(transition["events"]):
        assert event["version"] == message["version"]
        assert event["index"] == index


async def receive_json(socket: Any, *, timeout: float = 5) -> Dict[str, Any]:
    message = await asyncio.wait_for(socket.recv(), timeout)
    assert isinstance(message, str), f"expected text frame, received {type(message)}"
    return json.loads(message)


async def test_rest() -> str:
    async with httpx.AsyncClient() as client:
        entry = await client.get(f"{HTTP}/api/entry-status")
        assert entry.status_code == 200
        assert entry.json()["status"] == "ok"
        assert isinstance(entry.json()["machineId"], str)

        session = await client.get(f"{HTTP}/api/auth/get-session")
        assert session.status_code == 200
        assert session.json()["session"]["userId"] == "guest-user-001"

        ticket = await client.post(f"{HTTP}/api/arcade/ws-ticket")
        assert ticket.status_code == 200
        ticket_value = ticket.json()["ticket"]
        assert isinstance(ticket_value, str) and ticket_value

        convex_ticket = await client.post(
            f"{HTTP}/api/mutation",
            json={
                "path": "auth/wsTickets:issueWebUserWsTicket",
                "format": "convex_encoded_json",
                "args": [{}],
            },
        )
        assert convex_ticket.status_code == 200
        assert convex_ticket.json()["status"] == "success"

        static = await client.get(f"{HTTP}/assets/NormalApp-Cn6agT0F.js")
        assert static.status_code == 200
        assert "Local ticket request" in static.text
    return ticket_value


async def test_arcade(ticket: str) -> None:
    protocols = ["arcade.v1", f"ticket.{ticket}"]
    async with websockets.connect(WS, subprotocols=protocols) as socket:
        assert socket.subprotocol == "arcade.v1"
        await socket.send(json.dumps({"type": "open_my_web_world", "locale": "en"}))
        joined = await receive_json(socket)
        assert joined["type"] == "world_joined"
        world = joined["world"]
        world_id = world["worldId"]
        chat_runtime = next(item for item in world["mountedCartridges"] if item["cartridgeId"] == "chat")["runtimes"][0]
        assert chat_runtime["headVersion"] == 0
        grant = joined["session"]["mediaGrant"]

        async with websockets.connect(MEDIA_WS, subprotocols=protocols) as media:
            assert media.subprotocol == "arcade.v1"
            await media.send(json.dumps({"type": "open_media", "grant": grant}))

            await socket.send(
                json.dumps(
                    {
                        "type": "dispatch",
                        "actor": "player",
                        "cartridgeId": "chat",
                        "expectedHeadVersion": 0,
                        "requestId": "chat-player-1",
                        "cmd": {"type": "playerMessage", "text": "hello Nori"},
                    }
                )
            )
            first = await receive_json(socket)
            assert_runtime_transition(first)
            assert first["cartridgeId"] == "chat"
            assert first["transition"]["cmd"]["type"] == "playerMessage"
            advanced = await receive_json(socket)
            assert advanced["type"] == "visibility_fence_advanced"
            ack = await receive_json(socket)
            assert ack == {
                "type": "dispatch_ack",
                "worldId": world_id,
                "cartridgeId": "chat",
                "requestId": "chat-player-1",
                "success": True,
                "committed": True,
                "committedVersion": 1,
                "headVersion": 1,
                "result": {"messageId": "msg_1"},
            }

            seen_agent_transition = False
            seen_media = False
            end = time.monotonic() + 6
            while time.monotonic() < end and not (seen_agent_transition and seen_media):
                socket_task = asyncio.create_task(socket.recv())
                media_task = asyncio.create_task(media.recv())
                done, pending = await asyncio.wait({socket_task, media_task}, timeout=1.2, return_when=asyncio.FIRST_COMPLETED)
                for task in pending:
                    task.cancel()
                if not done:
                    continue
                completed = next(iter(done))
                payload = completed.result()
                if completed is media_task:
                    assert isinstance(payload, bytes)
                    assert payload[0] == 1 and payload[1] == 1 and len(payload) >= 48
                    seen_media = True
                else:
                    parsed = json.loads(payload)
                    if parsed["type"] == "runtime_transition":
                        assert_runtime_transition(parsed)
                        if parsed["transition"]["cmd"]["type"] == "operationStarted":
                            seen_agent_transition = True
            assert seen_agent_transition
            assert seen_media

        # Mount shape is strict in the shipped parser: it includes transition and runtimes.
        await socket.send(json.dumps({"type": "mount_cartridge", "cartridgeId": "pictionary", "requestId": "mount-pictionary"}))
        mounted = await receive_json(socket)
        assert mounted["type"] == "cartridge_mounted"
        assert mounted["transition"] == "created"
        assert mounted["runtimes"][0]["headVersion"] == 0
        mounted_ack = await receive_json(socket)
        assert mounted_ack["type"] == "cartridge_mounted_ack"
        assert mounted_ack["transition"] == "created"

        await socket.send(
            json.dumps(
                {
                    "type": "dispatch",
                    "actor": "player",
                    "cartridgeId": "pictionary",
                    "expectedHeadVersion": 0,
                    "requestId": "pictionary-start",
                    "cmd": {"type": "startSession", "atMs": int(time.time() * 1000), "settings": {"sessionDurationMs": 60000, "locale": "en"}},
                }
            )
        )
        transition = await receive_json(socket)
        assert_runtime_transition(transition)
        assert transition["cartridgeId"] == "pictionary"
        await receive_json(socket)  # visibility_fence_advanced
        pictionary_ack = await receive_json(socket)
        assert pictionary_ack["success"] is True and pictionary_ack["committedVersion"] == 1

        await socket.send(json.dumps({"type": "ping"}))
        pong = await receive_json(socket)
        assert pong["type"] == "pong" and isinstance(pong["now"], int)


async def run() -> None:
    ticket = await test_rest()
    await test_arcade(ticket)


if __name__ == "__main__":
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    time.sleep(0.8)
    asyncio.run(run())
    print("[ok] REST, ticket, Arcade JSON protocol, and media framing verified")
