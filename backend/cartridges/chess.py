"""`chess` cartridge compatible with the public ChessScreen state contract."""

from __future__ import annotations

import random
import time
from copy import deepcopy
from typing import Any, Dict, List, Optional, Tuple

import chess

from .base import BaseCartridge, CommandRejected, ReducerResult

PIECE_NAMES = {
    chess.PAWN: "p",
    chess.KNIGHT: "n",
    chess.BISHOP: "b",
    chess.ROOK: "r",
    chess.QUEEN: "q",
    chess.KING: "k",
}
PROMOTION_TYPES = {"q": chess.QUEEN, "r": chess.ROOK, "b": chess.BISHOP, "n": chess.KNIGHT}


# Protocol data is embedded for the Worker runtime, which has no project filesystem.
TUTORIAL_STEPS = [
    {'id': 'player_pawn_opens', 'mover': 'player', 'move': {'from': 'e2', 'to': 'e4'}},
    {'id': 'agent_pawn_mirrors', 'mover': 'agent', 'move': {'from': 'e7', 'to': 'e5'}},
    {'id': 'player_knight_develops', 'mover': 'player', 'move': {'from': 'g1', 'to': 'f3'}},
    {'id': 'agent_knight_defends', 'mover': 'agent', 'move': {'from': 'b8', 'to': 'c6'}},
    {'id': 'player_bishop_aims', 'mover': 'player', 'move': {'from': 'f1', 'to': 'c4'}},
    {'id': 'agent_bishop_mirrors', 'mover': 'agent', 'move': {'from': 'f8', 'to': 'c5'}},
    {'id': 'player_pawn_supports', 'mover': 'player', 'move': {'from': 'c2', 'to': 'c3'}},
    {'id': 'agent_knight_counters', 'mover': 'agent', 'move': {'from': 'g8', 'to': 'f6'}},
    {'id': 'player_pawn_strikes', 'mover': 'player', 'move': {'from': 'd2', 'to': 'd4'}},
    {'id': 'agent_pawn_captures', 'mover': 'agent', 'move': {'from': 'e5', 'to': 'd4'}},
    {'id': 'player_pawn_recaptures', 'mover': 'player', 'move': {'from': 'c3', 'to': 'd4'}},
    {'id': 'agent_bishop_checks', 'mover': 'agent', 'move': {'from': 'c5', 'to': 'b4'}},
    {'id': 'player_blocks_check', 'mover': 'player', 'move': {'from': 'c1', 'to': 'd2'}},
    {'id': 'agent_trades_bishops', 'mover': 'agent', 'move': {'from': 'b4', 'to': 'd2'}},
    {'id': 'player_knight_recaptures', 'mover': 'player', 'move': {'from': 'b1', 'to': 'd2'}},
    {'id': 'agent_frees_bishop', 'mover': 'agent', 'move': {'from': 'd7', 'to': 'd6'}},
    {'id': 'player_castles', 'mover': 'player', 'move': {'from': 'e1', 'to': 'g1'}},
    {'id': 'agent_castles', 'mover': 'agent', 'move': {'from': 'e8', 'to': 'g8'}},
    {'id': 'player_rook_guards', 'mover': 'player', 'move': {'from': 'f1', 'to': 'e1'}},
    {'id': 'agent_rook_mirrors', 'mover': 'agent', 'move': {'from': 'f8', 'to': 'e8'}},
    {'id': 'player_queen_develops', 'mover': 'player', 'move': {'from': 'd1', 'to': 'b3'}},
    {'id': 'agent_queen_connects', 'mover': 'agent', 'move': {'from': 'd8', 'to': 'd7'}},
]
TUTORIAL_INDEX = {step["id"]: index for index, step in enumerate(TUTORIAL_STEPS)}


