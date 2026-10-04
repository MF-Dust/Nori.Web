#!/usr/bin/env python3
"""Export deterministic expectations from the current Python reducers/session runtime."""
from __future__ import annotations

import asyncio
import copy
import hashlib
import json
import re
import sys
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
FIXTURES = ROOT / "rust" / "crates" / "nori-core" / "tests" / "fixtures"
MAX_FILE_BYTES = 1_500_000
SECRET = "rust-parity-secret-0123456789abcdef"
FIXED_NOW = 1_700_000_000
TS = "<ts>"
RANDOM = "<random>"

TIMESTAMP_KEYS = {
    "at", "atMs", "emittedAt", "createdAt", "surfacedAt", "timestamp",
    "startedAt", "endedAt", "lastSyncMs", "serverNowMs", "now",
    "updatedAt", "expiresAt", "lastScanAt", "cooledAt",
    # Integer epoch-ms keys found in reducer/live-pack output.
    "startedAtMs", "endedAtMs", "madeAtMs", "solvedAtMs", "coolAnchorMs",
    "lastSeenAt", "readAt", "seenAt", "syncedAt", "importedAt",
}
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.I)


class Normalizer:
    """Expectation-only masks. Inputs are copied verbatim and never passed here."""

    def __init__(self) -> None:
        self.uuid_ids: dict[str, str] = {}

    def apply(self, value, *, random_codenames: bool = False,
              random_cakeduel: bool = False, pictionary_random: bool = False):
        if isinstance(value, list):
            return [self.apply(v, random_codenames=random_codenames,
                               random_cakeduel=random_cakeduel,
                               pictionary_random=pictionary_random) for v in value]
        if not isinstance(value, dict):
            return value

        out = {}
        for key, raw in value.items():
            if key in TIMESTAMP_KEYS and isinstance(raw, int) and not isinstance(raw, bool):
                out[key] = TS
                continue
            if key == "worldId" and isinstance(raw, str):
                out[key] = "<world-id>"
                continue
            if key == "mediaGrants" and isinstance(raw, list):
                out[key] = [f"<media-grant-{i + 1}>" for i, _ in enumerate(raw)]
                continue
            if key == "mediaGrant" and isinstance(raw, str):
                out[key] = "<media-grant-1>"
                continue
            if isinstance(raw, str) and UUID_RE.fullmatch(raw):
                out[key] = self.uuid_ids.setdefault(raw, f"<uuid-{len(self.uuid_ids) + 1}>")
                continue
            if pictionary_random and key in {"roundId", "word", "drawingId", "pinyin", "synonyms"}:
                out[key] = RANDOM
                continue
            if random_codenames and key in {"board", "key"}:
                out[key] = RANDOM
                continue
            if random_cakeduel and key in {"deck", "discard", "hand", "cardIds"}:
                out[key] = RANDOM
                continue
            out[key] = self.apply(raw, random_codenames=random_codenames,
                                  random_cakeduel=random_cakeduel,
                                  pictionary_random=pictionary_random)
        return out


def normalize(value, *, random_codenames=False, random_cakeduel=False,
              pictionary_random=False, normalizer=None):
    return (normalizer or Normalizer()).apply(
        value, random_codenames=random_codenames,
        random_cakeduel=random_cakeduel, pictionary_random=pictionary_random,
    )


def canonical_json(value, *, indent=1) -> str:
    return json.dumps(value, ensure_ascii=False, indent=indent, sort_keys=True) + "\n"


def write_json(relative: str, value) -> None:
    path = FIXTURES / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    data = canonical_json(value).encode("utf-8")
    if len(data) >= MAX_FILE_BYTES:
        raise RuntimeError(f"fixture exceeds {MAX_FILE_BYTES} bytes: {relative} ({len(data)})")
    path.write_bytes(data)


def live_pack_data() -> dict:
    from backend.virtual_apps import live_pack
    data = json.loads(live_pack.PACK_PATH.read_text(encoding="utf-8"))
    if not live_pack.install_pack(data):
        raise RuntimeError("could not install the checked-in live archive pack")
    return data


def deterministic_runtime(stack: ExitStack) -> None:
    """Freeze wall clock and only the nonce APIs used by these Python paths."""
    stack.enter_context(patch("time.time", return_value=FIXED_NOW))
    token_hex_counter = iter(range(1, 1000))
    token_url_counter = iter(range(1, 1000))
    stack.enter_context(patch(
        "secrets.token_hex",
        side_effect=lambda n=16: f"{next(token_hex_counter):032x}"[-2 * (n or 16):],
    ))
    stack.enter_context(patch(
        "secrets.token_urlsafe",
        side_effect=lambda n=32: f"parity-token-{next(token_url_counter):04d}",
    ))


def mounted_world(owner: str, *, full_unlock: bool):
    from backend.session.world import WorldSession

    class FakeWebSocket:
        def __init__(self):
            self.messages: list[dict] = []
            self.text_frames: list[str] = []
            self.binary_frames: list[bytes] = []

        async def send_text(self, text: str) -> None:
            self.text_frames.append(text)
            self.messages.append(json.loads(text))

        async def send_bytes(self, data: bytes) -> None:
            self.binary_frames.append(data)

    world = WorldSession(owner, "zh-CN", full_unlock=full_unlock)
    # The fixture captures synchronous reducer behavior, not timer/AI side effects.
    world._schedule_follow_up = lambda *args, **kwargs: None

    def discard_background(coroutine):
        close = getattr(coroutine, "close", None)
        if close:
            close()
        return None

    world._spawn = discard_background
    return world, FakeWebSocket()


async def client_message(world, websocket, message):
    websocket.messages.clear()
    await world.handle_client_message(websocket, copy.deepcopy(message))
    if not websocket.messages:
        raise RuntimeError(f"WorldSession did not send a direct reply to {message!r}")
    return websocket.messages[-1]


