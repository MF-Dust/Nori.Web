"""Arcade WebSocket world service.

This is a local compatibility implementation of the public NoriOS Arcade
protocol, based on the client schemas embedded in the shipped application.
It intentionally does not pretend to be or proxy the upstream private server.
"""

from __future__ import annotations

import asyncio
import json
import secrets
import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set, Tuple

from fastapi import WebSocket

from .cartridges.base import BaseCartridge, CommandRejected
from .cartridges.cakeduel import CakeDuelCartridge
from .cartridges.chat import ChatCartridge
from .cartridges.chess_engine import ChessCartridge
from .cartridges.codenames import CodenamesCartridge
from .cartridges.manifold import ManifoldWebCartridge
from .cartridges.pictionary import PictionaryCartridge
from .media_stream import fallback_speech_frames
from .protocol import (
    ProtocolError,
    dispatch_failure_message,
    dispatch_success_message,
    error_message,
    runtime_transition_message,
    validate_client_message,
    visibility_advanced_message,
)

Json = Any


CARTRIDGE_FACTORIES = {
    "chat": ChatCartridge,
    "cakeduel": CakeDuelCartridge,
    "codenames": CodenamesCartridge,
    "chess": ChessCartridge,
    "pictionary": PictionaryCartridge,
    "manifold.web": ManifoldWebCartridge,
}


@dataclass(slots=True)
class Ticket:
    user_id: str
    expires_at: float


