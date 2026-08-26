"""`pictionary` / Draw & Guess cartridge contract from GameScreen-CgEXO_XJ.js."""

from __future__ import annotations

import json
import random
import re
import time
from pathlib import Path
from copy import deepcopy
from typing import Any, Dict, List, Optional

from .base import BaseCartridge, CommandRejected, ReducerResult

PLAYING = "PLAYING"
RESULTS = "RESULTS"

_DRAWINGS_PATH = Path(__file__).resolve().parents[2] / "public" / "pictionary" / "drawings.json"
try:
    _DRAWING_IDS = list(json.loads(_DRAWINGS_PATH.read_text(encoding="utf-8")).keys())
except (OSError, json.JSONDecodeError):
    _DRAWING_IDS = ["apple", "cat", "house", "tree", "sun"]


class PictionaryCartridge(BaseCartridge):
    def __init__(self) -> None:
        super().__init__(
            "pictionary",
            {
                "gameState": None,
                "settings": {
                    "sessionDurationMs": 180_000,
                    "inferenceMode": "fast",
                    "locale": "en",
                },
            },
        )
        self._rng = random.Random()

    @staticmethod
    def _roles_after(roles: Dict[str, str]) -> Dict[str, str]:
        return (
            {"drawer": "agent", "guesser": "player"}
            if roles["drawer"] == "player"
            else {"drawer": "player", "guesser": "agent"}
        )

    @staticmethod
    def _normalize_guess(value: Any) -> str:
        if not isinstance(value, str):
            raise CommandRejected("text must be a string")
        value = value.strip().lower()
        value = re.sub(r"\s+", " ", value)
        value = re.sub(r"[^a-z0-9\s-]", " ", value)
        return re.sub(r"\s+", " ", value).strip()[:50]

    @staticmethod
    def _word_from_id(drawing_id: str) -> str:
        return drawing_id.replace("-", " ")

    def _choose_word(self, excluded: List[str]) -> str:
        candidates = [entry for entry in _DRAWING_IDS if entry.lower() not in {x.lower() for x in excluded}]
        return self._rng.choice(candidates or _DRAWING_IDS)

    @staticmethod
    def _round(at_ms: int, drawing_id: str, roles: Dict[str, str]) -> Dict[str, Any]:
        return {
            "roundId": f"round_{at_ms}_{random.randrange(36**6):06x}",
            "startedAtMs": at_ms,
            "word": PictionaryCartridge._word_from_id(drawing_id),
            "drawingId": drawing_id,
            "pinyin": [],
            "roles": roles,
            "status": "active",
            "noriRedrawEpoch": 0,
        }

    @staticmethod
    def _settings(previous: Dict[str, Any], incoming: Any) -> Dict[str, Any]:
        settings = deepcopy(previous)
        if incoming is None:
            return settings
        if not isinstance(incoming, dict):
            raise CommandRejected("settings must be an object")
        if "sessionDurationMs" in incoming:
            duration = incoming["sessionDurationMs"]
            if isinstance(duration, bool) or not isinstance(duration, int) or duration <= 0:
                raise CommandRejected("sessionDurationMs must be a positive integer")
            settings["sessionDurationMs"] = duration
        if "roundTimeLimitMs" in incoming:
            limit = incoming["roundTimeLimitMs"]
            if isinstance(limit, bool) or not isinstance(limit, int) or limit <= 0:
                raise CommandRejected("roundTimeLimitMs must be a positive integer")
            settings["roundTimeLimitMs"] = limit
        if "inferenceMode" in incoming:
            if incoming["inferenceMode"] not in {"fast", "harder"}:
                raise CommandRejected("inferenceMode must be fast or harder")
            settings["inferenceMode"] = incoming["inferenceMode"]
        if "locale" in incoming:
            if not isinstance(incoming["locale"], str):
                raise CommandRejected("locale must be a string")
            settings["locale"] = incoming["locale"]
        return settings

    @staticmethod
    def _session_finished_if_needed(game: Dict[str, Any], settings: Dict[str, Any], history: List[Dict[str, Any]]) -> bool:
        elapsed = sum(int(entry.get("elapsedMs", 0)) for entry in history)
        return elapsed >= settings["sessionDurationMs"]

    def reduce(self, actor: str, cmd: Dict[str, Any]) -> ReducerResult:
        command_type = cmd["type"]
        state = deepcopy(self.state)

        if command_type == "startSession":
            if actor != "player":
                raise CommandRejected("Only player can start a session")
            existing = state.get("gameState")
            if existing and existing.get("phase") == PLAYING:
                raise CommandRejected("Session already in progress")
            at_ms = cmd.get("atMs")
            if isinstance(at_ms, bool) or not isinstance(at_ms, int):
                raise CommandRejected("atMs must be an integer")
            settings = self._settings(state["settings"], cmd.get("settings"))
            drawing_id = self._choose_word([])
            round_data = self._round(at_ms, drawing_id, {"drawer": "player", "guesser": "agent"})
            state["settings"] = settings
            state["gameState"] = {
                "phase": PLAYING,
                "score": {"solved": 0, "skipped": 0},
                "round": round_data,
                "history": [],
            }
            return ReducerResult(
                state,
                {"success": True, "roundId": round_data["roundId"]},
                [
                    {"type": "session_started"},
                    {"type": "round_started", "roundId": round_data["roundId"], "roles": round_data["roles"], "drawingId": drawing_id},
                ],
            )

        game = state.get("gameState")
        if not isinstance(game, dict) or game.get("phase") != PLAYING:
            if command_type == "forceEndSession":
                return ReducerResult(state, {"success": False})
            raise CommandRejected("Session is not active")
        round_data = game["round"]

        if command_type == "startNextRound":
            if round_data.get("status") == "active":
                raise CommandRejected("Round is still active")
            at_ms = cmd.get("atMs")
            if isinstance(at_ms, bool) or not isinstance(at_ms, int):
                raise CommandRejected("atMs must be an integer")
            used = [round_data["drawingId"], *[entry["word"].replace(" ", "-") for entry in game["history"]]]
            drawing_id = self._choose_word(used)
            roles = self._roles_after(round_data["roles"])
            next_round = self._round(at_ms, drawing_id, roles)
            game["round"] = next_round
            return ReducerResult(
                state,
                {"success": True, "roundId": next_round["roundId"]},
                [{"type": "round_started", "roundId": next_round["roundId"], "roles": roles, "drawingId": drawing_id}],
            )

        if command_type == "submitStrokeBatch":
            if actor != "player" or round_data["roles"]["drawer"] != "player":
                raise CommandRejected("Only the player drawer can submit strokes")
            batch = cmd.get("batch")
            if not isinstance(batch, list) or not (1 <= len(batch) <= 32):
                raise CommandRejected("batch must contain 1 to 32 strokes")
            # The shipped reducer intentionally treats strokes as an ephemeral
            # side channel: it returns success without mutating runtime state.
            return ReducerResult(state, {"success": True})

        if command_type == "submitGuess":
            if round_data.get("status") != "active":
                raise CommandRejected("Round is not active")
            if round_data["roles"]["guesser"] != actor:
                raise CommandRejected("Not the current guesser")
            at_ms = cmd.get("atMs")
            if isinstance(at_ms, bool) or not isinstance(at_ms, int):
                raise CommandRejected("atMs must be an integer")
            raw_text = cmd.get("text")
            guess = self._normalize_guess(raw_text)
            if not guess:
                raise CommandRejected("Empty guess")
            word = self._normalize_guess(round_data["word"])
            correct = word in guess or guess in word
            round_data["lastGuess"] = {"by": actor, "text": str(raw_text).strip(), "atMs": at_ms, "correct": correct}
            events: List[Dict[str, Any]] = [
                {"type": "guess_submitted", "roundId": round_data["roundId"], "by": actor, "text": str(raw_text).strip(), "correct": correct}
            ]
            if correct:
                elapsed = max(0, at_ms - round_data["startedAtMs"])
                history = [
                    *game["history"],
                    {"word": round_data["word"], "roles": deepcopy(round_data["roles"]), "elapsedMs": elapsed, "outcome": "solved"},
                ]
                game["history"] = history
                game["score"]["solved"] += 1
                round_data["status"] = "solved"
                round_data["solvedAtMs"] = at_ms
                events.append({"type": "round_solved", "roundId": round_data["roundId"], "by": actor, "word": round_data["word"], "elapsedMs": elapsed})
                if self._session_finished_if_needed(game, state["settings"], history):
                    game["phase"] = RESULTS
                    events.append({"type": "session_finished"})
            return ReducerResult(state, {"success": True, "correct": correct}, events)

        if command_type == "skipRound":
            if round_data.get("status") != "active":
                raise CommandRejected("Round is not active")
            if actor not in {round_data["roles"]["drawer"], round_data["roles"]["guesser"]}:
                raise CommandRejected("Not allowed to skip this round")
            at_ms = cmd.get("atMs")
            if isinstance(at_ms, bool) or not isinstance(at_ms, int):
                raise CommandRejected("atMs must be an integer")
            elapsed = max(0, at_ms - round_data["startedAtMs"])
            history = [
                *game["history"],
                {"word": round_data["word"], "roles": deepcopy(round_data["roles"]), "elapsedMs": elapsed, "outcome": "skipped"},
            ]
            game["history"] = history
            game["score"]["skipped"] += 1
            round_data["status"] = "skipped"
            events = [{"type": "round_skipped", "roundId": round_data["roundId"], "by": actor}]
            if self._session_finished_if_needed(game, state["settings"], history):
                game["phase"] = RESULTS
                events.append({"type": "session_finished"})
            return ReducerResult(state, {"success": True}, events)

        if command_type == "noriRedraw":
            if actor != "agent" or round_data["roles"]["drawer"] != "agent":
                raise CommandRejected("Only Nori can redraw")
            round_data["noriRedrawEpoch"] += 1
            return ReducerResult(
                state,
                {"epoch": round_data["noriRedrawEpoch"]},
                [{"type": "nori_redraw", "roundId": round_data["roundId"], "epoch": round_data["noriRedrawEpoch"]}],
            )

        if command_type == "forceEndSession":
            at_ms = cmd.get("atMs")
            if isinstance(at_ms, bool) or not isinstance(at_ms, int):
                raise CommandRejected("atMs must be an integer")
            elapsed = max(0, at_ms - round_data["startedAtMs"])
            round_data["status"] = "unfinished"
            game["history"].append(
                {"word": round_data["word"], "roles": deepcopy(round_data["roles"]), "elapsedMs": elapsed, "outcome": "unfinished"}
            )
            game["phase"] = RESULTS
            return ReducerResult(state, {"success": True}, [{"type": "session_finished"}])

        raise CommandRejected(f"Unknown pictionary command: {command_type}")
