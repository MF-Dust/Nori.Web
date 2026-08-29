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

    # Production live-pack worlds use text presentation. Text replies must settle
    # immediately and must not start synthetic PCM/audio-timeout tasks.
    assert 'if chat.state.get("presentationMode") == "text":' in ENTRY
    text_fast_path = ENTRY.split('if chat.state.get("presentationMode") == "text":', 1)[1]
    text_fast_path, audio_path = text_fast_path.split("# Audio mode still keeps", 1)
    assert '"type": "operationSettled"' in text_fast_path
    assert "_stream_chat_fallback" not in text_fast_path
    assert "_ensure_chat_progress" not in text_fast_path
    assert "self._spawn(self._stream_chat_fallback" in audio_path
    assert "self._spawn(self._ensure_chat_progress" in audio_path

    # Cloudflare-specific game follow-ups may cooperatively yield, but they must
    # not reintroduce real presentation timers that extend DO duration.
    assert "await _runtime.asyncio.sleep(0)" in ENTRY
    for delay in ("sleep(0.15)", "sleep(0.1)", "sleep(0.35)", "sleep(1.2)"):
        assert delay not in ENTRY

    print("[ok] Cloudflare DO follow-ups preserve ordering without billed presentation waits")


if __name__ == "__main__":
    main()
