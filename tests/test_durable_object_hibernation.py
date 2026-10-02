from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKER = (ROOT / "worker.py").read_text(encoding="utf-8")
ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")


def main() -> None:
    assert "self.ctx.acceptWebSocket(server)" in WORKER
    assert "async def webSocketMessage" in WORKER
    assert "serializeAttachment" in WORKER
    assert "deserializeAttachment" in WORKER

    # The production Workers runtime exposes DurableObjectState.getWebSockets().
    # Keep a snake_case fallback for Python SDK/runtime variants, but the runtime
    # bridge must prefer the camelCase method that production actually provides.
    assert 'getattr(ctx, "getWebSockets", None)' in ENTRY
    assert 'getattr(ctx, "get_websockets", None)' in ENTRY
    assert ENTRY.index('getattr(ctx, "getWebSockets", None)') < ENTRY.index(
        'getattr(ctx, "get_websockets", None)'
    )
    assert "class NoriArcadeSession(_runtime.NoriArcadeSession)" in ENTRY
    assert "def _refresh_world_clients" in ENTRY

    # A legacy ASGI WebSocket receive loop pins the Durable Object in memory for
    # the full browser connection and defeats hibernation.
    assert "asgi.websocket(" not in WORKER

    # Tickets contain a random nonce, so ticket-based object names create a new
    # Durable Object on reconnect. User-based naming lets main/media/reconnect
    # sockets share one state owner.
    assert "getByName(_durable_object_name(user_id))" in WORKER
    assert "getByName(_durable_object_name(ticket))" not in WORKER

    # Browser API keys are single-dispatch secrets. They may not be serialized
    # into hibernation attachments or copied into durable public AI config.
    assert 'if key != "apiKey"' in WORKER
    assert '_DO_AI_CONFIG_KEY = "nori:ai-public:v1"' in WORKER
    assert 'updated["apiKey"]' not in WORKER
    assert 'attachment.get("apiKey")' not in WORKER
    assert 'message.pop("noriAiConfig", None)' in WORKER
    assert 'install_runtime_ai_config(sanitized)' in WORKER

    # TTS credentials follow the same single-dispatch rule and legacy
    # serialized keys are only removed, never restored into runtime config.
    assert 'updated["ttsApiKey"]' not in ENTRY
    assert 'attachment.get("ttsApiKey")' not in ENTRY
    assert 'message.pop("noriTtsConfig", None)' in ENTRY
    assert '_install_runtime_tts_config(sanitized)' in ENTRY
    assert 'updated.pop("ttsApiKey", None)' in ENTRY
    assert '_DO_TTS_CONFIG_KEY' not in ENTRY
    assert '_persist_public_tts_config' not in ENTRY

    print("[ok] Arcade Durable Object uses runtime-compatible hibernating WebSockets")


if __name__ == "__main__":
    main()
