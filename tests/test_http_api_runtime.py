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

        # The shipped client also uses Convex-compatible HTTP RPCs. Keep their
        # response contract stable even though Cloudflare serves these paths
        # directly at the Worker edge to avoid an expensive ASGI cold start.
        convex_ticket = await client.post(
            "/api/query",
            json={"path": "auth/wsTickets:issueWebUserWsTicket"},
        )
        assert convex_ticket.status_code == 200, convex_ticket.text
        convex_payload = convex_ticket.json()
        assert convex_payload.get("status") == "success"
        convex_token = (convex_payload.get("value") or {}).get("ticket")
        assert isinstance(convex_token, str) and "." in convex_token
        assert convex_payload.get("logLines") == []

        preflight = await client.post(
            "/api/mutation",
            json={"path": "auth/otpEmail:preflightOtpSend"},
        )
        assert preflight.status_code == 200, preflight.text
        assert preflight.json() == {
            "status": "success",
            "value": None,
            "logLines": [],
        }

        timestamp = await client.post("/api/query_ts")
        assert timestamp.status_code == 200, timestamp.text
        assert timestamp.json() == {"ts": "0"}

    print(
        "[ok] FastAPI compatibility routes preserve entry, ticket, and Convex contracts"
    )


if __name__ == "__main__":
    asyncio.run(main())
