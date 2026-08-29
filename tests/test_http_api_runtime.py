from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import httpx

from server import create_app


async def main() -> None:
    app = create_app(include_static=False)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://nori.test") as client:
        status = await client.get("/api/entry-status")
        assert status.status_code == 200, status.text
        payload = status.json()
        assert payload.get("status") == "ok"
        assert isinstance(payload.get("machineId"), str)

        # AUTO_GUEST is enabled by default, so the ticket endpoint must be a
        # real end-to-end HTTP success too, not merely an importable route.
        ticket = await client.post("/api/arcade/ws-ticket")
        assert ticket.status_code == 200, ticket.text
        token = ticket.json().get("ticket")
        assert isinstance(token, str) and "." in token

    print("[ok] concrete FastAPI app serves entry-status and Arcade ticket endpoints")


if __name__ == "__main__":
    asyncio.run(main())
