"""JSON-safe persistence helpers for Cloudflare Durable Object worlds.

The live WebSocket objects, asyncio tasks, locks, and browser API keys are
intentionally excluded. Only deterministic world/cartridge state needed to
resume after Durable Object hibernation is stored.
"""

from __future__ import annotations

import json
from copy import deepcopy
from typing import Any, Dict

from ..cartridges.registry import CARTRIDGE_REGISTRY
from .world import WorldSession

Json = Any
SNAPSHOT_VERSION = 1


def _non_negative_int(value: Any, default: int = 0) -> int:
    if isinstance(value, bool):
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(0, parsed)


def _world_snapshot_view(world: WorldSession) -> Dict[str, Json]:
    """Build a read-only serialization view without cloning cartridge state.

    ``json.dumps`` never mutates its input, so the hot persistence path can
    reference each cartridge's current state directly. This avoids holding a
    second complete world object graph while a Durable Object is being
    serialized. Callers that need an independently mutable Python snapshot
    should use :func:`world_to_snapshot`, which preserves the old deep-copy
    contract.
    """
    cartridges: Dict[str, Json] = {}
    for cartridge_id, cartridge in world.cartridges.items():
        cartridges[cartridge_id] = {
            "state": cartridge.state,
            "headVersion": int(cartridge.head_version),
            "visibleVersion": int(cartridge.visible_version),
        }

    return {
        "version": SNAPSHOT_VERSION,
        "ownerId": world.owner_id,
        "worldId": world.world_id,
        "locale": world.locale,
        "mediaGrants": sorted(
            grant for grant in world.media_grants if isinstance(grant, str)
        ),
        "mediaSequence": int(world._media_sequence),
        "cartridges": cartridges,
    }


def world_to_snapshot(world: WorldSession) -> Dict[str, Json]:
    """Return an independently mutable JSON-safe snapshot of one world."""
    return deepcopy(_world_snapshot_view(world))


def world_snapshot_json(world: WorldSession) -> str:
    """Serialize one world without first duplicating the full state graph."""
    return json.dumps(
        _world_snapshot_view(world),
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )


def world_from_snapshot(payload: Any) -> WorldSession | None:
    """Restore a world from a validated snapshot, or ``None`` if corrupt."""
    if not isinstance(payload, dict) or payload.get("version") != SNAPSHOT_VERSION:
        return None

    owner_id = payload.get("ownerId")
    world_id = payload.get("worldId")
    locale = payload.get("locale")
    saved_cartridges = payload.get("cartridges")
    if (
        not isinstance(owner_id, str)
        or not owner_id
        or not isinstance(world_id, str)
        or not world_id
        or not isinstance(saved_cartridges, dict)
    ):
        return None

    world = WorldSession(owner_id, locale if isinstance(locale, str) else None)
    restored = {}
    for cartridge_id, saved in saved_cartridges.items():
        if not isinstance(cartridge_id, str) or not isinstance(saved, dict):
            continue
        state = saved.get("state")
        if not isinstance(state, dict):
            continue
        cartridge = CARTRIDGE_REGISTRY.create(cartridge_id)
        if cartridge is None:
            continue
        # Restore is comparatively cold (only on wake/recovery), so keep the
        # defensive copy here. The CPU/memory win is in the per-message write
        # path above, not in weakening the public restore isolation contract.
        cartridge.state = deepcopy(state)
        cartridge.head_version = _non_negative_int(saved.get("headVersion"))
        cartridge.visible_version = min(
            cartridge.head_version,
            _non_negative_int(saved.get("visibleVersion")),
        )
        # Historical transition bodies are only needed while an isolate is
        # alive; the browser receives a full snapshot whenever it rejoins.
        cartridge.transitions.clear()
        restored[cartridge_id] = cartridge

    # chat is world-owned and cannot be unmounted. Its absence means the stored
    # payload is incomplete, so a fresh world is safer than a partial restore.
    if "chat" not in restored:
        return None

    world.world_id = world_id
    world.cartridges = restored

    grants = payload.get("mediaGrants")
    if isinstance(grants, list):
        world.media_grants = {
            grant for grant in grants[-32:] if isinstance(grant, str) and grant
        }
    world._media_sequence = _non_negative_int(payload.get("mediaSequence")) & 0xFFFFFFFF
    return world


def world_from_snapshot_json(raw: Any) -> WorldSession | None:
    if not isinstance(raw, str) or not raw:
        return None
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return world_from_snapshot(payload)
