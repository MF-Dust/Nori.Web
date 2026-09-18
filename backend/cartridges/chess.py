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

# Exact runtime fixtures exported by Debug-D6AtxpLT.js (`ss`).
CHESS_DEBUG_SCENARIOS = {'acting-forked-counterpart': {'id': 'acting-forked-counterpart',
                               'settings': {'playerSide': 'black', 'difficulty': 'serious', 'locale': 'en'},
                               'startFen': 'rnbq3r/1p3kpp/p4n2/2b5/2pNP3/2N5/PPP3PP/R1BQ1RK1 w - - 2 12',
                               'startPly': 0,
                               'script': [{'uci': 'd1h5'}]},
 'counterpart-forked-acting': {'id': 'counterpart-forked-acting',
                               'settings': {'playerSide': 'black', 'difficulty': 'serious', 'locale': 'en'},
                               'startFen': '5rk1/5ppp/4p3/4N3/8/1Pn5/5PPP/2R3K1 b - - 1 28',
                               'startPly': 0,
                               'script': [{'uci': 'c3e2'}]},
 'acting-trapped-in-opening': {'id': 'acting-trapped-in-opening',
                               'settings': {'playerSide': 'black', 'difficulty': 'serious', 'locale': 'en'},
                               'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                               'startPly': 4,
                               'script': [{'uci': 'e2e4'},
                                          {'uci': 'e7e5'},
                                          {'uci': 'd1h5'},
                                          {'uci': 'b8c6'},
                                          {'uci': 'h5e5'}]},
 'counterpart-trapped-in-opening': {'id': 'counterpart-trapped-in-opening',
                                    'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                    'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                                    'startPly': 4,
                                    'script': [{'uci': 'e2e4'},
                                               {'uci': 'e7e5'},
                                               {'uci': 'g1f3'},
                                               {'uci': 'b8c6'},
                                               {'uci': 'f1c4'},
                                               {'uci': 'b7b5'}]},
 'acting-blundered-repeatedly': {'id': 'acting-blundered-repeatedly',
                                 'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                 'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                                 'startPly': 4,
                                 'script': [{'uci': 'e2e4'},
                                            {'uci': 'e7e5'},
                                            {'uci': 'g2g4'},
                                            {'uci': 'd7d5'},
                                            {'uci': 'f2f4'}]},
 'counterpart-blundered-repeatedly': {'id': 'counterpart-blundered-repeatedly',
                                      'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                      'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                                      'startPly': 6,
                                      'script': [{'uci': 'e2e4'},
                                                 {'uci': 'e7e5'},
                                                 {'uci': 'g1f3'},
                                                 {'uci': 'b8c6'},
                                                 {'uci': 'f1c4'},
                                                 {'uci': 'b7b5'},
                                                 {'uci': 'c4b5'},
                                                 {'uci': 'd8h4'}]},
 'draw-stalemate': {'id': 'draw-stalemate',
                    'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                    'startFen': '7k/5K2/8/6Q1/8/8/8/8 w - - 0 1',
                    'startPly': 0,
                    'script': [{'uci': 'g5g6'}]},
 'acting-offers-draw': {'id': 'acting-offers-draw',
                        'settings': {'playerSide': 'white', 'difficulty': 'casual', 'locale': 'en'},
                        'startFen': '7r/p5kp/6p1/8/8/6P1/P5KP/R7 b - - 0 1',
                        'startPly': 7,
                        'script': [{'uci': 'h8g8'},
                                   {'uci': 'a1b1'},
                                   {'uci': 'g8h8'},
                                   {'uci': 'b1a1'},
                                   {'uci': 'h8g8'},
                                   {'uci': 'a1b1'},
                                   {'uci': 'g8h8'},
                                   {'uci': 'b1a1'}]},
 'acting-checked-counterpart-repeatedly': {'id': 'acting-checked-counterpart-repeatedly',
                                           'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                           'startFen': '4k3/8/2p5/1B6/8/8/8/3Q2K1 w - - 0 1',
                                           'startPly': 0,
                                           'script': [{'uci': 'b5c6'}, {'uci': 'e8f8'}, {'uci': 'd1d8'}]},
 'counterpart-checked-acting-repeatedly': {'id': 'counterpart-checked-acting-repeatedly',
                                           'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                           'startFen': '3qk3/8/8/8/1b6/2P5/8/4K3 b - - 0 1',
                                           'startPly': 0,
                                           'script': [{'uci': 'b4c3'}, {'uci': 'e1f2'}, {'uci': 'd8d2'}]},
 'acting-checked-counterpart': {'id': 'acting-checked-counterpart',
                                'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                'startFen': '4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1',
                                'startPly': 0,
                                'script': [{'uci': 'e2e7'}]},
 'counterpart-checked-acting': {'id': 'counterpart-checked-acting',
                                'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                'startFen': '4k3/8/8/8/8/8/4r3/6K1 b - - 0 1',
                                'startPly': 0,
                                'script': [{'uci': 'e2e1'}]},
 'counterpart-offered-sacrifice': {'id': 'counterpart-offered-sacrifice',
                                   'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                   'startFen': 'r2b2k1/1p3q1p/p2p4/3P2p1/2P1PB2/6Q1/P6P/2R4K b - - 0 30',
                                   'startPly': 0,
                                   'script': [{'uci': 'f7f4'}, {'uci': 'g3f4'}, {'uci': 'g5f4'}]},
 'acting-offered-sacrifice': {'id': 'acting-offered-sacrifice',
                              'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                              'startFen': '4r1k1/ppq3pp/2p2p2/4r3/4p1Q1/P5RP/1P3PP1/3R2K1 w - - 4 35',
                              'startPly': 0,
                              'script': [{'uci': 'd1d7'}, {'uci': 'c7d7'}, {'uci': 'g4d7'}]},
 'acting-accepted-counterpart-sacrifice': {'id': 'acting-accepted-counterpart-sacrifice',
                                           'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                           'startFen': 'r2b2k1/1p3q1p/p2p4/3P2p1/2P1PB2/6Q1/P6P/2R4K b - - 0 30',
                                           'startPly': 1,
                                           'script': [{'uci': 'f7f4'}, {'uci': 'g3f4'}, {'uci': 'g5f4'}]},
 'acting-declined-counterpart-sacrifice': {'id': 'acting-declined-counterpart-sacrifice',
                                           'settings': {'playerSide': 'black', 'difficulty': 'serious', 'locale': 'en'},
                                           'startFen': '5rk1/1p3ppp/pq1Q1b2/8/8/1P3N2/P4PPP/3R2K1 b - - 3 27',
                                           'startPly': 1,
                                           'script': [{'uci': 'f8d8'}, {'uci': 'd6c7'}]},
 'counterpart-accepted-acting-sacrifice': {'id': 'counterpart-accepted-acting-sacrifice',
                                           'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                           'startFen': '4r1k1/ppq3pp/2p2p2/4r3/4p1Q1/P5RP/1P3PP1/3R2K1 w - - 4 35',
                                           'startPly': 1,
                                           'script': [{'uci': 'd1d7'}, {'uci': 'c7d7'}, {'uci': 'g4d7'}]},
 'counterpart-declined-acting-sacrifice': {'id': 'counterpart-declined-acting-sacrifice',
                                           'settings': {'playerSide': 'black', 'difficulty': 'serious', 'locale': 'en'},
                                           'startFen': 'r6r/pp1qbQpk/2p4p/3pP3/3Pb3/2P1B3/PP4PP/R4RK1 w - - 4 19',
                                           'startPly': 1,
                                           'script': [{'uci': 'f1f6'}, {'uci': 'a7a6'}]},
 'counterpart-skewered-acting': {'id': 'counterpart-skewered-acting',
                                 'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                 'startFen': '8/7R/8/5p2/4b2P/5k2/2r5/4K1R1 b - - 10 52',
                                 'startPly': 0,
                                 'script': [{'uci': 'c2c1'}, {'uci': 'e1d2'}, {'uci': 'c1g1'}]},
 'acting-skewered-counterpart': {'id': 'acting-skewered-counterpart',
                                 'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                 'startFen': '5R2/1p6/p1p1k3/2P1r3/2K3p1/2P1p1P1/1P5P/8 w - - 2 45',
                                 'startPly': 0,
                                 'script': [{'uci': 'f8e8'}, {'uci': 'e6f5'}, {'uci': 'e8e5'}, {'uci': 'f5e5'}]},
 'counterpart-pinned-acting': {'id': 'counterpart-pinned-acting',
                               'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                               'startFen': '3r2k1/pr4pp/2R1b3/5p2/2P1p3/8/P4PPP/3BR1K1 b - - 0 27',
                               'startPly': 0,
                               'script': [{'uci': 'b7b1'}, {'uci': 'g1f1'}, {'uci': 'd8d1'}, {'uci': 'e1d1'}]},
 'acting-pinned-counterpart': {'id': 'acting-pinned-counterpart',
                               'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                               'startFen': 'r2qk2r/p2bnppp/3p4/1Bp5/4P3/4Q3/PPP2PPP/2KR3R w kq - 1 13',
                               'startPly': 0,
                               'script': [{'uci': 'd1d6'}, {'uci': 'd7b5'}, {'uci': 'd6d8'}]},
 'acting-captured-repeatedly': {'id': 'acting-captured-repeatedly',
                                'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                'startFen': '6k1/8/8/4p3/2p5/5N2/8/6K1 w - - 0 1',
                                'startPly': 0,
                                'script': [{'uci': 'f3e5'}, {'uci': 'g8f8'}, {'uci': 'e5c4'}]},
 'counterpart-captured-repeatedly': {'id': 'counterpart-captured-repeatedly',
                                     'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                                     'startFen': '6k1/8/5n2/2P5/4P3/8/8/6K1 b - - 0 1',
                                     'startPly': 0,
                                     'script': [{'uci': 'f6e4'}, {'uci': 'g1g2'}, {'uci': 'e4c5'}]},
 'position-reversed': {'id': 'position-reversed',
                       'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                       'startFen': 'r2q2k1/ppp2ppp/8/2b5/2B5/5N2/PPP2PPP/R5K1 w - - 0 15',
                       'startPly': 0,
                       'script': [{'uci': 'h2h3'}, {'uci': 'd8h4'}]},
 'endgame-entered': {'id': 'endgame-entered',
                     'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                     'startFen': 'r2q2k1/pppb1ppp/8/8/2B5/5N2/PPP2PPP/R2Q2K1 w - - 0 1',
                     'startPly': 0,
                     'script': [{'uci': 'd1d7'}]},
 'king-hunt-endgame': {'id': 'king-hunt-endgame',
                       'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                       'startFen': '6k1/8/8/8/8/8/8/R5K1 w - - 0 1',
                       'startPly': 0,
                       'script': [{'uci': 'g1f2'}]},
 'race-endgame': {'id': 'race-endgame',
                  'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                  'startFen': '4k3/8/8/P6p/8/8/8/4K3 w - - 0 1',
                  'startPly': 0,
                  'script': [{'uci': 'a5a6'}, {'uci': 'h5h4'}, {'uci': 'a6a7'}]},
 'acting-used-opening': {'id': 'acting-used-opening',
                         'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                         'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                         'startPly': 0,
                         'script': [{'uci': 'e2e4'}]},
 'counterpart-used-opening': {'id': 'counterpart-used-opening',
                              'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                              'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                              'startPly': 1,
                              'script': [{'uci': 'e2e4'}, {'uci': 'e7e5'}]},
 'counterpart-moved-quickly': {'id': 'counterpart-moved-quickly',
                               'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                               'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 15',
                               'startPly': 0,
                               'script': [{'uci': 'a7a6', 'durationMs': 500}]},
 'counterpart-thought-long': {'id': 'counterpart-thought-long',
                              'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                              'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 15',
                              'startPly': 0,
                              'script': [{'uci': 'a7a6', 'durationMs': 65000}]},
 'critical-move': {'id': 'critical-move',
                   'settings': {'playerSide': 'black', 'difficulty': 'casual', 'locale': 'en'},
                   'startFen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                   'startPly': 6,
                   'script': [{'uci': 'e2e4'},
                              {'uci': 'e7e5'},
                              {'uci': 'g1f3'},
                              {'uci': 'b8c6'},
                              {'uci': 'f1c4'},
                              {'uci': 'b7b5'}]}}



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

    @classmethod
    def _debug_game(cls, fixture: Dict[str, Any]) -> Dict[str, Any]:
        start_fen = fixture["startFen"]
        try:
            board = chess.Board(start_fen)
        except Exception as exc:
            raise CommandRejected(f"Invalid debug start position: {exc}") from exc
        game = cls._state_from_board(board, [], start_fen)
        script = fixture["script"]
        start_ply = fixture["startPly"]
        if not isinstance(start_ply, int) or start_ply < 0 or start_ply > len(script):
            raise CommandRejected("Invalid debug start ply")
        for index, step in enumerate(script[:start_ply]):
            uci = step.get("uci")
            if not isinstance(uci, str) or len(uci) not in {4, 5}:
                raise CommandRejected("Invalid debug move")
            game, move_info = cls._make_move(game, uci[:2], uci[2:4], uci[4:] or None)
            if isinstance(step.get("durationMs"), int):
                move_info["durationMs"] = step["durationMs"]
                game["moveHistory"][-1] = move_info
        return game

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

        if command_type == "debugLoadScenario":
            if actor != "player":
                raise CommandRejected("Only player may load debug scenarios")
            scenario_id = cmd.get("scenarioId")
            fixture = CHESS_DEBUG_SCENARIOS.get(scenario_id)
            if fixture is None:
                raise CommandRejected("Unknown Chess debug scenario")
            settings = deepcopy(fixture["settings"])
            game = self._debug_game(fixture)
            state.update({
                "settings": settings,
                "gameState": game,
                "drawOffer": None,
                "takebackRequest": None,
                "tutorial": None,
                "debugScenarioId": scenario_id,
                "debugScenario": {"script": deepcopy(fixture["script"]), "nextPly": fixture["startPly"]},
            })
            return ReducerResult(state, {"success": True}, [{"type": "debug_scenario_loaded", "scenarioId": scenario_id}])

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
            debug = state.get("debugScenario")
            if isinstance(debug, dict) and debug.get("nextPly", 0) < len(debug.get("script", [])):
                scripted = debug["script"][debug["nextPly"]]
                expected = scripted.get("uci")
                actual = from_square + to_square + (promotion or "")
                if actual != expected:
                    raise CommandRejected("Follow the loaded debug scenario move")
            next_game, move_info = self._make_move(game, from_square, to_square, promotion)
            now = int(time.time() * 1000)
            previous = game["moveHistory"][-1].get("madeAtMs") if game["moveHistory"] else None
            move_info["madeAtMs"] = now
            if isinstance(previous, int):
                move_info["durationMs"] = max(0, now - previous)
            next_game["moveHistory"][-1] = move_info
            if isinstance(debug, dict):
                scripted = debug.get("script", [])[debug.get("nextPly", 0)] if debug.get("nextPly", 0) < len(debug.get("script", [])) else {}
                if isinstance(scripted.get("durationMs"), int):
                    move_info["durationMs"] = scripted["durationMs"]
                    next_game["moveHistory"][-1] = move_info
                debug["nextPly"] = debug.get("nextPly", 0) + 1
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

        raise CommandRejected(f"Unknown chess command: {command_type}")

    def agent_next_command(self) -> Optional[Dict[str, Any]]:
        game = self.state.get("gameState")
        if not isinstance(game, dict) or game.get("status") != "playing":
            return None
        agent_side = self._side_for_actor(self.state, "agent")
        if game.get("turn") != agent_side:
            return None
        debug = self.state.get("debugScenario")
        if isinstance(debug, dict):
            next_ply = debug.get("nextPly", 0)
            script = debug.get("script", [])
            if next_ply < len(script):
                uci = script[next_ply].get("uci")
                if isinstance(uci, str) and len(uci) in {4, 5}:
                    command = {"type": "move", "from": uci[:2], "to": uci[2:4]}
                    if len(uci) == 5:
                        command["promotion"] = uci[4]
                    return command
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
