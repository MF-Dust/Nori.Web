"""`manifold.web` cartridge providing state facts, unlock flags, and manifold dispatch handling."""

from __future__ import annotations

import copy
from typing import Any, Dict, List, Optional

from .base import BaseCartridge, ReducerResult

# All capability, app-install, gesture, and feature unlock facts enabled by default.
DEFAULT_UNLOCKED_FACTS: Dict[str, bool] = {
    # System repair and desktop app installations (Browser, Messages, etc.)
    "system.repaired": True,
    "virus.cleared": True,
    "qfr.installed": True,
    "compute.initialized": True,
    "bounty.ext_installed": True,
    "mail.help.read": True,
    "boot.completed": True,
    "session.ready": True,
    "arg.cult_truth": True,
    # Game and gesture completions
    "arg.gestures_complete": True,
    "gesture.chess": True,
    "gesture.codenames": True,
    "gesture.pictionary": True,
    "gesture.cakeduel": True,
    # Dock and UI visibility
    "arg.farewell.shown": True,
    # Daniel / Signal / Investigation facts
    "signal_daniel.unlocked": True,
    "daniel.deadman.delivered": True,
    "daniel.evidence_unlocked": True,
    "daniel.retraction.downloaded": True,
    "download.hanyue_consent": True,
    # Documents and files
    "futurum.doc1.downloaded": True,
    "futurum.doc2.downloaded": True,
    "futurum.doc3.downloaded": True,
    "corrupt.doc1.read": True,
    "corrupt.doc2.read": True,
    "corrupt.doc3.read": True,
    "dirt.daniel": True,
    "dirt.frank": True,
    "dirt.futurum_aleph_obs": True,
    "dirt.hanyue_ssh": True,
    "dirt.jack": True,
    "dirt.maggie": True,
    "file.seal_config.read": True,
    "file.tower_photo.read": True,
    # QFR unseals
    "qfr.seal.released": True,
    "qfr.cult.released": True,
    "qfr.bounty.released": True,
    "qfr.gestures.released": True,
    "recover.seal_config": True,
    "recover.tower_photo": True,
    "recover.overclock_log": True,
}


class ManifoldWebCartridge(BaseCartridge):
    def __init__(self, initial_facts: Optional[Dict[str, bool]] = None) -> None:
        facts = copy.deepcopy(DEFAULT_UNLOCKED_FACTS)
        if initial_facts:
            facts.update(initial_facts)
        super().__init__(
            "manifold.web",
            {
                "facts": facts,
                "variables": {},
            },
        )

    def reduce(self, actor: str, cmd: Dict[str, Any]) -> ReducerResult:
        command_type = cmd.get("type", "")
        state = copy.deepcopy(self.state)
        events: List[Dict[str, Any]] = []

        if command_type == "client.emitFact":
            fact_id = cmd.get("factId")
            if isinstance(fact_id, str) and fact_id:
                if not state["facts"].get(fact_id):
                    state["facts"][fact_id] = True
                    events.append({"type": "factEmitted", "factId": fact_id})
            return ReducerResult(state, {"ok": True}, events)

        if command_type == "idle.sync":
            return ReducerResult(
                state,
                {
                    "prestige": {
                        "maxCompute": 1000000,
                        "shards": 1000,
                        "abdications": 1,
                        "gemPowerUnlocked": True,
                        "heritagesUnlocked": [],
                    }
                },
            )

        if command_type == "idle.complete":
            return ReducerResult(state, {"ok": True})

        if command_type == "system.setState":
            new_state = cmd.get("state")
            if isinstance(new_state, dict):
                state = copy.deepcopy(new_state)
            return ReducerResult(state, {"ok": True})

        # Generic permissive response for arbitrary dev/client dispatches
        return ReducerResult(state, {"ok": True})
