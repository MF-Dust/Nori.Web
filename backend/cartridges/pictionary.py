"""`pictionary` / Draw & Guess cartridge contract with full multi-locale vocabulary and synonym matching."""

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

_VOCAB_PATH = Path(__file__).resolve().parents[1] / "data" / "pictionary_words.json"
try:
    _VOCAB_DATA: Dict[str, List[Dict[str, Any]]] = json.loads(_VOCAB_PATH.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError):
    _VOCAB_DATA = {
        "en": [{"word": "apple", "synonyms": [], "drawingId": "apple", "removed": False}],
        "zh-CN": [{"word": "苹果", "synonyms": [], "drawingId": "apple", "pinyin": [["p", "ing"], ["g", "uo"]], "removed": False}],
    }


class PictionaryCartridge(BaseCartridge):
    def __init__(self) -> None:
        super().__init__(
            "pictionary",
            {
                "gameState": None,
                "settings": {
                    "sessionDurationMs": 180_000,
                    "inferenceMode": "fast",
                    "locale": "zh-CN",
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
        """Normalize user guess preserving alphanumeric, Chinese, and Japanese characters."""
        if not isinstance(value, str):
            raise CommandRejected("text must be a string")
        value = value.strip().lower()
        # Remove whitespace and common punctuation, retaining letters, numbers, Chinese and Japanese characters
        value = re.sub(r"[\s\.,!?'\"-_/\\，。！？、“”‘’（）()【】\[\]]+", "", value)
        return value[:50]

    @staticmethod
    def _resolve_vocab(locale: Optional[str]) -> List[Dict[str, Any]]:
        loc = (locale or "zh-CN").lower().replace("_", "-")
        if loc.startswith("zh") or loc in {"cn", "zh-cn", "zh-tw", "zh-hk"}:
            vocab = _VOCAB_DATA.get("zh-CN") or _VOCAB_DATA.get("en", [])
        else:
            vocab = _VOCAB_DATA.get("en") or _VOCAB_DATA.get("zh-CN", [])
        return [item for item in vocab if not item.get("removed", False)]

    def _choose_item(self, locale: str, excluded_ids: List[str]) -> Dict[str, Any]:
        pool = self._resolve_vocab(locale)
        excluded_set = {x.lower() for x in excluded_ids}
        candidates = [item for item in pool if item["drawingId"].lower() not in excluded_set]
        return self._rng.choice(candidates or pool)

    @staticmethod
    def _round(at_ms: int, item: Dict[str, Any], roles: Dict[str, str]) -> Dict[str, Any]:
        return {
            "roundId": f"round_{at_ms}_{random.randrange(36**6):06x}",
            "startedAtMs": at_ms,
            "word": item["word"],
            "drawingId": item["drawingId"],
            "pinyin": item.get("pinyin", []),
            "synonyms": item.get("synonyms", []),
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

    @classmethod
    def _check_guess(cls, raw_guess: str, round_data: Dict[str, Any]) -> bool:
        guess = cls._normalize_guess(raw_guess)
        if not guess:
            return False

        target_word = cls._normalize_guess(round_data["word"])
        target_drawing = cls._normalize_guess(round_data["drawingId"])
        target_synonyms = [cls._normalize_guess(s) for s in round_data.get("synonyms", [])]
        all_targets = [t for t in [target_word, target_drawing, *target_synonyms] if t]

        if guess in all_targets:
            return True

        for target in all_targets:
            if len(guess) >= 2 and (guess in target or target in guess):
                return True
            if len(target) == 1 and guess == target:
                return True
        return False

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
            locale = settings.get("locale", "zh-CN")
            item = self._choose_item(locale, [])
            round_data = self._round(at_ms, item, {"drawer": "player", "guesser": "agent"})
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
                    {
                        "type": "round_started",
                        "roundId": round_data["roundId"],
                        "roles": round_data["roles"],
                        "drawingId": item["drawingId"],
                    },
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
            used = [round_data["drawingId"], *[entry.get("drawingId", entry["word"]).replace(" ", "-") for entry in game["history"]]]
            locale = state["settings"].get("locale", "zh-CN")
            item = self._choose_item(locale, used)
            roles = self._roles_after(round_data["roles"])
            next_round = self._round(at_ms, item, roles)
            game["round"] = next_round
            return ReducerResult(
                state,
                {"success": True, "roundId": next_round["roundId"]},
                [{"type": "round_started", "roundId": next_round["roundId"], "roles": roles, "drawingId": item["drawingId"]}],
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
            if not isinstance(raw_text, str) or not raw_text.strip():
                raise CommandRejected("Empty guess")
            correct = self._check_guess(raw_text, round_data)
            round_data["lastGuess"] = {"by": actor, "text": str(raw_text).strip(), "atMs": at_ms, "correct": correct}
            events: List[Dict[str, Any]] = [
                {"type": "guess_submitted", "roundId": round_data["roundId"], "by": actor, "text": str(raw_text).strip(), "correct": correct}
            ]
            if correct:
                elapsed = max(0, at_ms - round_data["startedAtMs"])
                history = [
                    *game["history"],
                    {
                        "word": round_data["word"],
                        "drawingId": round_data["drawingId"],
                        "roles": deepcopy(round_data["roles"]),
                        "elapsedMs": elapsed,
                        "outcome": "solved",
                    },
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
                {
                    "word": round_data["word"],
                    "drawingId": round_data["drawingId"],
                    "roles": deepcopy(round_data["roles"]),
                    "elapsedMs": elapsed,
                    "outcome": "skipped",
                },
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
                {
                    "word": round_data["word"],
                    "drawingId": round_data["drawingId"],
                    "roles": deepcopy(round_data["roles"]),
                    "elapsedMs": elapsed,
                    "outcome": "unfinished",
                }
            )
            game["phase"] = RESULTS
            return ReducerResult(state, {"success": True}, [{"type": "session_finished"}])

        raise CommandRejected(f"Unknown pictionary command: {command_type}")
