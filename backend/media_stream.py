"""Backward-compatibility re-export for `backend.core.media`."""

from .core.media import (
    CHAT_AUDIO_CHANNEL,
    COMPLETE_FLAG,
    OUTER_VERSION,
    SAMPLE_RATE,
    create_chat_audio_frame,
    fallback_speech_frames,
    tone_pcm,
)

__all__ = [
    "OUTER_VERSION",
    "CHAT_AUDIO_CHANNEL",
    "COMPLETE_FLAG",
    "SAMPLE_RATE",
    "create_chat_audio_frame",
    "tone_pcm",
    "fallback_speech_frames",
]
