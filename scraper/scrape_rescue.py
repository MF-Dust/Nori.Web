"""Rescue crawl for lookups mangled by scheme-forcing normalization.

The live server treats ``http://`` and ``https://`` lookups as distinct keys
(e.g. an IPv6-literal cloud drive only answers on its original scheme), so
this pass preserves the exact URL text found in archives while probing.
"""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
import time
import urllib.request
from collections import deque
from pathlib import Path
from urllib.parse import urljoin

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape_pass2 import Session, join_world, collect_from_page, HREF_RE, WEBASSET_RE  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "live_archive"
PAGES = OUT / "pages"

_DRIFT = "https://driftnet3jo3cp2q4dzwsoaiph5qxr5axirfxjcq4dzpmotxvct3qhvd.onion"
SEEDS = [
    "http://[2001:db8:f7c0::1a]/drive/folders/0AH7kQf9R2aVb8Uk",
    "http://futurum-prize.verify-now.com/claim",
    *[f"{_DRIFT}/b/{b}" for b in ("action", "chat", "intel", "jobs", "pinned", "tools")],
    *[f"{_DRIFT}/t/{t}?b=recent" for t in (1822, 1834, 1835, 1837, 1840, 1841, 1842, 1843, 1846)],
]


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def scheme_preserving_key(u: str) -> str:
    """Keep scheme/host/path verbatim; drop fragment only."""
    return u.split("#", 1)[0].strip()


LOOKUP_INDEX = PAGES / "_lookup_index.json"


def load_lookup_index() -> dict:
    if LOOKUP_INDEX.exists():
        return json.loads(LOOKUP_INDEX.read_text(encoding="utf-8"))
    # backfill: one exact lookup per existing page derived from data.url
    idx: dict = {}
    for f in PAGES.glob("*.json"):
        if f.name.startswith("_"):
            continue
        art = json.loads(f.read_text(encoding="utf-8"))
        u = ((art.get("data") or {}).get("url") or "").strip()
        if u:
            k = scheme_preserving_key(u).rstrip("/")
            idx[k] = f.name
    return idx


def known_page_urls() -> set[str]:
    return set(load_lookup_index().keys())


def record_lookup(filename: str, lookup: str) -> None:
    idx = load_lookup_index()
    entries = idx.setdefault(filename, [])
    k = scheme_preserving_key(lookup)
    if k not in entries and lookup not in entries:
        entries.append(lookup)
        idx[filename] = entries
        LOOKUP_INDEX.write_text(json.dumps(idx, ensure_ascii=False, indent=1),
                                encoding="utf-8")


async def main():
    seen = known_page_urls()
    log(f"{len(seen)} pages already archived")

    frontier: deque[str] = deque()
    enqueued = {s.rstrip("/") for s in SEEDS}
    for s in SEEDS:
        frontier.append(s)

    ticket = subprocess.run([sys.executable, str(HERE_TICKET)],
                            capture_output=True, text=True, check=True).stdout.strip()
    s, ws = await join_world(ticket)

    ok = miss = 0
    all_assets: set[str] = set()
    saved_files: list[str] = []
    try:
        while frontier:
            target = frontier.popleft()
            variants = [target] if target.endswith("/") else [target, target + "/"]
            art = None
            used = None
            for v in variants:
                resp = await s.roundtrip(
                    "manifold.artifacts.fetch",
                    {"artifactType": "browser_page", "lookup_key": v},
                    "manifold.artifacts.fetch.response", timeout=7)
                if resp and resp.get("ok"):
                    art, used = resp["artifact"], v
                    idx = load_lookup_index()
                    prior_file = None
                    artifact_id = art.get("id")
                    if LOOKUP_INDEX.exists():
                        for k, fn in load_lookup_index().items():
                            if k.rstrip("/") == scheme_preserving_key(v).rstrip("/"):
                                prior_file = fn
                    seen.add(used)
                    break
                if resp is None:
                    break
            if art is None:
                miss += 1
                continue
            ok += 1
            safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", used.replace("://", "_").replace("[", "").replace("]", ""))[:100]
            (PAGES / f"{safe}.json").write_text(
                json.dumps(art, ensure_ascii=False, indent=2), encoding="utf-8")
            saved_files.append(used)
            d_ = art.get("data") or {}
            if d_.get("url"):
                record_lookup(safe + ".json", scheme_preserving_key(d_["url"]))
            for variant in variants[:variants.index(used) + 1]:
                record_lookup(safe + ".json", scheme_preserving_key(variant))
            log(f"saved {used}")

            txt = json.dumps(art, ensure_ascii=False)
            all_assets |= set(WEBASSET_RE.findall(txt))
            html = (art.get("data") or {}).get("body_html") or ""
            base = (art.get("data") or {}).get("url") or used
            for mm in HREF_RE.findall(html):
                href = mm.strip()
                if href.startswith(("mailto:", "javascript:", "/webAssets/")):
                    continue
                abs_u = urljoin(base, href)
                abs_u = abs_u.split("#", 1)[0].rstrip("/")
                low = abs_u.lower()
                if any(h in low for h in REAL_HOSTS):
                    continue
                k = scheme_preserving_key(abs_u)
                if k and k.rstrip("/") not in seen and len(k) <= 160:
                    seen.add(k.rstrip("/"))
                    frontier.append(k)
        log(f"rescue done: ok={ok} miss={miss}")
    finally:
        try:
            await ws.close()
        except Exception:
            pass

    # download newly referenced assets
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
    log(f"assets: new={got} existing={skip} failed={fail}")
    (PAGES / "_rescue_index.json").write_text(json.dumps({
        "saved": saved_files}, ensure_ascii=False, indent=2), encoding="utf-8")


HERE_TICKET = Path(__file__).resolve().parent / "fetch_ticket.py"
REAL_HOSTS = ("googleusercontent", "convex.cloud", "convex.site", "inori.ai",
              "github.com", "fonts.googleapis", "jsdelivr", "steam", "bilibili",
              "bit.ly", "spellbrush.com")

if __name__ == "__main__":
    asyncio.run(main())
