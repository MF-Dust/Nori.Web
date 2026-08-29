from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")


def main() -> None:
    for path in (
        "/api/query",
        "/api/mutation",
        "/api/action",
        "/api/function",
        "/api/query_at_ts",
        "/api/query_ts",
    ):
        assert path in ENTRY

    assert "class Default(_runtime.Default)" in ENTRY
    assert "await request.json()" in ENTRY
    assert "auth/wsTickets:issueWebUserWsTicket" in ENTRY
    assert "auth/otpEmail:preflightOtpSend" in ENTRY
    assert "await _serve_edge_convex_api(path, request)" in ENTRY

    edge_call = ENTRY.index("await _serve_edge_convex_api(path, request)")
    fallback = ENTRY.index("return await super().fetch(request)")
    assert edge_call < fallback

    print("[ok] Cloudflare Convex compatibility routes bypass the ASGI cold path")


if __name__ == "__main__":
    main()
