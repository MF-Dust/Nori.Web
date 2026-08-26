"""Backward-compatibility re-export for `backend.api.auth`."""

from .api.auth import (
    AUTO_GUEST,
    DEV_OTP,
    OTP_STORE,
    SESSION_COOKIE,
    SESSIONS,
    USERS,
    auth_router,
    get_current_session,
    get_current_user_id,
)

__all__ = [
    "auth_router",
    "get_current_session",
    "get_current_user_id",
    "SESSION_COOKIE",
    "AUTO_GUEST",
    "DEV_OTP",
    "USERS",
    "SESSIONS",
    "OTP_STORE",
]
