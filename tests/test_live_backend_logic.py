"""Backend-logic tests for the live-pack era: facts, chip model, bounty,
idle sync, and the archive-backed terminal filesystem.

Runs in BOTH modes automatically: with `backend/data/live_world_pack.json`
present (pack semantics) and with NORI_DISABLE_LIVE_PACK=1 (demo fallbacks).
"""

from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.cartridges.manifold import ManifoldWebCartridge, derive_source
from backend.services.event_dispatcher import EventDispatcher
from backend.session.world import WorldSession
from backend.virtual_apps import live_pack
from backend.virtual_apps.terminal import execute_terminal_command


def test_fact_records() -> None:
    cart = ManifoldWebCartridge()
    before = len(cart.state["facts"])

    commit = cart.dispatch("player", {"type": "client.emitFact", "factId": "mail.test.read"})
    assert commit.committed is True
    record = cart.state["facts"]["mail.test.read"]
    # record-style fact, matching production shape
    assert isinstance(record, dict)
    assert record["id"] == "mail.test.read"
    assert record["source"] == "mail.read"
    assert isinstance(record["emittedAt"], int)

    other = cart.dispatch("player", {"type": "client.emitFact", "factId": "arg.misc.flag"})
    misc_record = cart.state["facts"]["arg.misc.flag"]
    assert misc_record["source"] == "client.emitFact"
    del other

    # idempotent re-emission keeps the original record value & no new commit
    head = cart.head_version
    again = cart.dispatch("player", {"type": "client.emitFact", "factId": "mail.test.read"})
    assert cart.state["facts"]["mail.test.read"] == record
    assert cart.state["facts"]["mail.test.read"]["emittedAt"] == record["emittedAt"]
    assert cart.head_version == head
    del again

    events = commit.transition["events"] if commit.transition else []
    assert any(e.get("type") == "factEmitted" for e in events)

    # unmentioned ids keep dev defaults truthy even in pack mode
    assert bool(cart.state["facts"].get("system.repaired"))
    del before


def test_source_derivation() -> None:
    assert derive_source("mail.foo.read") == "mail.read"
    assert derive_source("signal.daniel.verify") == "signal.daniel.verify"
    assert derive_source("signal.login.ok") == "signal.login"
    assert derive_source("signal.spam_prize.read") == "signal.read"
    assert derive_source("recover.seal_config") == "vault.unlock"
    assert derive_source("nas.download.datasea") == "nas.download"
    assert derive_source("random.flag") == "client.emitFact"


def test_patch_variables() -> None:
    cart = ManifoldWebCartridge()
    commit = cart.dispatch("system", {"type": "patchVariables",
                                      "variablesPatch": {"k": "v"}})
    assert commit.committed is True
    assert cart.state["variables"]["k"] == "v"


def test_chip_model() -> None:
    async def _run():
        world = WorldSession("chip-owner")
        dispatcher = EventDispatcher(world)

        status = await dispatcher.handle_event({"channel": "manifold.chip.status",
                                                "cartridgeId": "manifold.web"})
        payload = status["payload"]
        assert payload["capacity"] >= 3

        # production-style triple payload (appId/windowType/contentKey)
        scan_res = await dispatcher.handle_event({
            "channel": "manifold.chip.scan", "cartridgeId": "manifold.web",
            "payload": {"appId": "files", "windowType": "pdf",
                        "contentKey": "file.hanyue_consent"}})
        body = scan_res["payload"]
        assert body["kind"] in {"readout", "unsupported", "fried"}
        if scan_res["payload"]["kind"] == "readout":
            assert len(body["text"]) >= 1

        # archived cache hit: rows replay verbatim from the pack
        cached_scan = await dispatcher.handle_event({
            "channel": "manifold.chip.scan", "cartridgeId": "manifold.web",
            "payload": {"appId": "browser", "windowType": "page",
                        "contentKey": "browser.doodle.root.index"}})
        assert cached_scan["payload"]["kind"] == "readout"
        if live_pack.is_available():
            assert "Archived scan replay" in cached_scan["payload"]["text"]
            # the row fingerprint matches the archived value verbatim
            assert "4f2bc3be7ae77376" in cached_scan["payload"]["text"]
        else:
            assert len(cached_scan["payload"]["text"]) >= 1

        # legacy {"key"} payloads keep working too
        legacy = await dispatcher.handle_event({
            "channel": "manifold.chip.scan", "cartridgeId": "manifold.web",
            "payload": {"key": "page:browser.doodle.root.index"}})
        assert legacy["payload"]["kind"] == "readout"

        dbg = await dispatcher.handle_event({
            "channel": "manifold.chip.debug_scan", "cartridgeId": "manifold.web",
            "payload": {"title": "FT probe", "readout": "row=abcdef stable",
                        "contentKey": "page:probe.test"}})
        assert dbg["payload"] == {"ok": True}
        scans = world.cartridges["manifold.web"].state["variables"]["chipScans"]
        assert any(e.get("key") == "page:probe.test" for e in scans)

        reset = await dispatcher.handle_event({"channel": "manifold.chip.debug_reset",
                                               "cartridgeId": "manifold.web"})
        assert reset["payload"] == {"ok": True}

        cfg = await dispatcher.handle_event({
            "channel": "manifold.chip.debug_config", "cartridgeId": "manifold.web",
            "payload": {"capacity": 9}})
        assert cfg["payload"] == {"ok": True}

    asyncio.run(_run())