class WorldSession:
    def __init__(self, owner_id: str, locale: Optional[str] = None):
        self.owner_id = owner_id
        self.world_id = str(uuid.uuid4())
        self.locale = locale or "en"
        self.cartridges: Dict[str, BaseCartridge] = {
            "chat": ChatCartridge(),
            "manifold.web": ManifoldWebCartridge(),
        }
        self.clients: Set[WebSocket] = set()
        self.media_clients: Set[WebSocket] = set()
        self.media_grants: Set[str] = set()
        self.lock = asyncio.Lock()
        self._media_sequence = 0
        self._tasks: Set[asyncio.Task[Any]] = set()

    def issue_media_grant(self) -> str:
        grant = secrets.token_urlsafe(32)
        self.media_grants.add(grant)
        # Keep the set bounded while allowing a reconnecting client to reuse a
        # recently-issued grant.
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
        # Media frames are optional: text remains reachable through the fallback
        # acknowledgement below when a browser denies audio playback.
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
        factory = CARTRIDGE_FACTORIES.get(cartridge_id)
        if factory is None:
            raise CommandRejected(f"Unknown cartridge: {cartridge_id}")
        cartridge = factory()
        self.cartridges[cartridge_id] = cartridge
        return "created", cartridge

    async def handle_client_message(self, websocket: WebSocket, message: Dict[str, Json]) -> Optional["WorldSession"]:
        """Handle one validated client message.

        Returns a new world after reset; otherwise returns ``None``.
        """
        try:
            message = validate_client_message(message)
        except ProtocolError as exc:
            await self.send_direct(websocket, error_message(exc.code, exc.message, request_id=exc.request_id, cartridge_id=exc.cartridge_id))
            return None

        message_type = message["type"]
        if message_type == "open_my_web_world":
            if isinstance(message.get("locale"), str):
                self.locale = message["locale"]
            grant = self.issue_media_grant()
            await self.send_direct(
                websocket,
                {"type": "world_joined", "world": self.world_payload(), "session": {"isAdmin": True, "mediaGrant": grant}},
            )
            return None

        if message_type == "join_world":
            if message["worldId"] != self.world_id:
                await self.send_direct(websocket, error_message("world_not_found", "World is not available for this local user", world_id=message["worldId"]))
                return None
            grant = self.issue_media_grant()
            await self.send_direct(
                websocket,
                {"type": "world_joined", "world": self.world_payload(), "session": {"isAdmin": True, "mediaGrant": grant}},
            )
            return None

        if message_type == "leave_world":
            await self.send_direct(websocket, {"type": "world_left", "worldId": self.world_id})
            return None

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
                return None
            await self.broadcast(
                [{"type": "cartridge_mounted", "worldId": self.world_id, "cartridgeId": cartridge_id, "transition": transition, "runtimes": runtimes}]
            )
            await self.send_direct(
                websocket,
                {"type": "cartridge_mounted_ack", "worldId": self.world_id, "cartridgeId": cartridge_id, "requestId": request_id, "transition": transition, "runtimes": runtimes},
            )
            return None

        if message_type == "unmount_cartridge":
            cartridge_id = message["cartridgeId"]
            request_id = message["requestId"]
            # chat is the world-owned system cartridge and cannot be removed.
            if cartridge_id != "chat":
                async with self.lock:
                    self.cartridges.pop(cartridge_id, None)
                await self.broadcast([{"type": "cartridge_unmounted", "worldId": self.world_id, "cartridgeId": cartridge_id}])
            await self.send_direct(websocket, {"type": "cartridge_unmounted_ack", "worldId": self.world_id, "cartridgeId": cartridge_id, "requestId": request_id})
            return None

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
                return None
            await self.broadcast(messages)
            await self.send_direct(websocket, ack)
            self._schedule_follow_up(cartridge_id, message["actor"], message["cmd"])
            return None

        if message_type == "advance_visibility_fence":
            cartridge_id = message["cartridgeId"]
            request_id = message["requestId"]
            cartridge = self.cartridges.get(cartridge_id)
            if cartridge is None:
                await self.send_direct(websocket, error_message("cartridge_not_mounted", "Cartridge is not mounted", world_id=self.world_id, cartridge_id=cartridge_id, request_id=request_id))
                return None
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
            return None

        if message_type == "ping":
            await self.send_direct(websocket, {"type": "pong", "serverId": "nori-local-arcade", "now": int(time.time() * 1000)})
            return None

        if message_type == "event":
            await self._handle_event(websocket, message)
            return None

        # `create_world` is valid in the generic client but intentionally maps
        # to the local user's one web world rather than exposing server templates.
        if message_type == "create_world":
            await self.send_direct(websocket, {"type": "world_created", "world": self.world_payload(), "session": {"isAdmin": True}})
            return None

        return None

    async def _handle_event(self, websocket: WebSocket, message: Dict[str, Json]) -> None:
        channel = message["channel"]
        request_id = message.get("requestId")
        cartridge_id = message.get("cartridgeId")

        def response(response_channel: str, payload: Json) -> Dict[str, Json]:
            result: Dict[str, Json] = {"type": "event", "worldId": self.world_id, "channel": response_channel, "payload": payload}
            if cartridge_id is not None:
                result["cartridgeId"] = cartridge_id
            if request_id is not None:
                result["requestId"] = request_id
            return result

        now = int(time.time() * 1000)
        payload = message.get("payload", {})
        if channel == "manifold.chip.status":
            await self.send_direct(websocket, response("manifold.chip.status.result", {"capacity": 3, "heat": 0, "coolEveryMs": 60_000, "serverNowMs": now}))
        elif channel == "manifold.chip.scan":
            await self.send_direct(websocket, response("manifold.chip.scan.result", {"kind": "readout", "text": "Local manifold link stable."}))
        elif channel == "manifold.artifacts.request":
            req_type = payload.get("artifactType") if isinstance(payload, dict) else None
            artifacts: List[Dict[str, Any]] = []
            if req_type in {None, "mail"}:
                artifacts.extend([
                    {
                        "id": "mail_welcome",
                        "type": "mail",
                        "surfacedAt": now - 3600000,
                        "data": {
                            "from": "Inori Systems <system@inori.ai>",
                            "to": "Operator <operator@nori.ai>",
                            "subject": "欢迎接入 NoriOS 终端节点",
                            "body_md": "尊敬的操作员：\n\n您的终端已成功同步至 NoriOS 本地运行时核心。Nori Live2D 情绪模型、全部小游戏与系统应用已解锁就绪。\n\n-- Inori OS 运维组",
                            "folder": "inbox",
                            "date": "2026-08-26 10:00",
                            "read_fact": "mail.help.read",
                        },
                    },
                    {
                        "id": "mail_memo",
                        "type": "mail",
                        "surfacedAt": now - 1800000,
                        "data": {
                            "from": "Nori <nori@inori.ai>",
                            "to": "Operator <operator@nori.ai>",
                            "subject": "【日常备忘】今天也请多多指教呀！",
                            "body_md": "操作员！\n\n所有应用和游戏（国际象棋、蛋糕决斗、森林寻宝、你画我猜）都已准备好啦！随时可以开始哦！\n\n(Nori 留)",
                            "folder": "inbox",
                            "date": "2026-08-26 10:05",
                        },
                    },
                ])
            if req_type in {None, "file"}:
                artifacts.extend([
                    {
                        "id": "file_matrix",
                        "type": "file",
                        "surfacedAt": now - 3600000,
                        "data": {
                            "display_path": "personality_matrix.bin",
                            "mime": "application/octet-stream",
                            "folder": "Nori Core",
                        },
                    },
                    {
                        "id": "file_readme",
                        "type": "file",
                        "surfacedAt": now - 3600000,
                        "data": {
                            "display_path": "readme.txt",
                            "mime": "text/plain",
                            "folder": "Documents",
                            "content": "NoriOS Local Compatibility Environment\nAll components unlocked by default.",
                        },
                    },
                ])
            if req_type in {None, "signal_thread"}:
                artifacts.append({
                    "id": "thread_nori",
                    "type": "signal_thread",
                    "surfacedAt": now - 3600000,
                    "data": {
                        "thread_id": "nori",
                        "title": "Nori",
                        "participants": ["nori", "operator"],
                        "avatar_path": "/icon.png",
                    },
                })
            if req_type in {None, "signal_message"}:
                artifacts.extend([
                    {
                        "id": "msg_01",
                        "type": "signal_message",
                        "surfacedAt": now - 60000,
                        "data": {
                            "thread_id": "nori",
                            "message_id": "msg_01",
                            "sender": "nori",
                            "kind": "text",
                            "body_md": "操作员，听到我这边的信号了吗？全部功能都已解锁就绪啦！",
                            "timestamp": "2026-08-26T10:00:00Z",
                        },
                    }
                ])
            await self.send_direct(websocket, response("manifold.artifacts.response", {"ok": True, "artifacts": artifacts}))
        elif channel == "manifold.artifacts.fetch":
            lookup_key = payload.get("lookup_key") if isinstance(payload, dict) else ""
            artifact_type = payload.get("artifactType") if isinstance(payload, dict) else ""
            if artifact_type == "browser_page" and lookup_key:
                from .virtual_apps.browser import get_browser_page
                page = get_browser_page(lookup_key)
                await self.send_direct(
                    websocket,
                    response(
                        "manifold.artifacts.fetch.response",
                        {
                            "ok": True,
                            "artifact": {
                                "id": lookup_key,
                                "type": "browser_page",
                                "data": page,
                            },
                        },
                    ),
                )
            else:
                await self.send_direct(websocket, response("manifold.artifacts.fetch.response", {"ok": False, "status": 404}))
        elif channel == "manifold.dev.jump.request":
            facts = payload.get("facts", []) if isinstance(payload, dict) else []
            manifold_cartridge = self.cartridges.get("manifold.web")
            if isinstance(manifold_cartridge, ManifoldWebCartridge):
                for f in facts:
                    manifold_cartridge.state["facts"][f] = True
            await self.send_direct(websocket, response("manifold.dev.jump.response", {"ok": True, "count": len(facts), "committed": True}))
        elif channel == "manifold.command.request":
            await self.send_direct(websocket, response("manifold.command.response", {"ok": True, "result": {}}))
        elif channel == "settings.network.test":
            await self.send_direct(websocket, response("settings.network.test.result", {"ok": True, "rttMs": 0}))
        else:
            # Preserve RPC correlation for public extensions that only need a
            # successful local acknowledgement.
            await self.send_direct(websocket, response(f"{channel}.result", {"ok": True}))


