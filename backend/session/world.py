"""World session runtime and client synchronization service."""

from __future__ import annotations

import asyncio
import json
import secrets
import time
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple

from fastapi import WebSocket

from ..cartridges.base import BaseCartridge, CommandRejected
from ..cartridges.chat import ChatCartridge
from ..cartridges.registry import CARTRIDGE_REGISTRY
from ..core.media import fallback_speech_frames
from ..core.protocol import (
    ProtocolError,
    dispatch_failure_message,
    dispatch_success_message,
    error_message,
    runtime_transition_message,
    validate_client_message,
    visibility_advanced_message,
)
from ..services.event_dispatcher import EventDispatcher

Json = Any


class WorldSession:
    """Manages one Arcade world instance, its active cartridges and connected clients."""

    def __init__(self, owner_id: str, locale: Optional[str] = None) -> None:
        self.owner_id = owner_id
        self.world_id = str(uuid.uuid4())
        self.locale = locale or "en"
        self.cartridges: Dict[str, BaseCartridge] = CARTRIDGE_REGISTRY.get_default_cartridges()
        self.clients: Set[WebSocket] = set()
        self.media_clients: Set[WebSocket] = set()
        self.media_grants: Set[str] = set()
        self.lock = asyncio.Lock()
        self.event_dispatcher = EventDispatcher(self)
        self._media_sequence = 0
        self._tasks: Set[asyncio.Task[Any]] = set()

    def issue_media_grant(self) -> str:
        grant = secrets.token_urlsafe(32)
        self.media_grants.add(grant)
        while len(self.media_grants) > 32:
            self.media_grants.pop()
        return grant

    def mounted_cartridges(self) -> List[Dict[str, Json]]:
        result = []
        for cartridge_id, cartridge in self.cartridges.items():
            fence = "player" if cartridge_id == "manifold.web" else "ui"
            result.append({"cartridgeId": cartridge_id, "runtimes": [cartridge.get_snapshot(fence)]})
        return result

    def world_payload(self) -> Dict[str, Json]:
        return {"worldId": self.world_id, "mountedCartridges": self.mounted_cartridges()}

    async def add_client(self, websocket: WebSocket) -> None:
        self.clients.add(websocket)

    async def remove_client(self, websocket: WebSocket) -> None:
        self.clients.discard(websocket)
        self.media_clients.discard(websocket)

    async def add_media_client(self, websocket: WebSocket) -> None:
        self.media_clients.add(websocket)

    async def _send(self, websocket: WebSocket, message: Dict[str, Json]) -> None:
        await websocket.send_text(json.dumps(message, ensure_ascii=False, separators=(",", ":")))

    async def send_direct(self, websocket: WebSocket, message: Dict[str, Json]) -> None:
        try:
            await self._send(websocket, message)
        except Exception:
            await self.remove_client(websocket)

    async def broadcast(self, messages: List[Dict[str, Json]]) -> None:
        if not messages:
            return
        dead: List[WebSocket] = []
        for websocket in list(self.clients):
            try:
                for message in messages:
                    await self._send(websocket, message)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            await self.remove_client(websocket)

    async def broadcast_media(self, frame: bytes) -> None:
        dead: List[WebSocket] = []
        for websocket in list(self.media_clients):
            try:
                await websocket.send_bytes(frame)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            await self.remove_client(websocket)

    def _commit_messages(self, cartridge: BaseCartridge, commit: Any) -> List[Dict[str, Json]]:
        if not commit.committed or commit.transition is None:
            return []
        fence_id = "player" if cartridge.cartridge_id == "manifold.web" else "ui"
        return [
            runtime_transition_message(
                world_id=self.world_id,
                cartridge_id=cartridge.cartridge_id,
                version=commit.version,
                transition=commit.transition,
            ),
            visibility_advanced_message(
                world_id=self.world_id,
                cartridge_id=cartridge.cartridge_id,
                visibility_fence_id=fence_id,
                visible_version=cartridge.visible_version,
                head_version=cartridge.head_version,
            ),
        ]

    async def _dispatch_internal(self, cartridge_id: str, actor: str, cmd: Dict[str, Json]) -> Optional[Any]:
        """Apply a server-owned follow-up command and publish its transition."""
        async with self.lock:
            cartridge = self.cartridges.get(cartridge_id)
            if cartridge is None:
                return None
            try:
                commit = cartridge.dispatch(actor, cmd)
            except CommandRejected as exc:
                print(f"[world:{self.world_id}] internal {cartridge_id}/{cmd.get('type')} rejected: {exc}")
                return None
            messages = self._commit_messages(cartridge, commit)
        await self.broadcast(messages)
        return commit

    def _spawn(self, coroutine: Any) -> None:
        task = asyncio.create_task(coroutine)
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def _run_chat_reply(self, user_text: str) -> None:
        chat = self.cartridges.get("chat")
        if not isinstance(chat, ChatCartridge):
            return
        await asyncio.sleep(0.15)
        emotion, reply = await chat.generate_reply(user_text)
        operation_id, message_id, commands = chat.build_agent_turn(reply, emotion)
        for command in commands:
            await self._dispatch_internal("chat", "agent", command)
        self._spawn(self._stream_chat_fallback(operation_id, message_id, reply))
        self._spawn(self._ensure_chat_progress(operation_id))

    async def _stream_chat_fallback(self, operation_id: str, message_id: str, text: str) -> None:
        frame_count = max(1, min(12, (len(text) + 7) // 8))
        start_sequence = self._media_sequence
        self._media_sequence = (self._media_sequence + frame_count) & 0xFFFFFFFF
        async for frame in fallback_speech_frames(
            operation_id,
            message_id,
            text,
            start_sequence=start_sequence,
        ):
            await self.broadcast_media(frame)

    async def _ensure_chat_progress(self, operation_id: str) -> None:
        """Reveal a reply if no browser audio acknowledgement arrives."""
        await asyncio.sleep(1.1)
        chat = self.cartridges.get("chat")
        if not isinstance(chat, ChatCartridge):
            return
        operation = chat.state.get("operations", {}).get(operation_id)
        if operation and operation.get("startedThrough", -1) < 0:
            await self._dispatch_internal("chat", "agent", {"type": "audioStarted", "operationId": operation_id, "blockId": 0})
        await asyncio.sleep(0.45)
        chat = self.cartridges.get("chat")
        operation = chat.state.get("operations", {}).get(operation_id) if isinstance(chat, ChatCartridge) else None
        if operation and operation.get("presentedThrough", -1) < 0:
            await self._dispatch_internal("chat", "agent", {"type": "audioDone", "operationId": operation_id, "blockId": 0})
        await asyncio.sleep(0.1)
        await self._dispatch_internal("chat", "agent", {"type": "operationSettled", "operationId": operation_id, "outcome": "completed"})

    async def _settle_chat_after_audio(self, operation_id: str) -> None:
        await asyncio.sleep(0.1)
        await self._dispatch_internal("chat", "agent", {"type": "operationSettled", "operationId": operation_id, "outcome": "completed"})

    async def _run_agent_turns(self, cartridge_id: str) -> None:
        """Drive the transparent local opponent until the player must act."""
        for _ in range(8):
            await asyncio.sleep(0.35)
            cartridge = self.cartridges.get(cartridge_id)
            if cartridge is None:
                return
            command = getattr(cartridge, "agent_next_command", lambda: None)()
            if not command:
                return
            commit = await self._dispatch_internal(cartridge_id, "agent", command)
            if commit is None:
                return

    async def _start_next_pictionary_round(self) -> None:
        await asyncio.sleep(1.2)
        cartridge = self.cartridges.get("pictionary")
        if cartridge is None:
            return
        game = cartridge.state.get("gameState")
        if isinstance(game, dict) and game.get("phase") == "PLAYING" and game.get("round", {}).get("status") != "active":
            await self._dispatch_internal("pictionary", "agent", {"type": "startNextRound", "atMs": int(time.time() * 1000)})

    def _schedule_follow_up(self, cartridge_id: str, actor: str, cmd: Dict[str, Json]) -> None:
        command_type = cmd.get("type")
        if cartridge_id == "chat":
            if actor == "player" and command_type == "playerMessage":
                self._spawn(self._run_chat_reply(str(cmd["text"])))
            elif command_type == "audioDone" and isinstance(cmd.get("operationId"), str):
                self._spawn(self._settle_chat_after_audio(cmd["operationId"]))
            return
        if cartridge_id in {"cakeduel", "codenames", "chess"}:
            self._spawn(self._run_agent_turns(cartridge_id))
        elif cartridge_id == "pictionary" and command_type in {"submitGuess", "skipRound"}:
            self._spawn(self._start_next_pictionary_round())

    async def _mount(self, cartridge_id: str) -> Tuple[str, BaseCartridge]:
        cartridge = self.cartridges.get(cartridge_id)
        if cartridge is not None:
            return "already_mounted", cartridge
        cartridge = CARTRIDGE_REGISTRY.create(cartridge_id)
        if cartridge is None:
            raise CommandRejected(f"Unknown cartridge: {cartridge_id}")
        self.cartridges[cartridge_id] = cartridge
        return "created", cartridge

    async def handle_client_message(self, websocket: WebSocket, message: Dict[str, Json]) -> None:
        """Handle one validated client message."""
        try:
            message = validate_client_message(message)
        except ProtocolError as exc:
            await self.send_direct(websocket, error_message(exc.code, exc.message, request_id=exc.request_id, cartridge_id=exc.cartridge_id))
            return

        message_type = message["type"]
        if message_type == "open_my_web_world":
            if isinstance(message.get("locale"), str):
                self.locale = message["locale"]
            grant = self.issue_media_grant()
            await self.send_direct(
                websocket,
                {"type": "world_joined", "world": self.world_payload(), "session": {"isAdmin": True, "mediaGrant": grant}},
            )
            return

        if message_type == "join_world":
            if message["worldId"] != self.world_id:
                await self.send_direct(websocket, error_message("world_not_found", "World is not available for this local user", world_id=message["worldId"]))
                return
            grant = self.issue_media_grant()
            await self.send_direct(
                websocket,
                {"type": "world_joined", "world": self.world_payload(), "session": {"isAdmin": True, "mediaGrant": grant}},
            )
            return

        if message_type == "leave_world":
            await self.send_direct(websocket, {"type": "world_left", "worldId": self.world_id})
            return

        if message_type == "mount_cartridge":
            cartridge_id = message["cartridgeId"]
            request_id = message["requestId"]
            try:
                async with self.lock:
                    transition, cartridge = await self._mount(cartridge_id)
                    fence = "player" if cartridge_id == "manifold.web" else "ui"
                    runtimes = [cartridge.get_snapshot(fence)]
            except CommandRejected as exc:
                await self.send_direct(websocket, error_message("command_rejected", str(exc), world_id=self.world_id, cartridge_id=cartridge_id, request_id=request_id))
                return
            await self.broadcast(
                [{"type": "cartridge_mounted", "worldId": self.world_id, "cartridgeId": cartridge_id, "transition": transition, "runtimes": runtimes}]
            )
            await self.send_direct(
                websocket,
                {"type": "cartridge_mounted_ack", "worldId": self.world_id, "cartridgeId": cartridge_id, "requestId": request_id, "transition": transition, "runtimes": runtimes},
            )
            return

        if message_type == "unmount_cartridge":
            cartridge_id = message["cartridgeId"]
            request_id = message["requestId"]
            # chat is the world-owned system cartridge and cannot be removed.
            if cartridge_id != "chat":
                async with self.lock:
                    self.cartridges.pop(cartridge_id, None)
                await self.broadcast([{"type": "cartridge_unmounted", "worldId": self.world_id, "cartridgeId": cartridge_id}])
            await self.send_direct(websocket, {"type": "cartridge_unmounted_ack", "worldId": self.world_id, "cartridgeId": cartridge_id, "requestId": request_id})
            return

        if message_type == "dispatch":
            cartridge_id = message["cartridgeId"]
            request_id = message["requestId"]
            async with self.lock:
                cartridge = self.cartridges.get(cartridge_id)
                if cartridge is None:
                    failure = dispatch_failure_message(
                        world_id=self.world_id,
                        cartridge_id=cartridge_id,
                        request_id=request_id,
                        head_version=0,
                        error="Cartridge is not mounted",
                        error_code="dispatch_error",
                    )
                    messages: List[Dict[str, Json]] = []
                elif message["expectedHeadVersion"] != cartridge.head_version:
                    failure = dispatch_failure_message(
                        world_id=self.world_id,
                        cartridge_id=cartridge_id,
                        request_id=request_id,
                        head_version=cartridge.head_version,
                        error=f"Version mismatch: expected {message['expectedHeadVersion']}, head is {cartridge.head_version}",
                        error_code="version_mismatch",
                    )
                    messages = []
                else:
                    try:
                        commit = cartridge.dispatch(message["actor"], message["cmd"])
                    except CommandRejected as exc:
                        failure = dispatch_failure_message(
                            world_id=self.world_id,
                            cartridge_id=cartridge_id,
                            request_id=request_id,
                            head_version=cartridge.head_version,
                            error=str(exc),
                            error_code="command_rejected",
                        )
                        messages = []
                    except Exception as exc:
                        print(f"[world:{self.world_id}] dispatch error: {exc}")
                        failure = dispatch_failure_message(
                            world_id=self.world_id,
                            cartridge_id=cartridge_id,
                            request_id=request_id,
                            head_version=cartridge.head_version,
                            error="Local runtime dispatch error",
                            error_code="dispatch_error",
                        )
                        messages = []
                    else:
                        failure = None
                        messages = self._commit_messages(cartridge, commit)
                        ack = dispatch_success_message(
                            world_id=self.world_id,
                            cartridge_id=cartridge_id,
                            request_id=request_id,
                            head_version=cartridge.head_version,
                            committed=commit.committed,
                            result=commit.result,
                        )
            if failure is not None:
                await self.send_direct(websocket, failure)
                return
            await self.broadcast(messages)
            await self.send_direct(websocket, ack)
            self._schedule_follow_up(cartridge_id, message["actor"], message["cmd"])
            return

        if message_type == "advance_visibility_fence":
            cartridge_id = message["cartridgeId"]
            request_id = message["requestId"]
            cartridge = self.cartridges.get(cartridge_id)
            if cartridge is None:
                await self.send_direct(websocket, error_message("cartridge_not_mounted", "Cartridge is not mounted", world_id=self.world_id, cartridge_id=cartridge_id, request_id=request_id))
                return
            requested = min(message["version"], cartridge.head_version)
            cartridge.visible_version = max(cartridge.visible_version, requested)
            advanced = visibility_advanced_message(
                world_id=self.world_id,
                cartridge_id=cartridge_id,
                visibility_fence_id=message["visibilityFenceId"],
                visible_version=cartridge.visible_version,
                head_version=cartridge.head_version,
            )
            await self.broadcast([advanced])
            await self.send_direct(
                websocket,
                {
                    "type": "visibility_fence_advanced_ack",
                    "worldId": self.world_id,
                    "cartridgeId": cartridge_id,
                    "visibilityFenceId": message["visibilityFenceId"],
                    "visibleVersion": cartridge.visible_version,
                    "headVersion": cartridge.head_version,
                    "requestId": request_id,
                },
            )
            return

        if message_type == "ping":
            await self.send_direct(websocket, {"type": "pong", "serverId": "nori-local-arcade", "now": int(time.time() * 1000)})
            return

        if message_type == "event":
            response = await self.event_dispatcher.handle_event(message)
            await self.send_direct(websocket, response)
            return

        if message_type == "create_world":
            await self.send_direct(websocket, {"type": "world_created", "world": self.world_payload(), "session": {"isAdmin": True}})
            return
