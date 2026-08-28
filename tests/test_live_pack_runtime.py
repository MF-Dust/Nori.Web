from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.virtual_apps import live_pack


def main() -> None:
    sample = {
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

    live_pack.set_disabled(False)
    assert live_pack.install_pack(sample)
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

    live_pack.set_disabled(True)
    assert not live_pack.has_loaded_pack()
    assert live_pack.mail_artifacts() == []
    print("[ok] runtime live-world pack injection is available to existing accessors")


if __name__ == "__main__":
    main()
