"""Better-Auth compatible session and OTP authentication endpoints."""

from __future__ import annotations

import os
import secrets
import time
import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Request, Response

from ..core.config import COOKIE_NAME

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSION_COOKIE = "arcade-auth.session_token"
AUTO_GUEST = os.getenv("NORI_AUTO_GUEST", "true").strip().lower() not in {"0", "false", "no"}
DEV_OTP = os.getenv("NORI_DEV_OTP", "123456")

USERS: Dict[str, Dict[str, Any]] = {
    "guest-user-001": {
        "id": "guest-user-001",
        "name": "Operator",
        "email": "operator@nori.local",
        "image": "/icon.png",
        "createdAt": int(time.time() * 1000),
    }
}
SESSIONS: Dict[str, Dict[str, Any]] = {}
OTP_STORE: Dict[str, Dict[str, Any]] = {}


def _now_ms() -> int:
    return int(time.time() * 1000)


def _session_for_user(user: Dict[str, Any], token: Optional[str] = None) -> Dict[str, Any]:
    token = token or secrets.token_urlsafe(32)
    return {
        "session": {
            "id": f"session_{uuid.uuid4().hex}",
            "userId": user["id"],
            "token": token,
            "expiresAt": _now_ms() + 30 * 24 * 60 * 60 * 1000,
        },
        "user": user,
    }


def _cookie_token(request: Request) -> Optional[str]:
    raw = request.headers.get("better-auth-cookie") or request.headers.get("cookie") or ""
    for part in raw.split(";"):
        key, sep, value = part.strip().partition("=")
        if sep and (key == SESSION_COOKIE or key.endswith("session_token")):
            return value
    return None


def get_current_session(request: Request) -> Optional[Dict[str, Any]]:
    token = _cookie_token(request)
    if token:
        session = SESSIONS.get(token)
        if session and session["session"]["expiresAt"] > _now_ms():
            return session
    if AUTO_GUEST:
        guest = USERS["guest-user-001"]
        return {
            "session": {
                "id": "session-local-guest",
                "userId": guest["id"],
                "token": "local-guest-token",
                "expiresAt": _now_ms() + 30 * 24 * 60 * 60 * 1000,
            },
            "user": guest,
        }
    return None


def get_current_user_id(request: Request) -> Optional[str]:
    session = get_current_session(request)
    user = session.get("user") if session else None
    return user.get("id") if isinstance(user, dict) else None


def _set_auth_cookie(response: Response, token: str) -> None:
    cookie = f"{SESSION_COOKIE}={token}; Path=/; Max-Age=2592000; SameSite=Lax"
    response.headers["set-better-auth-cookie"] = cookie
    response.set_cookie(SESSION_COOKIE, token, max_age=2_592_000, httponly=True, samesite="lax")


@auth_router.api_route("/get-session", methods=["GET", "POST"])
async def get_session(request: Request):
    return get_current_session(request)


@auth_router.post("/email-otp/send-verification-otp")
@auth_router.post("/send-email-otp")
async def send_verification_otp(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    email = body.get("email")
    if not isinstance(email, str) or "@" not in email:
        return {"status": False, "code": "INVALID_EMAIL", "message": "A valid email is required"}
    OTP_STORE[email.strip().lower()] = {"otp": DEV_OTP, "expiresAt": time.time() + 10 * 60}
    return {"status": True}


@auth_router.post("/sign-in/email-otp")
@auth_router.post("/email-otp/verify-email")
async def sign_in_email_otp(request: Request, response: Response):
    try:
        body = await request.json()
    except Exception:
        body = {}
    email = body.get("email")
    otp = body.get("otp")
    if not isinstance(email, str) or "@" not in email or not isinstance(otp, str):
        return {"code": "INVALID_OTP", "message": "Invalid email or OTP"}
    normalized = email.strip().lower()
    stored = OTP_STORE.get(normalized)
    valid = otp == DEV_OTP or (stored is not None and stored["otp"] == otp and stored["expiresAt"] >= time.time())
    if not valid:
        return {"code": "INVALID_OTP", "message": "Invalid OTP"}
    user = next((entry for entry in USERS.values() if entry["email"] == normalized), None)
    if user is None:
        user = {
            "id": f"user_{uuid.uuid4().hex}",
            "name": normalized.split("@", 1)[0] or "Operator",
            "email": normalized,
            "image": "/icon.png",
            "createdAt": _now_ms(),
        }
        USERS[user["id"]] = user
    token = secrets.token_urlsafe(32)
    session = _session_for_user(user, token)
    SESSIONS[token] = session
    OTP_STORE.pop(normalized, None)
    _set_auth_cookie(response, token)
    return session


@auth_router.post("/sign-out")
async def sign_out(response: Response):
    response.headers["set-better-auth-cookie"] = f"{SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax"
    response.delete_cookie(SESSION_COOKIE)
    return {"success": True}


@auth_router.get("/convex/token")
@auth_router.post("/convex/token")
async def convex_token(request: Request):
    session = get_current_session(request)
    if session is None:
        return {"token": None}
    return {"token": f"local-convex.{session['user']['id']}"}
