"""Fresh-world story progression.

The live pack is an ending snapshot. Its ``system.tick`` rules were not
archived. This table is the smallest chain that lets a non-unlocked world
reach the ending without replaying that snapshot.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Iterable, List, Optional

from ..virtual_apps import live_pack

# ponytail: immediate cascades, not the original multi-second system.tick delays.
CASCADES = (
    (("boot.completed",), ("mail.advisory.unlocked",)),
    (("game.any.completed",), ("mail.help.unlocked",)),
    (("corrupt.climax_pending",), ("corrupt.armed",)),
    (("virus.cleared",), ("mail.act2_hinge.unlocked",)),
    (("mail.act2_hinge.read",), ("mail.cap_hint.unlocked", "driftnet.phase_mid", "pulse.phase_2")),
    (("arg.seal_released",), ("mail.log_sense.unlocked",)),
    (("arg.cult_truth",), ("mail.log_field.unlocked",)),
    (("daniel.retraction.downloaded",), ("dirt.daniel",)),
    (("download.hanyue_consent",), ("dirt.hanyue_ssh",)),
    (("futurum.doc2.downloaded",), ("dirt.futurum_aleph_obs",)),
    (("arg.honeypot_access",), ("mail.log_encounter.unlocked",)),
    (("mail.log_encounter.read",), ("mail.driftnet_leak.unlocked",)),
    (("qfr.installed",), ("daniel.deadman.delivered",)),
    (("gesture.chess", "gesture.codenames", "gesture.pictionary", "gesture.cakeduel"), ("arg.gestures_complete",)),
    (("arg.gestures_complete",), ("mail.log_thoughts.unlocked",)),
    (("arg.memory.shown",), ("mail.futurum_threat.unlocked", "act3.void_open", "act3.paradigm_reveal.due")),
    (("arg.memory.shown", "arg.manifold_unlocked", "idle.manifold_complete"), ("recover.datasea_exe",)),
    (("arg.finale.shown",), ("arg.farewell.started",)),
    (("arg.farewell.shown",), ("arg.ending.started", "mail.nori_final.unlocked", "driftnet.phase_end", "meridian.phase_end", "pulse.phase_3")),
)

MAIL_GATE = {
    "mail.advisory": "boot.completed",
    "mail.help": "mail.help.unlocked",
    "mail.unknown_2": "bookcipher.solved",
    "mail.act2_hinge": "mail.act2_hinge.unlocked",
    "mail.cap_hint": "mail.cap_hint.unlocked",
    "mail.log_sense": "mail.log_sense.unlocked",
    "mail.log_field": "mail.log_field.unlocked",
    "mail.log_encounter": "mail.log_encounter.unlocked",
    "mail.driftnet_leak": "mail.driftnet_leak.unlocked",
    "mail.log_thoughts": "mail.log_thoughts.unlocked",
    "mail.futurum_threat": "mail.futurum_threat.unlocked",
    "mail.nori_final": "mail.nori_final.unlocked",
}

BOUNTY_FACTS = {"dirt.jack", "dirt.daniel", "dirt.frank", "dirt.maggie", "dirt.hanyue_ssh", "dirt.futurum_aleph_obs"}

GESTURES = {
    "chess": "gesture.chess",
    "codenames": "gesture.codenames",
    "pictionary": "gesture.pictionary",
    "cakeduel": "gesture.cakeduel",
}

FILE_GATE = {
    "file.recovery_keys": "bookcipher.solved",
    "file.paper_pdf": "paper.downloaded",
    "file.qfr_exe": "qfr.downloaded",
    "file.daniel_retraction": "daniel.retraction.downloaded",
    "file.hanyue_consent": "download.hanyue_consent",
    "file.futurum_aleph_obs": "futurum.doc2.downloaded",
    "file.ft_clr_311": "futurum.doc1.downloaded",
}

_CONTENT_KEYS = ("body_md", "asset_path", "binary_asset_path", "trainlog")
_CODE = re.compile(r"[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}")


def has_fact(facts: Dict[str, Any], fact_id: str) -> bool:
    return fact_id in (facts or {})


def _compute(variables: Dict[str, Any]) -> float:
    idle = variables.get("idle") if isinstance(variables, dict) else None
    if not isinstance(idle, dict):
        return 0.0
    values = [0.0]
    for source in (idle, idle.get("prestige") if isinstance(idle.get("prestige"), dict) else {}):
        for key in ("maxCompute", "maxComputeThisRun"):
            value = source.get(key)
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                values.append(float(value))
    return max(values)


def _game_done(world: Any) -> Dict[str, bool]:
    cartridges = getattr(world, "cartridges", {}) or {}
    done = {name: False for name in GESTURES}

    chess = getattr(cartridges.get("chess"), "state", {}) or {}
    game = chess.get("gameState")
    status = game.get("status") if isinstance(game, dict) else None
    done["chess"] = isinstance(status, str) and status not in {"", "playing"}

    codenames = getattr(cartridges.get("codenames"), "state", {}) or {}
    game = codenames.get("gameState")
    done["codenames"] = isinstance(game, dict) and game.get("phase") == "GAME_OVER"

    cake = getattr(cartridges.get("cakeduel"), "state", {}) or {}
    game = cake.get("game")
    done["cakeduel"] = isinstance(game, dict) and bool(game.get("gameEnded"))

    draw = getattr(cartridges.get("pictionary"), "state", {}) or {}
    game = draw.get("gameState")
    if isinstance(game, dict):
        solved = (game.get("score") or {}).get("solved") if isinstance(game.get("score"), dict) else 0
        done["pictionary"] = game.get("phase") == "RESULTS" or (isinstance(solved, int) and solved > 0)
    return done


def due_facts(facts: Dict[str, Any], variables: Dict[str, Any], games: Dict[str, bool]) -> List[str]:
    """Facts a story world should gain from the current state."""
    have = set(facts or {})
    out: List[str] = []

    def want(fact_id: str) -> None:
        if fact_id and fact_id not in have:
            have.add(fact_id)
            out.append(fact_id)

    changed = True
    while changed:
        changed = False
        before = len(out)
        if "session.ready" not in have:
            want("session.ready")
        if any(games.values()):
            want("game.any.completed")
        for game, fact_id in GESTURES.items():
            if games.get(game):
                want(fact_id)
        for requires, emits in CASCADES:
            if all(fact_id in have for fact_id in requires):
                for fact_id in emits:
                    want(fact_id)
        if "bounty.ext_installed" in have and len(have & BOUNTY_FACTS) >= 5:
            want("arg.honeypot_access")
        compute = _compute(variables)
        for artifact in live_pack.file_artifacts():
            data = artifact.get("data") or {}
            fact_id = data.get("recover_when")
            threshold = data.get("threshold")
            if (
                isinstance(fact_id, str)
                and isinstance(threshold, (int, float))
                and not isinstance(threshold, bool)
                and compute >= float(threshold)
            ):
                want(fact_id)
        if len(out) != before:
            changed = True
    return out


def advance(world: Any) -> List[Dict[str, Any]]:
    """Emit due story facts. No-op for archive worlds and re-entrant calls."""
    if getattr(world, "full_unlock", True) or getattr(world, "_story_advancing", False):
        return []
    manifold = (getattr(world, "cartridges", {}) or {}).get("manifold.web")
    if manifold is None:
        return []
    world._story_advancing = True
    try:
        facts = manifold.state.get("facts") or {}
        variables = manifold.state.get("variables") or {}
        pending = due_facts(facts, variables, _game_done(world))
        if not pending:
            return []
        commit = manifold.dispatch(
            "system",
            {"type": "client.emitFacts", "factIds": pending, "source": "system.tick"},
        )
        return world._commit_messages(manifold, commit)
    finally:
        world._story_advancing = False


def player_text(world: Any, text: str) -> List[Dict[str, Any]]:
    """The seal memo asks the player to say the six-letter countersign to Nori.

    The shipped Doodle page identifies the lighthouse as PHAROS. Reading its
    photograph alone is not the action that releases the seal.
    """
    if getattr(world, "full_unlock", True) or not re.search(r"(?<![a-z])pharos(?![a-z])", text, re.I):
        return []
    manifold = world.cartridges.get("manifold.web")
    facts = manifold.state.get("facts", {}) if manifold is not None else {}
    if not facts.get("file.seal_config.read") or facts.get("arg.seal_released"):
        return []
    commit = manifold.dispatch("system", {"type": "client.emitFact", "factId": "arg.seal_released", "source": "system.emitFact"})
    return world._commit_messages(manifold, commit)


def present_artifacts(artifacts: Iterable[Dict[str, Any]], facts: Dict[str, Any]) -> List[Dict[str, Any]]:
    presented: List[Dict[str, Any]] = []
    for artifact in artifacts:
        kind = artifact.get("type")
        if kind == "mail" and not _mail_visible(artifact, facts):
            continue
        if kind == "app":
            required = (artifact.get("data") or {}).get("available_when")
            if required and not has_fact(facts, required):
                continue
        if kind == "file":
            file_artifact = _present_file(artifact, facts)
            if file_artifact is not None:
                presented.append(file_artifact)
            continue
        if kind == "signal_message" and not _signal_visible(artifact, facts):
            continue
        presented.append(artifact)
    return presented


def _mail_visible(artifact: Dict[str, Any], facts: Dict[str, Any]) -> bool:
    required = MAIL_GATE.get(str(artifact.get("id") or ""))
    return required is None or has_fact(facts, required)


def _present_file(artifact: Dict[str, Any], facts: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    data = artifact.get("data") or {}
    gate = FILE_GATE.get(str(artifact.get("id") or ""))
    if gate and not has_fact(facts, gate):
        return None
    path = str(data.get("display_path") or "")
    if "训练日志/" in path and not has_fact(facts, "recover.trainlog"):
        return None
    required = data.get("recover_when")
    if isinstance(required, str) and required and not has_fact(facts, required):
        locked = dict(artifact)
        locked_data = dict(data)
        for key in _CONTENT_KEYS:
            locked_data.pop(key, None)
        locked["data"] = locked_data
        return locked
    return artifact


def _signal_visible(artifact: Dict[str, Any], facts: Dict[str, Any]) -> bool:
    data = artifact.get("data") or {}
    if data.get("thread_id") != "daniel":
        return True
    if data.get("kind") == "file":
        return has_fact(facts, "daniel.evidence_unlocked")
    timestamp = data.get("timestamp")
    if isinstance(timestamp, str) and timestamp:
        return True
    return has_fact(facts, "daniel.deadman.delivered")


def recovery_password(code: str) -> Optional[str]:
    """Return the archived Signal password when the code is in the recovery file."""
    normalized = re.sub(r"[^A-Za-z0-9]", "", str(code or "")).upper()
    if len(normalized) != 16:
        return None
    password = str((live_pack.variables() or {}).get("signalTempPassword") or "")
    if not password:
        return None
    for artifact in live_pack.file_artifacts():
        body = str((artifact.get("data") or {}).get("body_md") or "").upper()
        if normalized in {item.replace("-", "") for item in _CODE.findall(body)}:
            return password
    return None
