"""Unit tests for virtual applications and event dispatcher."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.services.event_dispatcher import EventDispatcher
from backend.session.world import WorldSession
from backend.virtual_apps import live_pack
from backend.virtual_apps.browser import get_browser_page
from backend.virtual_apps.files import get_file_artifacts, list_device_volumes, unseal_volume
from backend.virtual_apps.mail import get_inbox_emails, get_mail_artifacts, mark_email_read, send_email
from backend.virtual_apps.messenger import (
    get_messenger_threads,
    get_signal_message_artifacts,
    get_signal_thread_artifacts,
    send_message_to_thread,
)
from backend.virtual_apps.terminal import execute_terminal_command


def test_mail_app() -> None:
    inbox = get_inbox_emails()
    assert len(inbox) >= 2
    assert inbox[0]["folder"] == "inbox"

    new_mail = send_email("nori@inori.ai", "Test Subject", "Test Body")
    assert new_mail["folder"] == "sent"

    read_ok = mark_email_read("mail_welcome")
    assert read_ok is True

    artifacts = get_mail_artifacts(1700000000000)
    assert len(artifacts) >= 2
    assert artifacts[0]["type"] == "mail"
    assert "body_md" in artifacts[0]["data"]


def test_files_app() -> None:
    volumes = list_device_volumes()
    assert len(volumes) >= 2
    assert volumes[0]["name"] == "Nori Memory Core"

    unseal_res = unseal_volume("vol_02", "key")
    assert unseal_res["success"] is True

    artifacts = get_file_artifacts(1700000000000)
    assert len(artifacts) >= 2
    assert artifacts[0]["type"] == "file"
    assert "display_path" in artifacts[0]["data"]


def test_messenger_app() -> None:
    threads = get_messenger_threads()
    assert len(threads) >= 2
    if not live_pack.is_available():
        # Demo-mode contract: the built-in mailbox leads with the Nori thread.
        assert threads[0]["thread_id"] == "nori"
    else:
        # Archived production data is served verbatim; order follows the pack.
        assert all(t.get("thread_id") for t in threads)

    msg = send_message_to_thread("nori", "Hello Nori!")
    assert msg["sender"] == "operator"

    thread_artifacts = get_signal_thread_artifacts(1700000000000)
    assert len(thread_artifacts) >= 2
    assert thread_artifacts[0]["type"] == "signal_thread"

    msg_artifacts = get_signal_message_artifacts(1700000000000)
    assert len(msg_artifacts) >= 2
    assert msg_artifacts[0]["type"] == "signal_message"


def test_browser_app() -> None:
    page = get_browser_page("https://doodle.search/")
    if live_pack.is_available():
        # Archived production payload renders via body_html.
        assert "Doodle" in page["title"]
        assert "<" in (page.get("body_html") or "")
    else:
        assert page["title"] == "Doodle Search"
        assert "<!DOCTYPE html>" in page["html"]

    fallback = get_browser_page("https://unknown.local/")
    assert "Simulated Net Page" in fallback["title"]


def test_terminal_app() -> None:
    help_out = execute_terminal_command("help")
    assert "NoriOS Terminal Commands" in help_out

    ls_out = execute_terminal_command("ls /")
    assert "system" in ls_out

    cat_out = execute_terminal_command("cat /system/config.json")
    assert "version" in cat_out

    whoami_out = execute_terminal_command("whoami")
    assert "operator" in whoami_out


def test_event_dispatcher() -> None:
    async def _run():
        world = WorldSession("test-owner")
        dispatcher = EventDispatcher(world)

        # 1. chip status
        chip_res = await dispatcher.handle_event({"channel": "manifold.chip.status", "cartridgeId": "manifold.web"})
        assert chip_res["type"] == "event"
        assert chip_res["channel"] == "manifold.chip.status.result"
        if live_pack.is_available():
            assert chip_res["payload"]["capacity"] >= 3  # archived value honored
        else:
            assert chip_res["payload"]["capacity"] == 3

        # 2. artifacts request
        art_res = await dispatcher.handle_event({"channel": "manifold.artifacts.request", "payload": {}})
        assert art_res["type"] == "event"
        assert art_res["payload"]["ok"] is True
        assert len(art_res["payload"]["artifacts"]) > 0

        # 3. browser fetch
        fetch_res = await dispatcher.handle_event(
            {
                "channel": "manifold.artifacts.fetch",
                "payload": {"artifactType": "browser_page", "lookup_key": "https://doodle.search/"},
            }
        )
        assert fetch_res["payload"]["ok"] is True
        assert fetch_res["payload"]["artifact"]["type"] == "browser_page"

        # 4. network test
        net_res = await dispatcher.handle_event({"channel": "settings.network.test"})
        assert net_res["payload"]["rttMs"] == 0

    asyncio.run(_run())


if __name__ == "__main__":
    test_mail_app()
    test_files_app()
    test_messenger_app()
    test_browser_app()
    test_terminal_app()
    test_event_dispatcher()
    print("[ok] all virtual apps and event dispatcher verified")
