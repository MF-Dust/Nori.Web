"""Install the browser AI-settings bridge onto the verified event dispatcher.

The shipped frontend bundle is treated as a compatibility target.  Keeping the
new configuration on an Arcade event channel means secrets never become part
of a cartridge command/transition while the existing protocol remains intact.
"""

from __future__ import annotations

from typing import Any, Dict

from .ai_runtime_config import install_runtime_ai_config, public_runtime_ai_summary
from .event_dispatcher import EventDispatcher

_INSTALLED = False
_ORIGINAL_HANDLE_EVENT = EventDispatcher.handle_event


async def _handle_event_with_ai_settings(
    self: EventDispatcher, message: Dict[str, Any]
) -> Dict[str, Any]:
    if message.get("channel") == "nori.ai.config":
        payload = message.get("payload") if isinstance(message.get("payload"), dict) else {}
        config = install_runtime_ai_config(payload)
        return self.build_response(
            "nori.ai.config.result",
            public_runtime_ai_summary(config),
            cartridge_id=message.get("cartridgeId"),
            request_id=message.get("requestId"),
        )
    return await _ORIGINAL_HANDLE_EVENT(self, message)


def install_ai_event_bridge() -> None:
    """Patch EventDispatcher exactly once during application bootstrap."""
    global _INSTALLED
    if _INSTALLED:
        return
    EventDispatcher.handle_event = _handle_event_with_ai_settings
    _INSTALLED = True
