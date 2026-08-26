"""Binary media framing for `/api/arcade/web/v1/media`.

The layout is verified from the public client decoder (see
`docs/VERIFIED_PROTOCOL.md`).
"""

from __future__ import annotations

import asyncio
import math
import struct
import uuid
from typing import AsyncIterator

OUTER_VERSION = 1
CHAT_AUDIO_CHANNEL = 1
COMPLETE_FLAG = 1
SAMPLE_RATE = 32_000  # Public client decodes PCM16 and resamples as needed.


def _uuid_bytes(value: str) -> bytes:
    try:
        return uuid.UUID(value).bytes
    except (ValueError, AttributeError) as exc:
        raise ValueError("Media operationId and messageId must be UUID strings") from exc


def create_chat_audio_frame(
    *,
    sequence: int,
    block_id: int,
    chunk_id: int,
    operation_id: str,
    message_id: str,
    is_complete: bool,
    pcm: bytes,
) -> bytes:
    flags = COMPLETE_FLAG if is_complete else 0
    outer = struct.pack("<BBHI", OUTER_VERSION, CHAT_AUDIO_CHANNEL, flags, sequence & 0xFFFFFFFF)
    subheader = struct.pack("<II", block_id, chunk_id) + _uuid_bytes(operation_id) + _uuid_bytes(message_id)
    return outer + subheader + pcm


def tone_pcm(*, frequency: float, duration_ms: int = 180, sample_rate: int = SAMPLE_RATE) -> bytes:
    """Local no-dependency fallback audio.

    It is deliberately labelled a fallback in documentation; deployments can
    swap in a real TTS provider without changing the public wire protocol.
    """
    samples = max(1, int(sample_rate * duration_ms / 1000))
    result = bytearray(samples * 2)
    for index in range(samples):
        position = index / sample_rate
        envelope = math.sin(math.pi * index / max(1, samples - 1))
        amplitude = int(32767 * 0.16 * envelope * math.sin(2 * math.pi * frequency * position))
        struct.pack_into("<h", result, index * 2, amplitude)
    return bytes(result)


async def fallback_speech_frames(
    operation_id: str, message_id: str, text: str, *, block_id: int = 0, start_sequence: int = 0
) -> AsyncIterator[bytes]:
    """Yield appropriately framed audio chunks for a local text reply."""
    count = max(1, min(12, (len(text) + 7) // 8))
    notes = (523.25, 587.33, 659.25, 698.46, 783.99, 880.0)
    for chunk_id in range(count):
        yield create_chat_audio_frame(
            sequence=start_sequence + chunk_id + 1,
            block_id=block_id,
            chunk_id=chunk_id,
            operation_id=operation_id,
            message_id=message_id,
            is_complete=chunk_id == count - 1,
            pcm=tone_pcm(frequency=notes[chunk_id % len(notes)]),
        )
        await asyncio.sleep(0.14)
