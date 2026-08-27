"""Checks required by multi-isolate / Durable Object deployments."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.session.manager import WorldManager


async def run() -> None:
    issuer = WorldManager()
    resolver = WorldManager()

    ticket = await issuer.issue_ticket("cloudflare-user")
    assert await resolver.resolve_ticket(ticket) == "cloudflare-user"

    payload, signature = ticket.rsplit(".", 1)
    tampered = f"{payload}.{signature[:-1]}{'A' if signature[-1:] != 'A' else 'B'}"
    assert await resolver.resolve_ticket(tampered) is None
    assert await resolver.resolve_ticket(None) is None


if __name__ == "__main__":
    asyncio.run(run())
    print("[ok] stateless Arcade tickets are portable across WorldManager instances")
