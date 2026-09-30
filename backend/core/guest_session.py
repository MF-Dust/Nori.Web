"""Stateless browser guest sessions shared by ASGI and Workers cold paths."""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time

from . import config

SESSION_COOKIE = "arcade-auth.session_token"
GUEST_PREFIX = "guest.v1."
SESSION_TTL = 30 * 24 * 60 * 60


def auto_guest_enabled() -> bool:
    return os.getenv("NORI_AUTO_GUEST", "true").strip().lower() not in {"0", "false", "no"}


def cookie_token(headers) -> str | None:
    # Prefer the browser cookie; an old bundle may still send a stale localStorage
    # cookie in Better-Auth-Cookie after a session has been rotated.
    for header in ("cookie", "better-auth-cookie"):
        raw = headers.get(header) or ""
        for part in raw.split(";"):
            key, sep, value = part.strip().partition("=")
            if sep and (key == SESSION_COOKIE or key.endswith("session_token")):
                return value
    return None


def _signature(payload: str) -> str:
    return hmac.new(
        config.SECRET_KEY.encode("utf-8"), payload.encode("ascii"), hashlib.sha256
    ).hexdigest()


def guest_session(token: str | None) -> tuple[dict, bool]:
    """Validate a guest cookie or mint a new identity, never the shared legacy ID."""
    now = int(time.time())
    valid = False
    if token and token.startswith(GUEST_PREFIX):
        try:
            prefix, version, nonce, expiry, signature = token.split(".")
            expires_at = int(expiry)
            valid = (
                len(nonce) == 32
                and all(char in "0123456789abcdef" for char in nonce)
                and now < expires_at <= now + SESSION_TTL
                and len(signature) == 64
                and all(char in "0123456789abcdef" for char in signature)
                and hmac.compare_digest(_signature(f"{prefix}.{version}.{nonce}.{expiry}"), signature)
            )
        except (ValueError, UnicodeEncodeError):
            valid = False
    if not valid:
        nonce = secrets.token_hex(16)
        expires_at = now + SESSION_TTL
        payload = f"{GUEST_PREFIX}{nonce}.{expires_at}"
        token = f"{payload}.{_signature(payload)}"
    user_id = f"guest_{nonce}"
    return {
        "session": {
            "id": f"session_{user_id}",
            "userId": user_id,
            "token": token,
            "expiresAt": expires_at * 1000,
        },
        "user": {
            "id": user_id,
            "name": "Operator",
            "email": f"{user_id}@nori.local",
            "image": "/icon.png",
            "createdAt": (expires_at - SESSION_TTL) * 1000,
        },
    }, not valid


def auth_cookie_headers(token: str, *, secure: bool = False) -> dict[str, str]:
    cookie = (
        f"{SESSION_COOKIE}={token}; Path=/; Max-Age={SESSION_TTL}; HttpOnly; SameSite=Lax"
        + ("; Secure" if secure else "")
    )
    return {
        "Set-Cookie": cookie,
        "set-better-auth-cookie": cookie,
        "Cache-Control": "private, no-store",
    }
