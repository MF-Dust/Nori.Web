"""NoriOS full read-only archive — v3.

A) WS: join world -> cartridge snapshot + mail/file/signal_thread/signal_message
     artifacts + chip status
B) WS: BFS-crawl the in-game Browser via manifold.artifacts.fetch
C) HTTPS: download every /webAssets/* static asset discovered anywhere
"""
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

from websockets.asyncio.client import connect as ws_connect

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "live_archive"
(OUT / "artifacts").mkdir(parents=True, exist_ok=True)
(OUT / "pages").mkdir(parents=True, exist_ok=True)
ASSETS_DIR = OUT / "webAssets"

WS_URL = "wss://os.inori.ai/api/arcade/web/v1"
ARTIFACT_TYPES = ["mail", "file", "signal_thread", "signal_message"]

URL_RE = re.compile(r"https?://[^\s\"'<>\\)\]}]+", re.I)
HOSTPATH_RE = re.compile(r"\b((?:[a-z0-9-]+\.)+(?:com|net|org|io|ai|tech|dev|xyz|me|info|blog|space|site|online|onion|search)(?:/[^\s\"'<>\\)\]]*)?)", re.I)
WEBASSET_RE = re.compile(r"/webAssets/[\w./-]+")

SEEDS = [
    "https://doodle.search/",
    "https://meridianpost.com/",
    "https://pulse.social/",
    "https://futurum.tech/",
    "https://futurum-prize.verify-now.com/",
    "https://driftnet.onion/",
]


def log(msg: str) -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


class Session:
    def __init__(self, ws):
        self.ws = ws
        self.events: list[dict] = []
        self.others: dict[str, list] = {}
        self.seen_event_keys: set[str] = set()
        self._run = True

    async def receiver(self):
        try:
            async for raw in self.ws:
                data = json.loads(raw)
                with open(OUT / "transcript.jsonl", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"ts": time.time(), "dir": "in", "msg": data},
                                       ensure_ascii=False) + "\n")
                if data.get("type") == "event":
                    k = json.dumps(data, sort_keys=True)
                    if k not in self.seen_event_keys:
                        self.events.append(data)
                else:
                    self.others.setdefault(data.get("type"), []).append(data)
        except Exception as e:
            log(f"receiver ended: {e!r}")

    async def roundtrip(self, channel: str, payload: dict, resp_channel: str,
                        timeout=10.0):
        rid = uuid.uuid4().hex[:16]
        msg = {"type": "event", "channel": channel, "cartridgeId": "manifold.web",
               "requestId": rid, "payload": payload}
        seen_now = {json.dumps(e, sort_keys=True) for e in self.events}
        self.seen_event_keys |= seen_now
        await self.ws.send(json.dumps(msg))
        deadline = time.time() + timeout
        while time.time() < deadline:
            await asyncio.sleep(0.1)
            for e in self.events:
                k = json.dumps(e, sort_keys=True)
                if e.get("channel") == resp_channel and k not in self.seen_event_keys:
                    self.seen_event_keys.add(k)
                    return e.get("payload")
        return None


def harvest(obj, urls: set, assets: set):
    if isinstance(obj, str):
        for m in URL_RE.findall(obj):
            urls.add(m.rstrip(".,;)]}»\"'"))
        for m in re.finditer(HOSTPATH_RE, obj):
            urls.add("https://" + m.group(1))
        for m in WEBASSET_RE.findall(obj):
            assets.add(m)
    elif isinstance(obj, list):
        for x in obj:
            harvest(x, urls, assets)
    elif isinstance(obj, dict):
        for v in obj.values():
            harvest(v, urls, assets)


def norm_url(u: str) -> str | None:
    u = u.strip().rstrip("/")
    if not u.lower().startswith(("http://", "https://")):
        return None
    # strip anchors/query fragments for canonical key
    u = u.split("#", 1)[0]
    return u if len(u) <= 120 else None


