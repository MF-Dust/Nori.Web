"""`codenames` / Woodland Quest runtime compatible with the shipped reducer."""

from __future__ import annotations

import json
import random
import re
import time
from pathlib import Path
from copy import deepcopy
from typing import Any, Dict, Iterable, List, Optional, Tuple

from .base import BaseCartridge, CommandRejected, ReducerResult

TEAM_A = "A"
TEAM_B = "B"
AGENT = "AGENT"
BYSTANDER = "BYSTANDER"
ASSASSIN = "ASSASSIN"
NORMAL = "NORMAL"
SUDDEN_DEATH = "SUDDEN_DEATH"
GAME_OVER = "GAME_OVER"

_WORDS_FILE = Path(__file__).resolve().parents[1] / "data" / "codenames_words.json"
_RAW_WORDS = json.loads(_WORDS_FILE.read_text(encoding="utf-8"))
if isinstance(_RAW_WORDS, dict):
    WORDS_BY_LOCALE: Dict[str, List[str]] = _RAW_WORDS
else:
    WORDS_BY_LOCALE: Dict[str, List[str]] = {"en": _RAW_WORDS}


class CodenamesCartridge(BaseCartridge):
    def __init__(self) -> None:
        super().__init__(
            "codenames",
            {
                "gameState": None,
                "counterpartSide": TEAM_A,
                "agentSide": TEAM_B,
                "settings": {"tokens": 9, "wordLocale": "zh-CN"},
                "tutorial": None,
            },
        )

    @staticmethod
    def _resolve_words(word_locale: Optional[str]) -> List[str]:
        """Resolve localized vocabulary for Codenames game board."""
        if not word_locale:
            return WORDS_BY_LOCALE.get("zh-CN") or WORDS_BY_LOCALE.get("en", [])
        loc = word_locale.lower().replace("_", "-")
        if loc.startswith("zh") or loc in {"cn", "zh-cn", "zh-tw", "zh-hk"}:
            return WORDS_BY_LOCALE.get("zh-CN") or WORDS_BY_LOCALE.get("en", [])
        if loc.startswith("ja") or loc in {"jp", "ja"}:
            return WORDS_BY_LOCALE.get("ja") or WORDS_BY_LOCALE.get("en", [])
        return WORDS_BY_LOCALE.get("en") or list(WORDS_BY_LOCALE.values())[0]

    @staticmethod
    def _other(side: str) -> str:
        return TEAM_B if side == TEAM_A else TEAM_A

    @staticmethod
    def _actor_side(state: Dict[str, Any], actor: str) -> str:
        if actor == "player":
            return state["counterpartSide"]
        if actor == "agent":
            return state["agentSide"]
        raise CommandRejected("Unknown actor")

    @staticmethod
    def _remaining_agents(game: Dict[str, Any], side: str) -> int:
        return sum(
            1
            for index, role in enumerate(game["key"][side])
            if role == AGENT and game["cells"][index]["solvedBy"] is None
        )

    @classmethod
    def _all_agents_solved(cls, game: Dict[str, Any]) -> bool:
        for index in range(25):
            if (
                game["key"][TEAM_A][index] == AGENT
                or game["key"][TEAM_B][index] == AGENT
            ) and game["cells"][index]["solvedBy"] is None:
                return False
        return True

    @staticmethod
    def _generate_keys(rng: random.Random) -> Dict[str, List[str]]:
        a = [BYSTANDER] * 25
        b = [BYSTANDER] * 25
        indexes = list(range(25))
        rng.shuffle(indexes)
        cursor = 0
        for _ in range(3):
            index = indexes[cursor]
            cursor += 1
            a[index] = b[index] = AGENT
        index = indexes[cursor]
        cursor += 1
        a[index] = b[index] = ASSASSIN
        index = indexes[cursor]
        cursor += 1
        a[index] = AGENT
        b[index] = ASSASSIN
        index = indexes[cursor]
        cursor += 1
        a[index] = ASSASSIN
        b[index] = AGENT
        for _ in range(5):
            a[indexes[cursor]] = AGENT
            cursor += 1
        for _ in range(5):
            b[indexes[cursor]] = AGENT
            cursor += 1
        a[indexes[cursor]] = ASSASSIN
        cursor += 1
        b[indexes[cursor]] = ASSASSIN
        return {TEAM_A: a, TEAM_B: b}

    @classmethod
    def _new_game(cls, settings: Dict[str, Any]) -> Dict[str, Any]:
        seed = settings.get("seed")
        if isinstance(seed, bool) or not isinstance(seed, int):
            seed = int(time.time() * 1000)
        rng = random.Random(seed)
        words_pool = cls._resolve_words(settings.get("wordLocale"))
        selected = rng.sample(words_pool, 25)
        return {
            "board": [{"id": word, "text": word} for word in selected],
            "key": cls._generate_keys(rng),
            "cells": [
                {"solvedBy": None, "bystanderMarks": [None, None], "assassinatedBy": None}
                for _ in range(25)
            ],
            "tokensRemaining": settings["tokens"],
            "whoseTurnToGive": TEAM_A,
            "phase": NORMAL,
            "winner": None,
            "history": [],
        }

    @staticmethod
    def _validate_settings(raw: Any, previous: Dict[str, Any]) -> Dict[str, Any]:
        settings = deepcopy(previous)
        if raw is None:
            return settings
        if not isinstance(raw, dict):
            raise CommandRejected("settings must be an object")
        if "tokens" in raw:
            tokens = raw["tokens"]
            if isinstance(tokens, bool) or tokens not in {9, 10, 11}:
                raise CommandRejected("tokens must be 9, 10, or 11")
            settings["tokens"] = tokens
        if "seed" in raw:
            seed = raw["seed"]
            if isinstance(seed, bool) or not isinstance(seed, int):
                raise CommandRejected("seed must be an integer")
            settings["seed"] = seed
        if "wordLocale" in raw:
            if not isinstance(raw["wordLocale"], str):
                raise CommandRejected("wordLocale must be a string")
            settings["wordLocale"] = raw["wordLocale"]
        return settings

    @staticmethod
    def _validate_clue(game: Dict[str, Any], clue: Any) -> Dict[str, Any]:
        if not isinstance(clue, dict):
            raise CommandRejected("clue must be an object")
        word = clue.get("word")
        count = clue.get("count")
        if not isinstance(word, str):
            raise CommandRejected("clue.word must be a string")
        word = word.strip().upper()
        if not word or len(word) > 24 or re.search(r"\s|\d", word):
            raise CommandRejected("Invalid clue word")
        if word in {entry["text"].upper() for entry in game["board"]}:
            raise CommandRejected("Clue word cannot be on the board")
        if count != "infinity" and (isinstance(count, bool) or not isinstance(count, int) or count < 0):
            raise CommandRejected("Clue count must be a non-negative integer or infinity")
        return {"word": word, "count": count}

    @classmethod
    def _finish_turn(cls, game: Dict[str, Any]) -> Dict[str, Any]:
        if game["tokensRemaining"] == 0 and not cls._all_agents_solved(game):
            game["phase"] = SUDDEN_DEATH
            return game
        giver = game["whoseTurnToGive"]
        other = cls._other(giver)
        if cls._remaining_agents(game, other) > 0:
            game["whoseTurnToGive"] = other
        elif cls._remaining_agents(game, giver) > 0:
            game["whoseTurnToGive"] = giver
        else:
            game["phase"] = SUDDEN_DEATH
        return game

    @classmethod
    def _submit_clue(cls, game: Dict[str, Any], side: str, clue: Dict[str, Any]) -> Dict[str, Any]:
        if game["phase"] != NORMAL:
            raise CommandRejected("Can only submit clues during NORMAL phase")
        if game["whoseTurnToGive"] != side:
            raise CommandRejected("Not your turn")
        if cls._remaining_agents(game, side) <= 0:
            raise CommandRejected("This side cannot give clues")
        turn = {"clueGiver": side, "clue": clue, "guesses": [], "endedBy": None}
        game["history"].append(turn)
        return game

    @classmethod
    def _submit_guess(cls, game: Dict[str, Any], side: str, cell_index: int) -> Tuple[Dict[str, Any], str, bool]:
        if game["phase"] not in {NORMAL, SUDDEN_DEATH}:
            raise CommandRejected("Game is over")
        if cell_index < 0 or cell_index >= 25:
            raise CommandRejected("Cell index must be between 0 and 24")
        cell = game["cells"][cell_index]
        if cell["solvedBy"] is not None or cell["assassinatedBy"] is not None:
            raise CommandRejected("Cannot guess an already solved card")

        if game["phase"] == SUDDEN_DEATH:
            if cls._remaining_agents(game, side) <= 0:
                raise CommandRejected("This side cannot guess in sudden death")
            role = game["key"][cls._other(side)][cell_index]
            if role == ASSASSIN:
                cell["assassinatedBy"] = side
                game["phase"] = GAME_OVER
                game["winner"] = None
                return game, "assassin", True
            if role == BYSTANDER:
                marks = cell["bystanderMarks"]
                if marks[0] is None:
                    marks[0] = side
                else:
                    marks[1] = side
                game["phase"] = GAME_OVER
                game["winner"] = None
                return game, "bystander", True
            cell["solvedBy"] = side
            if cls._all_agents_solved(game):
                game["phase"] = GAME_OVER
                game["winner"] = "TEAM"
                return game, "agent", True
            return game, "agent", False

        if not game["history"]:
            raise CommandRejected("No clue has been given")
        turn = game["history"][-1]
        if turn["endedBy"] is not None:
            raise CommandRejected("Current turn has ended")
        if side == turn["clueGiver"]:
            raise CommandRejected("Clue giver cannot make guesses")

        role = game["key"][turn["clueGiver"]][cell_index]
        turn["guesses"].append({"cell": cell_index, "result": role, "at": int(time.time() * 1000)})
        if role == ASSASSIN:
            cell["assassinatedBy"] = side
            game["phase"] = GAME_OVER
            game["winner"] = None
            return game, "assassin", True
        if role == AGENT:
            cell["solvedBy"] = side
            if cls._all_agents_solved(game):
                game["phase"] = GAME_OVER
                game["winner"] = "TEAM"
                return game, "agent", True
            if cls._remaining_agents(game, turn["clueGiver"]) == 0:
                turn["endedBy"] = "ALL_FOUND"
                game["tokensRemaining"] = max(0, game["tokensRemaining"] - 1)
                cls._finish_turn(game)
                return game, "agent", True
            return game, "agent", False
        marks = cell["bystanderMarks"]
        if marks[0] is None:
            marks[0] = side
        else:
            marks[1] = side
        turn["endedBy"] = "BYSTANDER"
        game["tokensRemaining"] = max(0, game["tokensRemaining"] - 1)
        cls._finish_turn(game)
        return game, "bystander", True

    @classmethod
    def _end_turn(cls, game: Dict[str, Any], side: str) -> Tuple[Dict[str, Any], bool]:
        if game["phase"] != NORMAL:
            raise CommandRejected("Can only end turns during NORMAL phase")
        if not game["history"]:
            raise CommandRejected("No turn to end")
        turn = game["history"][-1]
        if turn["endedBy"] is not None:
            raise CommandRejected("Current turn has already ended")
        if side == turn["clueGiver"]:
            raise CommandRejected("Clue giver cannot end turn")
        if not turn["guesses"]:
            raise CommandRejected("Must make at least one guess before ending turn")
        turn["endedBy"] = "VOLUNTARY_END"
        game["tokensRemaining"] = max(0, game["tokensRemaining"] - 1)
        before = game["phase"]
        cls._finish_turn(game)
        return game, before != game["phase"] == SUDDEN_DEATH

    @classmethod
    def _outcome_events(cls, game: Dict[str, Any], result: str) -> List[Dict[str, Any]]:
        if game["phase"] != GAME_OVER:
            return []
        outcome = "team" if game["winner"] == "TEAM" else result
        return [
            {"type": "game_over", "winner": outcome},
            {"type": "game_outcome", "outcome": "win" if outcome == "team" else "loss", "reason": outcome},
        ]

    def reduce(self, actor: str, cmd: Dict[str, Any]) -> ReducerResult:
        command_type = cmd["type"]
        state = deepcopy(self.state)

        if command_type == "startGame":
            if actor not in {"player", "agent"}:
                raise CommandRejected("Unknown actor")
            game = state.get("gameState")
            if actor == "agent" and game and game.get("phase") != GAME_OVER:
                raise CommandRejected("A game is already in progress — only the player may start a new one")
            settings = self._validate_settings(cmd.get("settings"), state["settings"])
            state.update(
                {
                    "gameState": self._new_game(settings),
                    "settings": settings,
                    "counterpartSide": TEAM_A,
                    "agentSide": TEAM_B,
                    "tutorial": {"step": "free_play"} if cmd.get("mode") == "tutorial" else None,
                }
            )
            return ReducerResult(state, {"success": True}, [{"type": "game_start", "counterpartSide": TEAM_A}])

        if command_type == "reset":
            if actor != "player":
                raise CommandRejected("Only player may reset")
            game = state.get("gameState")
            if game and game.get("phase") != GAME_OVER and state.get("tutorial") is None:
                raise CommandRejected("Cannot reset a live game")
            state["gameState"] = None
            state["tutorial"] = None
            return ReducerResult(state, {"success": True})

        if command_type == "restore":
            restored = cmd.get("state")
            if not isinstance(restored, dict):
                raise CommandRejected("state must be an object")
            return ReducerResult(deepcopy(restored), {"success": True})

        game = state.get("gameState")
        if not isinstance(game, dict):
            raise CommandRejected("Game not started")
        side = self._actor_side(state, actor)

        if command_type == "submitClue":
            clue = self._validate_clue(game, cmd.get("clue"))
            self._submit_clue(game, side, clue)
            by = "counterpart" if actor == "player" else "agent"
            events: List[Dict[str, Any]] = [{"type": "clue", "by": by, "word": clue["word"], "count": clue["count"]}]
            return ReducerResult(state, {"success": True, "newState": deepcopy(game)}, events)

        if command_type == "submitGuess":
            cell = cmd.get("cell")
            if isinstance(cell, bool) or not isinstance(cell, int):
                raise CommandRejected("cell must be an integer")
            before = deepcopy(game)
            game, result, turn_ended = self._submit_guess(game, side, cell)
            by = "counterpart" if actor == "player" else "agent"
            events: List[Dict[str, Any]] = [
                {"type": "card_reveal", "cell": cell, "by": by},
                {"type": "guess", "by": by, "word": before["board"][cell]["text"], "result": result},
            ]
            if before["phase"] != SUDDEN_DEATH and game["phase"] == SUDDEN_DEATH:
                events.append({"type": "sudden_death"})
            events.extend(self._outcome_events(game, result))
            return ReducerResult(
                state,
                {
                    "success": True,
                    "result": result,
                    "word": before["board"][cell]["text"],
                    "gameStateBefore": before,
                    "gameStateAfter": deepcopy(game),
                    "turnEnded": turn_ended,
                },
                events,
            )

        if command_type == "endTurn":
            game, entered_sudden_death = self._end_turn(game, side)
            by = "counterpart" if actor == "player" else "agent"
            correct = sum(1 for guess in game["history"][-1]["guesses"] if guess["result"] == AGENT)
            events: List[Dict[str, Any]] = [
                {"type": "turn_end", "by": by, "reason": "voluntary", "correctGuesses": correct}
            ]
            if entered_sudden_death:
                events.append({"type": "sudden_death"})
            if game["phase"] == NORMAL and game["whoseTurnToGive"] == state["agentSide"]:
                events.insert(0, {"type": "agent_turn", "action": "clue"})
            return ReducerResult(state, {"success": True, "enteredSuddenDeath": entered_sudden_death}, events)

        if command_type == "tutorialLoadStage":
            if actor != "agent":
                raise CommandRejected("Only agent may load tutorial stages")
            raise CommandRejected("Tutorial stage loading is not available in local free-play mode")

        if command_type == "debugLoadScenario":
            raise CommandRejected("Codenames debug harness is disabled")

        raise CommandRejected(f"Unknown codenames command: {command_type}")

    def agent_next_command(self) -> Optional[Dict[str, Any]]:
        """Return one legal local-agent action; scheduling is owned by World."""
        state = self.state
        game = state.get("gameState")
        if not isinstance(game, dict) or game.get("phase") == GAME_OVER:
            return None
        agent_side = state["agentSide"]
        word_locale = (state.get("settings") or {}).get("wordLocale", "zh-CN")
        default_clue_word = (
            "诺莉"
            if (word_locale and ("zh" in word_locale.lower() or "cn" in word_locale.lower()))
            else ("ノリ" if (word_locale and "ja" in word_locale.lower()) else "NORI")
        )
        if game["phase"] == NORMAL:
            if not game["history"] or game["history"][-1]["endedBy"] is not None:
                if game["whoseTurnToGive"] == agent_side:
                    targets = [
                        i
                        for i, role in enumerate(game["key"][agent_side])
                        if role == AGENT and game["cells"][i]["solvedBy"] is None
                    ]
                    if targets:
                        # The public reducer validates clue form, not semantic relation.
                        return {"type": "submitClue", "clue": {"word": default_clue_word, "count": 1}}
            else:
                turn = game["history"][-1]
                if turn["clueGiver"] != agent_side:
                    candidates = [
                        i
                        for i, cell in enumerate(game["cells"])
                        if cell["solvedBy"] is None and cell["assassinatedBy"] is None
                    ]
                    # Avoid known assassin positions on the clue-giver's key.
                    safe = [i for i in candidates if game["key"][turn["clueGiver"]][i] == AGENT]
                    if safe:
                        return {"type": "submitGuess", "cell": safe[0]}
                    if turn["guesses"]:
                        return {"type": "endTurn"}
                    if candidates:
                        return {"type": "submitGuess", "cell": candidates[0]}
        elif game["phase"] == SUDDEN_DEATH and self._remaining_agents(game, agent_side) > 0:
            candidates = [
                i
                for i, cell in enumerate(game["cells"])
                if cell["solvedBy"] is None and cell["assassinatedBy"] is None
                and game["key"][self._other(agent_side)][i] == AGENT
            ]
            if candidates:
                return {"type": "submitGuess", "cell": candidates[0]}
        return None
