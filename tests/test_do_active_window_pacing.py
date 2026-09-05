from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")
WORLD = (ROOT / "backend" / "session" / "world.py").read_text(encoding="utf-8")


def main() -> None:
    # Local mode intentionally keeps human-facing presentation delays.
    assert "await asyncio.sleep(0.15)" in WORLD
    assert "await asyncio.sleep(0.35)" in WORLD
    assert "await asyncio.sleep(1.2)" in WORLD
    assert "await asyncio.sleep(1.1)" in WORLD

    # Cloudflare replaces only the presentation-only methods so Durable Object
    # active wall-clock time is not spent sleeping for UI pacing.
    assert "_WorldSession._run_chat_reply = _cloudflare_run_chat_reply" in ENTRY
    assert "_WorldSession._run_agent_turns = _cloudflare_run_agent_turns" in ENTRY
    assert "_WorldSession._start_next_pictionary_round = _cloudflare_start_next_pictionary_round" in ENTRY
    assert "_WorldSession._settle_chat_after_audio = _cloudflare_settle_chat_after_audio" in ENTRY

    # Production live-pack worlds use text presentation. Text replies settle
    # immediately. Configured TTS may synthesize once, but the audio timeout
    # machinery must remain exclusive to audio presentation mode.
    marker = "async def _cloudflare_run_chat_reply(self, user_text: str) -> None:"
    end_marker = "async def _cloudflare_settle_chat_after_audio"
    assert marker in ENTRY and end_marker in ENTRY
    chat_reply = ENTRY.split(marker, 1)[1].split(end_marker, 1)[0]
    assert 'if chat.state.get("presentationMode") == "text":' in chat_reply
    assert 'if _get_runtime_tts_config().get("enabled") is True:' in chat_reply
    assert '"type": "operationSettled"' in chat_reply
    assert chat_reply.count("self._spawn(self._stream_chat_fallback") == 2
    assert chat_reply.count("self._spawn(self._ensure_chat_progress") == 1

    # Cloudflare-specific game follow-ups may cooperatively yield, but they must
    # not reintroduce real presentation timers that extend DO duration.
    assert "await _runtime.asyncio.sleep(0)" in ENTRY
    for delay in ("sleep(0.15)", "sleep(0.1)", "sleep(0.35)", "sleep(1.2)"):
        assert delay not in ENTRY

    print("[ok] Cloudflare DO follow-ups preserve ordering without billed presentation waits")


if __name__ == "__main__":
    main()