async def phase_ws():
    ticket = subprocess.run(
        [sys.executable, str(HERE / "fetch_ticket.py")],
        capture_output=True, text=True, check=True).stdout.strip()
    log(f"ticket ok")
    async with ws_connect(
        WS_URL, subprotocols=["arcade.v1", f"ticket.{ticket}"],
        additional_headers={"Origin": "https://os.inori.ai"},
        max_size=50 * 1024 * 1024,
    ) as ws:
        s = Session(ws)
        recv_task = asyncio.create_task(s.receiver())
        await ws.send(json.dumps({"type": "open_my_web_world", "locale": "zh-CN"}))
        for _ in range(100):
            await asyncio.sleep(0.25)
            if "world_joined" in s.others or "world_created" in s.others:
                break
        wj = (s.others.get("world_joined") or s.others.get("world_created") or [{}])[0]
        cartridges = ((wj.get("world") or {}).get("mountedCartridges") or [])
        log(f"world joined; cartridges={[c.get('cartridgeId') for c in cartridges]}")
        (OUT / "world_snapshot.json").write_text(json.dumps(
            {"world_joined": wj,
             "cartridges": {c.get("cartridgeId"): c.get("runtimes") for c in cartridges}},
            ensure_ascii=False, indent=2), encoding="utf-8")

        urls: set[str] = set()
        assets: set[str] = set()

        for atype in ARTIFACT_TYPES:
            resp = await s.roundtrip("manifold.artifacts.request",
                                     {"artifactType": atype},
                                     "manifold.artifacts.response")
            arts = resp.get("artifacts", []) if resp and resp.get("ok") else []
            log(f"{atype}: {len(arts)} artifacts")
            if arts:
                (OUT / "artifacts" / f"{atype}.json").write_text(
                    json.dumps(arts, ensure_ascii=False, indent=2), encoding="utf-8")
                harvest(arts, urls, assets)

        chip = await s.roundtrip("manifold.chip.status", {}, "manifold.chip.status.result")
        if chip:
            (OUT / "chip_status.json").write_text(
                json.dumps(chip, ensure_ascii=False, indent=2), encoding="utf-8")
            harvest(chip, urls, assets)

        harvest(((wj.get("world") or {}).get("mountedCartridges")), urls, assets)

        # seed candidates harvested from everything known so far
        crawl_urls: deque[str] = deque()
        enqueued: set[str] = set()

        def enqueue(u: str):
            n = norm_url(u)
            if n and n not in enqueued and n not in ("https://os.inori.ai", "http://localhost"):
                enqueued.add(n)
                crawl_urls.append(n + ("/" if not n.split("/")[-1].count(".") and not n.endswith("/") else ""))

        for seed in SEEDS:
            enqueue(seed)
        real_hosts = ("googleusercontent", "convex.cloud", "convex.site", "inori.ai",
                      "github.com", "fonts.googleapis", "jsdelivr", "steam", "bilibili",
                      "bit.ly")
        for u in sorted(urls):
            low = u.lower()
            if any(h in low for h in real_hosts):
                continue
            enqueue(u)

        pages_ok, pages_404 = [], []
        tried = 0
        while crawl_urls and tried < 250:
            u = crawl_urls.popleft()
            tried += 1
            payload = {"artifactType": "browser_page", "lookup_key": u}
            resp = await s.roundtrip("manifold.artifacts.fetch", payload,
                                     "manifold.artifacts.fetch.response", timeout=8)
            tried_key = {"url": u}
            if resp is None:
                pages_404.append({**tried_key, "error": "timeout"})
            elif resp.get("ok"):
                art = resp["artifact"]
                safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", u.replace("https://", ""))[:90]
                path = OUT / "pages" / f"{safe}.json"
                path.write_text(json.dumps(art, ensure_ascii=False, indent=2),
                                encoding="utf-8")
                pages_ok.append(u)
                harvest(art, urls, assets)
                new_ones = 0
                for cand in sorted(urls):
                    n = norm_url(cand)
                    if n and n not in enqueued and not any(h in n.lower() for h in real_hosts):
                        enqueue(cand)
                        new_ones += 1
                        if new_ones > 6:
                            break
                log(f"page OK  {u}")
            else:
                st = resp.get("status")
                pages_404.append({**tried_key, "status": st})
                if st != 404:
                    log(f"page {st} {u}")
            await asyncio.sleep(0.12)

        log(f"crawl done: ok={len(pages_ok)} miss={len(pages_404)} tried={tried}")
        (OUT / "pages" / "_index.json").write_text(json.dumps({
            "ok": pages_ok, "missed": pages_404}, ensure_ascii=False, indent=2),
            encoding="utf-8")
        (OUT / "webassets_paths.json").write_text(
            json.dumps(sorted(assets), ensure_ascii=False, indent=2), encoding="utf-8")

        await asyncio.sleep(1.5)
        recv_task.cancel()
    return sorted(assets)


def phase_assets(asset_paths: list[str]):
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    got, failed = 0, []
    for p in asset_paths:
        dest = ASSETS_DIR / p.lstrip("/")
        if dest.exists():
            got += 1
            continue
        url = "https://os.inori.ai" + p
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(r.read())
            got += 1
        except Exception as e:
            failed.append({"path": p, "err": str(e)[:120]})
    log(f"assets downloaded/present={got}, failed={len(failed)}")
    (OUT / "webassets_download_report.json").write_text(
        json.dumps(failed, ensure_ascii=False, indent=2), encoding="utf-8")


async def main():
    assets = await phase_ws()
    phase_assets(assets)
    log("ALL DONE")


if __name__ == "__main__":
    asyncio.run(main())
