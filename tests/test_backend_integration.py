"""Black-box checks for the verified local Arcade compatibility contract."""

from __future__ import annotations

import asyncio
import json
import sys
import threading
import time
from pathlib import Path
from typing import Any, Dict, Tuple

import httpx
import uvicorn
import websockets

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

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
        assert session.json()["session"]["userId"].startswith("guest_")

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

        # Mount and verify manifold.web cartridge (unlocks Browser, Messages, Credits, etc.)
        await socket.send(json.dumps({"type": "mount_cartridge", "cartridgeId": "manifold.web", "requestId": "mount-manifold"}))
        mounted_m = await receive_json(socket)
        assert mounted_m["type"] == "cartridge_mounted" and mounted_m["cartridgeId"] == "manifold.web"
        assert bool(mounted_m["runtimes"][0]["state"]["facts"]["system.repaired"])
        mounted_m_ack = await receive_json(socket)
        assert mounted_m_ack["type"] == "cartridge_mounted_ack"

        # Test manifold artifacts request
        await socket.send(json.dumps({"type": "event", "channel": "manifold.artifacts.request", "cartridgeId": "manifold.web", "requestId": "req-art", "payload": {}}))
        art_res = await receive_json(socket)
        assert art_res["type"] == "event" and art_res["channel"] == "manifold.artifacts.response"
        assert art_res["payload"]["ok"] is True and len(art_res["payload"]["artifacts"]) > 0

        # Test manifold chip status (ensuring strict non-null fields)
        await socket.send(json.dumps({"type": "event", "channel": "manifold.chip.status", "cartridgeId": "manifold.web", "requestId": "req-chip", "payload": {}}))
        chip_res = await receive_json(socket)
        assert chip_res["type"] == "event" and chip_res["channel"] == "manifold.chip.status.result"
        assert chip_res["payload"]["capacity"] >= 3  # archived chip honors >= demo value

        await socket.send(json.dumps({"type": "ping"}))
        pong = await receive_json(socket)
        assert pong["type"] == "pong" and isinstance(pong["now"], int)


async def test_browser_isolation() -> None:
    async with httpx.AsyncClient() as a, httpx.AsyncClient() as b:
        user_a = (await a.get(f"{HTTP}/api/auth/get-session")).json()["user"]["id"]
        user_b = (await b.get(f"{HTTP}/api/auth/get-session")).json()["user"]["id"]
        assert user_a != user_b
        ticket_a = (await a.post(f"{HTTP}/api/arcade/ws-ticket")).json()["ticket"]
        ticket_b = (await b.post(f"{HTTP}/api/arcade/ws-ticket")).json()["ticket"]
        protocols_a = ["arcade.v1", f"ticket.{ticket_a}"]
        protocols_b = ["arcade.v1", f"ticket.{ticket_b}"]
        async with (
            websockets.connect(WS, subprotocols=protocols_a) as socket_a,
            websockets.connect(WS, subprotocols=protocols_b) as socket_b,
        ):
            await socket_a.send(json.dumps({"type": "open_my_web_world"}))
            joined_a = await receive_json(socket_a)
            await socket_b.send(json.dumps({"type": "open_my_web_world"}))
            joined_b = await receive_json(socket_b)
            assert joined_a["world"]["worldId"] != joined_b["world"]["worldId"]
            await socket_a.send(json.dumps({
                "type": "dispatch", "actor": "player", "cartridgeId": "chat",
                "expectedHeadVersion": 0, "requestId": "private-message",
                "cmd": {"type": "playerMessage", "text": "only browser A sees this"},
            }))
            while True:
                response = await receive_json(socket_a)
                if response["type"] == "dispatch_ack":
                    assert response["success"]
                    break
            # Any leaked transition would arrive before this pong on B's socket.
            await socket_b.send(json.dumps({"type": "ping"}))
            assert (await receive_json(socket_b))["type"] == "pong"
            async with websockets.connect(MEDIA_WS, subprotocols=protocols_b) as media_b:
                await media_b.send(json.dumps({"type": "open_media", "grant": joined_a["session"]["mediaGrant"]}))
                try:
                    await asyncio.wait_for(media_b.recv(), 5)
                    raise AssertionError("B accepted A's media grant")
                except websockets.exceptions.ConnectionClosed as exc:
                    assert exc.code == 4005
        # New tickets from the same cookie jar reconnect to the same chat/world.
        reconnect_ticket = (await a.post(f"{HTTP}/api/arcade/ws-ticket")).json()["ticket"]
        async with websockets.connect(WS, subprotocols=["arcade.v1", f"ticket.{reconnect_ticket}"]) as socket:
            await socket.send(json.dumps({"type": "open_my_web_world"}))
            restored = await receive_json(socket)
            assert restored["world"]["worldId"] == joined_a["world"]["worldId"]
            chat = next(item for item in restored["world"]["mountedCartridges"] if item["cartridgeId"] == "chat")
            assert any(line["content"] == "only browser A sees this" for line in chat["runtimes"][0]["state"]["lines"])


async def run() -> None:
    ticket = await test_rest()
    await test_arcade(ticket)
    await test_browser_isolation()


if __name__ == "__main__":
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    time.sleep(0.8)
    asyncio.run(run())
    print("[ok] REST, Arcade protocol/media, independent browser chats, and reconnect verified")
