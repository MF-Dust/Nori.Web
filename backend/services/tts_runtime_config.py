"""Ephemeral TTS configuration supplied by the browser Settings app.

The browser keeps provider credentials in browser storage and sends the active
configuration immediately before a chat dispatch. The server stores it in a
ContextVar so chat reply tasks inherit the configuration without writing
credentials into world state, transitions, or Durable Object persistence.
"""

from __future__ import annotations

from contextvars import ContextVar
from typing import Any, Dict
from urllib.parse import urlsplit

_ALLOWED_PROVIDERS = {
    "openai-compatible",
    "custom",
    "gpt-sovits",
    "minimax",
    "gemini",
}
_RUNTIME_TTS_CONFIG: ContextVar[Dict[str, Any] | None] = ContextVar(
    "nori_runtime_tts_config", default=None
)


def _text(value: Any, *, limit: int) -> str:
    if not isinstance(value, str):
        return ""
    return value.strip()[:limit]


def _base_url(value: Any) -> str:
    raw = _text(value, limit=1000).rstrip("/")
    if not raw:
        return ""
    try:
        parsed = urlsplit(raw)
    except Exception:
        return ""
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return ""
    if parsed.username is not None or parsed.password is not None:
        return ""
    return raw


def _number(value: Any, default: float, low: float, high: float) -> float:
    if isinstance(value, bool):
        return default
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    return max(low, min(high, parsed))


def sanitize_runtime_tts_config(raw: Any) -> Dict[str, Any]:
    """Validate an untrusted browser TTS configuration."""
    if not isinstance(raw, dict):
        raw = {}

    provider = _text(raw.get("provider"), limit=40).lower()
    if provider not in _ALLOWED_PROVIDERS:
        provider = "openai-compatible"

    return {
        "enabled": raw.get("enabled") is True,
        "provider": provider,
        "baseUrl": _base_url(raw.get("baseUrl")),
        "apiKey": _text(raw.get("apiKey"), limit=2048),
        "model": _text(raw.get("model"), limit=200),
        "voice": _text(raw.get("voice"), limit=200),
        "speed": _number(raw.get("speed"), 1.0, 0.25, 4.0),
        "refAudio": _text(raw.get("refAudio"), limit=4000),
        "promptText": _text(raw.get("promptText"), limit=4000),
        "promptLang": _text(raw.get("promptLang"), limit=40) or "zh",
        "textLang": _text(raw.get("textLang"), limit=40) or "zh",
    }


def install_runtime_tts_config(raw: Any) -> Dict[str, Any]:
    config = sanitize_runtime_tts_config(raw)
    _RUNTIME_TTS_CONFIG.set(config)
    return config


def clear_runtime_tts_config() -> None:
    _RUNTIME_TTS_CONFIG.set(None)


def get_runtime_tts_config() -> Dict[str, Any]:
    config = _RUNTIME_TTS_CONFIG.get()
    return dict(config) if isinstance(config, dict) else {}


def public_runtime_tts_summary(config: Dict[str, Any] | None = None) -> Dict[str, Any]:
    cfg = config if isinstance(config, dict) else get_runtime_tts_config()
    return {
        "ok": True,
        "enabled": bool(cfg.get("enabled")),
        "provider": str(cfg.get("provider") or "openai-compatible"),
        "baseUrl": str(cfg.get("baseUrl") or ""),
        "model": str(cfg.get("model") or ""),
        "voice": str(cfg.get("voice") or ""),
        "speed": cfg.get("speed", 1.0),
        "hasApiKey": bool(cfg.get("apiKey")),
        "hasReferenceAudio": bool(cfg.get("refAudio")),
    }
