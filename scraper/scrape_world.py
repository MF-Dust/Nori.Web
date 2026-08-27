"""NoriOS live-world archive scraper v2.

Read-only archive of the user's live NoriOS world:
  1. join world, snapshot every cartridge runtime state
  2. pull manifold artifacts by type (mail / file / signal_thread / signal_message)
  3. probe manifold.chip.status
  4. harvest candidate browser-site lookup keys from everything seen,
     then fetch each site page via manifold.artifacts.fetch
  5. transcript of every frame -> JSONL

No mutating commands are ever sent.
"""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
import time
import uuid
from pathlib import Path

from websockets.asyncio.client import connect as ws_connect

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "live_archive"
(OUT / "artifacts").mkdir(parents=True, exist_ok=True)

WS_URL = "wss://os.inori.ai/api/arcade/web/v1"
LOCALE = "zh-CN"

ARTIFACT_TYPES = [
    "mail", "file", "signal_thread", "signal_message",
    "note", "docx", "pdf", "image", "download",
    "browser_bookmark", "bookmark", "history_entry", "chat_log",
]

URL_RE = re.compile(r"\b(?:https?://|www\.)[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+", re.I)
DOMAIN_RE = re.compile(r"\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|ai|tech|dev|xyz|me|info|blog|space|site|online)\b", re.I)


def log(msg: str) -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


_responses: dict[str, list] = {}
_seen: set[str] = set()


async def recv_loop(ws):
    try:
        async for raw in ws:
            ts = time.time()
            try:
                data = json.loads(raw)
            except Exception:
                data = {"_raw": str(raw)[:500]}
            with open(OUT / "transcript.jsonl", "a", encoding="utf-8") as f:
                f.write(json.dumps({"ts": ts, "dir": "in", "msg": data}, ensure_ascii=False) + "\n")
            _responses.setdefault(data.get("type", "?"), []).append(data)
            if data.get("type") == "error":
                log(f"◀ error: {json.dumps(data, ensure_ascii=False)[:240]}")
    except Exception as e:
        log(f"receiver ended: {e!r}")


async def event_roundtrip(ws, channel: str, payload: dict, resp_channel: str, timeout=8.0):
    rid = uuid.uuid4().hex[:16]
    msg = {"type": "event", "channel": channel, "cartridgeId": "manifold.web",
           "requestId": rid, "payload": payload}
    # mark current responses as seen so we only catch fresh ones
    for e in _responses.get("event", []):
        _seen.add(json.dumps(e, sort_keys=True))
    await ws.send(json.dumps(msg))
    deadline = time.time() + timeout
    while time.time() < deadline:
        await asyncio.sleep(0.12)
        for e in _responses.get("event", []):
            k = json.dumps(e, sort_keys=True)
            if e.get("channel") == resp_channel and k not in _seen:
                _seen.add(k)
                return e.get("payload")
    return None


def harvest_lookups(obj, found: set):
    if isinstance(obj, str):
        for m in URL_RE.findall(obj):
            found.add(m.rstrip(".,;)】」』"))
        for m in DOMAIN_RE.findall(obj):
            pass  # domain regex findall returns TLD-only groups; handled below
        for m in re.finditer(DOMAIN_RE, obj):
            found.add(m.group(0))
    elif isinstance(obj, list):
        for x in obj:
            harvest_lookups(x, found)
    elif isinstance(obj, dict):
        for v in obj.values():
            harvest_lookups(v, found)


async def main():
    ticket = subprocess.run(
        [sys.executable, str(HERE / "fetch_ticket.py")],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    log(f"ticket ok ({len(ticket)} chars)")

    headers = {"Origin": "https://os.inori.ai", "User-Agent": "Mozilla/5.0"}
    async with ws_connect(
        WS_URL, subprotocols=["arcade.v1", f"ticket.{ticket}"],
        additional_headers=headers, max_size=50 * 1024 * 1024,
    ) as ws:
        log("connected")
        receiver = asyncio.create_task(recv_loop(ws))

        await ws.send(json.dumps({"type": "open_my_web_world", "locale": LOCALE}))
        for _ in range(80):
            await asyncio.sleep(0.25)
            if "world_joined" in _responses or "world_created" in _responses or "error" in _responses:
                break
        wj = (_responses.get("world_joined") or _responses.get("world_created") or [{}])[0]
        world_id = (wj.get("world") or {}).get("worldId", "")
        cartridges = ((wj.get("world") or {}).get("mountedCartridges") or [])
        log(f"world={world_id} cartridges={[c.get('cartridgeId') for c in cartridges]}")

        snapshot = {"world_joined": wj, "cartridges": {}}
        for c in cartridges:
            snapshot["cartridges"][c.get("cartridgeId")] = c.get("runtimes", [])
        (OUT / "world_snapshot.json").write_text(
            json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")

        # 1) artifacts by type ------------------------------------------------
        index = {}
        for atype in ARTIFACT_TYPES:
            resp = await event_roundtrip(
                ws, "manifold.artifacts.request", {"artifactType": atype},
                "manifold.artifacts.response")
            entry = {"ok": False}
            if resp is None:
                entry["error"] = "timeout"
            elif resp.get("ok"):
                arts = resp.get("artifacts", [])
                entry = {"ok": True, "count": len(arts)}
                if arts:
                    (OUT / "artifacts" / f"{atype}.json").write_text(
                        json.dumps(arts, ensure_ascii=False, indent=2), encoding="utf-8")
            else:
                entry["error"] = str(resp.get("error"))[:300]
            index[atype] = entry
            log(f"{atype}: {entry}")

        # 2) chip status -------------------------------------------------------
        resp = await event_roundtrip(ws, "manifold.chip.status", {},
                                     "manifold.chip.status.result")
        (OUT / "chip_status.json").write_text(
            json.dumps(resp, ensure_ascii=False, indent=2), encoding="utf-8")
        log(f"chip.status: {'ok' if resp else 'no response'}")

        # 3) browser page lookups ---------------------------------------------
        lookups: set[str] = set()
        harvest_lookups(snapshot, lookups)
        for f in (OUT / "artifacts").glob("*.json"):
            if f.name.startswith("_"):
                continue
            harvest_lookups(json.loads(f.read_text(encoding="utf-8")), lookups)

        browsed = {}
        ok_pages = 0
        for lk in sorted(lookups)[:60]:
            lk_clean = lk.replace("https://", "").replace("http://", "").rstrip("/")
            payload = {"artifactType": "browser_page", "lookup_key": lk_clean}
            resp = await event_roundtrip(
                ws, "manifold.artifacts.fetch", payload,
                "manifold.artifacts.fetch.response")
            got = bool(resp and resp.get("ok"))
            if got:
                safe = re.sub(r"[^A-Za-z0-9_.-]", "_", lk_clean)[:80]
                (OUT / "artifacts" / f"browser__{safe}.json").write_text(
                    json.dumps(resp, ensure_ascii=False, indent=2), encoding="utf-8")
                ok_pages += 1
            browsed[lk_clean] = {"ok": got,
                                 "err": None if got else str((resp or {}).get("error", "timeout"))[:120]}
        (OUT / "artifacts" / "_browser_fetch.json").write_text(
            json.dumps(browsed, ensure_ascii=False, indent=2), encoding="utf-8")
        log(f"browser pages fetched: {ok_pages}/{len(browsed)}")

        await asyncio.sleep(2)
        receiver.cancel()

    frames = sum(1 for _ in open(OUT / "transcript.jsonl", encoding="utf-8"))
    log(f"DONE. frames={frames}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
