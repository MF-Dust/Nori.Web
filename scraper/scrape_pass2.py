"""Second pass v2: full link-graph closure of the in-game Browser."""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
import time
import urllib.request
import uuid
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse

from websockets.asyncio.client import connect as ws_connect

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "live_archive"
PAGES = OUT / "pages"
WS_URL = "wss://os.inori.ai/api/arcade/web/v1"

REAL_HOSTS = ("googleusercontent", "convex.cloud", "convex.site", "inori.ai",
              "github.com", "fonts.googleapis", "jsdelivr", "steam", "bilibili",
              "bit.ly", "spellbrush.com", "mailto:", "calderwood.com")

HREF_RE = re.compile(r'href=["\']([^"\'#]+)["\']')
URL_RE = re.compile(r"https?://[^\s\"'<>\\)]+", re.I)
WEBASSET_RE = re.compile(r"/webAssets/[\w./-]+")


def log(msg):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def collect_from_page(path: Path):
    art = json.loads(path.read_text(encoding="utf-8"))
    d = art.get("data", {})
    html = d.get("body_html", "") or ""
    base = d.get("url") or ""
    urls = set()
    for m in HREF_RE.findall(html):
        u = m.strip()
        if u.lower().startswith(("mailto:", "javascript:")):
            continue
        if u.startswith("/"):
            if base:
                urls.add(urljoin(base, u))
        elif u.startswith("http"):
            urls.add(u)
    txt = json.dumps(art, ensure_ascii=False)
    for m in URL_RE.findall(txt):
        urls.add(m.rstrip("\\"))
    return base, urls, set(WEBASSET_RE.findall(txt))


def canon(u: str) -> str | None:
    """Scheme/query-preserving normalization; drops only fragments."""
    u = u.split("#")[0].strip()
    if not u or len(u) > 200:
        return None
    low = u.lower()
    if any(h in low for h in REAL_HOSTS):
        return None
    try:
        parts = urlparse(u)
    except Exception:
        return None
    if not parts.netloc:
        return None
    scheme = parts.scheme or "https"
    path = re.sub(r"/{2,}", "/", parts.path)
    return f"{scheme.lower()}://{parts.netloc.lower()}{path}".rstrip("/")




class Session:
    def __init__(self, ws):
        self.ws = ws
        self.events: list[dict] = []
        self.receipts: set[str] = set()
        self.consumed: set[str] = set()
        self.others: dict[str, list] = {}

    async def receiver(self):
        try:
            async for raw in self.ws:
                data = json.loads(raw)
                with open(OUT / "transcript.jsonl", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"ts": time.time(), "dir": "in", "msg": data},
                                       ensure_ascii=False) + "\n")
                if data.get("type") == "event":
                    k = json.dumps(data, sort_keys=True)
                    if k not in self.receipts:
                        self.receipts.add(k)
                        self.events.append(data)
                else:
                    self.others.setdefault(data.get("type"), []).append(data)
        except Exception as e:
            log(f"receiver ended: {e!r}")

    async def roundtrip(self, channel, payload, resp_channel, timeout=8.0):
        rid = uuid.uuid4().hex[:16]
        msg = {"type": "event", "channel": channel, "cartridgeId": "manifold.web",
               "requestId": rid, "payload": payload}
        for e in self.events:
            self.consumed.add(json.dumps(e, sort_keys=True))
        await self.ws.send(json.dumps(msg))
        deadline = time.time() + timeout
        while time.time() < deadline:
            await asyncio.sleep(0.08)
            for e in self.events:
                k = json.dumps(e, sort_keys=True)
                if e.get("channel") == resp_channel and k not in self.consumed:
                    self.consumed.add(k)
                    return e.get("payload")
        return None


async def fetch_page(s: Session, url: str):
    payload = {"artifactType": "browser_page", "lookup_key": url}
    resp = await s.roundtrip("manifold.artifacts.fetch", payload,
                             "manifold.artifacts.fetch.response", timeout=7)
    if resp is None or (isinstance(resp, dict) and resp.get("ok") is False
                        and not url.endswith("/")):
        payload = {"artifactType": "browser_page", "lookup_key": url + "/"}
        alt = await s.roundtrip("manifold.artifacts.fetch", payload,
                                "manifold.artifacts.fetch.response", timeout=6)
        if alt is not None and alt.get("ok"):
            return alt
    return resp


