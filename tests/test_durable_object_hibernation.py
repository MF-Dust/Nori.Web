from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKER = (ROOT / "worker.py").read_text(encoding="utf-8")


def main() -> None:
    assert "self.ctx.acceptWebSocket(server)" in WORKER
    assert "async def webSocketMessage" in WORKER
    assert "self.ctx.get_websockets()" in WORKER
    assert "serializeAttachment" in WORKER
    assert "deserializeAttachment" in WORKER

    # A legacy ASGI WebSocket receive loop pins the Durable Object in memory for
    # the full browser connection and defeats hibernation.
    assert "asgi.websocket(" not in WORKER

    # Tickets contain a random nonce, so ticket-based object names create a new
    # Durable Object on reconnect. User-based naming lets main/media/reconnect
    # sockets share one state owner.
    assert "getByName(_durable_object_name(user_id))" in WORKER
    assert "getByName(_durable_object_name(ticket))" not in WORKER

    # API keys may survive hibernation only as per-connection attachment data;
    # they must not be copied into the durable public AI config object.
    assert 'if key != "apiKey"' in WORKER
    assert '_DO_AI_CONFIG_KEY = "nori:ai-public:v1"' in WORKER

    print("[ok] Arcade Durable Object uses hibernatable user-scoped WebSockets")


if __name__ == "__main__":
    main()