def timestamp_and_random_snapshot(world) -> tuple[str, dict]:
    from backend.session.persistence import world_snapshot_json, world_from_snapshot_json

    parsed = json.loads(world_snapshot_json(world))
    # Only expectation values are masked; the input owner/grants/commands stay real.
    expected = normalize(parsed, pictionary_random=True)
    raw = json.dumps(expected, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    restored = world_from_snapshot_json(raw)
    if restored is None:
        raise AssertionError("normalized snapshot did not restore")
    round_trip = json.loads(world_snapshot_json(restored))
    round_trip = normalize(round_trip, pictionary_random=True)
    round_trip_json = json.dumps(round_trip, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    if round_trip_json != raw:
        raise AssertionError("parse→restore→serialize snapshot round trip differs")
    return raw, expected


async def export_snapshot(full_unlock: bool) -> None:
    from backend.session.persistence import world_snapshot_json

    owner = "guest_0123456789abcdef0123456789abcdef"
    world, websocket = mounted_world(owner, full_unlock=full_unlock)
    steps = []
    for cartridge_id in ("chess", "codenames", "cakeduel", "pictionary"):
        message = {"type": "mount_cartridge", "cartridgeId": cartridge_id,
                   "requestId": f"mount-{cartridge_id}"}
        steps.append(message)
        reply = await client_message(world, websocket, message)
        if "error" in reply:
            raise AssertionError(reply)

    def dispatch(cartridge_id, cmd):
        cartridge = world.cartridges[cartridge_id]
        msg = {
            "type": "dispatch", "cartridgeId": cartridge_id,
            "requestId": f"snapshot-{cartridge_id}", "actor": "player",
            "expectedHeadVersion": cartridge.head_version, "cmd": cmd,
        }
        steps.append(copy.deepcopy(msg))
        return msg

    msg = dispatch("chat", {"type": "playerMessage", "text": "Rust parity 快照"})
    reply = await client_message(world, websocket, msg)
    if "error" in reply:
        raise AssertionError(reply)

    msg = dispatch("chess", {"type": "startGame", "mode": "normal",
                              "side": "white", "difficulty": "casual"})
    if "error" in await client_message(world, websocket, msg):
        raise AssertionError("chess start failed")
    msg = dispatch("chess", {"type": "move", "from": "e2", "to": "e4"})
    if "error" in await client_message(world, websocket, msg):
        raise AssertionError("legal chess e2-e4 failed")

    msg = dispatch("codenames", {"type": "startGame", "mode": "tutorial",
                                  "settings": {"wordLocale": "zh-CN"}})
    if "error" in await client_message(world, websocket, msg):
        raise AssertionError("codenames tutorial start failed")
    msg = dispatch("cakeduel", {"type": "debugLoadScenario", "scenarioId": "attack-phase"})
    if "error" in await client_message(world, websocket, msg):
        raise AssertionError("cakeduel debug load failed")
    msg = dispatch("pictionary", {"type": "startSession", "atMs": 1000,
                                   "settings": {"locale": "zh-CN"}})
    if "error" in await client_message(world, websocket, msg):
        raise AssertionError("pictionary start failed")

    world.issue_media_grant()
    world.issue_media_grant()
    raw, parsed = timestamp_and_random_snapshot(world)
    compact_len = len(raw.encode("utf-8"))
    meta = {
        "mode": "archive" if full_unlock else "story",
        "ownerId": owner,
        "locale": "zh-CN",
        "fullUnlock": full_unlock,
        "inputs": steps,
        "snapshotBytes": compact_len,
        "factsKeyCount": len(parsed["cartridges"].get("manifold.web", {}).get("state", {}).get("facts", {})),
        "variablesKeyCount": len(parsed["cartridges"].get("manifold.web", {}).get("state", {}).get("variables", {})),
        "mediaGrantCount": len(parsed.get("mediaGrants", [])),
    }
    if len(raw.encode("utf-8")) < MAX_FILE_BYTES:
        meta["snapshot"] = raw
    else:
        meta["snapshotSha256"] = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    # Assert the source serializer was exercised directly as well as via restore.
    if not world_snapshot_json(world):
        raise AssertionError("empty Python snapshot")
    filename = "snapshot_archive_mode.json" if full_unlock else "snapshot_story_mode.json"
    write_json(filename, meta)


async def export_auth_vectors() -> None:
    from backend.core import config
    from backend.core import guest_session as guest
    from backend.session.manager import WorldManager

    config.SECRET_KEY = SECRET
    normalizer = Normalizer()
    sessions = []
    issued_tokens = []
    for index, now in enumerate((1_700_000_000, 1_700_000_123, 1_710_000_000), 1):
        with patch.object(guest.time, "time", return_value=now):
            result, created = guest.guest_session(None)
        token = result["session"]["token"]
        issued_tokens.append((token, result["user"]["id"], now + guest.SESSION_TTL))
        with patch.object(guest.time, "time", return_value=now + 1):
            restored, restored_created = guest.guest_session(token)
        sessions.append({
            "case": f"guest-{index}",
            "issuedAt": now,
            "token": token,
            "created": created,
            "userId": result["user"]["id"],
            "expiry": now + guest.SESSION_TTL,
            "validAt": now + 1,
            "validOutcome": {"created": restored_created,
                             "userId": restored["user"]["id"],
                             "token": restored["session"]["token"]},
        })

    bad_inputs = [
        ("missing", None, 1_700_000_000),
        ("legacy-local-storage", "local-guest-token", 1_700_000_000),
        ("malformed", "guest.v1.bad", 1_700_000_000),
        ("tampered-signature", issued_tokens[0][0][:-1] + ("0" if issued_tokens[0][0][-1] != "0" else "1"), 1_700_000_010),
        ("non-ascii-signature", issued_tokens[1][0].rsplit(".", 1)[0] + "." + "é" * 64, 1_700_000_010),
    ]
    invalid = []
    for case, token, now in bad_inputs:
        with patch.object(guest.time, "time", return_value=now):
            result, created = guest.guest_session(token)
        invalid.append({"case": case, "input": token, "validationAt": now,
                        "created": created, "userId": result["user"]["id"],
                        "replacementToken": result["session"]["token"],
                        "notLegacy": result["user"]["id"] != "guest-user-001"})
    expired_now = 1_700_000_000 - guest.SESSION_TTL - 1
    with patch.object(guest.time, "time", return_value=expired_now):
        expired, _ = guest.guest_session(None)
    expired_token = expired["session"]["token"]
    with patch.object(guest.time, "time", return_value=1_700_000_000):
        rotated, expired_created = guest.guest_session(expired_token)
    invalid.append({"case": "expired", "input": expired_token,
                    "validationAt": 1_700_000_000, "created": expired_created,
                    "userId": rotated["user"]["id"],
                    "replacementToken": rotated["session"]["token"],
                    "notLegacy": rotated["user"]["id"] != "guest-user-001"})

    # Ticket issue/resolve use module time and nonce APIs; both are fixed above.
    manager = WorldManager()
    tickets = []
    issued = []
    for user_id, now in (("guest_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 1_700_000_000),
                         ("user_rust_parity", 1_710_000_000),
                         ("guest-user-001", 1_720_000_000)):
        with patch("backend.session.manager.time.time", return_value=now):
            token = await manager.issue_ticket(user_id)
        encoded = token.rsplit(".", 1)[0]
        import base64
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        issued.append((token, user_id, payload["e"], now))
    valid_token, valid_user, expiry, issued_at = issued[0]
    tampered = valid_token.rsplit(".", 1)[0] + ".invalid-signature"
    legacy_token, _, _, _ = issued[2]
    second_token, second_user, second_expiry, second_issued_at = issued[1]
    for label, token, now, expected in (
        ("valid", valid_token, issued_at + 1, valid_user),
        ("valid-at-expiry", valid_token, expiry, valid_user),
        ("expired", valid_token, expiry + 1, None),
        ("tampered", tampered, issued_at + 1, None),
        ("legacy-shared-user", legacy_token, issued[2][3] + 1, None),
        ("second-valid", second_token, second_issued_at + 1, second_user),
        ("missing", None, issued_at + 1, None),
    ):
        with patch("backend.session.manager.time.time", return_value=now):
            resolved = await manager.resolve_ticket(token)
        if resolved != expected:
            raise AssertionError((label, resolved, expected))
        tickets.append({"case": label, "token": token, "resolveAt": now,
                        "expectedUserId": expected, "actualUserId": resolved,
                        "expiry": expiry if token == valid_token else (second_expiry if token == second_token else issued[2][2] if token == legacy_token else None)})

    cookie_cases = []
    for case, headers in (
        ("empty", {}),
        ("browser-cookie", {"cookie": f"{guest.SESSION_COOKIE}=guest.v1.cookie"}),
        ("better-auth-only", {"better-auth-cookie": f"{guest.SESSION_COOKIE}=better.v1.cookie"}),
        ("browser-wins-over-stale-local-storage", {
            "cookie": f"{guest.SESSION_COOKIE}=browser.v1.cookie",
            "better-auth-cookie": f"{guest.SESSION_COOKIE}=stale-local-token"}),
        ("suffix-session-token", {"cookie": "other.session_token=legacy-token"}),
        ("value-keeps-equals", {"cookie": f"{guest.SESSION_COOKIE}=a=b=c"}),
        ("first-matching-cookie", {"cookie": f"x.session_token=first; {guest.SESSION_COOKIE}=second"}),
    ):
        cookie_cases.append({"case": case, "headers": headers,
                             "token": guest.cookie_token(headers)})

    payload = {
        "secret": SECRET,
        "guestSessions": sessions,
        "guestInvalidVariants": invalid,
        "tickets": tickets,
        "cookieCases": cookie_cases,
        "cookieHeaders": {
            "insecure": guest.auth_cookie_headers("opaque", secure=False),
            "secure": guest.auth_cookie_headers("opaque", secure=True),
        },
    }
    write_json("auth_vectors.json", normalize(payload, normalizer=normalizer))


def record_step(cartridge, actor: str, cmd: dict, *, random_codenames=False,
                random_cakeduel=False, pictionary_random=False,
                normalizer: Normalizer | None = None) -> dict:
    from backend.cartridges.base import CommandRejected

    try:
        commit = cartridge.dispatch(actor, copy.deepcopy(cmd))
    except CommandRejected as exc:
        ok, error, committed, result, events = False, str(exc), False, None, []
    else:
        ok, error = True, None
        committed, result = commit.committed, commit.result
        events = commit.transition["events"] if commit.transition else []
    return {
        "actor": actor,
        "cmd": copy.deepcopy(cmd),
        "ok": ok,
        "error": error,
        "committed": committed,
        "result": normalize(result, random_codenames=random_codenames,
                             random_cakeduel=random_cakeduel,
                             pictionary_random=pictionary_random,
                             normalizer=normalizer),
        "events": normalize(events, random_codenames=random_codenames,
                             random_cakeduel=random_cakeduel,
                             pictionary_random=pictionary_random,
                             normalizer=normalizer),
        "state": normalize(copy.deepcopy(cartridge.state), random_codenames=random_codenames,
                            random_cakeduel=random_cakeduel,
                            pictionary_random=pictionary_random,
                            normalizer=normalizer),
    }


def export_chess() -> None:
    from backend.cartridges.chess import CHESS_DEBUG_SCENARIOS, TUTORIAL_STEPS, ChessCartridge

    cart = ChessCartridge()
    steps = []
    for scenario_id in sorted(CHESS_DEBUG_SCENARIOS):
        fixture = CHESS_DEBUG_SCENARIOS[scenario_id]
        steps.append(record_step(cart, "player", {"type": "debugLoadScenario", "scenarioId": scenario_id}))
        for spec in fixture["script"][fixture["startPly"]:]:
            game = cart.state["gameState"]
            side = game["turn"]
            actor = "player" if side == cart.state["settings"]["playerSide"] else "agent"
            cmd = {"type": "move", "from": spec["uci"][:2], "to": spec["uci"][2:4]}
            if len(spec["uci"]) == 5:
                cmd["promotion"] = spec["uci"][4]
            steps.append(record_step(cart, actor, cmd))

    steps.append(record_step(cart, "player", {"type": "startGame", "mode": "tutorial"}))
    steps.append(record_step(cart, "player", {"type": "move", "from": "f2", "to": "f3"}))
    steps.append(record_step(cart, "agent", {"type": "move", "from": "e2", "to": "e4"}))
    steps.append(record_step(cart, "player", {"type": "resign"}))
    for spec in TUTORIAL_STEPS:
        actor = spec["mover"]
        cmd = {"type": "move", **spec["move"]}
        steps.append(record_step(cart, actor, cmd))
    write_json("reducer_transcripts/chess.json", {"cartridge": "chess", "steps": steps})


def export_codenames() -> None:
    from backend.cartridges.codenames import CodenamesCartridge

    cart = CodenamesCartridge()
    steps = []
    for scenario_id in sorted(cart.DEBUG_SCENARIO_SEEDS):
        steps.append(record_step(cart, "player", {
            "type": "startGame", "settings": {"seed": 732451, "wordLocale": "zh-CN"}},
            random_codenames=True))
        steps.append(record_step(cart, "player", {
            "type": "debugLoadScenario", "scenarioId": scenario_id},
            random_codenames=True))

    steps.append(record_step(cart, "player", {
        "type": "startGame", "mode": "tutorial", "settings": {"wordLocale": "zh-CN"}}))
    steps.append(record_step(cart, "player", {"type": "submitClue", "clue": {"word": "早晨", "count": 1}}))
    steps.append(record_step(cart, "agent", {"type": "tutorialLoadStage", "stage": "sudden_death"}))
    opening = cart.agent_next_command()
    steps.append(record_step(cart, "agent", opening))
    steps.append(record_step(cart, "player", {"type": "submitGuess", "cell": 10}))
    steps.append(record_step(cart, "player", {"type": "submitClue", "clue": {"word": "错误", "count": 1}}))
    for cell in (0, 10, 17):
        steps.append(record_step(cart, "player", {"type": "submitGuess", "cell": cell}))
    steps.append(record_step(cart, "player", {"type": "submitClue", "clue": {"word": "PHAROS", "count": 1}}))
    while (cart.state.get("tutorial") or {}).get("step") == "nori_real_guessing":
        command = cart.agent_next_command()
        if command is None:
            raise AssertionError("codenames tutorial agent stalled at nori_real_guessing")
        steps.append(record_step(cart, "agent", command))
    steps.append(record_step(cart, "agent", cart.agent_next_command()))
    game = cart.state["gameState"]
    last_clue = game["history"][-1]
    safe = next(i for i, role in enumerate(game["key"][last_clue["clueGiver"]])
                if role == "AGENT" and game["cells"][i]["solvedBy"] is None)
    steps.append(record_step(cart, "player", {"type": "submitGuess", "cell": safe}))
    if cart.state["gameState"]["history"][-1]["endedBy"] is None:
        steps.append(record_step(cart, "player", {"type": "endTurn"}))
    steps.append(record_step(cart, "agent", cart.agent_next_command()))
    steps.append(record_step(cart, "agent", cart.agent_next_command()))
    steps.append(record_step(cart, "player", {"type": "submitGuess", "cell": 23}))
    steps.append(record_step(cart, "agent", cart.agent_next_command()))
    steps.append(record_step(cart, "player", {"type": "submitGuess", "cell": 12}))
    write_json("reducer_transcripts/codenames.json", {"cartridge": "codenames", "steps": steps})


def export_cakeduel() -> None:
    from backend.cartridges.cakeduel import CakeDuelCartridge

    cart = CakeDuelCartridge()
    steps = []
    scenario_ids = ("attack-phase", "block-phase", "stacked", "empty")
    for scenario_id in scenario_ids:
        steps.append(record_step(cart, "player", {
            "type": "startGame", "difficulty": "soldier"}, random_cakeduel=True))
        steps.append(record_step(cart, "player", {
            "type": "debugLoadScenario", "scenarioId": scenario_id}, random_cakeduel=True))
        steps.append(record_step(cart, "agent", {
            "type": "play", "action": {"type": "concede"}}, random_cakeduel=True))
        steps.append(record_step(cart, "player", {
            "type": "play", "action": {"type": "concede"}}, random_cakeduel=True))
    write_json("reducer_transcripts/cakeduel.json", {"cartridge": "cakeduel", "steps": steps})


def export_pictionary() -> None:
    from backend.cartridges.pictionary import PictionaryCartridge

    cart = PictionaryCartridge()
    steps = [
        record_step(cart, "player", {"type": "startSession", "atMs": 1000,
                                      "settings": {"locale": "zh-CN"}}, pictionary_random=True),
        record_step(cart, "player", {"type": "submitStrokeBatch", "batch":[{"x": 0.25, "y": 0.75}]}, pictionary_random=True),
        record_step(cart, "agent", {"type": "submitStrokeBatch", "batch":[{"x": 0.25, "y": 0.75}]}, pictionary_random=True),
        record_step(cart, "player", {"type": "submitStrokeBatch", "batch": []}, pictionary_random=True),
        record_step(cart, "player", {"type": "skipRound", "atMs": 2000}, pictionary_random=True),
        record_step(cart, "player", {"type": "forceEndSession", "atMs": 6000}, pictionary_random=True),
    ]
    write_json("reducer_transcripts/pictionary.json", {"cartridge": "pictionary", "steps": steps})


def export_manifold() -> None:
    from backend.cartridges.manifold import ManifoldWebCartridge
    from backend.virtual_apps import live_pack

    steps = []
    installed = ManifoldWebCartridge(full_unlock=True)
    installed_commands = [
        {"type": "client.emitFacts", "factIds": ["parity.batch.alpha", "parity.batch.beta"],
         "source": "rust-parity", "emittedAt": FIXED_NOW * 1000},
        {"type": "client.emitFacts", "factIds": ["parity.batch.alpha", "parity.batch.alpha"],
         "source": "rust-parity", "emittedAt": FIXED_NOW * 1000},
        {"type": "client.emitFacts", "factIds": "not-an-array"},
        {"type": "client.emitFacts", "factIds": ["x" * 257]},
        {"type": "patchVariables", "variablesPatch": {"rustParity": {"enabled": True, "count": 2}}},
        {"type": "idle.sync", "maxCompute": 12, "maxComputeThisRun": 12, "cap": 50,
         "prestige": {"level": 1}},
        {"type": "chip.debugReset"},
        {"type": "chip.debugConfig", "capacity": 1, "coolEveryMs": 300000,
         "neverOverheat": False},
        {"type": "chip.scan", "appId": "browser", "contentKey": "rust-parity-fresh"},
        {"type": "chip.scan", "appId": "browser", "contentKey": "rust-parity-second"},
        {"type": "chip.debugScan", "contentKey": "rust-parity-debug", "title": "Parity", "readout": "fixed"},
        {"type": "chip.debugScan", "contentKey": "rust-parity-debug", "title": "Parity", "readout": "fixed"},
        {"type": "chip.debugReset"},
        {"type": "chip.debugConfig", "capacity": 2, "coolEveryMs": 60000, "heat": 1},
    ]
    for cmd in installed_commands:
        steps.append({"pack": "installed", **record_step(installed, "player", cmd)})

    live_pack.set_disabled(True)
    try:
        disabled = ManifoldWebCartridge(full_unlock=True)
        disabled_commands = [
            {"type": "client.emitFacts", "factIds": ["parity.disabled.alpha"], "source": "rust-parity",
             "emittedAt": FIXED_NOW * 1000},
            {"type": "client.emitFacts", "factIds": ["parity.disabled.alpha", "parity.disabled.beta"]},
            {"type": "client.emitFacts", "factIds": "invalid-disabled-batch"},
            {"type": "patchVariables", "variablesPatch": {"rustParity": "disabled-pack"}},
            {"type": "idle.sync", "maxCompute": 9, "prestige": {"level": 2}},
            {"type": "chip.debugReset"},
            {"type": "chip.debugConfig", "capacity": 1, "coolEveryMs": 60000,
             "neverOverheat": False},
            {"type": "chip.scan", "appId": "browser", "contentKey": "rust-parity-disabled"},
            {"type": "chip.scan", "appId": "browser", "contentKey": "rust-parity-disabled-2"},
            {"type": "chip.debugScan", "contentKey": "rust-parity-disabled-debug",
             "title": "Disabled", "readout": "fixed"},
            {"type": "chip.debugReset"},
            {"type": "chip.debugConfig", "capacity": 2, "heat": 1},
        ]
        for cmd in disabled_commands:
            steps.append({"pack": "disabled", **record_step(disabled, "player", cmd)})
    finally:
        live_pack.set_disabled(False)
    write_json("reducer_transcripts/manifold.json", {"cartridge": "manifold.web", "steps": steps})


def export_chat() -> None:
    from backend.cartridges.chat import ChatCartridge

    cart = ChatCartridge()
    steps = [
        record_step(cart, "player", {"type": "playerMessage", "text": "你好，Nori。"}),
        record_step(cart, "player", {"type": "setPresentationMode", "presentationMode": "audio"}),
        record_step(cart, "agent", {"type": "operationStarted", "operationId": "op-fixed-1"}),
        record_step(cart, "agent", {
            "type": "ingestBlock", "operationId": "op-fixed-1", "messageId": "msg-fixed-1",
            "blockId": 0, "blockType": "text", "content": "固定的语音文本。",
            "isSpeech": True, "emotion": "neutral"}),
        record_step(cart, "agent", {"type": "audioStarted", "operationId": "op-fixed-1", "blockId": 0}),
        record_step(cart, "agent", {"type": "audioDone", "operationId": "op-fixed-1", "blockId": 0}),
        record_step(cart, "agent", {"type": "operationSettled", "operationId": "op-fixed-1", "outcome": "completed"}),
        record_step(cart, "agent", {"type": "ingestBlock", "operationId": "op-fixed-1",
                                     "messageId": "msg-fixed-1", "blockId": -1,
                                     "blockType": "text", "content": "bad", "isSpeech": True}),
    ]
    write_json("reducer_transcripts/chat.json", {"cartridge": "chat", "steps": steps})


class StoryRecorder:
    def __init__(self, world, websocket):
        self.world, self.websocket = world, websocket
        self.steps = []

    def facts(self):
        return sorted(self.world.cartridges["manifold.web"].state.get("facts", {}))

    def add(self, sent, reply, *, transport="event", artifacts_kind=None,
            replay_selector=None):
        clean_reply = copy.deepcopy(reply)
        if artifacts_kind is not None:
            artifacts = clean_reply.get("payload", {}).get("artifacts", [])
            clean_reply["payload"]["artifacts"] = [compact_artifact(a) for a in artifacts]
        pictionary_random = transport == "client" and sent.get("cartridgeId") == "pictionary"
        step = {"transport": transport, "sent": copy.deepcopy(sent),
                "reply": normalize(clean_reply, pictionary_random=pictionary_random),
                "factIds": self.facts()}
        if replay_selector is not None:
            # Semantic guidance for replay when Python/Rust random generators differ.
            step["replaySelector"] = replay_selector
        self.steps.append(step)

    async def event(self, message, *, artifacts_kind=None, replay_selector=None):
        reply = await self.world.event_dispatcher.handle_event(copy.deepcopy(message))
        self.add(message, reply, artifacts_kind=artifacts_kind,
                 replay_selector=replay_selector)
        return reply

    async def rpc(self, command, **payload):
        message = {"channel": "manifold.command.request", "requestId": "story-test",
                   "payload": {"command": command, "payload": payload}}
        reply = await self.event(message)
        return reply["payload"].get("result", reply["payload"])

    async def artifacts(self, kind):
        message = {"channel": "manifold.artifacts.request",
                   "payload": {"artifactType": kind}}
        reply = await self.event(message, artifacts_kind=kind)
        return reply["payload"]["artifacts"]

    async def dispatch(self, cartridge, command, actor="player", replay_selector=None):
        self.websocket.messages.clear()
        sent = {"type": "dispatch", "cartridgeId": cartridge,
                "requestId": "story-test", "actor": actor,
                "expectedHeadVersion": self.world.cartridges[cartridge].head_version,
                "cmd": copy.deepcopy(command)}
        await self.world.handle_client_message(self.websocket, copy.deepcopy(sent))
        if not self.websocket.messages:
            raise AssertionError(f"no reply for {sent!r}")
        reply = self.websocket.messages[-1]
        self.add(sent, reply, transport="client", replay_selector=replay_selector)
        if "error" in reply:
            raise AssertionError(reply)
        return reply

    async def mount(self, cartridge):
        sent = {"type": "mount_cartridge", "cartridgeId": cartridge,
                "requestId": "story-test"}
        self.websocket.messages.clear()
        await self.world.handle_client_message(self.websocket, copy.deepcopy(sent))
        reply = self.websocket.messages[-1]
        self.add(sent, reply, transport="client")
        if "error" in reply:
            raise AssertionError(reply)
        return reply


def compact_artifact(artifact):
    data = artifact.get("data") if isinstance(artifact.get("data"), dict) else {}
    keep = {}
    for key in ("app_kind", "puzzle_id", "command", "available_when", "display_path",
                "recover_when", "thread_id", "kind", "read_fact", "timestamp"):
        if key in data:
            keep[key] = data[key]
    if artifact.get("id") == "file.recovery_keys" and "body_md" in data:
        keep["body_md"] = data["body_md"]
    return {"id": artifact.get("id"), "type": artifact.get("type"),
            **({"data": keep} if keep else {})}


async def new_story_recorder():
    from backend.session.world import WorldSession
    from backend.services.story import advance

    world, websocket = mounted_world("story-command-test", full_unlock=False)
    advance(world)
    recorder = StoryRecorder(world, websocket)
    return recorder


async def export_story_walkthrough() -> None:
    recorder = await new_story_recorder()
    world = recorder.world
    # Mirrors test_vaults_are_surfaced_and_wrong_answers_do_not_advance.
    await recorder.artifacts("app")
    await recorder.rpc("client.emitFact", factId="paper.downloaded")
    vault = (await recorder.artifacts("app"))[0]["data"]
    await recorder.rpc(vault["command"], puzzleId=vault["puzzle_id"], tokens=["wrong"])
    await recorder.artifacts("file")
    await recorder.rpc(vault["command"], puzzleId=vault["puzzle_id"], tokens=["Eurydice"])
    await recorder.artifacts("file")
    await recorder.rpc("client.emitFact", factId="cult.zip.downloaded")
    await recorder.rpc("vault.unlock", puzzleId="cult", tokens=["978209"])
    await recorder.rpc("vault.unlock", puzzleId="cult", tokens=["978208"])

    # Mirrors test_idle_command_and_event_share_recovery_and_reject_bad_numbers.
    await recorder.rpc("idle.sync", maxCompute=1e8, maxComputeThisRun=1e8, cap=1e8, type="idle.complete")
    await recorder.rpc("idle.sync", maxCompute=1)
    await recorder.rpc("idle.sync", maxCompute=-1)
    await recorder.event({"channel": "idle.sync", "payload": {"prestige": {"maxCompute": 1e12}}})

    # Mirrors test_daniel_evidence_waits_for_all_answers.
    await recorder.rpc("client.emitFact", factId="signal_daniel.unlocked")
    await recorder.rpc("client.emitFact", factId="qfr.installed")
    await recorder.artifacts("signal_message")
    await recorder.rpc("signal.daniel.verify")
    await recorder.rpc("signal.daniel.verify", answer="314159")
    for answer in ("2-13", "3月6日", "银虎斑"):
        await recorder.rpc("signal.daniel.verify", answer=answer)
    await recorder.artifacts("signal_message")

    # Mirrors test_nas_download_publishes_the_actual_file_and_rejects_unknown_paths.
    await recorder.rpc("nas.list", path="/")
    await recorder.rpc("nas.connect", host="unknown.example")
    await recorder.rpc("nas.connect", host="198.51.100.74")
    await recorder.rpc("nas.list", path="/")
    await recorder.rpc("nas.read", path="/README.txt")
    await recorder.rpc("nas.download", path="/missing.pdf")
    await recorder.artifacts("file")
    await recorder.rpc("nas.download", path="/deep-dive-consent-review.pdf")
    await recorder.artifacts("file")
    await recorder.rpc("nas.download", path="/deep-dive-consent-review.pdf")

    story = await new_story_recorder()
    # Mirrors the long test that reaches arg.ending.shown; fixed seed only
    # stabilizes Python's input choice. Rust replays the semantic selector below.
    await story.mount("chess")
    await story.dispatch("chess", {"type": "startGame", "mode": "normal",
                                    "side": "white", "difficulty": "casual"})
    await story.dispatch("chess", {"type": "resign"})
    await story.rpc("mail.read", mailId="mail.help")
    await story.rpc("client.emitFact", factId="system.repaired")
    await story.rpc("client.emitFact", factId="paper.downloaded")
    await story.rpc("vault.unlock", puzzleId="bookcipher", tokens=["欧律狄刻"])
    recovery = next(a for a in await story.artifacts("file") if a.get("id") == "file.recovery_keys")
    recovery_code = re.search(r"[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}", recovery["data"]["body_md"]).group()
    password_result = await story.rpc("signal.recover", recoveryCode=recovery_code)
    await story.rpc("signal.login", username="me@manifold.institute", password=password_result["tempPassword"])
    for n in (1, 2, 3):
        await story.rpc("client.emitFact", factId=f"corrupt.doc{n}.read")
    await story.rpc("client.emitFact", factId="corrupt.climax_pending")
    await story.rpc("client.emitFact", factId="virus.cleared")
    await story.rpc("mail.read", mailId="mail.act2_hinge")
    for fact in ("qfr.downloaded", "qfr.installing", "qfr.installed"):
        await story.rpc("client.emitFact", factId=fact)
    await story.rpc("idle.sync", maxCompute=1e8, maxComputeThisRun=1e8, cap=1e10)
    await story.rpc("client.emitFact", factId="file.seal_config.read")
    await story.rpc("client.emitFact", factId="file.tower_photo.read")
    await story.dispatch("chat", {"type": "playerMessage", "text": "pharos"})
    await story.rpc("signal.daniel.verify")
    for answer in ("02-13", "03-06", "silver tabby"):
        await story.rpc("signal.daniel.verify", answer=answer)
    await story.rpc("client.emitFact", factId="daniel.retraction.downloaded")
    await story.rpc("nas.connect", host="198.51.100.74")
    await story.rpc("nas.download", path="/deep-dive-consent-review.pdf")
    await story.rpc("client.emitFact", factId="futurum.doc2.downloaded")
    await story.rpc("client.emitFact", factId="cult.zip.downloaded")
    await story.rpc("vault.unlock", puzzleId="cult", tokens=["978208"])
    await story.rpc("client.emitFact", factId="arg.cult_truth")
    await story.rpc("bounty.installExtension")
    for url in ("https://pulse.social/user/frank_mercer48", "https://pulse.social/user/mags_cole"):
        await story.event({"channel": "manifold.bounty.submit", "payload": {"url": url}})

    await story.mount("codenames")
    await story.dispatch("codenames", {"type": "startGame", "settings": {"seed": 481516, "wordLocale": "zh-CN"}})
    await story.dispatch("codenames", {"type": "submitClue", "clue": {"word": "示例线索", "count": 1}})
    game = story.world.cartridges["codenames"].state["gameState"]
    cell = game["key"][game["history"][-1]["clueGiver"]].index("ASSASSIN")
    await story.dispatch("codenames", {"type": "submitGuess", "cell": cell}, "agent",
                         replay_selector={"kind": "first-role", "role": "ASSASSIN",
                                          "teamFrom": "gameState.history[-1].clueGiver"})
    await story.mount("pictionary")
    await story.dispatch("pictionary", {"type": "startSession", "atMs": 0})
    await story.dispatch("pictionary", {"type": "forceEndSession", "atMs": 60_000})
    await story.mount("cakeduel")
    await story.dispatch("cakeduel", {"type": "startGame"})
    for _ in range(10):
        cake = story.world.cartridges["cakeduel"]
        if cake.state["game"]["gameEnded"]:
            break
        actor = "player" if cake._phasing_player(cake.state["game"]) == 0 else "agent"
        await story.dispatch("cakeduel", {"type": "play", "action": {"type": "concede"}}, actor)
    await story.rpc("idle.sync", maxCompute=1e31, maxComputeThisRun=1e31, cap=1e35)
    await story.rpc("client.emitFact", factId="arg.memory.start")
    await story.rpc("client.emitFact", factId="arg.memory.shown")
    await story.rpc("idle.complete")
    await story.rpc("client.emitFact", factId="arg.manifold_unlocked")
    await story.rpc("idle.sync", claimedMementoCount=12)
    await story.rpc("idle.complete")
    await story.rpc("idle.sync", claimedMementoCount=13)
    await story.rpc("idle.complete")
    for fact in ("arg.finale.started", "arg.finale.shown", "arg.farewell.shown", "arg.ending.shown"):
        await story.rpc("client.emitFact", factId=fact)

    expected = {"endingFact": "arg.ending.shown", "gestureFact": "arg.gestures_complete",
                "recoveryCodeFact": "recover.datasea_exe"}
    if "arg.ending.shown" not in story.facts() or "mail.nori_final.unlocked" not in story.facts():
        raise AssertionError("story walkthrough did not reach arg.ending.shown")
    write_json("story_walkthrough.json", {
        "sourceTest": "tests/test_story_commands.py",
        "scenarios": {
            "playthrough": {"steps": story.steps, "expected": expected,
                            "finalFactIds": story.facts()},
            "vaultDanielNasChecks": {"steps": recorder.steps,
                                      "finalFactIds": recorder.facts()},
        },
    })


def export_readme(pack: dict) -> None:
    readme = f"""# Python → Rust parity fixtures

Generated by running `python scripts/rust_parity/export_fixtures.py` from the repository root. The exporter imports the current `backend/` implementation, uses the checked-in `backend/data/live_world_pack.json`, freezes wall-clock time at Unix second `{FIXED_NOW}` for deterministic generated cases, and writes sorted-key UTF-8 JSON with a final newline. Re-running the command replaces these files with byte-identical output. Every file is checked to remain below 1,500,000 bytes.

## Expectation normalization

Only recorded **expectations** are normalized; command inputs and recorded sent messages are kept as the actual Python values. Integer timestamp fields are replaced by the string `"<ts>"` for these keys: `{', '.join(sorted(TIMESTAMP_KEYS))}`. Test-time inputs (`issuedAt`, `validAt`, `validationAt`, `resolveAt`, and explicit reducer command values) stay numeric; only output expectations are normalized. World UUIDs become `"<world-id>"`; media grants become `"<media-grant-N>"`; UUID-shaped IDs become stable `"<uuid-N>"` labels. Random pictionary round IDs/word payloads are `"<random>"`. The codenames debug fixtures mask Python-RNG-generated `board`/`key` values. Cake Duel start-game expectations mask shuffled deck/hand/discard/card-id arrays; the scenario data and non-random rule outputs remain exact. Rust must apply the same expectation masks before comparing, and must not treat masked values as golden data.

The ticket/guest vectors intentionally retain valid signed tokens and an `expiry` seconds field: these are the cryptographic/authentication test vectors, not wall-clock display expectations. The exporter substitutes deterministic nonce sources when creating them, so signatures remain genuine and stable across runs.

## Files and Rust replay assertions

- `snapshot_story_mode.json`, `snapshot_archive_mode.json`: built from an in-process `WorldSession` (`guest_` plus 32 hex digits, `zh-CN`), mounting chess, codenames, cakeduel, and pictionary; dispatching chat `playerMessage`, chess normal start plus legal `e2-e4`, codenames tutorial start, cakeduel `attack-phase` debug load, and pictionary start with fixed `atMs`; then issuing two media grants. Assert owner/locale/unlock mode, mounted cartridge states, media sequence/grant count, and byte equality of the normalized snapshot string after parse → restore → serialize. Archive mode uses the installed live pack. If the canonical snapshot exceeds the limit the fixture stores its SHA-256, byte length, and facts/variables key counts instead of the snapshot body.
- `auth_vectors.json`: guest-token creation/verification, malformed/expired/tampered rotation, fixed-secret ticket issue/resolve (including expiry boundary, invalid signature, missing token, and legacy `guest-user-001` rejection), cookie precedence/parsing, and secure/insecure cookie-header generation. Assert exact HMAC token acceptance, resulting user IDs/expiry seconds, resolution outcome at each retained `resolveAt`, and cookie values/headers.
- `reducer_transcripts/chess.json`: every `CHESS_DEBUG_SCENARIOS` load and remaining scripted moves, then all 22 tutorial moves plus off-script, wrong-actor, and forbidden-action rejections. Assert every step's ok/error/commit/result/events and complete post-step state (timestamp masks only).
- `reducer_transcripts/codenames.json`: each `DEBUG_SCENARIO_SEEDS` load followed by the full tutorial, including gated/rejected actions and both tutorial stage loads. Assert tutorial gates, stage/turn changes, scoring/events, terminal state, and state after each dispatch; mask only RNG-derived debug board/key fields.
- `reducer_transcripts/cakeduel.json`: each Python debug scenario, a wrong-phasing-player rejection, and a legal concede. Assert scenario payloads and reducer behavior; shuffled engine zones in the fixed-seed start are masked because Rust's RNG stream is not Python's.
- `reducer_transcripts/pictionary.json`: fixed-locale session start, stroke batch success/wrong actor/invalid batch, skip, and force-end. Assert rules/events/state except masked random word/drawing/round-id values.
- `reducer_transcripts/manifold.json`: emitFacts batch and duplicate, invalid batches, variable patching, idle sync, and chip scan/debugScan/debugReset/debugConfig with the live pack installed and disabled. Assert emitted counts/fact records, validation errors, variable persistence, chip cache/heat/readout behavior, and timestamp-normalized state.
- `reducer_transcripts/chat.json`: player message, presentation-mode change, fixed operation/message IDs through ingestBlock/audioStarted/audioDone/operationSettled, and invalid ingest. Assert message IDs, contiguous block reveal/presentation behavior, transition events, and final state.
- `story_walkthrough.json`: the long `test_normal_commands_reach_the_ending_not_just_ending_started` progression plus the vault, Daniel, NAS, and idle checks. Client dispatches are sent through `WorldSession.handle_client_message` with a fake websocket; other checks use the same event-dispatcher RPCs as the Python test. Assert each client direct reply and sorted fact-ID list after the operation, rejected answers do not advance facts, and the final story reaches `arg.ending.shown`/`mail.nori_final.unlocked`. The codenames assassin guess includes `replaySelector` metadata: the recorded Python cell is concrete, while a Rust replay should select the assassin from its own generated key because the RNGs differ.

The live pack contributes {len(pack.get('facts', dict()))} initial facts and {len(pack.get('variables', dict()))} variable keys to the archive snapshot. Snapshot and replay expectations contain no API keys, sockets, asyncio tasks, or output from scheduled AI/background work.
"""
    path = FIXTURES / "README.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(readme, encoding="utf-8", newline="\n")
    if path.stat().st_size >= MAX_FILE_BYTES:
        raise RuntimeError("fixtures README exceeds size limit")


async def main_async() -> None:
    from backend.core import config
    from backend.virtual_apps import live_pack

    config.SECRET_KEY = SECRET
    pack = live_pack_data()
    with ExitStack() as stack:
        deterministic_runtime(stack)
        await export_snapshot(False)
        await export_snapshot(True)
        await export_auth_vectors()
        export_chess()
        export_codenames()
        export_cakeduel()
        export_pictionary()
        export_manifold()
        export_chat()
        await export_story_walkthrough()
        export_readme(pack)
    live_pack.set_disabled(False)
    # Restore the pack if a disabled-pack parity case cleared its cache.
    if not live_pack.has_loaded_pack():
        live_pack.install_pack(pack)


def main() -> None:
    asyncio.run(main_async())
    files = sorted(path for path in FIXTURES.rglob("*") if path.is_file())
    for path in files:
        size = path.stat().st_size
        if size >= MAX_FILE_BYTES:
            raise RuntimeError(f"fixture exceeds size limit: {path} ({size})")
        print(f"{path.relative_to(ROOT).as_posix()} {size}")


if __name__ == "__main__":
    main()
