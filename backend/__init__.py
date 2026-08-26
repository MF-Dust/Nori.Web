"""Nori.Web backend package."""

from .core.config import (
    BASE_DIR,
    DEBUG,
    HOST,
    PORT,
    PUBLIC_DIR,
)

__all__ = ["BASE_DIR", "PUBLIC_DIR", "HOST", "PORT", "DEBUG"]
