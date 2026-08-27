"""`manifold.web` cartridge providing state facts, unlock flags, and manifold dispatch handling."""

from __future__ import annotations

import copy
import hashlib
import time
from typing import Any, Dict, List, Optional

from .base import BaseCartridge, ReducerResult
from ..virtual_apps import live_pack

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


def derive_source(fact_id: str) -> str:
    """Derive the production-style fact record source from its id namespace.

    The live server stamped emitted facts with an emitter identity
    (``mail.read``, ``signal.read``, ``vault.unlock``, ``nas.*``,
    ``idle.sync``, ``client.emitFact`` …). Reproduce that mapping so replayed
    emissions carry the same shapes seen in the archive.
    """
    fid = fact_id or ""
    if fid.startswith("mail.") and (fid.endswith(".read") or ".read" in fid):
        return "mail.read"
    if fid.startswith("signal."):
        if "verify" in fid:
            return "signal.daniel.verify"
        if fid.endswith(".login") or "temp_password" in fid or "login" in fid:
            return "signal.login"
        if fid.endswith(".read"):
            return "signal.read"
        return "client.emitFact"
    if fid.startswith("recover.") or "unseal" in fid or "seal_release" in fid:
        return "vault.unlock"
    if fid.startswith("nas."):
        return "nas.download" if "download" in fid else "nas.connect"
    if fid.startswith("idle."):
        return "idle.sync"
    return "client.emitFact"


def _fact_record(fact_id: str, actor: str, source: str, now_ms: int) -> Dict[str, Any]:
    return {
        "id": fact_id,
        "emittedAt": now_ms,
        "actor": actor,
        "source": source,
    }


def _affected_artifact_type(fact_id: str) -> Optional[str]:
    if fact_id.startswith("mail."):
        return "mail"
    if fact_id.startswith("file.") or fact_id.startswith("recover."):
        return "file"
    if fact_id.startswith("signal."):
        return "signal_thread"
    return None


def chip_config_of(variables: Dict[str, Any]) -> Dict[str, Any]:
    return variables.setdefault("chipConfig", {})


