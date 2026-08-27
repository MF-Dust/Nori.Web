"""Loader for the optional live-world archive pack (`live_world_pack.json`).

The pack is produced by `scraper/import_pack.py` from a read-only scrape of
the production NoriOS world. When present, the backend replays the user's
real mail / files / Signal threads / browser sites / story facts instead of
the built-in mock data. Every accessor returns deep copies so handlers can
mutate freely without corrupting the shared cache.
"""

from __future__ import annotations

import copy
import json
import os
import re
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlsplit

PACK_PATH = Path(__file__).resolve().parents[1] / "data" / "live_world_pack.json"
# NORI_DISABLE_LIVE_PACK=1 → ignore the archive entirely (mock-data mode).
_DISABLED = os.getenv("NORI_DISABLE_LIVE_PACK", "").strip().lower() in {"1", "true", "yes", "on"}

_lock = threading.Lock()
_cache: Optional[Dict[str, Any]] = None


def _pack() -> Optional[Dict[str, Any]]:
    global _cache
    if _DISABLED:
        return None
    if _cache is not None:
        return _cache
    with _lock:
        if _cache is not None:
            return _cache
        if not PACK_PATH.is_file():
            return None
        try:
            data = json.loads(PACK_PATH.read_text(encoding="utf-8"))
        except Exception as exc:  # corrupted pack must not break the server
            print(f"[live_pack] failed to load {PACK_PATH}: {exc}")
            return None
        if not isinstance(data, dict):
            return None
        _cache = data
        return _cache


def is_available() -> bool:
    return not _DISABLED and _pack() is not None


def summary() -> str:
    p = _pack()
    if not p:
        return "live pack: not installed"
    return (
        f"live pack: mails={len(p.get('mail_artifacts', []))} "
        f"files={len(p.get('file_artifacts', []))} "
        f"threads={len(p.get('signal_thread_artifacts', []))} "
        f"messages={len(p.get('signal_message_artifacts', []))} "
        f"pages={len(p.get('browser_pages', []))} "
        f"facts={len(p.get('facts', {}))} world={p.get('world_id', '')}"
    )


def _list(key: str) -> List[Dict[str, Any]]:
    p = _pack()
    if not p:
        return []
    val = p.get(key)
    return copy.deepcopy(val) if isinstance(val, list) else []


def mail_artifacts() -> List[Dict[str, Any]]:
    return _list("mail_artifacts")


def file_artifacts() -> List[Dict[str, Any]]:
    return _list("file_artifacts")


def signal_thread_artifacts() -> List[Dict[str, Any]]:
    return _list("signal_thread_artifacts")


def signal_message_artifacts() -> List[Dict[str, Any]]:
    return _list("signal_message_artifacts")


_PAGE_INDEX: Optional[Dict[str, Dict[str, Any]]] = None


def _canonical(url: str) -> str:
    """Scheme/query-preserving canonicalization.

    Live lookups distinguish http vs https AND rely on query strings
    (e.g. ``/t/1822?b=recent`` and the IPv6 cloud drive), so only host case,
    fragment, and duplicate slashes are normalized.
    """
    raw = (url or "").strip()
    try:
        parts = urlsplit(raw)
    except Exception:
        return raw.lower()
    if not parts.netloc:
        return re.sub(r"/{2,}", "/", raw).lower()
    path = re.sub(r"/{2,}", "/", parts.path or "")
    query = f"?{parts.query}" if parts.query else ""
    return f"{parts.scheme.lower()}://{parts.netloc.lower()}{path}{query}"


def page(lookup_key: str) -> Optional[Dict[str, Any]]:
    """Find an archived browser page by any recorded lookup alias.

    The production server keys pages on exact scheme+query (e.g.
    ``/t/1843?b=intel`` differs from ``/t/1843?b=recent`` only by which board
    highlighted it), so we index every alias the archive captured plus a few
    auto-relaxed variants to stay forgiving with client-constructed URLs.
    """
    global _PAGE_INDEX
    if not lookup_key:
        return None
    if _PAGE_INDEX is None:
        idx: Dict[str, Dict[str, Any]] = {}
        for entry in _list("browser_pages"):
            entries_for_page: List[Dict[str, Any]] = [entry]
            variants: set[str] = set()
            for alias in ({entry.get("key"), (entry.get("data") or {}).get("url")}
                          | set(entry.get("aliases") or [])):
                if not alias:
                    continue
                c = _canonical(alias)
                variants.add(c)
                variants.add(c.rstrip("/"))
                variants.add(c + "/")
                if "://" in c:
                    swapped = ("https://" + c.split("://", 1)[1]
                               if c.startswith("http://")
                               else "http://" + c.split("://", 1)[1])
                    variants.add(swapped)
                    variants.add(swapped.rstrip("/"))
            for v in variants:
                if v and v not in idx:
                    prev = next((e for e in entries_for_page), entry)
                    idx[v] = prev
            for v in variants:
                idx.setdefault(v, entry)
        _PAGE_INDEX = idx
    canon = _canonical(lookup_key)
    entry = _PAGE_INDEX.get(canon)
    if not entry:
        # Query-insensitive fallback: single-page apps such as the Doodle
        # search shim serve EVERY ``?q=…`` lookup from one archived page.
        base_no_q = canon.split("?", 1)[0]
        candidates = {k: e for k, e in _PAGE_INDEX.items()
                      if k.split("?", 1)[0] == base_no_q and "?" not in k}
        if len({id(e) for e in candidates.values()}) == 1:
            entry = next(iter(candidates.values()))
    if not entry:
        return None
    out = copy.deepcopy(entry)
    return out


def all_pages_raw() -> List[Dict[str, Any]]:
    """Pages in archived form: {'key': ..., 'id': ..., 'data': {...}}."""
    return _list("browser_pages")


def facts() -> Dict[str, Any]:
    p = _pack()
    if not p:
        return {}
    val = p.get("facts")
    return copy.deepcopy(val) if isinstance(val, dict) else {}


def variables() -> Dict[str, Any]:
    p = _pack()
    if not p:
        return {}
    val = p.get("variables")
    return copy.deepcopy(val) if isinstance(val, dict) else {}


def chip_status() -> Optional[Dict[str, Any]]:
    p = _pack()
    if not p:
        return None
    val = p.get("chip_status")
    return copy.deepcopy(val) if isinstance(val, dict) else None
