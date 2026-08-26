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
    cartridge = CodenamesCartridge()
    cartridge.dispatch("player", {"type": "startGame", "settings": {"tokens": 9, "seed": 10}})
    game = cartridge.state["gameState"]
    assert len(game["board"]) == len(game["cells"]) == 25
    cartridge.dispatch("player", {"type": "submitClue", "clue": {"word": "NORI", "count": 1}})
    game = cartridge.state["gameState"]
    assert game["history"][-1]["clue"]["word"] == "NORI"
    action = cartridge.agent_next_command()
    assert action and action["type"] == "submitGuess"
    cartridge.dispatch("agent", action)


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
    cartridge = PictionaryCartridge()
    cartridge.dispatch("player", {"type": "startSession", "atMs": 1_000, "settings": {"sessionDurationMs": 60_000, "locale": "en"}})
    game = cartridge.state["gameState"]
    assert game["phase"] == "PLAYING" and game["round"]["roles"] == {"drawer": "player", "guesser": "agent"}
    # Strokes are deliberately no-op runtime commands in the shipped reducer.
    committed = cartridge.dispatch(
        "player",
        {"type": "submitStrokeBatch", "atMs": 1_001, "batch": [{"points": [{"x": 0, "y": 0}, {"x": 1, "y": 1}]}]},
    )
    assert committed.committed is False
    cartridge.dispatch("player", {"type": "skipRound", "atMs": 1_002})
    assert cartridge.state["gameState"]["round"]["status"] == "skipped"


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