class WorldManager:
    def __init__(self) -> None:
        self.worlds_by_user: Dict[str, WorldSession] = {}
        self.tickets: Dict[str, Ticket] = {}
        self._lock = asyncio.Lock()

    async def issue_ticket(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        self.tickets[token] = Ticket(user_id=user_id, expires_at=time.time() + 300)
        # Garbage collect expired tickets opportunistically.
        now = time.time()
        for key, ticket in list(self.tickets.items()):
            if ticket.expires_at < now:
                self.tickets.pop(key, None)
        return token

    async def resolve_ticket(self, token: Optional[str]) -> Optional[str]:
        if not token:
            return None
        ticket = self.tickets.get(token)
        if ticket is None or ticket.expires_at < time.time():
            self.tickets.pop(token, None)
            return None
        return ticket.user_id

    async def get_world(self, user_id: str, locale: Optional[str] = None) -> WorldSession:
        async with self._lock:
            world = self.worlds_by_user.get(user_id)
            if world is None:
                world = WorldSession(user_id, locale)
                self.worlds_by_user[user_id] = world
            elif locale:
                world.locale = locale
            return world

    async def reset_world(self, user_id: str, locale: Optional[str] = None) -> WorldSession:
        async with self._lock:
            old = self.worlds_by_user.get(user_id)
            world = WorldSession(user_id, locale or (old.locale if old else None))
            self.worlds_by_user[user_id] = world
            return world

    async def world_for_grant(self, user_id: str, grant: str) -> Optional[WorldSession]:
        world = self.worlds_by_user.get(user_id)
        if world is not None and grant in world.media_grants:
            return world
        return None


WORLD_MANAGER = WorldManager()
