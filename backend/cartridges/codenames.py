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
    TUTORIAL_STEPS = (
        "nori_opening_clue",
        "player_first_treasure",
        "player_second_treasure",
        "player_berry_lesson",
        "player_real_clue",
        "nori_real_guessing",
        "nori_canine_clue",
        "player_free_guessing",
        "load_monster_lesson",
        "nori_chime_clue",
        "player_monster_touch",
        "load_sudden_death",
        "player_finale_guess",
        "free_play",
    )
    TUTORIAL_MOVERS = {
        "nori_opening_clue": "agent",
        "player_first_treasure": "player",
        "player_second_treasure": "player",
        "player_berry_lesson": "player",
        "player_real_clue": "player",
        "nori_real_guessing": "agent",
        "nori_canine_clue": "agent",
        "player_free_guessing": "player",
        "load_monster_lesson": "agent",
        "nori_chime_clue": "agent",
        "player_monster_touch": "player",
        "load_sudden_death": "agent",
        "player_finale_guess": "player",
    }
    TUTORIAL_GUESSES = {
        "player_first_treasure": 0,
        "player_second_treasure": 10,
        "player_berry_lesson": 17,
        "player_monster_touch": 23,
        "player_finale_guess": 12,
    }
    TUTORIAL_KEY = {
        TEAM_A: [
            BYSTANDER, BYSTANDER, BYSTANDER, ASSASSIN, AGENT,
            AGENT, AGENT, BYSTANDER, AGENT, BYSTANDER,
            BYSTANDER, BYSTANDER, AGENT, BYSTANDER, AGENT,
            AGENT, BYSTANDER, BYSTANDER, BYSTANDER, AGENT,
            BYSTANDER, AGENT, ASSASSIN, ASSASSIN, BYSTANDER,
        ],
        TEAM_B: [
            AGENT, BYSTANDER, BYSTANDER, BYSTANDER, BYSTANDER,
            BYSTANDER, AGENT, AGENT, BYSTANDER, AGENT,
            AGENT, ASSASSIN, AGENT, AGENT, BYSTANDER,
            ASSASSIN, BYSTANDER, BYSTANDER, BYSTANDER, BYSTANDER,
            BYSTANDER, AGENT, AGENT, ASSASSIN, BYSTANDER,
        ],
    }
    TUTORIAL_CONTENT = {
        "en": {
            "board": ["MOON", "RIVER", "ACORN", "SPARROW", "BRIDGE", "CASTLE", "HONEY", "WOLF", "LANTERN", "MAPLE", "STAR", "MUSHROOM", "BELL", "FOX", "CLOUD", "IVY", "COMPASS", "OWL", "PEBBLE", "SNOW", "FERN", "MEADOW", "CROW", "EMBER", "SHELL"],
            "clues": {"nori_opening_clue": ("NIGHT", 2), "nori_canine_clue": ("CANINE", 2), "nori_chime_clue": ("CHIME", 1)},
        },
        "zh-CN": {
            "board": ["月亮", "溪流", "坚果", "麻雀", "吊桥", "城堡", "蜂蜜", "野狼", "灯笼", "枫叶", "星星", "蘑菇", "铃铛", "狐狸", "云朵", "藤蔓", "罗盘", "猫头鹰", "鹅卵石", "雪花", "蕨草", "草地", "乌鸦", "余烬", "贝壳"],
            "clues": {"nori_opening_clue": ("黑夜", 2), "nori_canine_clue": ("犬类", 2), "nori_chime_clue": ("钟声", 1)},
        },
        "ja": {
            "board": ["満月", "小川", "どんぐり", "スズメ", "つり橋", "古城", "ハチミツ", "オオカミ", "ランタン", "モミジ", "星空", "キノコ", "ベル", "キツネ", "入道雲", "ツタ", "コンパス", "フクロウ", "小石", "吹雪", "シダ", "草原", "カラス", "残り火", "貝殻"],
            "clues": {"nori_opening_clue": ("真夜中", 2), "nori_canine_clue": ("イヌ科", 2), "nori_chime_clue": ("チャイム", 1)},
        },
    }
    DEBUG_SCENARIO_SEEDS = {
        "sudden_death_both": 2026012101,
        "sudden_death_counterpart_only": 2026012102,
        "sudden_death_agent_only": 2026012103,
    }
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

    @classmethod
    def _tutorial_content(cls, word_locale: Optional[str]) -> Dict[str, Any]:
        locale = (word_locale or "en").lower().replace("_", "-")
        key = "zh-CN" if locale.startswith("zh") or locale == "cn" else "ja" if locale.startswith("ja") else "en"
        return cls.TUTORIAL_CONTENT[key]

    @classmethod
    def _new_tutorial_game(cls, word_locale: Optional[str]) -> Dict[str, Any]:
        content = cls._tutorial_content(word_locale)
        return {
            "board": [{"id": word, "text": word} for word in content["board"]],
            "key": deepcopy(cls.TUTORIAL_KEY),
            "cells": [
                {"solvedBy": None, "bystanderMarks": [None, None], "assassinatedBy": None}
                for _ in range(25)
            ],
            "tokensRemaining": 9,
            "whoseTurnToGive": TEAM_B,
            "phase": NORMAL,
            "winner": None,
            "history": [],
        }

    @classmethod
    def _tutorial_gate(cls, state: Dict[str, Any], actor: str, command_type: str, cell: Any = None) -> None:
        tutorial = state.get("tutorial")
        if not isinstance(tutorial, dict) or actor != "player":
            return
        step = tutorial.get("step")
        if step == "free_play":
            return
        if cls.TUTORIAL_MOVERS.get(step) != actor:
            raise CommandRejected("Tutorial: wait — it is not your move yet")
        expected_cell = cls.TUTORIAL_GUESSES.get(step)
        if expected_cell is not None:
            if command_type != "submitGuess":
                raise CommandRejected("Tutorial: this step asks you to guess a card")
            if cell != expected_cell:
                raise CommandRejected("Tutorial: this step asks you to guess the highlighted card")
            return
        if step == "player_real_clue" and command_type != "submitClue":
            raise CommandRejected("Tutorial: this step asks you to give a clue of your own")
        if step == "player_free_guessing" and command_type not in {"submitGuess", "endTurn"}:
            raise CommandRejected("Tutorial: this step asks you to guess or end your turn")

    @classmethod
    def _advance_tutorial(
        cls, state: Dict[str, Any], actor: str, *, turn_ended: bool, game_over: bool
    ) -> List[Dict[str, Any]]:
        tutorial = state.get("tutorial")
        if not isinstance(tutorial, dict):
            return []
        step = tutorial.get("step")
        if step not in cls.TUTORIAL_STEPS or step == "free_play":
            return []
        events = [{"type": "tutorial_step", "step": step}]
        if cls.TUTORIAL_MOVERS.get(step) != actor:
            return events
        if step in {"nori_real_guessing", "player_free_guessing"} and not turn_ended:
            return events
        next_index = cls.TUTORIAL_STEPS.index(step) + 1
        if game_over:
            while next_index < len(cls.TUTORIAL_STEPS):
                candidate = cls.TUTORIAL_STEPS[next_index]
                if candidate in {"load_monster_lesson", "load_sudden_death", "free_play"}:
                    break
                next_index += 1
        tutorial["step"] = cls.TUTORIAL_STEPS[min(next_index, len(cls.TUTORIAL_STEPS) - 1)]
        return events

    @classmethod
    def _load_tutorial_stage(cls, game: Dict[str, Any], stage: str, agent_side: str) -> Dict[str, Any]:
        for turn in game["history"][-1:]:
            if turn["endedBy"] is None:
                turn["endedBy"] = "VOLUNTARY_END"
        if stage == "monster":
            for index, cell in enumerate(game["cells"]):
                cell["assassinatedBy"] = None
                if index == 12:
                    cell.update({"solvedBy": None, "bystanderMarks": [None, None], "assassinatedBy": None})
            game.update({"phase": NORMAL, "winner": None, "whoseTurnToGive": agent_side})
            return game
        if stage == "sudden_death":
            for index, cell in enumerate(game["cells"]):
                if index == 12:
                    cell.update({"solvedBy": None, "bystanderMarks": [None, None], "assassinatedBy": None})
                    continue
                belongs_a = game["key"][TEAM_A][index] == AGENT
                belongs_b = game["key"][TEAM_B][index] == AGENT
                cell["assassinatedBy"] = None
                if belongs_a or belongs_b:
                    cell["solvedBy"] = cell["solvedBy"] or (TEAM_A if belongs_b else TEAM_B)
            game.update({"phase": SUDDEN_DEATH, "winner": None, "tokensRemaining": 0})
            return game
        raise CommandRejected("Unknown tutorial stage")

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

    @classmethod
    def _debug_sudden_death(cls, state: Dict[str, Any], scenario_id: str) -> Dict[str, Any]:
        """Build the three shipped sudden-death scenarios from the live key.

        Keeping the current key makes the scenario a real Codenames state: the
        ordinary reducer can continue it, and the UI derives the eligible
        guesser from the same remaining-target calculation used in play.
        """
        if scenario_id not in cls.DEBUG_SCENARIO_SEEDS:
            raise CommandRejected("Unknown Codenames debug scenario")
        current = state.get("gameState")
        if not isinstance(current, dict):
            raise CommandRejected("Game not started")
        counterpart, agent = state["counterpartSide"], state["agentSide"]

        def exclusive(owner: str, other: str) -> int:
            return next((index for index in range(25)
                         if current["key"][owner][index] == AGENT
                         and current["key"][other][index] != AGENT), -1)

        protected: set[int] = set()
        if scenario_id in {"sudden_death_both", "sudden_death_counterpart_only"}:
            index = exclusive(agent, counterpart)
            if index < 0:
                raise CommandRejected("Current key has no agent-only treasure")
            protected.add(index)
        if scenario_id in {"sudden_death_both", "sudden_death_agent_only"}:
            index = exclusive(counterpart, agent)
            if index < 0:
                raise CommandRejected("Current key has no counterpart-only treasure")
            protected.add(index)

        seed = cls.DEBUG_SCENARIO_SEEDS[scenario_id]
        rng = random.Random(seed)
        words = cls._resolve_words((state.get("settings") or {}).get("wordLocale"))
        board_words = rng.sample(words, 25)
        board = [{"id": word, "text": word} for word in board_words]
        cells = [{"solvedBy": None, "bystanderMarks": [None, None], "assassinatedBy": None}
                 for _ in range(25)]
        turns = int((state.get("settings") or {}).get("tokens", 9))
        started = int(time.time() * 1000) - turns * 60_000
        clue_pool = [word for word in words if word not in set(board_words)]
        rng.shuffle(clue_pool)
        history: List[Dict[str, Any]] = []
        for turn_index in range(turns):
            giver = counterpart if turn_index % 2 == 0 else agent
            history.append({
                "clueGiver": giver,
                "clue": {"word": clue_pool[turn_index] if turn_index < len(clue_pool) else f"CLUE{turn_index + 1}", "count": 2},
                "guesses": [],
                "endedBy": "VOLUNTARY_END",
            })

        # Assign every solved treasure to a legal historical turn. Balancing
        # across turns keeps all token-spending turns playable and truthful.
        for cell_index in range(25):
            if cell_index in protected:
                continue
            eligible = [turn_index for turn_index, turn in enumerate(history)
                        if current["key"][turn["clueGiver"]][cell_index] == AGENT]
            if not eligible:
                continue
            turn_index = min(eligible, key=lambda index: len(history[index]["guesses"]))
            giver = history[turn_index]["clueGiver"]
            guesser = cls._other(giver)
            at = started + turn_index * 60_000 + (len(history[turn_index]["guesses"]) + 1) * 6_000
            history[turn_index]["guesses"].append({"cell": cell_index, "result": AGENT, "at": at})
            cells[cell_index]["solvedBy"] = guesser

        # The shipped fixture ends every third turn on a safe bystander.
        used = {guess["cell"] for turn in history for guess in turn["guesses"]}
        for turn_index, turn in enumerate(history):
            if turn_index % 3 != 2:
                continue
            giver, guesser = turn["clueGiver"], cls._other(turn["clueGiver"])
            bystander = next((index for index in range(25) if index not in used
                              and current["key"][giver][index] == BYSTANDER
                              and current["key"][cls._other(giver)][index] != AGENT), None)
            if bystander is None:
                continue
            used.add(bystander)
            cells[bystander]["bystanderMarks"][0] = guesser
            turn["guesses"].append({"cell": bystander, "result": BYSTANDER,
                                    "at": started + turn_index * 60_000 + 54_000})
            turn["endedBy"] = "BYSTANDER"

        remaining_counterpart = sum(1 for index, role in enumerate(current["key"][counterpart])
                                    if role == AGENT and cells[index]["solvedBy"] is None)
        remaining_agent = sum(1 for index, role in enumerate(current["key"][agent])
                              if role == AGENT and cells[index]["solvedBy"] is None)
        valid = ((scenario_id == "sudden_death_both" and remaining_counterpart > 0 and remaining_agent > 0)
                 or (scenario_id == "sudden_death_counterpart_only" and remaining_counterpart == 0 and remaining_agent > 0)
                 or (scenario_id == "sudden_death_agent_only" and remaining_counterpart > 0 and remaining_agent == 0))
        if not valid:
            raise CommandRejected("Unable to construct requested sudden-death scenario")
        return {
            "board": board,
            "key": deepcopy(current["key"]),
            "cells": cells,
            "tokensRemaining": 0,
            "whoseTurnToGive": history[-1]["clueGiver"] if history else counterpart,
            "phase": SUDDEN_DEATH,
            "winner": None,
            "history": history,
        }

    def reduce(self, actor: str, cmd: Dict[str, Any]) -> ReducerResult:
        command_type = cmd["type"]
        state = deepcopy(self.state)

        if command_type == "startGame":
            if actor not in {"player", "agent"}:
                raise CommandRejected("Unknown actor")
            game = state.get("gameState")
            if actor == "agent" and game and game.get("phase") != GAME_OVER:
                raise CommandRejected("A game is already in progress — only the player may start a new one")
            raw_settings = cmd.get("settings")
            settings = self._validate_settings(raw_settings, state["settings"])
            tutorial_mode = cmd.get("mode") == "tutorial"
            if tutorial_mode:
                tutorial_locale = raw_settings.get("wordLocale") if isinstance(raw_settings, dict) else None
                settings = {"tokens": 9, **({"wordLocale": tutorial_locale} if isinstance(tutorial_locale, str) else {})}
            state.update(
                {
                    "gameState": self._new_tutorial_game(settings.get("wordLocale")) if tutorial_mode else self._new_game(settings),
                    "settings": settings,
                    "counterpartSide": TEAM_A,
                    "agentSide": TEAM_B,
                    "tutorial": {"step": "nori_opening_clue"} if tutorial_mode else None,
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
            self._tutorial_gate(state, actor, command_type)
            clue = self._validate_clue(game, cmd.get("clue"))
            self._submit_clue(game, side, clue)
            by = "counterpart" if actor == "player" else "agent"
            events: List[Dict[str, Any]] = [{"type": "clue", "by": by, "word": clue["word"], "count": clue["count"]}]
            events.extend(self._advance_tutorial(state, actor, turn_ended=False, game_over=False))
            return ReducerResult(state, {"success": True, "newState": deepcopy(game)}, events)

        if command_type == "submitGuess":
            cell = cmd.get("cell")
            if isinstance(cell, bool) or not isinstance(cell, int):
                raise CommandRejected("cell must be an integer")
            self._tutorial_gate(state, actor, command_type, cell)
            before = deepcopy(game)
            game, result, turn_ended = self._submit_guess(game, side, cell)
            by = "counterpart" if actor == "player" else "agent"
            events: List[Dict[str, Any]] = [
                {"type": "card_reveal", "cell": cell, "by": by},
                {"type": "guess", "by": by, "word": before["board"][cell]["text"], "result": result},
            ]
            if before["phase"] != SUDDEN_DEATH and game["phase"] == SUDDEN_DEATH:
                events.append({"type": "sudden_death"})
            outcome_events = self._outcome_events(game, result)
            if state.get("tutorial") is not None:
                outcome_events = [event for event in outcome_events if event["type"] != "game_outcome"]
            events.extend(outcome_events)
            if before["phase"] != SUDDEN_DEATH and result == "bystander":
                correct = sum(1 for guess in game["history"][-1]["guesses"] if guess["result"] == AGENT)
                events.append({"type": "turn_end", "by": by, "reason": "bystander", "correctGuesses": correct})
            elif before["phase"] != SUDDEN_DEATH and game.get("history") and game["history"][-1]["endedBy"] == "ALL_FOUND":
                correct = sum(1 for guess in game["history"][-1]["guesses"] if guess["result"] == AGENT)
                events.append({"type": "turn_end", "by": by, "reason": "all_found", "correctGuesses": correct})
            elif game["phase"] == GAME_OVER and (result == "assassin" or (before["phase"] == SUDDEN_DEATH and result == "bystander")):
                events.append({"type": "turn_end", "by": by, "reason": result, "correctGuesses": 0})
            events.extend(self._advance_tutorial(
                state, actor, turn_ended=turn_ended, game_over=game["phase"] == GAME_OVER
            ))
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
            self._tutorial_gate(state, actor, command_type)
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
            events.extend(self._advance_tutorial(state, actor, turn_ended=True, game_over=False))
            return ReducerResult(state, {"success": True, "enteredSuddenDeath": entered_sudden_death}, events)

        if command_type == "tutorialLoadStage":
            if actor != "agent":
                raise CommandRejected("Only agent may load tutorial stages")
            tutorial = state.get("tutorial")
            if not isinstance(tutorial, dict):
                raise CommandRejected("No tutorial running")
            stage = cmd.get("stage")
            expected = {"load_monster_lesson": "monster", "load_sudden_death": "sudden_death"}.get(tutorial.get("step"))
            if stage != expected:
                raise CommandRejected(f'Tutorial: not at the "{stage}" stage boundary')
            self._load_tutorial_stage(game, stage, state["agentSide"])
            events = self._advance_tutorial(state, actor, turn_ended=False, game_over=False)
            if stage == "sudden_death":
                events.append({"type": "sudden_death"})
            return ReducerResult(state, {"success": True}, events)

        if command_type == "debugLoadScenario":
            if actor not in {"player", "agent"}:
                raise CommandRejected("Unknown actor")
            scenario_id = cmd.get("scenarioId")
            if not isinstance(scenario_id, str):
                raise CommandRejected("scenarioId must be a string")
            state["gameState"] = self._debug_sudden_death(state, scenario_id)
            state["tutorial"] = None
            return ReducerResult(state, {"success": True}, [{"type": "sudden_death"}])

        raise CommandRejected(f"Unknown codenames command: {command_type}")

    def agent_next_command(self) -> Optional[Dict[str, Any]]:
        """Return one legal local-agent action; scheduling is owned by World."""
        state = self.state
        game = state.get("gameState")
        if not isinstance(game, dict):
            return None
        agent_side = state["agentSide"]
        tutorial = state.get("tutorial")
        if isinstance(tutorial, dict) and tutorial.get("step") != "free_play":
            step = tutorial.get("step")
            if step in {"load_monster_lesson", "load_sudden_death"}:
                return {"type": "tutorialLoadStage", "stage": "monster" if step == "load_monster_lesson" else "sudden_death"}
            clue = self._tutorial_content((state.get("settings") or {}).get("wordLocale"))["clues"].get(step)
            if clue is not None:
                return {"type": "submitClue", "clue": {"word": clue[0], "count": clue[1]}}
            if step == "nori_real_guessing":
                turn = game["history"][-1] if game.get("history") else None
                if turn and turn["clueGiver"] != agent_side and turn["endedBy"] is None:
                    if turn["guesses"]:
                        return {"type": "endTurn"}
                    candidate = next((
                        index for index, cell in enumerate(game["cells"])
                        if cell["solvedBy"] is None and cell["assassinatedBy"] is None
                        and game["key"][turn["clueGiver"]][index] == AGENT
                    ), None)
                    if candidate is not None:
                        return {"type": "submitGuess", "cell": candidate}
            return None
        if game.get("phase") == GAME_OVER:
            return None
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
