from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.services.ai_event_bridge import install_ai_event_bridge
from backend.services.ai_runtime_config import (
    clear_runtime_ai_config,
    get_runtime_ai_config,
    public_runtime_ai_summary,
    sanitize_runtime_ai_config,
)
from backend.services.event_dispatcher import EventDispatcher
from backend.services.llm_service import LLMService


class DummyWorld:
    world_id = "test-world"


async def main() -> None:
    secret = "super-secret-browser-key"
    raw = {
        "enabled": True,
        "provider": "openai-compatible",
        "baseUrl": "https://example.test/v1/",
        "model": "custom-model",
        "apiKey": secret,
        "systemPrompt": "Custom system prompt",
        "characterPrompt": "Keep Nori curious and concise.",
        "temperature": 9,
        "maxTokens": 999999,
    }

    sanitized = sanitize_runtime_ai_config(raw)
    assert sanitized["enabled"] is True
    assert sanitized["provider"] == "openai-compatible"
    assert sanitized["baseUrl"] == "https://example.test/v1"
    assert sanitized["temperature"] == 2.0
    assert sanitized["maxTokens"] == 4096

    # URLs containing inline credentials are rejected. Credentials belong only
    # in the dedicated secret field, which keeps them out of request URLs/logs.
    bad_url = sanitize_runtime_ai_config({
        **raw,
        "baseUrl": "https://user:password@example.test/v1",
    })
    assert bad_url["baseUrl"] == ""

    summary = public_runtime_ai_summary(sanitized)
    assert "apiKey" not in summary
    assert secret not in repr(summary)
    assert summary["hasApiKey"] is True

    # The existing generic Arcade event channel carries the configuration
    # without putting it in cartridge state or runtime_transition objects.
    install_ai_event_bridge()
    dispatcher = EventDispatcher(DummyWorld())
    response = await dispatcher.handle_event(
        {
            "type": "event",
            "channel": "nori.ai.config",
            "requestId": "settings-test",
            "payload": raw,
        }
    )
    assert response["channel"] == "nori.ai.config.result"
    assert response["requestId"] == "settings-test"
    assert "apiKey" not in response["payload"]
    assert secret not in repr(response)
    assert get_runtime_ai_config()["apiKey"] == secret

    # Prove that model, endpoint and both prompt fields actually reach the
    # provider call, while preserving NoriOS's emotion-rendering contract.
    captured: dict = {}
    original_openai = LLMService.__dict__["_openai_compatible_reply"]

    async def fake_openai(cls, **kwargs):
        captured.update(kwargs)
        return "[emotion:happy] configured reply"

    LLMService._openai_compatible_reply = classmethod(fake_openai)
    try:
        emotion, reply = await LLMService.generate_reply("hello", [])
    finally:
        LLMService._openai_compatible_reply = original_openai

    assert emotion == "happy"
    assert reply == "configured reply"
    assert captured["base_url"] == "https://example.test/v1"
    assert captured["model"] == "custom-model"
    assert captured["api_key"] == secret
    assert captured["temperature"] == 2.0
    assert captured["max_tokens"] == 4096
    assert "Custom system prompt" in captured["system_prompt"]
    assert "Keep Nori curious and concise." in captured["system_prompt"]
    assert "NoriOS rendering contract" in captured["system_prompt"]

    # Static integration checks: the compatibility extension executes before
    # the main module script. The Vite modulepreload link may appear earlier
    # and is intentionally ignored because it does not execute application JS.
    index_html = (ROOT / "public" / "index.html").read_text(encoding="utf-8")
    client_js = (ROOT / "public" / "nori-ai-settings.js").read_text(encoding="utf-8")
    ai_script = '<script src="/nori-ai-settings.js"></script>'
    app_script = '<script type="module" crossorigin src="/assets/index-CyHAbkO5.js"></script>'
    assert ai_script in index_html
    assert app_script in index_html
    assert index_html.index(ai_script) < index_html.index(app_script)
    assert "localStorage" in client_js
    assert "sessionStorage" in client_js
    assert 'channel: "nori.ai.config"' in client_js
    assert "rememberApiKey" in client_js
    assert "apiKey" in client_js

    clear_runtime_ai_config()
    assert get_runtime_ai_config() == {}
    print("[ok] browser AI settings are persistent, effective, and keep API keys out of public state")


if __name__ == "__main__":
    asyncio.run(main())
