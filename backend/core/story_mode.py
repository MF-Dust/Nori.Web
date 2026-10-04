"""Story/archive preference for clients that cannot send ``fullUnlock``.

The historical web client never sends ``fullUnlock`` on ``open_my_web_world`` or
``reset_my_web_world``. Its local settings panel stores the preference in the
``nori_full_unlock`` cookie instead of rewriting WebSocket frames, and the
server applies that preference only when the message leaves the field out.
"""
from __future__ import annotations

from typing import Any, Mapping, Optional

STORY_MODE_COOKIE = "nori_full_unlock"
_WORLD_LIFECYCLE = {"open_my_web_world", "reset_my_web_world"}


def story_mode_preference(headers: Any) -> Optional[bool]:
    """Read the handshake cookie: ``True`` archive, ``False`` story, ``None`` unset."""
    getter = getattr(headers, "get", None)
    raw = (getter("cookie") if callable(getter) else None) or ""
    for part in str(raw).split(";"):
        key, sep, value = part.strip().partition("=")
        if sep and key == STORY_MODE_COOKIE:
            if value == "1":
                return True
            if value == "0":
                return False
    return None


def apply_story_mode_default(message: Mapping[str, Any], preference: Optional[bool]) -> None:
    """Fill a missing lifecycle ``fullUnlock`` from the stored preference in place."""
    if preference is None or not isinstance(message, dict):
        return
    if message.get("type") in _WORLD_LIFECYCLE and "fullUnlock" not in message:
        message["fullUnlock"] = preference