def chip_cool(variables: Dict[str, Any], *, write: bool = True) -> Dict[str, Any]:
    """Apply elapsed cooldown windows; returns the live chip dict."""
    cfg = chip_config_of(variables)
    now_ms = int(time.time() * 1000)
    chip = variables.setdefault("chip", {"heat": 0, "coolAnchorMs": now_ms})
    cool_every = int(cfg.get("coolEveryMs") or 300_000)
    anchor = int(chip.get("coolAnchorMs") or now_ms)
    windows = max(0, (now_ms - anchor) // cool_every)
    heat = int(chip.get("heat") or 0)
    if windows:
        cooled = max(0, heat - windows)
        if write and cooled != heat:
            chip["heat"] = cooled
            chip["coolAnchorMs"] = anchor + windows * cool_every
        elif not write:
            chip = {**chip, "heat": cooled}
    return chip


def chip_capacity(variables: Dict[str, Any]) -> int:
    cfg = chip_config_of(variables)
    if cfg.get("neverOverheat"):
        return 10 ** 9
    archived = live_pack.chip_status() or {}
    return int(cfg.get("capacity") or archived.get("capacity") or 5)


def chip_status_snapshot(variables: Dict[str, Any]) -> Dict[str, Any]:
    """Read-only status computation (no state writes)."""
    live_vars = dict(variables)
    cfg = chip_config_of(live_vars)
    chip = chip_cool(live_vars, write=False)
    archived = live_pack.chip_status() or {}
    scans = variables.get("chipScans")
    return {
        "capacity": int(cfg.get("capacity") or archived.get("capacity") or 5),
        "heat": int(chip.get("heat", 0)),
        "coolEveryMs": int(cfg.get("coolEveryMs") or archived.get("coolEveryMs")
                           or 300_000),
        "scanCount": len(scans) if isinstance(scans, list) else 0,
        "serverNowMs": int(time.time() * 1000),
    }


def _sha_row(seed: str) -> str:
    return hashlib.sha1(seed.encode("utf-8")).hexdigest()[:16]


class ManifoldWebCartridge(BaseCartridge):
    def __init__(self, initial_facts: Optional[Dict[str, bool]] = None) -> None:
        pack_facts = live_pack.facts()
        pack_vars = live_pack.variables()
        if pack_facts:
            # Faithful replay: production fact records (id/emittedAt/actor/source)
            # win over the dev defaults; dev-unlock flags stay True when the
            # archive simply never mentions them.
            facts: Dict[str, Any] = {
                **{k: v for k, v in DEFAULT_UNLOCKED_FACTS.items()},
                **pack_facts,
            }
        else:
            facts = copy.deepcopy(DEFAULT_UNLOCKED_FACTS)
        if initial_facts:
            facts.update(initial_facts)
        variables = pack_vars if pack_vars else {}
        super().__init__(
            "manifold.web",
            {
                "facts": facts,
                "variables": copy.deepcopy(variables),
            },
        )

    def reduce(self, actor: str, cmd: Dict[str, Any]) -> ReducerResult:
        command_type = cmd.get("type", "")
        state = copy.deepcopy(self.state)
        events: List[Dict[str, Any]] = []

        if command_type == "client.emitFact":
            fact_id = cmd.get("factId")
            if isinstance(fact_id, str) and fact_id:
                existing = state["facts"].get(fact_id)
                if not existing:
                    source = cmd.get("source") or derive_source(fact_id)
                    state["facts"][fact_id] = _fact_record(
                        fact_id,
                        actor,
                        source,
                        int(cmd.get("emittedAt") or time.time() * 1000),
                    )
                    events.append({"type": "factEmitted", "factId": fact_id, "source": source})
                    events.append({
                        "type": "manifold.facts.changed",
                        "emitted": [fact_id],
                        "retracted": [],
                        "snapshot": {fact_id: True},
                    })
                    art_type = _affected_artifact_type(fact_id)
                    if art_type:
                        events.append({
                            "type": "manifold.artifacts.invalidated",
                            "reason": f"fact:{fact_id}",
                            "changedArtifactTypes": [art_type],
                        })
            return ReducerResult(state, {"ok": True}, events)

        APP_PREFIX = {"browser": "page", "files": "file", "mail": "mail",
                      "messenger": "signal", "signal": "signal",
                      "terminal": "app", "idle": "app", "settings": "app",
                      "system": "app", "debug": "app"}

        def _resolve_scan_key(raw_cmd: Dict[str, Any]) -> str:
            """Production payload is {appId, windowType, contentKey}; derive
            the canonical ``<ns>:<contentKey>`` scan identity from it."""
            explicit = raw_cmd.get("key")
            if isinstance(explicit, str) and explicit.strip():
                return explicit.strip()
            app_id = str(raw_cmd.get("appId") or "").strip().lower()
            content = str(raw_cmd.get("contentKey") or "").strip()
            if not content:
                return ""
            if ":" in content:
                return content
            return f"{APP_PREFIX.get(app_id, app_id or 'app')}:{content}"

        if command_type == "chip.scan":
            now_ms = int(time.time() * 1000)
            variables = state.setdefault("variables", {})
            capacity = chip_capacity(variables)
            chip_cool(variables)
            chip = variables.setdefault("chip", {"heat": 0, "coolAnchorMs": now_ms})
            scans = variables.setdefault("chipScans", [])
            known_full = {e.get("key"): e for e in scans if isinstance(e, dict)}
            known_tail = {str(k).split(":", 1)[-1]: e
                          for k, e in known_full.items() if isinstance(k, str)}
            heat = int(chip.get("heat") or 0)

            raw_key = _resolve_scan_key(cmd)
            if not raw_key and cmd.get("appId"):
                # legacy callers that only identify the app window itself
                raw_key = f"{APP_PREFIX.get(str(cmd['appId']).lower(), 'app')}:self"
            if not raw_key:
                raw_key = "unknown"

            entry = known_full.get(raw_key) or known_tail.get(
                raw_key.split(":", 1)[-1])
            if entry is not None:
                result: Any = {
                    "kind": "readout",
                    "text": (f"Archived scan replay — key={entry.get('key')}, "
                             f"row={entry.get('row')}"),
                }
                events.append({"type": "chip.status.changed",
                               **chip_status_snapshot(variables)})
                return ReducerResult(state, result, events)

            if heat >= capacity:
                result = {"kind": "fried",
                          "text": (f"[{raw_key}] chip thermal lock — "
                                   f"heat {heat}/{capacity}; wait for cooldown")}
                events.append({"type": "chip.status.changed",
                               **chip_status_snapshot(variables)})
                return ReducerResult(state, result, events)

            row = _sha_row(f"{raw_key}@{len(scans)}")
            scans.append({"key": raw_key, "row": row})
            chip["heat"] = heat + 1
            events.append({"type": "chip.status.changed",
                           **chip_status_snapshot(variables)})
            result = {
                "kind": "readout",
                "text": f"Fresh readout logged — key={raw_key}, row={row}",
            }
            return ReducerResult(state, result, events)

        if command_type == "chip.debugScan":
            """Front-end reports a completed debug read-out for the record."""
            key = str(cmd.get("contentKey") or cmd.get("key") or "").strip()
            readout = str(cmd.get("readout") or "").strip()
            variables = state.setdefault("variables", {})
            scans = variables.setdefault("chipScans", [])
            if key:
                existing = next((e for e in scans
                                 if isinstance(e, dict)
                                 and e.get("key") == key), None)
                if existing is None:
                    scans.append({"key": key,
                                  "row": _sha_row(f"{key}|{readout}"),
                                  "title": str(cmd.get("title") or "")[:80]})
                    events.append({"type": "chip.status.changed",
                                   **chip_status_snapshot(variables)})
            return ReducerResult(state, {"ok": True}, events)

        if command_type == "chip.debugReset":
            variables = state.setdefault("variables", {})
            variables["chip"] = {"heat": 0, "coolAnchorMs": int(time.time() * 1000)}
            variables["chipScans"] = []
            events.append({"type": "chip.status.changed",
                           **chip_status_snapshot(variables)})
            return ReducerResult(state, {"ok": True}, events)

        if command_type == "chip.debugConfig":
            variables = state.setdefault("variables", {})
            cfg = chip_config_of(variables)
            for key in ("capacity", "coolEveryMs", "heat", "neverOverheat"):
                if key in cmd:
                    cfg[key] = cmd[key]
            return ReducerResult(state, {"ok": True}, events)

        if command_type == "client.emitFact":
            fact_id = cmd.get("factId")
            if isinstance(fact_id, str) and fact_id:
                existing = state["facts"].get(fact_id)
                if not existing:
                    source = cmd.get("source") or derive_source(fact_id)
                    state["facts"][fact_id] = _fact_record(
                        fact_id,
                        actor,
                        source,
                        int(cmd.get("emittedAt") or time.time() * 1000),
                    )
                    events.append({"type": "factEmitted", "factId": fact_id, "source": source})
                    events.append({
                        "type": "manifold.facts.changed",
                        "emitted": [fact_id],
                        "retracted": [],
                        "snapshot": {fact_id: True},
                    })
                    art_type = _affected_artifact_type(fact_id)
                    if art_type:
                        events.append({
                            "type": "manifold.artifacts.invalidated",
                            "reason": f"fact:{fact_id}",
                            "changedArtifactTypes": [art_type],
                        })
            return ReducerResult(state, {"ok": True}, events)

        if command_type == "chip.scan":
            key = str(cmd.get("key") or "").strip() or "unknown"
            now_ms = int(time.time() * 1000)
            variables = state.setdefault("variables", {})
            capacity = chip_capacity(variables)
            chip_cool(variables)  # apply cooldown writes
            chip = variables.setdefault("chip", {"heat": 0, "coolAnchorMs": now_ms})
            scans = variables.setdefault("chipScans", [])
            known = {e.get("key"): e for e in scans if isinstance(e, dict)}
            heat = int(chip.get("heat") or 0)
            if key in known:
                row = known[key].get("row") or _sha_row(key)
                result: Any = {"kind": "readout",
                               "text": f"[{key}] cached row={row} · replay from scan cache"}
            elif heat >= capacity:
                result = {"kind": "fried",
                          "text": f"[{key}] chip thermal lock — heat {heat}/{capacity}; wait for cooldown"}
            else:
                row = _sha_row(f"{key}@{len(scans)}")
                scans.append({"key": key, "row": row})
                chip["heat"] = heat + 1
                result = {"kind": "readout",
                          "text": f"[{key}] fresh readout row={row} · heat {heat + 1}/{capacity}"}
            events.append({"type": "chip.status.changed",
                           **chip_status_snapshot(variables)})
            return ReducerResult(state, result, events)

        if command_type == "chip.debugScan":
            key = str(cmd.get("key") or "").strip() or "debug:probe"
            row = _sha_row(f"force:{key}:{int(time.time())}")
            events.append({"type": "chip.status.changed",
                           **chip_status_snapshot(state.setdefault("variables", {}))})
            return ReducerResult(
                state,
                {"kind": "readout", "text": f"[{key}] forced readout row={row}"},
                events,
            )

        if command_type == "chip.debugReset":
            variables = state.setdefault("variables", {})
            variables["chip"] = {"heat": 0, "coolAnchorMs": int(time.time() * 1000)}
            variables["chipScans"] = []
            snapshot = chip_status_snapshot(variables)
            events.append({"type": "chip.status.changed", **snapshot})
            return ReducerResult(state, dict(snapshot, reset=True), events)

        if command_type == "chip.debugConfig":
            variables = state.setdefault("variables", {})
            cfg = chip_config_of(variables)
            for key in ("capacity", "coolEveryMs", "heat", "neverOverheat"):
                if key in cmd:
                    cfg[key] = cmd[key]
            snapshot = chip_status_snapshot(variables)
            events.append({"type": "chip.status.changed", **snapshot})
            return ReducerResult(state, snapshot, events)

        if command_type in ("patchVariables", "system.patchVariables"):
            patch = cmd.get("variablesPatch") or cmd.get("patch") or {}
            if isinstance(patch, dict) and patch:
                state.setdefault("variables", {}).update(copy.deepcopy(patch))
                events.append({"type": "variablesPatched", "keys": sorted(patch.keys())})
            return ReducerResult(state, {"ok": True}, events)

        if command_type == "idle.sync":
            # Persist the client idle-store snapshot so later syncs can diff.
            payload = {
                key: value for key, value in cmd.items()
                if key not in {"type", "requestId"}
            }
            if payload:
                previous = state.setdefault("variables", {}).get("idle")
                merged = previous if isinstance(previous, dict) else {}
                merged.update({k: v for k, v in payload.items()
                               if k not in {"prestige", "readIdlePrestige"}})
                merged["lastSyncMs"] = int(time.time() * 1000)
                state["variables"]["idle"] = merged
                events.append({"type": "idleSynced"})
            return ReducerResult(
                state,
                {
                    "ok": True,
                    "prestige": (cmd.get("prestige") or {}),
                },
                events,
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
