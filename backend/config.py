"""Backward-compatibility re-export for `backend.core.config`."""

from .core.config import (
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL,
    BASE_DIR,
    COOKIE_NAME,
    DATA_DIR,
    DEBUG,
    HOST,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL,
    PORT,
    PUBLIC_DIR,
    SECRET_KEY,
    SESSION_COOKIE_NAME,
    TTS_ENGINE,
)

__all__ = [
    "BASE_DIR",
    "PUBLIC_DIR",
    "DATA_DIR",
    "HOST",
    "PORT",
    "DEBUG",
    "SECRET_KEY",
    "COOKIE_NAME",
    "SESSION_COOKIE_NAME",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_MODEL",
    "TTS_ENGINE",
]
