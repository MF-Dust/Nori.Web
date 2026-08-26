"""Backward-compatibility alias for `backend.cartridges.chess`."""

from .chess import (
    PIECE_NAMES,
    PROMOTION_TYPES,
    ChessCartridge,
)

__all__ = ["PIECE_NAMES", "PROMOTION_TYPES", "ChessCartridge"]
