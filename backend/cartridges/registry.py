"""Cartridge registration and factory registry."""

from __future__ import annotations

from typing import Callable, Dict, List, Optional, Type

from .base import BaseCartridge
from .cakeduel import CakeDuelCartridge
from .chat import ChatCartridge
from .chess_engine import ChessCartridge
from .codenames import CodenamesCartridge
from .manifold import ManifoldWebCartridge
from .pictionary import PictionaryCartridge

CartridgeFactory = Callable[[], BaseCartridge]


class CartridgeRegistry:
    """Central registry for pluggable game/system cartridges."""

    def __init__(self) -> None:
        self._factories: Dict[str, CartridgeFactory] = {}
        self._default_cartridge_ids: List[str] = ["chat", "manifold.web"]
        self._register_defaults()

    def _register_defaults(self) -> None:
        self.register("chat", ChatCartridge)
        self.register("cakeduel", CakeDuelCartridge)
        self.register("codenames", CodenamesCartridge)
        self.register("chess", ChessCartridge)
        self.register("manifold.web", ManifoldWebCartridge)
        self.register("pictionary", PictionaryCartridge)

    def register(self, cartridge_id: str, factory: CartridgeFactory) -> None:
        self._factories[cartridge_id] = factory

    def unregister(self, cartridge_id: str) -> None:
        self._factories.pop(cartridge_id, None)

    def get_factory(self, cartridge_id: str) -> Optional[CartridgeFactory]:
        return self._factories.get(cartridge_id)

    def create(self, cartridge_id: str) -> Optional[BaseCartridge]:
        factory = self.get_factory(cartridge_id)
        if factory is None:
            return None
        return factory()

    def list_available(self) -> List[str]:
        return list(self._factories.keys())

    def get_default_cartridges(self) -> Dict[str, BaseCartridge]:
        """Instantiate standard startup cartridges for a new WorldSession."""
        result: Dict[str, BaseCartridge] = {}
        for cid in self._default_cartridge_ids:
            cartridge = self.create(cid)
            if cartridge:
                result[cid] = cartridge
        return result


CARTRIDGE_REGISTRY = CartridgeRegistry()
