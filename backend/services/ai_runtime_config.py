"""Ephemeral AI configuration supplied by the browser Settings app.

The browser persists its preferences locally, then sends the active settings
through the existing Arcade ``event`` channel.  The server keeps the decoded
configuration in a ContextVar so it follows the WebSocket task (and chat reply
tasks spawned from it) without ever entering cartridge state, transitions, or
Durable Object storage.
"""

from __future__ import annotations

from contextvars import ContextVar
from typing import Any, Dict
from urllib.parse import urlsplit

_ALLOWED_PROVIDERS = {"openai-compatible", "anthropic"}
_RUNTIME_AI_CONFIG: ContextVar[Dict[str, Any] | None] = ContextVar(
    "nori_runtime_ai_config", default=None
)


def _text(value: Any, *, limit: int) -> str:
    if not isinstance(value, str):
        return ""
    value = value.strip()
    return value[:limit]


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
    # Never allow credentials in a URL; API credentials belong in the
    # dedicated key field and must not appear in logs, traces, or error URLs.
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


def _integer(value: Any, default: int, low: int, high: int) -> int:
    if isinstance(value, bool):
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(low, min(high, parsed))


def sanitize_runtime_ai_config(raw: Any) -> Dict[str, Any]:
    """Validate an untrusted browser configuration.

    API keys are accepted for the current WebSocket execution context but are
    intentionally absent from :func:`public_runtime_ai_summary` and from every
    cartridge state/transition.
    """
    if not isinstance(raw, dict):
        raw = {}

    provider = _text(raw.get("provider"), limit=40).lower()
    if provider not in _ALLOWED_PROVIDERS:
        provider = "openai-compatible"

    return {
        "enabled": raw.get("enabled") is True,
        "provider": provider,
        "baseUrl": _base_url(raw.get("baseUrl")),
        "model": _text(raw.get("model"), limit=200),
        "apiKey": _text(raw.get("apiKey"), limit=2048),
        "systemPrompt": _text(raw.get("systemPrompt"), limit=16000),
        "characterPrompt": _text(raw.get("characterPrompt"), limit=16000),
        "temperature": _number(raw.get("temperature"), 0.75, 0.0, 2.0),
        "maxTokens": _integer(raw.get("maxTokens"), 350, 32, 4096),
    }


def install_runtime_ai_config(raw: Any) -> Dict[str, Any]:
    """Install browser settings in the current WebSocket task context."""
    config = sanitize_runtime_ai_config(raw)
    _RUNTIME_AI_CONFIG.set(config)
    return config


def clear_runtime_ai_config() -> None:
    """Drop the current task's browser override (mainly useful in tests)."""
    _RUNTIME_AI_CONFIG.set(None)


def get_runtime_ai_config() -> Dict[str, Any]:
    config = _RUNTIME_AI_CONFIG.get()
    return dict(config) if isinstance(config, dict) else {}


def public_runtime_ai_summary(config: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Return acknowledgement metadata that can safely go back to the client."""
    cfg = config if isinstance(config, dict) else get_runtime_ai_config()
    return {
        "ok": True,
        "enabled": bool(cfg.get("enabled")),
        "provider": str(cfg.get("provider") or "openai-compatible"),
        "baseUrl": str(cfg.get("baseUrl") or ""),
        "model": str(cfg.get("model") or ""),
        "hasApiKey": bool(cfg.get("apiKey")),
        "systemPromptLength": len(str(cfg.get("systemPrompt") or "")),
        "characterPromptLength": len(str(cfg.get("characterPrompt") or "")),
        "temperature": cfg.get("temperature", 0.75),
        "maxTokens": cfg.get("maxTokens", 350),
    }
