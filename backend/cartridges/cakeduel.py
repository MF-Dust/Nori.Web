"""Local port of the public Cake Duel base-deck runtime.

The shipped bundle exposes the complete base-card rules.  Normal play only
uses the base deck (`specialCardsToAdd: 0`), which is what this cartridge
implements; it preserves the raw game-state fields consumed by
GameScreen-BbDAUsf1.js.
"""

from __future__ import annotations

import random
import time
from copy import deepcopy
from typing import Any, Dict, List, Optional, Tuple

from .base import BaseCartridge, CommandRejected, ReducerResult

BASE_CARD_LIST = [
    "soldier", "soldier", "soldier", "soldier", "soldier",
    "archer", "archer", "archer", "archer",
    "defender", "defender", "defender", "defender",
    "wizard", "wizard", "wizard",
    "scientist", "scientist", "scientist",
    "wolfy",
]
SPECIAL_CARD_LIST = ["assassin", "scout", "summoner", "quartermaster", "oracle", "priest", "angel", "baacrates", "agent_u", "pierrot"]
CARD_TYPE = {
    "soldier": "physical",
    "archer": "physical",
    "wizard": "magical",
    "defender": "blocker",
    "scientist": "blocker",
    "wolfy": "unclaimable",
}
ATTACK_DAMAGE = {"soldier": 1, "archer": 1, "wizard": 2}
BLOCKS = {"defender": "physical", "scientist": "magical"}