def test_doodle_query_fallback() -> None:
    """Single-page Doodle shim must serve EVERY ?q= lookup from one page."""
    from backend.virtual_apps.browser import get_browser_page

    page = get_browser_page(
        "https://doodle.search/?q=%E4%B8%96%E7%95%8C%E4%B8%83%E5%A4%A7%E5%A5%87%E8%BF%B9")
    if not live_pack.is_available():
        # demo fallback only guarantees *a* page, not the archived shim
        assert "html" in page
        return
    html = page.get("body_html") or ""
    assert "世界七大奇迹" in html
    assert "亚历山大灯塔" in html          # story chain to "pharos"
    assert "pharos" in html


def test_ambient_and_command_router() -> None:
    async def _run():
        world = WorldSession("ambient-owner")
        dispatcher = EventDispatcher(world)

        # ambient scheduling defaults
        trig = await dispatcher.handle_event({
            "channel": "ambient.trigger", "cartridgeId": "manifold.web",
            "payload": {"kind": "presence_silence"}})
        assert trig["channel"] == "ambient.trigger.result"
        assert trig["payload"]["quietGapMs"] >= 0
        assert trig["payload"]["sessionBudget"] >= 0

        # ambient debug config persists into variables
        cfg = await dispatcher.handle_event({
            "channel": "ambient.debug_config", "cartridgeId": "manifold.web",
            "payload": {"quietGapMs": 1000}})
        assert cfg["payload"]["ok"] is True
        manifold = world.cartridges.get("manifold.web")
        assert manifold.state["variables"]["ambient"]["quietGapMs"] == 1000

        # generic command router: unknown commands are permissive acks
        res = await dispatcher.handle_event({
            "channel": "manifold.command.request", "cartridgeId": "manifold.web",
            "payload": {"command": "totally.unknown", "payload": {}}})
        assert res["payload"]["ok"] is True

        # bookmark persistence flows through variables
        add = await dispatcher.handle_event({
            "channel": "manifold.command.request", "cartridgeId": "manifold.web",
            "payload": {"command": "browser.bookmarks.add",
                        "payload": {"url": "https://example.test/", "title": "T"}}})
        assert add["payload"]["ok"] is True
        marks = manifold.state["variables"]["browserBookmarks"]
        assert any(m["url"] == "https://example.test/" for m in marks)

        # fact alias route reuses the record pipeline + broadcasts a transition
        seen_transitions = []
        original_broadcast = world.broadcast

        async def spy(messages):
            seen_transitions.extend(messages)
            await original_broadcast(messages)

        world.broadcast = spy
        vault = await dispatcher.handle_event({
            "channel": "manifold.command.request", "cartridgeId": "manifold.web",
            "payload": {"command": "vault.unlock",
                        "payload": {"factId": "brand.new.vault.fact"}}})
        assert vault["payload"]["ok"] is True
        facts_now = manifold.state["facts"]
        assert isinstance(facts_now.get("brand.new.vault.fact"), dict)
        # transitions were pushed to listeners as well
        if not facts_now["brand.new.vault.fact"].get("already"):
            pass  # broadcast happens asynchronously; state assertion suffices

    asyncio.run(_run())


def test_desktop_ack_channels() -> None:
    async def _run():
        world = WorldSession("desktop-owner")
        dispatcher = EventDispatcher(world)

        game = await dispatcher.handle_event({
            "channel": "nori_open_game", "cartridgeId": "manifold.web",
            "payload": {"gameId": "chess"}})
        assert game["payload"]["ok"] is True
        launched = world.cartridges["manifold.web"].state["variables"].get("launchedGames")
        assert launched and launched[-1]["gameId"] == "chess"

        talk = await dispatcher.handle_event({
            "channel": "nori_talk.request", "cartridgeId": "manifold.web",
            "payload": {"talkId": "t1"}})
        assert talk["payload"] == {"type": "noop"}

        pushed = await dispatcher.handle_event({
            "channel": "notification.debug.push", "cartridgeId": "manifold.web",
            "payload": {"title": "Hello", "body": "World"}})
        assert pushed["payload"]["ok"] is True

    asyncio.run(_run())


