"""Reducer-level checks for every publicly registered game/chat cartridge."""

from __future__ import annotations

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.cartridges.cakeduel import CakeDuelCartridge
from backend.cartridges.chat import ChatCartridge
from backend.cartridges.chess import ChessCartridge
from backend.cartridges.codenames import CodenamesCartridge
from backend.cartridges.manifold import ManifoldWebCartridge
from backend.cartridges.pictionary import PictionaryCartridge
from backend.cartridges.registry import CARTRIDGE_REGISTRY


def test_registry() -> None:
    available = CARTRIDGE_REGISTRY.list_available()
    assert "chat" in available
    assert "cakeduel" in available
    assert "codenames" in available
    assert "chess" in available
    assert "manifold.web" in available
    assert "pictionary" in available

    defaults = CARTRIDGE_REGISTRY.get_default_cartridges()
    assert "chat" in defaults
    assert "manifold.web" in defaults


def test_chat() -> None:
    cartridge = ChatCartridge()
    first = cartridge.dispatch("player", {"type": "playerMessage", "text": "hello"})
    assert first.committed and first.result == {"messageId": "msg_1"}
    operation = "00000000-0000-4000-8000-000000000001"
    message = "00000000-0000-4000-8000-000000000002"
    cartridge.dispatch("agent", {"type": "operationStarted", "operationId": operation})
    cartridge.dispatch(
        "agent",
        {
            "type": "ingestBlock",
            "operationId": operation,
            "messageId": message,
            "blockId": 0,
            "blockType": "text",
            "content": "Hi!",
            "isSpeech": True,
            "emotion": "happy",
        },
    )
    # Audio mode holds speech until its start acknowledgement, as the public reducer does.
    assert all(line.get("content") != "Hi!" for line in cartridge.state["lines"])
    cartridge.dispatch("player", {"type": "audioStarted", "operationId": operation, "blockId": 0})
    assert cartridge.state["lines"][-1]["content"] == "Hi!"
    cartridge.dispatch("player", {"type": "audioDone", "operationId": operation, "blockId": 0})


def test_codenames() -> None:
    # 1. Test Chinese (zh-CN) localization
    cartridge_zh = CodenamesCartridge()
    cartridge_zh.dispatch("player", {"type": "startGame", "settings": {"tokens": 9, "seed": 10, "wordLocale": "zh-CN"}})
    game_zh = cartridge_zh.state["gameState"]
    assert len(game_zh["board"]) == len(game_zh["cells"]) == 25
    assert any("\u4e00" <= char <= "\u9fff" for char in game_zh["board"][0]["text"])
    cartridge_zh.dispatch("player", {"type": "submitClue", "clue": {"word": "诺莉", "count": 2}})
    assert cartridge_zh.state["gameState"]["history"][-1]["clue"]["word"] == "诺莉"
    action_zh = cartridge_zh.agent_next_command()
    assert action_zh and action_zh["type"] == "submitGuess"
    cartridge_zh.dispatch("agent", action_zh)

    # 2. Test English (en) localization
    cartridge_en = CodenamesCartridge()
    cartridge_en.dispatch("player", {"type": "startGame", "settings": {"tokens": 9, "seed": 10, "wordLocale": "en"}})
    game_en = cartridge_en.state["gameState"]
    assert len(game_en["board"]) == 25
    assert all(entry["text"].isupper() for entry in game_en["board"])
    cartridge_en.dispatch("player", {"type": "submitClue", "clue": {"word": "NORI", "count": 1}})
    assert cartridge_en.state["gameState"]["history"][-1]["clue"]["word"] == "NORI"


