"""Cartridges package providing replicated game state machines and registry."""

from .base import (
    BaseCartridge,
    CommandRejected,
    Commit,
    ReducerResult,
    top_level_patch,
)
from .cakeduel import CakeDuelCartridge
from .chat import ChatCartridge
from .chess import ChessCartridge
from .codenames import CodenamesCartridge
from .manifold import ManifoldWebCartridge
from .pictionary import PictionaryCartridge
from .registry import CARTRIDGE_REGISTRY, CartridgeRegistry

__all__ = [
    "BaseCartridge",
    "CommandRejected",
    "ReducerResult",
    "Commit",
    "top_level_patch",
    "ChatCartridge",
    "CakeDuelCartridge",
    "ChessCartridge",
    "CodenamesCartridge",
    "ManifoldWebCartridge",
    "PictionaryCartridge",
    "CartridgeRegistry",
    "CARTRIDGE_REGISTRY",
]