class CakeDuelCartridge(BaseCartridge):
    def __init__(self) -> None:
        super().__init__(
            "cakeduel",
            {
                "config": None,
                "game": None,
                "settings": {"difficulty": "soldier", "roundsToWin": 3, "seed": 20260127},
                "tutorial": None,
                "lastError": None,
            },
        )
        self._rng = random.Random()

    @staticmethod
    def _player_index(actor: str) -> int:
        if actor == "player":
            return 0
        if actor == "agent":
            return 1
        raise CommandRejected("Unknown actor")

    @staticmethod
    def _other(index: int) -> int:
        return 1 - index

    @staticmethod
    def _engine_event(event_type: str, **payload: Any) -> Dict[str, Any]:
        return {"type": "engine", "event": {"type": event_type, **payload}}

    @staticmethod
    def _settings(previous: Dict[str, Any], cmd: Dict[str, Any]) -> Dict[str, Any]:
        difficulty = cmd.get("difficulty", previous["difficulty"])
        if difficulty not in {"soldier", "wizard", "assassin"}:
            raise CommandRejected("difficulty must be soldier, wizard, or assassin")
        seed = int(time.time() * 1000)
        return {"difficulty": difficulty, "roundsToWin": 3, "seed": seed}

    @staticmethod
    def _config(settings: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "gameId": f"cakeduel_{int(settings['seed'])}",
            "seed": int(settings["seed"]),
            "roundsToWin": int(settings["roundsToWin"]),
            "baseCardList": list(BASE_CARD_LIST),
            "specialCardList": list(SPECIAL_CARD_LIST),
            "specialCardsToAdd": 0,
        }

    @classmethod
    def _new_engine(cls, config: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "frame": 0,
            "lastEventId": 0,
            "phase": "attack",
            "lastAttackPassed": False,
            "gameEnded": None,
            "deck": [],
            "discard": [],
            "attackingClaim": None,
            "blockingClaim": None,
            "players": [
                {"hand": [], "handLimit": 4, "claimBlacklist": [], "cakes": 3, "lastAttackingClaim": None},
                {"hand": [], "handLimit": 4, "claimBlacklist": [], "cakes": 4, "lastAttackingClaim": None},
            ],
            "boutWinners": [],
            "attackerIndex": 0,
            "nextAttackerIndexOverride": [],
            "pickPhaseEffects": [],
            "cardList": list(config["baseCardList"]),
            "config": deepcopy(config),
        }

    def _shuffle(self, values: List[int]) -> List[int]:
        values = list(values)
        self._rng.shuffle(values)
        return values

    @staticmethod
    def _phasing_player(game: Dict[str, Any]) -> int:
        phase = game["phase"]
        if phase == "attack":
            return game["attackerIndex"]
        if phase == "block":
            return 1 - game["attackerIndex"]
        if phase == "review":
            return game["attackerIndex"]
        if phase == "pick":
            effects = game.get("pickPhaseEffects", [])
            if effects:
                return effects[0]["player"]
        raise CommandRejected("Invalid game phase")

    @staticmethod
    def _card_name(game: Dict[str, Any], card_id: int) -> str:
        try:
            return game["cardList"][card_id]
        except (IndexError, TypeError) as exc:
            raise CommandRejected("Invalid card reference") from exc

    def _draw_to_limits(self, game: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        for player_index, player in enumerate(game["players"]):
            needed = player["handLimit"] - len(player["hand"])
            if needed <= 0:
                continue
            cards = game["deck"][:needed]
            del game["deck"][:needed]
            player["hand"].extend(cards)
            if cards:
                events.append(self._engine_event("card_drawn", zone="deck", cardIds=list(cards), player=player_index))

    def _start_bout(self, game: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        game["deck"] = self._shuffle(list(range(len(game["cardList"]))))
        events.append(self._engine_event("deck_shuffled", cardIds=list(game["deck"])))
        game["lastAttackPassed"] = False
        game["discard"] = []
        game["attackingClaim"] = None
        game["blockingClaim"] = None
        game["nextAttackerIndexOverride"] = []
        game["pickPhaseEffects"] = []
        for player in game["players"]:
            player.update({"hand": [], "handLimit": 4, "claimBlacklist": [], "lastAttackingClaim": None})
        winner = game["boutWinners"][-1] if game["boutWinners"] else None
        game["attackerIndex"] = 0 if winner is None else self._other(winner)
        attacker = game["attackerIndex"]
        defender = self._other(attacker)
        game["players"][attacker]["cakes"] = 3
        game["players"][defender]["cakes"] = 4
        game["phase"] = "attack"
        events.append(self._engine_event("bout_started", attackerIndex=attacker, cakesAfter=[game["players"][0]["cakes"], game["players"][1]["cakes"]]))
        events.append(self._engine_event("phase_changed", player=attacker, phase="attack"))
        self._draw_to_limits(game, events)

    def _finish_game(self, game: Dict[str, Any], winner: int, events: List[Dict[str, Any]]) -> None:
        game["gameEnded"] = {"winner": winner}
        events.append(self._engine_event("game_ended", winner=winner))

    def _end_bout(self, game: Dict[str, Any], winner: int, events: List[Dict[str, Any]]) -> None:
        game["boutWinners"].append(winner)
        events.append(self._engine_event("bout_ended", winner=winner))
        if sum(1 for item in game["boutWinners"] if item == winner) >= game["config"]["roundsToWin"]:
            self._finish_game(game, winner, events)
        else:
            self._start_bout(game, events)

    def _advance_attacker(self, game: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        if game["nextAttackerIndexOverride"]:
            game["attackerIndex"] = game["nextAttackerIndexOverride"].pop(0)
        else:
            game["attackerIndex"] = self._other(game["attackerIndex"])
        game["phase"] = "attack"
        events.append(self._engine_event("phase_changed", player=game["attackerIndex"], phase="attack"))
        self._draw_to_limits(game, events)

    def _claim_options(self, game: Dict[str, Any], phase: str) -> List[str]:
        if phase == "attack":
            player = game["players"][game["attackerIndex"]]
            return [
                name
                for name in dict.fromkeys(game["cardList"])
                if CARD_TYPE.get(name) in {"physical", "magical"} and name not in player["claimBlacklist"]
            ]
        if phase == "block":
            attack = game.get("attackingClaim")
            if not attack:
                return []
            attack_type = CARD_TYPE.get(attack["claim"])
            player = game["players"][self._other(game["attackerIndex"])]
            return [
                name for name, blocks in BLOCKS.items() if blocks == attack_type and name not in player["claimBlacklist"]
            ]
        return []

    def _legal_actions(self, game: Dict[str, Any]) -> List[Dict[str, Any]]:
        if game.get("gameEnded"):
            return []
        player = self._phasing_player(game)
        hand = game["players"][player]["hand"]
        phase = game["phase"]
        result: List[Dict[str, Any]] = []
        if phase in {"attack", "block"} and hand and self._claim_options(game, phase):
            result.append({"type": "claim", "availableHandIndices": list(range(len(hand))), "claimFrom": self._claim_options(game, phase)})
        if phase == "attack":
            result.extend([{"type": "pass"}, {"type": "concede"}])
        elif phase in {"block", "review"}:
            result.extend([{"type": "pass"}, {"type": "challenge"}, {"type": "concede"}])
        return result

    def _make_claim(self, game: Dict[str, Any], player: int, action: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        hand_indices = action.get("handIndices")
        claim = action.get("claim")
        if not isinstance(hand_indices, list) or not hand_indices or any(isinstance(item, bool) or not isinstance(item, int) for item in hand_indices):
            raise CommandRejected("claim requires non-empty handIndices")
        if len(set(hand_indices)) != len(hand_indices):
            raise CommandRejected("Cannot claim the same card twice")
        options = self._claim_options(game, game["phase"])
        if claim not in options:
            raise CommandRejected("Claiming card type is not allowed")
        hand = game["players"][player]["hand"]
        if any(index < 0 or index >= len(hand) for index in hand_indices):
            raise CommandRejected("Played card is not in hand")
        card_ids = [hand[index] for index in hand_indices]
        for index in sorted(hand_indices, reverse=True):
            hand.pop(index)
        claimed = {"claim": claim, "cardIds": card_ids}
        if game["attackingClaim"] is None:
            game["attackingClaim"] = claimed
            game["players"][player]["lastAttackingClaim"] = claim
            pile = "attack_pile"
            game["phase"] = "block"
        elif game["blockingClaim"] is None:
            game["blockingClaim"] = claimed
            pile = "block_pile"
            game["phase"] = "review"
        else:
            raise CommandRejected("Both claims are already set")
        events.append(self._engine_event("claim_made", pile=pile, player=player, claim=claim, cardIds=card_ids))
        events.append(self._engine_event("phase_changed", player=self._phasing_player(game), phase=game["phase"]))

    def _discard_claims(self, game: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        for field, pile in (("attackingClaim", "attack_pile"), ("blockingClaim", "block_pile")):
            claim = game.get(field)
            if not claim:
                continue
            ids = list(claim["cardIds"])
            game["discard"].extend(ids)
            events.append(self._engine_event("card_discarded", cardIds=ids, zone=pile))
            game[field] = None

    def _transfer_cakes(self, game: Dict[str, Any], from_player: int, to_player: int, amount: int, events: List[Dict[str, Any]]) -> None:
        amount = max(0, min(amount, game["players"][from_player]["cakes"]))
        if amount <= 0:
            return
        game["players"][from_player]["cakes"] -= amount
        game["players"][to_player]["cakes"] += amount
        events.append(self._engine_event("cakes_transferred", **{"from": from_player, "to": to_player, "amount": amount, "cakesAfter": [game["players"][0]["cakes"], game["players"][1]["cakes"]]}))

    def _resolve_pass(self, game: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        current = self._phasing_player(game)
        events.append(self._engine_event("pass_made", player=current))
        attack = game.get("attackingClaim")
        if attack is None:
            if game["lastAttackPassed"]:
                winner = 0 if game["players"][0]["cakes"] > game["players"][1]["cakes"] else 1
                self._end_bout(game, winner, events)
                return
            game["lastAttackPassed"] = True
            self._advance_attacker(game, events)
            return

        game["lastAttackPassed"] = False
        attack_name = attack["claim"]
        damage = ATTACK_DAMAGE.get(attack_name)
        if damage is None:
            raise CommandRejected("Attacking claim is not an attacker")
        effective_damage = len(attack["cardIds"])
        block = game.get("blockingClaim")
        if block:
            blocker_type = BLOCKS.get(block["claim"])
            if blocker_type != CARD_TYPE.get(attack_name):
                raise CommandRejected("Blocking claim is incompatible")
            # Base blockers negate one matching attack card each.
            effective_damage = max(0, effective_damage - len(block["cardIds"]))
        for _ in range(effective_damage):
            self._transfer_cakes(game, self._other(game["attackerIndex"]), game["attackerIndex"], damage, events)
        self._discard_claims(game, events)
        for player_index, player in enumerate(game["players"]):
            if player["cakes"] == 0:
                self._end_bout(game, self._other(player_index), events)
                return
        self._advance_attacker(game, events)

    def _resolve_challenge(self, game: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        claim = game.get("blockingClaim") or game.get("attackingClaim")
        if not claim:
            raise CommandRejected("No claim to challenge")
        challenger = self._phasing_player(game)
        revealed = [
            {"cardId": card_id, "cardName": self._card_name(game, card_id)}
            for card_id in claim["cardIds"]
        ]
        success = all(entry["cardName"] != claim["claim"] for entry in revealed)
        events.append(self._engine_event("challenge_made", challenger=challenger, claimedCard=claim["claim"], success=success, revealedCards=revealed))
        self._end_bout(game, challenger if success else self._other(challenger), events)

    def _concede(self, game: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        current = self._phasing_player(game)
        events.append(self._engine_event("concede_made", player=current))
        self._finish_game(game, self._other(current), events)

    def _apply_action(self, game: Dict[str, Any], actor: str, action: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        if not isinstance(action, dict) or not isinstance(action.get("type"), str):
            raise CommandRejected("action.type is required")
        player = self._player_index(actor)
        if player != self._phasing_player(game):
            raise CommandRejected("Not the phasing player's turn")
        legal = self._legal_actions(game)
        kind = action["type"]
        if not any(item["type"] == kind for item in legal):
            raise CommandRejected(f"Illegal action: {kind}")
        if kind == "claim":
            self._make_claim(game, player, action, events)
        elif kind == "pass":
            self._resolve_pass(game, events)
        elif kind == "challenge":
            self._resolve_challenge(game, events)
        elif kind == "concede":
            self._concede(game, events)
        else:
            raise CommandRejected(f"Unsupported action: {kind}")
        game["frame"] += 1

    def reduce(self, actor: str, cmd: Dict[str, Any]) -> ReducerResult:
        command_type = cmd["type"]
        state = deepcopy(self.state)

        if command_type == "startGame":
            if actor not in {"player", "agent"}:
                raise CommandRejected("Unknown actor")
            existing = state.get("game")
            if actor == "agent" and existing and not existing.get("gameEnded"):
                raise CommandRejected("A duel is already in progress — only the player may start a new one")
            settings = self._settings(state["settings"], cmd)
            config = self._config(settings)
            self._rng = random.Random(config["seed"])
            game = self._new_engine(config)
            events: List[Dict[str, Any]] = [self._engine_event("game_started", cardList=list(game["cardList"]), config=deepcopy(config))]
            self._start_bout(game, events)
            state.update({"settings": settings, "config": config, "game": game, "tutorial": {"step": "free_play"} if cmd.get("mode") == "tutorial" else None, "lastError": None})
            return ReducerResult(state, {"success": True}, events)

        if command_type == "reset":
            if actor != "player":
                raise CommandRejected("Only player may reset")
            state.update({"config": None, "game": None, "tutorial": None, "lastError": None})
            return ReducerResult(state, {"success": True})

        if command_type == "debugSetDealtCardGuarantee":
            if actor != "player":
                raise CommandRejected("Only player may use debug controls")
            # It is a test harness only; retain the wire-compatible no-op.
            return ReducerResult(state, {"success": True})

        if command_type != "play":
            raise CommandRejected(f"Unknown Cake Duel command: {command_type}")
        game = state.get("game")
        if not isinstance(game, dict):
            raise CommandRejected("Game not started")
        if game.get("gameEnded"):
            raise CommandRejected("Game already ended")
        events: List[Dict[str, Any]] = []
        self._apply_action(game, actor, cmd.get("action"), events)
        if game.get("gameEnded"):
            winner = game["gameEnded"]["winner"]
            events.append({"type": "game_outcome", "outcome": "win" if winner == 0 else "loss"})
        state["lastError"] = None
        return ReducerResult(state, {"success": True}, events)

    def agent_next_command(self) -> Optional[Dict[str, Any]]:
        game = self.state.get("game")
        if not isinstance(game, dict) or game.get("gameEnded"):
            return None
        if self._phasing_player(game) != 1:
            return None
        legal = self._legal_actions(game)
        claim = next((item for item in legal if item["type"] == "claim"), None)
        if claim:
            hand = game["players"][1]["hand"]
            for index, card_id in enumerate(hand):
                name = self._card_name(game, card_id)
                if name in claim["claimFrom"]:
                    return {"type": "play", "action": {"type": "claim", "handIndices": [index], "claim": name}}
            # A legal bluff keeps the gameplay mechanic intact.
            if hand:
                return {"type": "play", "action": {"type": "claim", "handIndices": [0], "claim": claim["claimFrom"][0]}}
        if any(item["type"] == "pass" for item in legal):
            return {"type": "play", "action": {"type": "pass"}}
        if any(item["type"] == "challenge" for item in legal):
            return {"type": "play", "action": {"type": "challenge"}}
        return None
