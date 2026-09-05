"""Install browser AI/TTS settings bridges onto the verified event dispatcher.

The shipped frontend bundle is treated as a compatibility target. Keeping
browser configuration on Arcade event channels means secrets never become part
of cartridge commands, transitions, or persisted world state.
"""

from __future__ import annotations

from typing import Any, Dict

from .ai_runtime_config import install_runtime_ai_config, public_runtime_ai_summary
from .event_dispatcher import EventDispatcher
from .tts_runtime_config import install_runtime_tts_config, public_runtime_tts_summary
from .tts_service import TTS_SERVICE, TTSServiceError

_INSTALLED = False
_ORIGINAL_HANDLE_EVENT = EventDispatcher.handle_event


async def _handle_event_with_ai_settings(
    self: EventDispatcher, message: Dict[str, Any]
) -> Dict[str, Any]:
    channel = message.get("channel")
    payload = message.get("payload") if isinstance(message.get("payload"), dict) else {}

    if channel == "nori.ai.config":
        config = install_runtime_ai_config(payload)
        return self.build_response(
            "nori.ai.config.result",
            public_runtime_ai_summary(config),
            cartridge_id=message.get("cartridgeId"),
            request_id=message.get("requestId"),
        )

    if channel == "nori.tts.config":
        config = install_runtime_tts_config(payload)
        return self.build_response(
            "nori.tts.config.result",
            public_runtime_tts_summary(config),
            cartridge_id=message.get("cartridgeId"),
            request_id=message.get("requestId"),
        )

    if channel == "nori.tts.test":
        raw_config = payload.get("config") if isinstance(payload.get("config"), dict) else payload
        config = install_runtime_tts_config(raw_config)
        text = str(payload.get("text") or "你好，我是 Nori。这是一段语音测试。").strip()[:400]
        try:
            speech = await TTS_SERVICE.synthesize(text, config)
        except TTSServiceError as exc:
            return self.build_response(
                "nori.tts.error",
                {"ok": False, "provider": exc.provider, "error": str(exc), "purpose": "test"},
                cartridge_id=message.get("cartridgeId"),
                request_id=message.get("requestId"),
            )
        return self.build_response(
            "nori.tts.audio",
            {**speech.as_event_payload(), "ok": True, "purpose": "test"},
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
