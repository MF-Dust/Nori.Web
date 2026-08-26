"""World and Ticket lifecycle manager."""

from __future__ import annotations

import asyncio
import secrets
import time
from dataclasses import dataclass
from typing import Dict, Optional

from .world import WorldSession


@dataclass(slots=True)
class Ticket:
    user_id: str
    expires_at: float


class WorldManager:
    """Manages active user world sessions and issue/resolve arcade tickets."""

    def __init__(self) -> None:
        self.worlds_by_user: Dict[str, WorldSession] = {}
        self.tickets: Dict[str, Ticket] = {}
        self._lock = asyncio.Lock()

    async def issue_ticket(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        self.tickets[token] = Ticket(user_id=user_id, expires_at=time.time() + 300)
        # Garbage collect expired tickets opportunistically
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
