"""Fetch a fresh Better-Auth session -> Convex JWT -> Arcade WS ticket.

Usage: python fetch_ticket.py   (prints ticket to stdout)
Reads session token from .scraper_token.txt next to this script.
"""
import json
import sys
from pathlib import Path

import urllib.request

HERE = Path(__file__).resolve().parent
TOKEN = (HERE / ".scraper_token.txt").read_text().strip()

AUTH_BASE = "https://polished-fly-97.convex.site/api/auth"
CONVEX_CLOUD = "https://polished-fly-97.convex.cloud"


def _post(url: str, payload: dict, headers: dict | None = None) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def main() -> int:
    # 1) Convex JWT from better-auth plugin endpoint
    jwt_req = urllib.request.Request(
        f"{AUTH_BASE}/convex/token",
        headers={"Cookie": f"__Secure-better-auth.session_token={TOKEN}",
                 "Origin": "https://os.inori.ai"},
    )
    with urllib.request.urlopen(jwt_req, timeout=20) as r:
        jwt = json.loads(r.read().decode())["token"]

    # 2) Arcade WS ticket via Convex HTTP mutation
    res = _post(
        f"{CONVEX_CLOUD}/api/mutation",
        {"path": "auth/wsTickets:issueWebUserWsTicket", "args": {}, "format": "json"},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    if res.get("status") != "success":
        print(f"ticket failed: {json.dumps(res)[:300]}", file=sys.stderr)
        return 1
    print(res["value"]["ticket"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
