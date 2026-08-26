"""Centralized configuration and environment definitions for Nori.Web."""

from __future__ import annotations

import os
from pathlib import Path

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
