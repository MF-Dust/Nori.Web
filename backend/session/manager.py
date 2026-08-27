"""World and ticket lifecycle manager."""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import secrets
import time
from contextvars import ContextVar
from typing import Dict, Optional

from ..core import config
from .world import WorldSession


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _ticket_signature(payload: str) -> str:
    digest = hmac.new(
        config.SECRET_KEY.encode("utf-8"),
        payload.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return _b64encode(digest)


class WorldManager:
    """Manage active user worlds and issue stateless Arcade tickets.

    Tickets used to live in process memory. That works for a single local
    Uvicorn process, but a Cloudflare HTTP request and the subsequent WebSocket
    upgrade can land in different isolates. Signed tickets can therefore be
    validated without shared process state.
    """

    def __init__(self) -> None:
        self.worlds_by_user: Dict[str, WorldSession] = {}
        self._lock = asyncio.Lock()

    async def issue_ticket(self, user_id: str) -> str:
        payload = {
            "u": user_id,
            "e": int(time.time()) + 300,
            "n": secrets.token_urlsafe(8),
        }
        encoded = _b64encode(
            json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        )
        return f"{encoded}.{_ticket_signature(encoded)}"

    async def resolve_ticket(self, token: Optional[str]) -> Optional[str]:
        if not token:
            return None
        try:
            encoded, signature = token.rsplit(".", 1)
            if not hmac.compare_digest(_ticket_signature(encoded), signature):
                return None
            payload = json.loads(_b64decode(encoded).decode("utf-8"))
            user_id = payload.get("u")
            expires_at = payload.get("e")
            if not isinstance(user_id, str) or not user_id:
                return None
            if not isinstance(expires_at, int) or expires_at < int(time.time()):
                return None
            return user_id
        except (ValueError, TypeError, json.JSONDecodeError, UnicodeDecodeError):
            return None

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
_WORLD_MANAGER_CONTEXT: ContextVar[Optional[WorldManager]] = ContextVar(
    "nori_world_manager", default=None
)


def get_world_manager() -> WorldManager:
    """Return the manager bound to the current execution context."""
    return _WORLD_MANAGER_CONTEXT.get() or WORLD_MANAGER


def bind_world_manager(manager: WorldManager):
    """Bind a manager for the current ASGI task and return the ContextVar token."""
    return _WORLD_MANAGER_CONTEXT.set(manager)


def reset_world_manager(token) -> None:
    """Restore the previous manager binding."""
    _WORLD_MANAGER_CONTEXT.reset(token)
