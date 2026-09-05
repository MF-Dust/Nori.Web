"""Attach configured TTS synthesis to the existing chat speech stream hook."""

from __future__ import annotations

from typing import Any

from .tts_runtime_config import get_runtime_tts_config
from .tts_service import TTS_SERVICE, TTSServiceError

_INSTALLED = False


def install_tts_world_bridge() -> None:
    """Replace the fallback speech producer while preserving its failure path."""
    global _INSTALLED
    if _INSTALLED:
        return

    from ..session.world import WorldSession

    original_stream = WorldSession._stream_chat_fallback

    async def stream_configured_tts(
        self: Any,
        operation_id: str,
        message_id: str,
        text: str,
    ) -> None:
        config = get_runtime_tts_config()
        if config.get("enabled") is not True:
            await original_stream(self, operation_id, message_id, text)
            return

        try:
            speech = await TTS_SERVICE.synthesize(text, config)
        except TTSServiceError as exc:
            print(
                f"[TTSService] {exc.provider} request failed: "
                f"{type(exc).__name__}: {str(exc)[:240]}"
            )
            await self.broadcast(
                [
                    {
                        "type": "event",
                        "worldId": self.world_id,
                        "cartridgeId": "chat",
                        "channel": "nori.tts.error",
                        "payload": {
                            "ok": False,
                            "provider": exc.provider,
                            "error": str(exc),
                            "purpose": "chat",
                            "operationId": operation_id,
                            "messageId": message_id,
                        },
                    }
                ]
            )
            await original_stream(self, operation_id, message_id, text)
            return

        await self.broadcast(
            [
                {
                    "type": "event",
                    "worldId": self.world_id,
                    "cartridgeId": "chat",
                    "channel": "nori.tts.audio",
                    "payload": {
                        **speech.as_event_payload(),
                        "ok": True,
                        "purpose": "chat",
                        "operationId": operation_id,
                        "messageId": message_id,
                        "blockId": 0,
                    },
                }
            ]
        )

    WorldSession._stream_chat_fallback = stream_configured_tts
    _INSTALLED = True
