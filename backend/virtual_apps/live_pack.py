"""Loader for the optional live-world archive pack (`live_world_pack.json`).

The pack is produced by `scraper/import_pack.py` from a read-only scrape of
the production NoriOS world. Local deployments can read the complete JSON from
disk. Cloudflare installs a small core snapshot first and attaches artifact
sections on demand from private R2 objects so the Python Durable Object stays
well below the 128 MiB isolate memory limit.
"""

from __future__ import annotations

import copy
import json
import os
import re
import threading
from contextvars import ContextVar
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional
from urllib.parse import urlsplit

PACK_PATH = Path(__file__).resolve().parents[1] / "data" / "live_world_pack.json"
_DISABLED = os.getenv("NORI_DISABLE_LIVE_PACK", "").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

_lock = threading.Lock()
_cache: Optional[Dict[str, Any]] = None
_PAGE_INDEX: Optional[Dict[str, Dict[str, Any]]] = None

RuntimePackLoader = Callable[[], Awaitable[bool]]
_RUNTIME_PACK_LOADER: ContextVar[Optional[RuntimePackLoader]] = ContextVar(
    "nori_runtime_pack_loader", default=None
)

_SECTION_KEYS = {
    "mail_artifacts",
    "file_artifacts",
    "signal_thread_artifacts",
    "signal_message_artifacts",
    "browser_pages",
}


def set_disabled(disabled: bool) -> None:
    """Enable or disable archive replay at runtime."""
    global _DISABLED, _cache, _PAGE_INDEX
    _DISABLED = disabled
    if disabled:
        _cache = None
        _PAGE_INDEX = None


def install_pack(data: Dict[str, Any]) -> bool:
    """Install a complete already-decoded archive."""
    if not isinstance(data, dict):
        return False
    global _DISABLED, _cache, _PAGE_INDEX
    with _lock:
        _cache = data
        _PAGE_INDEX = None
        _DISABLED = False
    return True


def install_core(data: Dict[str, Any]) -> bool:
    """Install the lightweight archive core while keeping heavy sections lazy."""
    if not isinstance(data, dict):
        return False
    global _DISABLED, _cache, _PAGE_INDEX
    with _lock:
        core = {key: value for key, value in data.items() if key not in _SECTION_KEYS}
        _cache = core
        _PAGE_INDEX = None
        _DISABLED = False
    return True


def install_section(key: str, value: Any) -> bool:
    """Install one artifact section fetched from R2."""
    if key not in _SECTION_KEYS or not isinstance(value, list):
        return False
    global _DISABLED, _cache, _PAGE_INDEX
    with _lock:
        if _cache is None:
            _cache = {}
        _cache[key] = value
        if key == "browser_pages":
            _PAGE_INDEX = None
        _DISABLED = False
    return True


def replace_browser_pages(pages: List[Dict[str, Any]]) -> bool:
    """Replace the in-memory browser shard, bounding browser replay memory."""
    if not isinstance(pages, list):
        return False
    return install_section("browser_pages", pages)


def section_loaded(key: str) -> bool:
    p = _cache
    return not _DISABLED and isinstance(p, dict) and key in p


def has_loaded_pack() -> bool:
    """Return whether at least the archive core is resident."""
    return not _DISABLED and _cache is not None


def bind_runtime_loader(loader: RuntimePackLoader):
    """Bind the async Cloudflare core loader for the current ASGI task."""
    return _RUNTIME_PACK_LOADER.set(loader)


def reset_runtime_loader(token) -> None:
    _RUNTIME_PACK_LOADER.reset(token)


async def ensure_runtime_pack() -> bool:
    """Ensure the core archive is present before constructing WorldSession."""
    if _DISABLED:
        return False
    if has_loaded_pack():
        return True

    loader = _RUNTIME_PACK_LOADER.get()
    if loader is not None:
        try:
            await loader()
        except Exception as exc:
            print(f"[live_pack] runtime loader failed: {exc}")
        if has_loaded_pack():
            return True

    return _pack() is not None


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
        except Exception as exc:
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

    def count(key: str) -> str:
        value = p.get(key)
        return str(len(value)) if isinstance(value, list) else "lazy"

    facts_value = p.get("facts")
    fact_count = len(facts_value) if isinstance(facts_value, dict) else 0
    return (
        f"live pack: mails={count('mail_artifacts')} "
        f"files={count('file_artifacts')} "
        f"threads={count('signal_thread_artifacts')} "
        f"messages={count('signal_message_artifacts')} "
        f"pages={count('browser_pages')} "
        f"facts={fact_count} world={p.get('world_id', '')}"
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


def canonical_lookup(url: str) -> str:
    """Scheme/query-preserving canonicalization used by local and R2 indexes."""
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


def lookup_variants(url: str) -> set[str]:
    """Return the forgiving URL variants used by the archived browser."""
    c = canonical_lookup(url)
    variants = {c, c.rstrip("/"), c.rstrip("/") + "/"}
    if "://" in c:
        swapped = (
            "https://" + c.split("://", 1)[1]
            if c.startswith("http://")
            else "http://" + c.split("://", 1)[1]
        )
        variants.update({swapped, swapped.rstrip("/"), swapped.rstrip("/") + "/"})
    return {item for item in variants if item}


def page(lookup_key: str) -> Optional[Dict[str, Any]]:
    """Find an archived browser page in the currently installed local/R2 shard."""
    global _PAGE_INDEX
    if not lookup_key:
        return None
    if _PAGE_INDEX is None:
        idx: Dict[str, Dict[str, Any]] = {}
        for entry in _list("browser_pages"):
            aliases = {
                entry.get("key"),
                (entry.get("data") or {}).get("url"),
                *(entry.get("aliases") or []),
            }
            for alias in aliases:
                if not alias:
                    continue
                for variant in lookup_variants(str(alias)):
                    idx.setdefault(variant, entry)
        _PAGE_INDEX = idx

    canon = canonical_lookup(lookup_key)
    entry = _PAGE_INDEX.get(canon)
    if not entry:
        base_no_q = canon.split("?", 1)[0]
        candidates = {
            key: value
            for key, value in _PAGE_INDEX.items()
            if key.split("?", 1)[0] == base_no_q and "?" not in key
        }
        if len({id(value) for value in candidates.values()}) == 1:
            entry = next(iter(candidates.values()))
    return copy.deepcopy(entry) if entry else None


def all_pages_raw() -> List[Dict[str, Any]]:
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
