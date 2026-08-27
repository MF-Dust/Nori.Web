"""Build backend/data/live_world_pack.json from the scraped live archive.

Also merges live_archive/webAssets/** into public/webAssets/** so the
local server serves every referenced asset.
"""
from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / "live_archive"
PACK_PATH = ROOT / "backend" / "data" / "live_world_pack.json"
PUBLIC_ASSETS = ROOT / "public" / "webAssets"


def log(msg):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    print(msg, flush=True)


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def canonical_page_key(url: str) -> str:
    """Normalize host casing / duplicate slashes ONLY.

    Scheme, query string and path text are significant to the live lookup:
    ``http://[v6]/drive/folders/x`` and ``http://futurum-prize…/claim`` only
    answer on their original scheme+query, so nothing may be dropped here.
    """
    u = url.split("#")[0].strip()
    parsed = urlparse(u)
    if not parsed.netloc:
        return ""
    netloc = parsed.netloc.lower()
    path = re.sub(r"/{2,}", "/", parsed.path)
    query = f"?{parsed.query}" if parsed.query else ""
    return f"{parsed.scheme}://{netloc}{path}{query}"


def collect_pages() -> list[dict]:
    lookup_index_path = ARCHIVE / "pages" / "_lookup_index.json"
    lookup_index = load_json(lookup_index_path) if lookup_index_path.exists() else {}

    pages: dict[str, dict] = {}
    for f in sorted((ARCHIVE / "pages").glob("*.json")):
        if f.name.startswith("_"):
            continue
        art = load_json(f)
        data = art.get("data") or {}
        # alias set = every exact lookup that worked on the live server,
        # plus the server-normalized data.url. Missing any of these breaks
        # offline resolution (queries/schemes get stripped upstream).
        aliases = {canonical_page_key(a) for a in lookup_index.get(f.name, [])}
        aliases.add(canonical_page_key(data.get("url", "")))
        aliases.discard("")
        key = sorted(aliases)[0] if aliases else ""
        if not key:
            continue
        if key in pages:  # same page reached via multiple boards — merge
            pages[key]["aliases"] = sorted(set(pages[key]["aliases"]) | aliases)
            continue
        pages[key] = {
            "key": key,
            "id": art.get("id", key),
            "data": data,
            "aliases": sorted(aliases),
        }
    log(f"browser pages: {len(pages)} unique "
        f"({sum(len(p['aliases']) for p in pages.values())} aliases)")
    return list(pages.values())


def main():
    pack = {
        "_meta": {
            "source": "os.inori.ai live archive (read-only scrape)",
            "imported_at": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
        },
        "mail_artifacts": load_json(ARCHIVE / "artifacts" / "mail.json"),
        "file_artifacts": load_json(ARCHIVE / "artifacts" / "file.json"),
        "signal_thread_artifacts": load_json(ARCHIVE / "artifacts" / "signal_thread.json"),
        "signal_message_artifacts": load_json(ARCHIVE / "artifacts" / "signal_message.json"),
        "browser_pages": collect_pages(),
    }

    snap = load_json(ARCHIVE / "world_snapshot.json")
    runs = snap["cartridges"]["manifold.web"]
    st = runs[0]["state"] if isinstance(runs, list) and runs else {}
    pack["facts"] = st.get("facts", {})
    pack["variables"] = st.get("variables", {})
    world_id = ((snap.get("world_joined", {}).get("world") or {}).get("worldId", ""))
    pack["world_id"] = world_id
    pack["_meta"]["world_id"] = world_id

    session_resp = snap.get("world_joined", {})
    pack["mounted_cartridges"] = [c.get("cartridgeId")
                                  for c in (session_resp.get("world") or {}).get("mountedCartridges", [])]

    chip = ARCHIVE / "chip_status.json"
    if chip.exists():
        pack["chip_status"] = load_json(chip)

    PACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    PACK_PATH.write_text(json.dumps(pack, ensure_ascii=False, indent=1), encoding="utf-8")
    size_mb = PACK_PATH.stat().st_size / 1024 / 1024
    log(f"pack written: {PACK_PATH} ({size_mb:.2f} MB)")

    # ---- merge static assets into public/webAssets -------------------------
    src_root = ARCHIVE / "webAssets"
    copied = skipped = 0
    if src_root.exists():
        for src in src_root.rglob("*"):
            if not src.is_file():
                continue
            rel = src.relative_to(src_root)
            dst = PUBLIC_ASSETS / rel
            if dst.exists() and dst.stat().st_size == src.stat().st_size:
                skipped += 1
                continue
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            copied += 1
    total = sum(1 for _ in PUBLIC_ASSETS.rglob("*") if _.is_file())
    log(f"assets: copied={copied} skipped(existing)={skipped} public_total={total}")


if __name__ == "__main__":
    main()
