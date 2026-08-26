"""Backward-compatibility re-export for `backend.session`."""

from .cartridges.registry import CARTRIDGE_REGISTRY
from .session.manager import Ticket, WORLD_MANAGER, WorldManager
from .session.world import WorldSession

# Expose CARTRIDGE_FACTORIES mapping for legacy access
CARTRIDGE_FACTORIES = CARTRIDGE_REGISTRY._factories

__all__ = [
    "Ticket",
    "WorldSession",
    "WorldManager",
    "WORLD_MANAGER",
    "CARTRIDGE_FACTORIES",
]