class ChessCartridge(BaseCartridge):
    def __init__(self) -> None:
        super().__init__(
            "chess",
            {
                "settings": {"playerSide": "white", "difficulty": "casual", "locale": "en"},
                "gameState": None,
                "drawOffer": None,
                "takebackRequest": None,
                "tutorial": None,
                "debugScenarioId": None,
                "debugScenario": None,
            },
        )
        self._rng = random.Random()

    @staticmethod
    def _side_for_actor(state: Dict[str, Any], actor: str) -> str:
        player_side = state["settings"]["playerSide"]
        if actor == "player":
            return player_side
        if actor == "agent":
            return "black" if player_side == "white" else "white"
        raise CommandRejected("Unknown actor")

    @staticmethod
    def _board_from_game(game: Dict[str, Any]) -> chess.Board:
        try:
            return chess.Board(game["fen"])
        except Exception as exc:
            raise CommandRejected(f"Invalid stored chess position: {exc}") from exc

    @staticmethod
    def _phase(board: chess.Board, move_count: int) -> str:
        pieces = list(board.piece_map().values())
        non_pawn_non_king = sum(piece.piece_type not in {chess.PAWN, chess.KING} for piece in pieces)
        material = sum({chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}.get(piece.piece_type, 0) for piece in pieces)
        if material <= 20 or non_pawn_non_king <= 6 or len(pieces) <= 12:
            return "endgame"
        if move_count <= 20:
            return "opening"
        return "middlegame"

    @classmethod
    def _state_from_board(
        cls, board: chess.Board, move_history: List[Dict[str, Any]], start_fen: str
    ) -> Dict[str, Any]:
        if board.is_checkmate():
            status = "checkmate"
            winner = "black" if board.turn == chess.WHITE else "white"
        elif board.is_stalemate():
            status = "stalemate"
            winner = "draw"
        elif board.is_insufficient_material() or board.is_seventyfive_moves() or board.is_fivefold_repetition() or board.can_claim_draw():
            status = "draw"
            winner = "draw"
        else:
            status = "playing"
            winner = None
        pgn_parts: List[str] = []
        for index, item in enumerate(move_history):
            if item["by"] == "white":
                pgn_parts.append(f"{index // 2 + 1}. {item['san']}")
            else:
                pgn_parts.append(item["san"])
        state = {
            "fen": board.fen(),
            "pgn": " ".join(pgn_parts),
            "turn": "white" if board.turn == chess.WHITE else "black",
            "phase": cls._phase(board, len(move_history)),
            "status": status,
            "fullMoveNumber": board.fullmove_number,
            "halfMoveClock": board.halfmove_clock,
            "isCheck": board.is_check(),
            "isCheckmate": board.is_checkmate(),
            "isStalemate": board.is_stalemate(),
            "isDraw": status == "draw" or board.is_stalemate(),
            "isInsufficientMaterial": board.is_insufficient_material(),
            "isThreefoldRepetition": board.can_claim_threefold_repetition(),
            "winner": winner,
            "moveHistory": move_history,
            "startFen": start_fen,
            "openingMatch": None,
        }
        return state

    @classmethod
    def _new_game(cls) -> Dict[str, Any]:
        board = chess.Board()
        return cls._state_from_board(board, [], board.fen())

    @classmethod
    def _make_move(
        cls, game: Dict[str, Any], from_square: str, to_square: str, promotion: Optional[str]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        board = cls._board_from_game(game)
        if from_square not in chess.SQUARE_NAMES or to_square not in chess.SQUARE_NAMES:
            raise CommandRejected("Invalid square")
        promotion_type = PROMOTION_TYPES.get(promotion) if promotion else None
        if promotion is not None and promotion_type is None:
            raise CommandRejected("Invalid promotion")
        move = chess.Move.from_uci(from_square + to_square + (promotion or ""))
        if move not in board.legal_moves:
            raise CommandRejected("Invalid move")
        piece = board.piece_at(move.from_square)
        if piece is None:
            raise CommandRejected("Invalid move")
        captured_piece = board.piece_at(move.to_square)
        if board.is_en_passant(move):
            captured_piece = chess.Piece(chess.PAWN, not board.turn)
        san = board.san(move)
        is_castling = board.is_castling(move)
        is_en_passant = board.is_en_passant(move)
        is_promotion = move.promotion is not None
        mover = "white" if board.turn == chess.WHITE else "black"
        board.push(move)
        move_info: Dict[str, Any] = {
            "by": mover,
            "move": {
                "piece": PIECE_NAMES[piece.piece_type],
                "from": from_square,
                "to": to_square,
            },
            "piece": PIECE_NAMES[piece.piece_type],
            "san": san,
            "isCheck": board.is_check(),
            "isCheckmate": board.is_checkmate(),
            "isStalemate": board.is_stalemate(),
            "isCastling": is_castling,
            "isEnPassant": is_en_passant,
            "isPromotion": is_promotion,
        }
        if captured_piece is not None:
            move_info["captured"] = PIECE_NAMES[captured_piece.piece_type]
        if promotion:
            move_info["move"]["promotion"] = promotion
            move_info["promotionPiece"] = promotion
        history = [*game["moveHistory"], move_info]
        return cls._state_from_board(board, history, game["startFen"]), move_info

    @classmethod
    def _undo_plies(cls, game: Dict[str, Any], plies: int) -> Dict[str, Any]:
        if plies < 1 or len(game["moveHistory"]) < plies:
            raise CommandRejected("Not enough moves to take back")
        history = deepcopy(game["moveHistory"][:-plies])
        board = chess.Board(game["startFen"])
        for item in history:
            move = item["move"]
            board.push(chess.Move.from_uci(move["from"] + move["to"] + move.get("promotion", "")))
        return cls._state_from_board(board, history, game["startFen"])

    @staticmethod
    def _event_game_over(game: Dict[str, Any], player_side: str) -> List[Dict[str, Any]]:
        if game["status"] == "playing":
            return []
        winner = game["winner"]
        if winner == "draw":
            outcome = "draw"
        else:
            outcome = "win" if winner == player_side else "loss"
        return [
            {"type": "game_over", "result": game["status"], "winner": winner, "playerSide": player_side},
            {"type": "game_outcome", "outcome": outcome, "reason": game["status"]},
        ]

    @staticmethod
    def _settings(previous: Dict[str, Any], mode: str, cmd: Dict[str, Any]) -> Dict[str, Any]:
        if mode == "tutorial":
            return {**previous, "playerSide": "white", "difficulty": "sleepy"}
        side = cmd.get("side")
        difficulty = cmd.get("difficulty")
        if side not in {"white", "black"}:
            raise CommandRejected("side must be white or black")
        if difficulty not in {"sleepy", "casual", "normal", "focused", "serious"}:
            raise CommandRejected("Invalid difficulty")
        return {**previous, "playerSide": side, "difficulty": difficulty}

    def reduce(self, actor: str, cmd: Dict[str, Any]) -> ReducerResult:
        command_type = cmd["type"]
        state = deepcopy(self.state)

        if command_type == "startGame":
            mode = cmd.get("mode")
            if mode not in {"normal", "tutorial"}:
                raise CommandRejected("mode must be normal or tutorial")
            current = state.get("gameState")
            if actor == "agent" and current and current.get("status") == "playing":
                raise CommandRejected("A game is already in progress — only the player may start a new one")
            settings = self._settings(state["settings"], mode, cmd)
            state.update(
                {
                    "settings": settings,
                    "gameState": self._new_game(),
                    "drawOffer": None,
                    "takebackRequest": None,
                    "tutorial": {"step": TUTORIAL_STEPS[0]["id"]} if mode == "tutorial" else None,
                    "debugScenarioId": None,
                    "debugScenario": None,
                }
            )
            return ReducerResult(
                state,
                {"success": True},
                [{"type": "game_start", "playerSide": settings["playerSide"], "difficulty": settings["difficulty"]}],
            )

        game = state.get("gameState")
        if not isinstance(game, dict):
            raise CommandRejected("Game not started")

        tutorial_id = (state.get("tutorial") or {}).get("step")
        guided = tutorial_id is not None and tutorial_id != "free_play"
        tutorial_index = TUTORIAL_INDEX.get(tutorial_id)
        if guided and tutorial_index is None:
            raise CommandRejected("Unknown tutorial step")
        if guided and command_type != "move":
            raise CommandRejected("Complete the guided opening before using game actions")

        if command_type == "move":
            side = self._side_for_actor(state, actor)
            if game["status"] != "playing":
                raise CommandRejected("Game is not in progress")
            if game["turn"] != side:
                raise CommandRejected("Not your turn")
            from_square = cmd.get("from")
            to_square = cmd.get("to")
            promotion = cmd.get("promotion")
            if not isinstance(from_square, str) or not isinstance(to_square, str) or (promotion is not None and not isinstance(promotion, str)):
                raise CommandRejected("Invalid move payload")
            if guided:
                expected = TUTORIAL_STEPS[tutorial_index]
                if actor != expected["mover"] or {"from": from_square, "to": to_square} != expected["move"] or promotion is not None:
                    raise CommandRejected("Follow the highlighted tutorial move")
            next_game, move_info = self._make_move(game, from_square, to_square, promotion)
            now = int(time.time() * 1000)
            previous = game["moveHistory"][-1].get("madeAtMs") if game["moveHistory"] else None
            move_info["madeAtMs"] = now
            if isinstance(previous, int):
                move_info["durationMs"] = max(0, now - previous)
            next_game["moveHistory"][-1] = move_info
            state["gameState"] = next_game
            state["drawOffer"] = None
            state["takebackRequest"] = None
            events: List[Dict[str, Any]] = [{"type": "move", "by": side, "details": deepcopy(move_info)}]
            if move_info["isCheck"]:
                events.append({"type": "check", "by": side, "from": {"piece": move_info["move"]["piece"], "square": from_square}})
            if move_info.get("captured"):
                events.append({"type": "capture", "by": side, "from": {"piece": move_info["move"]["piece"], "square": from_square}, "captured": {"piece": move_info["captured"], "square": to_square}})
            if move_info["isCastling"]:
                events.append({"type": "castling", "by": side, "side": "kingside" if to_square.startswith("g") else "queenside"})
            if move_info["isPromotion"]:
                events.append({"type": "promotion", "by": side, "from": {"piece": "p", "square": from_square}, "promotion": promotion})
            if guided:
                next_index = tutorial_index + 1
                state["tutorial"] = {"step": TUTORIAL_STEPS[next_index]["id"] if next_index < len(TUTORIAL_STEPS) else "free_play"}
                events.append({"type": "tutorial_step", "step": tutorial_id})
            events.extend(self._event_game_over(next_game, state["settings"]["playerSide"]))
            return ReducerResult(state, {"success": True, "move": deepcopy(move_info)}, events)

        if command_type == "resign":
            if game["status"] != "playing":
                raise CommandRejected("Game is not in progress")
            side = self._side_for_actor(state, actor)
            game["status"] = "resigned"
            game["winner"] = "black" if side == "white" else "white"
            game["isCheck"] = False
            game["isCheckmate"] = False
            game["isStalemate"] = False
            return ReducerResult(state, {"success": True}, self._event_game_over(game, state["settings"]["playerSide"]))

        if command_type == "offerDraw":
            if game["status"] != "playing" or state["drawOffer"] is not None:
                raise CommandRejected("Cannot offer a draw")
            side = self._side_for_actor(state, actor)
            state["drawOffer"] = side
            return ReducerResult(state, {"success": True}, [{"type": "draw_offer", "side": side}])

        if command_type == "cancelDrawOffer":
            side = self._side_for_actor(state, actor)
            if state["drawOffer"] != side:
                raise CommandRejected("No draw offer from this side")
            state["drawOffer"] = None
            return ReducerResult(state, {"success": True}, [{"type": "cancel_draw_offer", "side": side}])

        if command_type == "respondDraw":
            side = self._side_for_actor(state, actor)
            offered = state["drawOffer"]
            accept = cmd.get("accept")
            if offered is None or offered == side or not isinstance(accept, bool):
                raise CommandRejected("Invalid draw response")
            state["drawOffer"] = None
            events = [{"type": "respond_draw", "respondSide": side, "accept": accept}]
            if accept:
                game.update({"status": "draw", "winner": "draw", "isDraw": True, "isCheck": False, "isCheckmate": False, "isStalemate": False})
                events.extend(self._event_game_over(game, state["settings"]["playerSide"]))
            return ReducerResult(state, {"success": True}, events)

        if command_type == "requestTakeback":
            side = self._side_for_actor(state, actor)
            needed = 2 if game["turn"] == side else 1
            if state["takebackRequest"] is not None or len(game["moveHistory"]) < needed:
                raise CommandRejected("Cannot request takeback")
            state["takebackRequest"] = side
            return ReducerResult(state, {"success": True}, [{"type": "request_takeback", "side": side}])

        if command_type == "cancelTakebackRequest":
            side = self._side_for_actor(state, actor)
            if state["takebackRequest"] != side:
                raise CommandRejected("No takeback request from this side")
            state["takebackRequest"] = None
            return ReducerResult(state, {"success": True}, [{"type": "cancel_takeback_request", "side": side}])

        if command_type == "respondTakeback":
            side = self._side_for_actor(state, actor)
            requested = state["takebackRequest"]
            accept = cmd.get("accept")
            if requested is None or requested == side or not isinstance(accept, bool):
                raise CommandRejected("Invalid takeback response")
            needed = 2 if game["turn"] == requested else 1
            state["takebackRequest"] = None
            events: List[Dict[str, Any]] = [{"type": "respond_takeback", "respondSide": side, "accept": accept}]
            if accept:
                old_plies = len(game["moveHistory"])
                state["gameState"] = self._undo_plies(game, needed)
                events.append({"type": "history_rewound", "pliesUndone": needed, "prevPly": old_plies, "nextPly": len(state["gameState"]["moveHistory"]), "fen": state["gameState"]["fen"]})
            return ReducerResult(state, {"success": True}, events)

        if command_type == "debugLoadScenario":
            raise CommandRejected("Chess debug harness is disabled")

        raise CommandRejected(f"Unknown chess command: {command_type}")

    def agent_next_command(self) -> Optional[Dict[str, Any]]:
        game = self.state.get("gameState")
        if not isinstance(game, dict) or game.get("status") != "playing":
            return None
        agent_side = self._side_for_actor(self.state, "agent")
        if game.get("turn") != agent_side:
            return None
        tutorial_id = (self.state.get("tutorial") or {}).get("step")
        if tutorial_id is not None and tutorial_id != "free_play":
            index = TUTORIAL_INDEX.get(tutorial_id)
            if index is None or TUTORIAL_STEPS[index]["mover"] != "agent":
                return None
            return {"type": "move", **TUTORIAL_STEPS[index]["move"]}
        board = self._board_from_game(game)
        legal = list(board.legal_moves)
        if not legal:
            return None
        # A deterministic low-cost local opponent. Difficulty controls the
        # candidate choice without pretending to reproduce the private model.
        move = legal[0] if self.state["settings"].get("difficulty") == "sleepy" else self._rng.choice(legal)
        return {
            "type": "move",
            "from": chess.square_name(move.from_square),
            "to": chess.square_name(move.to_square),
            **({"promotion": PIECE_NAMES[move.promotion]} if move.promotion else {}),
        }