async def join_world(ticket: str) -> tuple[Session, object]:
    ws = None
    tkt = ticket
    for attempt in range(4):
        try:
            ws = await ws_connect(WS_URL, subprotocols=["arcade.v1", f"ticket.{tkt}"],
                                  additional_headers={"Origin": "https://os.inori.ai"},
                                  max_size=50 * 1024 * 1024, open_timeout=30)
            break
        except Exception as e:
            log(f"connect attempt {attempt+1} failed: {e!r}; retrying")
            await asyncio.sleep(3)
            tkt = subprocess.run([sys.executable, str(HERE / "fetch_ticket.py")],
                                 capture_output=True, text=True, check=True).stdout.strip()
    if ws is None:
        raise RuntimeError("could not connect")
    s = Session(ws)
    s.receiver_task = asyncio.create_task(s.receiver())
    await ws.send(json.dumps({"type": "open_my_web_world", "locale": "zh-CN"}))
    for _ in range(100):
        await asyncio.sleep(0.2)
        if "world_joined" in s.others or "world_created" in s.others:
            break
    return s, ws


async def main():
    seen_urls: set[str] = set()
    frontier: deque[str] = deque()
    all_assets: set[str] = set()
    origins = 0
    for f in PAGES.glob("*.json"):
        if f.name.startswith("_"):
            continue
        base, urls, assets = collect_from_page(f)
        origins += 1
        all_assets |= assets
        b = canon(base)
        if b:
            seen_urls.add(b)
        for u in urls:
            n = canon(u)
            if n and n not in seen_urls:
                seen_urls.add(n)
                frontier.append(n)

    log(f"origins={origins} frontier={len(frontier)} assets_seen={len(all_assets)}")

    ticket = subprocess.run([sys.executable, str(HERE / "fetch_ticket.py")],
                            capture_output=True, text=True, check=True).stdout.strip()
    s, ws = await join_world(ticket)

    ok = miss = 0
    saved_urls: list[str] = []
    missed_urls: list[str] = []
    try:
        while frontier:
            u = frontier.popleft()
            resp = await fetch_page(s, u)
            if resp is None:
                miss += 1
                missed_urls.append(u)
            elif resp.get("ok"):
                ok += 1
                art = resp["artifact"]
                safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", u.replace("https://", ""))[:90]
                (PAGES / f"{safe}.json").write_text(
                    json.dumps(art, ensure_ascii=False, indent=2), encoding="utf-8")
                saved_urls.append(u)
                all_assets |= set(WEBASSET_RE.findall(json.dumps(art, ensure_ascii=False)))
                html = art.get("data", {}).get("body_html", "") or ""
                base = art.get("data", {}).get("url", "") or u
                for m in HREF_RE.findall(html):
                    mm = m.strip()
                    if mm.startswith(("mailto:", "javascript:", "/webAssets/")):
                        continue
                    n = canon(urljoin(base, mm))
                    if n and n not in seen_urls:
                        seen_urls.add(n)
                        frontier.append(n)
            else:
                miss += 1
                missed_urls.append(u)
            if (ok + miss) % 20 == 0:
                log(f"progress fetched={ok+miss} ok={ok} queue={len(frontier)}")
    finally:
        try:
            await ws.close()
        except Exception:
            pass

    log(f"pass2 done: ok={ok} miss={miss}")
    (PAGES / "_index.json").write_text(json.dumps({
        "pages_saved_total": sorted(p.stem for p in PAGES.glob("*.json") if not p.name.startswith("_")),
        "newly_saved": saved_urls,
        "not_found_or_timeout": missed_urls}, ensure_ascii=False, indent=2), encoding="utf-8")

    got = fail = skip = 0
    for p in sorted(all_assets):
        dest = OUT / "webAssets" / p.lstrip("/")
        if dest.exists():
            skip += 1
            continue
        try:
            req = urllib.request.Request("https://os.inori.ai" + p,
                                         headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(r.read())
            got += 1
        except Exception:
            fail += 1
    log(f"assets: downloaded={got} existing={skip} failed={fail}")


if __name__ == "__main__":
    asyncio.run(main())
