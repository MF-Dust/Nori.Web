from __future__ import annotations

import asyncio
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.virtual_apps import live_pack


def _sample() -> dict:
    return {
        "world_id": "test-world",
        "mail_artifacts": [{"id": "mail-1", "subject": "hello"}],
        "file_artifacts": [{"id": "file-1", "name": "note.txt"}],
        "signal_thread_artifacts": [{"id": "thread-1"}],
        "signal_message_artifacts": [{"id": "message-1", "thread_id": "thread-1"}],
        "browser_pages": [
            {
                "key": "https://example.test/page?q=1",
                "aliases": ["http://example.test/page?q=1"],
                "data": {"url": "https://example.test/page?q=1", "title": "Example"},
            }
        ],
        "facts": {"chapter": 7},
        "variables": {"flag": True},
        "chip_status": {"online": True},
    }


def _assert_full_accessors() -> None:
    assert live_pack.has_loaded_pack()
    assert live_pack.is_available()
    assert live_pack.mail_artifacts()[0]["id"] == "mail-1"
    assert live_pack.file_artifacts()[0]["id"] == "file-1"
    assert live_pack.signal_thread_artifacts()[0]["id"] == "thread-1"
    assert live_pack.signal_message_artifacts()[0]["id"] == "message-1"
    assert live_pack.page("https://example.test/page?q=1")["data"]["title"] == "Example"
    assert live_pack.page("http://example.test/page?q=1")["data"]["title"] == "Example"
    assert live_pack.facts()["chapter"] == 7
    assert live_pack.variables()["flag"] is True
    assert live_pack.chip_status()["online"] is True

    copied = live_pack.mail_artifacts()
    copied[0]["subject"] = "mutated"
    assert live_pack.mail_artifacts()[0]["subject"] == "hello"


def _load_partition_module():
    path = ROOT / "scripts" / "upload_cloudflare_live_pack.py"
    spec = importlib.util.spec_from_file_location("nori_live_partition", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


async def main() -> None:
    sample = _sample()

    # Local/direct complete injection remains valid.
    live_pack.set_disabled(False)
    assert live_pack.install_pack(sample)
    _assert_full_accessors()

    # Cloudflare binds a loader before dispatching the ASGI WebSocket task.
    # The loader now installs only the small core needed for WorldSession.
    live_pack.set_disabled(True)
    live_pack.set_disabled(False)
    calls: list[str] = []

    async def deferred_loader() -> bool:
        calls.append("load")
        core = {
            key: value
            for key, value in sample.items()
            if key
            not in {
                "mail_artifacts",
                "file_artifacts",
                "signal_thread_artifacts",
                "signal_message_artifacts",
                "browser_pages",
            }
        }
        return live_pack.install_core(core)

    token = live_pack.bind_runtime_loader(deferred_loader)
    try:
        assert calls == []
        assert not live_pack.has_loaded_pack()
        assert await live_pack.ensure_runtime_pack()
        assert calls == ["load"]
        assert live_pack.facts()["chapter"] == 7
        assert live_pack.variables()["flag"] is True
        assert live_pack.chip_status()["online"] is True
        assert not live_pack.section_loaded("mail_artifacts")
        assert live_pack.mail_artifacts() == []
        assert "mails=lazy" in live_pack.summary()

        # Artifact sections can be attached independently without replacing core.
        assert live_pack.install_section("mail_artifacts", sample["mail_artifacts"])
        assert live_pack.install_section("file_artifacts", sample["file_artifacts"])
        assert live_pack.install_section(
            "signal_thread_artifacts", sample["signal_thread_artifacts"]
        )
        assert live_pack.install_section(
            "signal_message_artifacts", sample["signal_message_artifacts"]
        )
        assert live_pack.mail_artifacts()[0]["subject"] == "hello"
        assert live_pack.file_artifacts()[0]["id"] == "file-1"

        # Browser replay is explicitly replaceable so only one R2 shard must
        # remain resident at a time.
        assert live_pack.replace_browser_pages(sample["browser_pages"])
        assert live_pack.page("https://example.test/page?q=1")["data"]["title"] == "Example"
        assert live_pack.page("http://example.test/page?q=1")["data"]["title"] == "Example"
        assert live_pack.replace_browser_pages([])
        assert live_pack.page("https://example.test/page?q=1") is None

        # Once the core is resident, a second world open does not re-fetch it.
        assert await live_pack.ensure_runtime_pack()
        assert calls == ["load"]
    finally:
        live_pack.reset_runtime_loader(token)

    # The uploader must produce a core with no heavy arrays plus an alias index
    # that points both http/https forms to the same browser shard.
    partition = _load_partition_module()
    objects = partition.partition_pack(sample, shard_count=4)
    core = objects["runtime/live/core.json"]
    assert "browser_pages" not in core
    assert "mail_artifacts" not in core
    index = objects["runtime/live/browser-index.json"]["entries"]
    assert index["https://example.test/page?q=1"] == index[
        "http://example.test/page?q=1"
    ]
    shard = index["https://example.test/page?q=1"]
    pages = objects[f"runtime/live/browser/{shard}.json"]
    assert pages[0]["data"]["title"] == "Example"

    live_pack.set_disabled(True)
    assert not live_pack.has_loaded_pack()
    assert live_pack.mail_artifacts() == []
    print("[ok] live-world core, lazy sections, and browser sharding behave correctly")


if __name__ == "__main__":
    asyncio.run(main())
