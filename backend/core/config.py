"""Centralized configuration and environment definitions for Nori.Web."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

# Base Paths
CORE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CORE_DIR.parent
BASE_DIR = BACKEND_DIR.parent
PUBLIC_DIR = BASE_DIR / "public"
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Server Config
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "4173"))
DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

# Auth Config
SECRET_KEY = os.getenv("SECRET_KEY", "nori-os-secret-key-2026")
COOKIE_NAME = "arcade-auth_cookie"
SESSION_COOKIE_NAME = "arcade-auth_session_data"

# LLM / AI Config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

# TTS Config
TTS_ENGINE = os.getenv("TTS_ENGINE", "built-in")  # "built-in", "openai", "edge"

# Cloudflare-only behavior. The live archive is intentionally disabled by
# default in the public Worker deployment; local mode keeps the current default.
NORI_DISABLE_LIVE_PACK = os.getenv("NORI_DISABLE_LIVE_PACK", "")

_RUNTIME_BINDINGS = (
    "SECRET_KEY",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_MODEL",
    "TTS_ENGINE",
    "NORI_DISABLE_LIVE_PACK",
)


def _binding_value(env: Any, name: str) -> str | None:
    """Read a string-like Workers binding without depending on Pyodide types."""
    try:
        value = getattr(env, name)
    except Exception:
        return None
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        converted = value.to_py()
    except Exception:
        converted = value
    return converted if isinstance(converted, str) else str(converted)


def apply_runtime_bindings(env: Any) -> None:
    """Overlay Cloudflare vars/secrets onto the module-level configuration.

    Workers bindings are passed through the request environment rather than the
    host process environment, so regular ``os.getenv`` calls cannot see them.
    Local Uvicorn behavior is unchanged because this function is only invoked by
    the Cloudflare entrypoint.
    """
    namespace = globals()
    for name in _RUNTIME_BINDINGS:
        value = _binding_value(env, name)
        if value is not None:
            namespace[name] = value
