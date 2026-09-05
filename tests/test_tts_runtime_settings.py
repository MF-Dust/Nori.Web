from __future__ import annotations

import asyncio
import base64
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.services.ai_event_bridge import install_ai_event_bridge
from backend.services.event_dispatcher import EventDispatcher
from backend.services.tts_runtime_config import (
    clear_runtime_tts_config,
    get_runtime_tts_config,
    public_runtime_tts_summary,
    sanitize_runtime_tts_config,
)
from backend.services.tts_service import (
    EncodedSpeech,
    TTSService,
    pcm16_to_wav,
    provider_endpoint,
    redact_provider_detail,
)


class DummyWorld:
    world_id = "test-world"


async def main() -> None:
    secret = "tts-super-secret"
    raw = {
        "enabled": True,
        "provider": "minimax",
        "baseUrl": "https://api.minimaxi.com/v1/",
        "apiKey": secret,
        "model": "speech-2.8-turbo",
        "voice": "male-qn-qingse",
        "speed": 9,
    }
    sanitized = sanitize_runtime_tts_config(raw)
    assert sanitized["enabled"] is True
    assert sanitized["provider"] == "minimax"
    assert sanitized["baseUrl"] == "https://api.minimaxi.com/v1"
    assert sanitized["speed"] == 4.0
    assert sanitized["apiKey"] == secret

    bad_url = sanitize_runtime_tts_config({
        **raw,
        "baseUrl": "https://user:password@example.test/v1",
    })
    assert bad_url["baseUrl"] == ""

    summary = public_runtime_tts_summary(sanitized)
    assert summary["hasApiKey"] is True
    assert "apiKey" not in summary
    assert secret not in repr(summary)

    assert provider_endpoint("https://api.openai.com/v1", "/audio/speech") == "https://api.openai.com/v1/audio/speech"
    assert provider_endpoint("https://api.openai.com/v1/audio/speech/", "/audio/speech") == "https://api.openai.com/v1/audio/speech"
    assert provider_endpoint("https://api.minimaxi.com/v1/t2a_v2", "/t2a_v2") == "https://api.minimaxi.com/v1/t2a_v2"

    reflected = redact_provider_detail(
        f'{{"error":"Authorization: Bearer {secret}","key":"{secret}"}}',
        secret,
    )
    assert secret not in reflected
    assert "Bearer ***" in reflected

    wav = pcm16_to_wav(b"\x00\x00\x01\x00", sample_rate=24000)
    assert wav[:4] == b"RIFF"
    assert wav[8:12] == b"WAVE"

    # Provider protocol parsing is tested without sending third-party traffic.
    service = TTSService()
    original_post = service._post_json

    async def fake_minimax_post(**kwargs):
        assert kwargs["url"] == "https://api.minimaxi.com/v1/t2a_v2"
        assert kwargs["payload"]["voice_setting"]["voice_id"] == "male-qn-qingse"
        assert kwargs["api_key"] == secret
        return httpx.Response(
            200,
            json={
                "data": {"audio": "494433"},
                "base_resp": {"status_code": 0, "status_msg": "success"},
                "trace_id": "trace-test",
            },
        )

    service._post_json = fake_minimax_post
    minimax = await service.synthesize("你好", sanitized)
    assert minimax.provider == "minimax"
    assert minimax.mime == "audio/mpeg"
    assert minimax.data == b"ID3"

    gemini_config = sanitize_runtime_tts_config({
        "enabled": True,
        "provider": "gemini",
        "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
        "apiKey": secret,
        "model": "gemini-3.1-flash-tts-preview",
        "voice": "Kore",
    })

    async def fake_gemini_post(**kwargs):
        assert kwargs["url"].endswith("/models/gemini-3.1-flash-tts-preview:generateContent")
        assert kwargs["key_header"] == "x-goog-api-key"
        assert kwargs["payload"]["generationConfig"]["responseModalities"] == ["AUDIO"]
        pcm = b"\x00\x00\x01\x00\x02\x00"
        return httpx.Response(
            200,
            json={
                "candidates": [{
                    "content": {
                        "parts": [{
                            "inlineData": {
                                "mimeType": "audio/L16;codec=pcm;rate=24000",
                                "data": base64.b64encode(pcm).decode("ascii"),
                            }
                        }]
                    }
                }]
            },
        )

    service._post_json = fake_gemini_post
    gemini = await service.synthesize("Hello", gemini_config)
    assert gemini.provider == "gemini"
    assert gemini.mime == "audio/wav"
    assert gemini.data[:4] == b"RIFF"
    service._post_json = original_post

    # Event configuration and test replies must keep browser credentials out of
    # public state while returning playable audio data.
    install_ai_event_bridge()
    dispatcher = EventDispatcher(DummyWorld())
    config_response = await dispatcher.handle_event({
        "type": "event",
        "channel": "nori.tts.config",
        "requestId": "tts-config-test",
        "payload": raw,
    })
    assert config_response["channel"] == "nori.tts.config.result"
    assert config_response["payload"]["hasApiKey"] is True
    assert secret not in repr(config_response)
    assert get_runtime_tts_config()["apiKey"] == secret

    from backend.services import ai_event_bridge

    original_synthesize = ai_event_bridge.TTS_SERVICE.synthesize

    async def fake_synthesize(text, config=None):
        assert "Nori" in text
        assert config["apiKey"] == secret
        return EncodedSpeech(b"test-audio", "audio/mpeg", "minimax")

    ai_event_bridge.TTS_SERVICE.synthesize = fake_synthesize
    try:
        test_response = await dispatcher.handle_event({
            "type": "event",
            "channel": "nori.tts.test",
            "requestId": "tts-test",
            "payload": {"config": raw, "text": "你好，我是 Nori。"},
        })
    finally:
        ai_event_bridge.TTS_SERVICE.synthesize = original_synthesize

    assert test_response["channel"] == "nori.tts.audio"
    assert test_response["payload"]["mime"] == "audio/mpeg"
    assert base64.b64decode(test_response["payload"]["audio"]) == b"test-audio"
    assert secret not in repr(test_response)

    index_html = (ROOT / "public" / "index.html").read_text(encoding="utf-8")
    client_js = (ROOT / "public" / "nori-tts-settings.js").read_text(encoding="utf-8")
    tts_script = '<script src="/nori-tts-settings.js"></script>'
    app_script = '<script type="module" crossorigin src="/assets/index-CyHAbkO5.js"></script>'
    assert tts_script in index_html
    assert index_html.index(tts_script) < index_html.index(app_script)
    for marker in (
        "OpenAI Compatible",
        "Custom HTTP",
        "GPT-SoVITS",
        "MiniMax",
        "Gemini TTS",
        'channel: "nori.tts.config"',
        'channel: "nori.tts.test"',
        "localStorage",
        "sessionStorage",
    ):
        assert marker in client_js

    clear_runtime_tts_config()
    assert get_runtime_tts_config() == {}
    print("[ok] browser TTS settings cover provider protocols, redaction, testing, and playback bridge")


if __name__ == "__main__":
    asyncio.run(main())