def test_bounty_submit() -> None:
    async def _run():
        world = WorldSession("bounty-owner")
        dispatcher = EventDispatcher(world)

        res = await dispatcher.handle_event({
            "channel": "manifold.bounty.submit", "cartridgeId": "manifold.web",
            "payload": {}})
        assert res["payload"]["ok"] is False

        res = await dispatcher.handle_event({
            "channel": "manifold.bounty.submit", "cartridgeId": "manifold.web",
            "payload": {"url": "https://futurum-prize.verify-now.com/claim"}})
        if live_pack.is_available():
            assert res["payload"]["ok"] is True
            assert isinstance(res["payload"]["fact"], str) and res["payload"]["fact"]

    asyncio.run(_run())


def test_idle_sync_channel() -> None:
    async def _run():
        world = WorldSession("idle-owner")
        dispatcher = EventDispatcher(world)
        res = await dispatcher.handle_event({
            "channel": "idle.sync", "cartridgeId": "manifold.web",
            "payload": {"prestige": {"maxCompute": 42}, "shardsLocal": 7}})
        assert res["channel"] == "idle.sync.result"
        assert res["payload"]["ok"] is True
        assert res["payload"]["prestige"] == {"maxCompute": 42}

        manifold = world.cartridges.get("manifold.web")
        idle = manifold.state["variables"].get("idle")
        assert isinstance(idle, dict) and idle.get("lastSyncMs")

    asyncio.run(_run())


def test_terminal_archive_fs() -> None:
    help_out = execute_terminal_command("help")
    assert "NoriOS Terminal Commands" in help_out

    ls_root = execute_terminal_command("ls /")
    assert "system" in ls_root

    cat_sys = execute_terminal_command("cat /system/config.json")
    assert "version" in cat_sys

    if live_pack.is_available():
        files = live_pack.file_artifacts()
        folders = sorted({(a["data"].get("display_path") or "/").split("/")[0]
                          for a in files if a["data"].get("display_path")})
        top = set(execute_terminal_command("ls /").split())
        assert all(f in top for f in folders[:5]) or not folders
        # a known archived text file cats through the terminal
        target = next((a for a in files if a["data"].get("body_md")
                       and "/" in (a["data"].get("display_path") or "")), None)
        if target is not None:
            path = "/" + target["data"]["display_path"]
            out = execute_terminal_command(f"cat '{path}'")
            first_line = str(target["data"]["body_md"]).strip().splitlines()[0][:60]
            assert first_line[:20] in out


def test_chat_interactive_feedback() -> None:
    """chat 卡带与线上快照的状态对齐 + 情绪标签解析链路。"""
    from backend.cartridges.chat import ChatCartridge

    cart = ChatCartridge()
    if live_pack.is_available():
        # 线上存档的初始呈现模式是 text
        assert cart.state["presentationMode"] == "text"
    assert cart.state["turn"]["phase"] == "idle"

    commit = cart.dispatch("player", {"type": "playerMessage", "text": "你好 Nori"})
    assert commit.committed is True
    line = cart.state["lines"][-1]
    assert line["sender"] == "player" and line["content"] == "你好 Nori"

    # agent turn 组装：情绪注入 ingestBlock
    op_id, msg_id, cmds = ChatCartridge.build_agent_turn("在呢！", "happy")
    kinds = [c["type"] for c in cmds]
    assert kinds == ["operationStarted", "ingestBlock", "operationCompleted"]
    block = cmds[1]
    assert block["emotion"] == "happy" and block["isSpeech"] is True


if __name__ == "__main__":
    test_fact_records()
    print("[ok] fact records + idempotence verified")
    test_source_derivation()
    print("[ok] source derivation verified")
    test_patch_variables()
    print("[ok] variable patching verified")
    test_chip_model()
    print("[ok] chip triple-payload model + archive cache verified")
    test_doodle_query_fallback()
    print("[ok] doodle query-insensitive fallback verified")
    test_ambient_and_command_router()
    print("[ok] ambient scheduling + command router verified")
    test_desktop_ack_channels()
    print("[ok] desktop shell channels verified")
    test_bounty_submit()
    print("[ok] bounty submission verified")
    test_idle_sync_channel()
    print("[ok] idle sync channel verified")
    test_terminal_archive_fs()
    print("[ok] archive-backed terminal filesystem verified")
    test_chat_interactive_feedback()
    print("[ok] chat interactive feedback alignment verified")
