from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.session import persistence
from backend.session.world import WorldSession
from backend.virtual_apps import live_pack

ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")


def _test_snapshot_hot_path() -> None:
    world = WorldSession("memory-test", "zh-CN")
    chat = world.cartridges["chat"]
    chat.state["__memoryProbe"] = {"nested": [1, 2, 3]}

    original_deepcopy = persistence.deepcopy
    calls = 0

    def counting_deepcopy(value):
        nonlocal calls
        calls += 1
        return original_deepcopy(value)

    persistence.deepcopy = counting_deepcopy
    try:
        raw = persistence.world_snapshot_json(world)
        assert calls == 0, "hot JSON persistence must not deepcopy the world graph"
        payload = json.loads(raw)
        assert payload["cartridges"]["chat"]["state"]["__memoryProbe"]["nested"] == [
            1,
            2,
            3,
        ]

        detached = persistence.world_to_snapshot(world)
        assert calls == 1, "public Python snapshot must keep defensive-copy semantics"
        detached["cartridges"]["chat"]["state"]["__memoryProbe"]["nested"].append(4)
        assert chat.state["__memoryProbe"]["nested"] == [1, 2, 3]
    finally:
        persistence.deepcopy = original_deepcopy


def _test_live_pack_single_resident_graph() -> None:
    sample = {
        "world_id": "memory-world",
        "mail_artifacts": [
            {"id": "mail-1", "data": {"subject": "hello", "labels": ["a"]}}
        ],
        "browser_pages": [
            {
                "key": "https://example.test/",
                "aliases": ["http://example.test/"],
                "data": {"url": "https://example.test/", "title": "Example"},
            }
        ],
    }

    live_pack.set_disabled(False)
    assert live_pack.install_pack(sample)

    # Trusted internal readers see the one resident R2-decoded graph directly.
    view = live_pack._section_view("browser_pages")
    assert view is sample["browser_pages"]
    assert view[0] is sample["browser_pages"][0]

    # Public artifact accessors retain their historical deep-copy isolation.
    copied_mail = live_pack.mail_artifacts()
    copied_mail[0]["data"]["labels"].append("mutated")
    assert sample["mail_artifacts"][0]["data"]["labels"] == ["a"]

    # Raw browser scans only detach the list shell; the heavy page tree is not
    # duplicated. A concrete page crossing the app boundary is still copied.
    raw_pages = live_pack.all_pages_raw()
    assert raw_pages is not sample["browser_pages"]
    assert raw_pages[0] is sample["browser_pages"][0]

    page = live_pack.page("https://example.test/")
    assert page is not None
    page["data"]["title"] = "Changed"
    assert live_pack.page("https://example.test/")["data"]["title"] == "Example"

    live_pack.set_disabled(True)


def _test_cloudflare_hot_path_source() -> None:
    # One incoming frame is decoded exactly once in the production override.
    assert ENTRY.count("message = json.loads(raw)") == 1
    assert "_prefetch_parsed_arcade_message(self.env, message)" in ENTRY
    assert "_prefetch_for_arcade_message(self.env, raw)" not in ENTRY

    # Production artifact accessors only copy list pointers, not the archived
    # object graph, and transition bodies are released after serialization.
    assert "_cloudflare_archive_list" in ENTRY
    assert 'mail_artifacts = lambda: _cloudflare_archive_list("mail_artifacts")' in ENTRY
    assert "_prune_transition_history(world)" in ENTRY
    assert "cartridge.transitions.clear()" in ENTRY


def main() -> None:
    _test_snapshot_hot_path()
    _test_live_pack_single_resident_graph()
    _test_cloudflare_hot_path_source()
    print(
        "[ok] Cloudflare persistence, archive reads, JSON parsing, and transition history avoid redundant object graphs"
    )


if __name__ == "__main__":
    main()
