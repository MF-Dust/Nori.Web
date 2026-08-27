"""Virtual Browser application service.

Serves archived production pages (fetched via the in-game Browser link graph)
when the live pack is installed; falls back to a small simulated net for any
URL that was not captured.
"""

from __future__ import annotations

from typing import Any, Dict
from urllib.parse import urlsplit

from . import live_pack


def _mock_sites() -> Dict[str, Dict[str, Any]]:
    return {
        "https://doodle.search/": {
            "title": "Doodle Search",
            "html": _DOODLE_HTML,
        },
        "https://meridianpost.com/": {
            "title": "The Meridian Post",
            "html": _MERIDIAN_HTML,
        },
        "https://pulse.social/": {
            "title": "Pulse Social",
            "html": _PULSE_HTML,
        },
    }


def _canon(url: str) -> str:
    """Normalize a URL for lookup: strip fragment/query, host lowercase."""
    raw = (url or "").strip()
    try:
        parts = urlsplit(raw)
    except Exception:
        return raw.lower().rstrip("/")
    if not parts.netloc:
        return raw.lower().rstrip("/")
    path = (parts.path or "").replace("//", "/")
    return f"{parts.scheme.lower()}://{parts.netloc.lower()}{path}".rstrip("/")


def get_browser_page(url: str) -> Dict[str, Any]:
    """Resolve an archived page, else the simulated-net fallback."""
    if live_pack.is_available():
        entry = live_pack.page(url)
        if entry is not None:
            data = dict(entry.get("data") or {})
            data.setdefault("body_html", "")
            return data

    clean = url.split("?")[0].rstrip("/") + "/"
    sites = _mock_sites()
    if clean in sites:
        page = sites[clean]
    else:
        for key, value in sites.items():
            if key.rstrip("/") == clean.rstrip("/"):
                page = value
                break
        else:
            page = {
                "title": "Simulated Net Page",
                "html": (
                    "<html><body style='font-family:sans-serif;background:#111;"
                    "color:#eee;padding:40px;text-align:center;'>"
                    f"<h2>Page: {url}</h2>"
                    "<p>Simulated web page hosted inside NoriOS network.</p></body></html>"
                ),
            }
    # Real frontend renders `body_html`; expose the legacy markup through it too.
    out = dict(page)
    out.setdefault("supported_locales", ["zh-CN"])
    out.setdefault("body_html", page.get("html", ""))
    return out


_DOODLE_HTML = """<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px 20px; }
        h1 { color: #38bdf8; font-size: 32px; }
        input { width: 80%; max-width: 500px; padding: 12px 18px; border-radius: 24px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 16px; outline: none; }
        .results { margin-top: 40px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto; }
        .card { background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #334155; }
        .card a { color: #38bdf8; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Doodle Search</h1>
    <p>Fictional Internet Gateway · NoriOS Network</p>
    <input type="text" placeholder="Search the simulated net..." value="NoriOS architecture">
    <div class="results">
        <div class="card">
            <a href="https://meridianpost.com/">The Meridian Post: NoriOS Next-Gen Node Launch</a>
            <p style="color:#94a3b8; font-size:14px;">Autonomous AI companion and world engine successfully deployed in production.</p>
        </div>
        <div class="card">
            <a href="https://pulse.social/">Pulse Social Feed</a>
            <p style="color:#94a3b8; font-size:14px;">Latest network chatter, developer updates and community signals.</p>
        </div>
    </div>
</body>
</html>"""

_MERIDIAN_HTML = """<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: serif; background: #fafaf9; color: #1c1917; padding: 30px; line-height: 1.6; }
        h1 { border-bottom: 2px solid #1c1917; padding-bottom: 10px; }
        .meta { color: #78716c; font-size: 14px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>The Meridian Post</h1>
    <div class="meta">Special Edition · 2026</div>
    <h2>NoriOS: The Convergence of Live Virtual Companions and Realtime Runtimes</h2>
    <p>In a breakthrough development, NoriOS has seamlessly integrated Live2D emotional state tracking, WebSocket-based world presence, and local cognitive models into a unified desktop interface.</p>
</body>
</html>"""

_PULSE_HTML = """<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #09090b; color: #fafafa; padding: 20px; }
        .post { background: #18181b; padding: 14px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #27272a; }
        .author { font-weight: bold; color: #a1a1aa; margin-bottom: 4px; }
    </style>
</head>
<body>
    <h2>Pulse Network</h2>
    <div class="post">
        <div class="author">@nori_core</div>
        <div>System status: optimal. Memory link: synchronized. Happy exploring! ✨</div>
    </div>
    <div class="post">
        <div class="author">@operator</div>
        <div>Connected to NoriOS node. Ready for party games and chat.</div>
    </div>
</body>
</html>"""

# Backwards-compatible module-level view of the fallback site table.
SITES = _mock_sites()