def test_cakeduel() -> None:
    cartridge = CakeDuelCartridge()
    cartridge.dispatch("player", {"type": "startGame", "mode": "normal", "difficulty": "soldier"})
    game = cartridge.state["game"]
    assert game["phase"] == "attack" and len(game["players"][0]["hand"]) == 4
    names = [game["cardList"][card_id] for card_id in game["players"][0]["hand"]]
    claim = next((name for name in names if name in {"soldier", "archer", "wizard"}), "soldier")
    hand_idx = names.index(claim) if claim in names else 0
    cartridge.dispatch("player", {"type": "play", "action": {"type": "claim", "handIndices": [hand_idx], "claim": claim}})
    assert cartridge.state["game"]["phase"] == "block"
    command = cartridge.agent_next_command()
    assert command is not None
    cartridge.dispatch("agent", command)


def test_chess() -> None:
    cartridge = ChessCartridge()
    cartridge.dispatch("player", {"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"})
    cartridge.dispatch("player", {"type": "move", "from": "e2", "to": "e4"})
    game = cartridge.state["gameState"]
    assert game["turn"] == "black" and game["moveHistory"][-1]["san"] == "e4"
    command = cartridge.agent_next_command()
    assert command is not None and command["type"] == "move"
    cartridge.dispatch("agent", command)
    assert cartridge.state["gameState"]["turn"] == "white"


def test_pictionary() -> None:
    # 1. Test Chinese (zh-CN) localization and synonym matching
    cartridge_zh = PictionaryCartridge()
    cartridge_zh.dispatch("player", {"type": "startSession", "atMs": 1_000, "settings": {"sessionDurationMs": 60_000, "locale": "zh-CN"}})
    game_zh = cartridge_zh.state["gameState"]
    round_zh = game_zh["round"]
    assert game_zh["phase"] == "PLAYING" and round_zh["roles"] == {"drawer": "player", "guesser": "agent"}
    assert isinstance(round_zh["pinyin"], list)
    assert len(round_zh["drawingId"]) > 0

    # Test Chinese guess matching
    correct_word = round_zh["word"]
    guess_res = cartridge_zh.dispatch("agent", {"type": "submitGuess", "atMs": 1_005, "text": correct_word})
    assert guess_res.result["correct"] is True
    assert cartridge_zh.state["gameState"]["round"]["status"] == "solved"

    # 2. Test English (en) localization
    cartridge_en = PictionaryCartridge()
    cartridge_en.dispatch("player", {"type": "startSession", "atMs": 1_000, "settings": {"sessionDurationMs": 60_000, "locale": "en"}})
    game_en = cartridge_en.state["gameState"]
    assert game_en["phase"] == "PLAYING"
    # Strokes are deliberately no-op runtime commands in the shipped reducer.
    committed = cartridge_en.dispatch(
        "player",
        {"type": "submitStrokeBatch", "atMs": 1_001, "batch": [{"points": [{"x": 0, "y": 0}, {"x": 1, "y": 1}]}]},
    )
    assert committed.committed is False
    cartridge_en.dispatch("player", {"type": "skipRound", "atMs": 1_002})
    assert cartridge_en.state["gameState"]["round"]["status"] == "skipped"


def test_manifold() -> None:
    cartridge = ManifoldWebCartridge()
    assert cartridge.state["facts"].get("system.repaired") is True
    assert cartridge.state["facts"].get("virus.cleared") is True
    assert cartridge.state["facts"].get("qfr.installed") is True

    # Test client.emitFact
    res = cartridge.dispatch("player", {"type": "client.emitFact", "factId": "custom.fact.test"})
    assert res.committed is True
    assert cartridge.state["facts"].get("custom.fact.test") is True

    # Test idle sync & complete (idle.sync is a query dispatch without state mutations)
    sync_res = cartridge.dispatch("player", {"type": "idle.sync"})
    assert isinstance(sync_res.result, dict) and "prestige" in sync_res.result


if __name__ == "__main__":
    test_registry()
    test_chat()
    test_codenames()
    test_cakeduel()
    test_chess()
    test_pictionary()
    test_manifold()
    print("[ok] chat, codenames, cakeduel, chess, pictionary, manifold.web, and registry verified")
