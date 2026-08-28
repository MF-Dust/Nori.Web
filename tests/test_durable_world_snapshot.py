from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.session.persistence import world_from_snapshot_json, world_snapshot_json
from backend.session.world import WorldSession


def main() -> None:
    world = WorldSession("user_hibernate", "zh-CN")
    world.world_id = "world_hibernate_test"
    world.media_grants = {"grant-a", "grant-b"}
    world._media_sequence = 23

    chat = world.cartridges["chat"]
    commit = chat.dispatch("player", {"type": "playerMessage", "text": "测试休眠恢复"})
    assert commit.committed
    chat.visible_version = chat.head_version

    raw = world_snapshot_json(world)
    payload = json.loads(raw)
    assert payload["ownerId"] == "user_hibernate"
    assert payload["worldId"] == "world_hibernate_test"
    assert payload["mediaSequence"] == 23
    assert "apiKey" not in raw
    assert "clients" not in payload

    restored = world_from_snapshot_json(raw)
    assert restored is not None
    assert restored.owner_id == world.owner_id
    assert restored.world_id == world.world_id
    assert restored.locale == world.locale
    assert restored.media_grants == world.media_grants
    assert restored._media_sequence == 23

    restored_chat = restored.cartridges["chat"]
    assert restored_chat.state == chat.state
    assert restored_chat.head_version == chat.head_version
    assert restored_chat.visible_version == chat.visible_version
    assert restored_chat.transitions == {}

    assert restored.clients == set()
    assert restored.media_clients == set()
    assert restored._tasks == set()

    print("[ok] Durable Object world snapshots survive hibernation without socket/task/secret state")


if __name__ == "__main__":
    main()
