from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.cartridges.cakeduel import CakeDuelCartridge
from backend.session.world import WorldSession

ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")
WORLD = (ROOT / "backend" / "session" / "world.py").read_text(encoding="utf-8")


def verify_cakeduel_pass_recovery() -> None:
    """A missing Nori decision after the player's pass must not soft-lock the duel."""
    cartridge = CakeDuelCartridge()
    cartridge.dispatch(
        "player",
        {"type": "startGame", "mode": "normal", "difficulty": "soldier"},
    )

    game = cartridge.state["game"]
    claim_action = next(item for item in cartridge._legal_actions(game) if item["type"] == "claim")
    cartridge.dispatch(
        "player",
        {
            "type": "play",
            "action": {
                "type": "claim",
                "handIndices": [0],
                "claim": claim_action["claimFrom"][0],
            },
        },
    )

    block_command = cartridge.agent_next_command()
    assert block_command is not None
    cartridge.dispatch("agent", block_command)
    assert cartridge.state["game"]["phase"] == "review"

    cartridge.dispatch("player", {"type": "play", "action": {"type": "pass"}})
    game = cartridge.state["game"]
    assert game["phase"] == "attack" and game["attackerIndex"] == 1

    # Reproduce the reported failure mode: the agent runner wakes up while the
    # state says Nori is attacking, but the decision provider yields no action.
    cartridge.agent_next_command = lambda: None  # type: ignore[method-assign]
    world = WorldSession("cake-duel-recovery-test")
    world.cartridges["cakeduel"] = cartridge

    recovery = world._next_agent_command("cakeduel", cartridge)
    assert recovery == {"type": "play", "action": {"type": "pass"}}
    cartridge.dispatch("agent", recovery)

    game = cartridge.state["game"]
    assert game["phase"] == "attack" and game["attackerIndex"] == 0


def main() -> None:
    # Local mode intentionally keeps human-facing presentation delays.
    assert "await asyncio.sleep(0.15)" in WORLD
    assert "await asyncio.sleep(0.35)" in WORLD
    assert "await asyncio.sleep(1.2)" in WORLD
    assert "await asyncio.sleep(1.1)" in WORLD

    # Game follow-ups are single-flight per cartridge and background failures
    # are observed instead of disappearing from the task set silently.
    assert "self._agent_tasks" in WORLD
    assert "self._schedule_agent_turns(cartridge_id)" in WORLD
    assert "background task failed" in WORLD

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
    # not reintroduce real presentation timers that extend DO duration. The
    # production runner must use the guarded decision/dispatch helpers too.
    assert "await _runtime.asyncio.sleep(0)" in ENTRY
    assert "self._next_agent_command(cartridge_id, cartridge)" in ENTRY
    assert "self._dispatch_agent_command(cartridge_id, cartridge, command)" in ENTRY
    for delay in ("sleep(0.15)", "sleep(0.1)", "sleep(0.35)", "sleep(1.2)"):
        assert delay not in ENTRY

    verify_cakeduel_pass_recovery()
    print("[ok] Cloudflare DO follow-ups preserve ordering and Cake Duel recovers stranded Nori turns")


if __name__ == "__main__":
    main()
