from __future__ import annotations

import asyncio
import base64
import gzip
import json
import sys
from pathlib import Path
from unittest.mock import patch

import httpx

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.api.arcade import _install_dispatch_tts_config
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
    MAX_AUDIO_BYTES,
    MAX_ERROR_BYTES,
    MAX_JSON_BYTES,
    TTSService,
    TTSServiceError,
    pcm16_to_wav,
    provider_endpoint,
    redact_provider_detail,
)


class DummyWorld:
    world_id = "test-world"


class TrackedStream(httpx.AsyncByteStream):
    def __init__(self, chunks):
        self.chunks = chunks
        self.read_count = 0
        self.closed = False

    async def __aiter__(self):
        for chunk in self.chunks:
            self.read_count += 1
            yield chunk

    async def aclose(self):
        self.closed = True


async def test_bounded_streaming() -> None:
    async_client = httpx.AsyncClient

    async def run(provider, replies, *, fails=False):
        requests = []

        def handler(request):
            requests.append(request)
            status, headers, stream = replies[len(requests) - 1]
            assert "content-length" not in headers
            return httpx.Response(status, headers=headers, stream=stream)

        transport = httpx.MockTransport(handler)
        with patch("backend.services.tts_service.httpx.AsyncClient",
                   side_effect=lambda **kwargs: async_client(transport=transport, **kwargs)):
            try:
                result = await TTSService().synthesize("hello", {
                    "enabled": True, "provider": provider,
                    "baseUrl": "http://127.0.0.1:9880", "apiKey": "test-secret",
                    "voice": "test-voice", "refAudio": "local.wav",
                })
            except TTSServiceError as exc:
                assert fails, str(exc)
                assert exc.provider == provider
                assert "test-secret" not in str(exc)
                result = exc
            else:
                assert not fails
        assert all(stream.closed for _, _, stream in replies)
        return result, requests

    def reply(data, *, status=200, mime="audio/mpeg", compressed=False):
        headers = {"content-type": mime}
        if compressed:
            data = gzip.compress(data)
            headers["content-encoding"] = "gzip"
        return status, headers, TrackedStream([data[:7], data[7:]])

    # Every provider uses real streamed transport, including gzip decoding.
    for provider in ("openai-compatible", "custom", "gpt-sovits", "minimax", "gemini"):
        audio = b"ID3-test"
        mime = "audio/mpeg"
        data = audio
        if provider == "minimax":
            data = json.dumps({"data": {"audio": audio.hex()},
                               "base_resp": {"status_code": 0}}).encode()
            mime = "application/json"
        elif provider == "gemini":
            data = json.dumps({"candidates": [{"content": {"parts": [{"inlineData": {
                "mimeType": "audio/wav", "data": base64.b64encode(audio).decode(),
            }}]}}]}).encode()
            mime = "application/json"
        result, requests = await run(provider, [reply(data, mime=mime, compressed=True)])
        assert result.data == audio
        assert len(requests) == 1 and requests[0].method == "POST"
        payload = json.loads(requests[0].content)
        if provider == "gemini":
            assert requests[0].headers["x-goog-api-key"] == "test-secret"
            assert payload["generationConfig"]["responseModalities"] == ["AUDIO"]
        else:
            assert requests[0].headers["authorization"] == "Bearer test-secret"
        if provider == "openai-compatible":
            assert requests[0].url.path == "/audio/speech" and payload["input"] == "hello"
        elif provider == "custom":
            assert payload["text"] == "hello" and payload["voice"] == "test-voice"
        elif provider == "minimax":
            assert payload["output_format"] == "hex" and payload["stream"] is False

    # No Content-Length: stop on the chunk crossing the decoded-byte limit.
    for provider in ("openai-compatible", "custom", "gpt-sovits", "minimax", "gemini"):
        limit = MAX_JSON_BYTES if provider in {"minimax", "gemini"} else MAX_AUDIO_BYTES
        for compressed in (False, True):
            chunks = [b"x" * limit, b"x", b"must not be read"]
            headers = {}
            if compressed:
                # One compressed member expands past the limit; the tail stays unread.
                chunks = [gzip.compress(b"x" * (limit + 1)), b"must not be read"]
                headers["content-encoding"] = "gzip"
            stream = TrackedStream(chunks)
            result, requests = await run(provider, [(200, headers, stream)], fails=True)
            assert "过大" in str(result)
            assert stream.read_count == (1 if compressed else 2)
            assert len(requests) == 1  # Oversized GPT audio must not trigger GET.

    # JSON envelopes can exceed the audio cap, but decoded audio cannot.
    for provider in ("minimax", "gemini"):
        for size in (MAX_AUDIO_BYTES, MAX_AUDIO_BYTES + 1):
            audio = b"x" * size
            if provider == "minimax":
                body = {"data": {"audio": audio.hex()}}
            else:
                body = {"candidates": [{"content": {"parts": [{"inlineData": {
                    "mimeType": "audio/wav", "data": base64.b64encode(audio).decode(),
                }}]}}]}
            encoded = json.dumps(body).encode()
            assert MAX_AUDIO_BYTES < len(encoded) <= MAX_JSON_BYTES
            result, _ = await run(provider, [reply(encoded, mime="application/json")],
                                  fails=size > MAX_AUDIO_BYTES)
            if size == MAX_AUDIO_BYTES:
                assert result.data == audio

    result, _ = await run("custom", [reply(b"x" * MAX_AUDIO_BYTES)])
    assert len(result.data) == MAX_AUDIO_BYTES

    # Errors are truncated, redacted and closed, not fully buffered.
    for compressed in (False, True):
        error = b"test-secret " + b"e" * MAX_ERROR_BYTES
        headers = {"content-encoding": "gzip"} if compressed else {}
        stream = TrackedStream([gzip.compress(error) if compressed else error, b"unread"])
        result, _ = await run("custom", [(400, headers, stream)], fails=True)
        assert "HTTP 400" in str(result) and stream.read_count == 1

    # Both an empty success and a bounded failed POST retain GPT's GET fallback.
    for status in (200, 405):
        stream = TrackedStream([] if status == 200 else [b"e" * (MAX_ERROR_BYTES + 1), b"unread"])
        result, requests = await run("gpt-sovits", [
            (status, {}, stream), reply(b"RIFF-audio", mime="audio/wav"),
        ])
        assert result.data == b"RIFF-audio"
        assert [request.method for request in requests] == ["POST", "GET"]
        assert requests[1].url.params["ref_audio_path"] == "local.wav"
        assert requests[1].url.params["text"] == "hello"
        assert stream.read_count == (0 if status == 200 else 1)

    get_stream = TrackedStream([b"x" * (MAX_AUDIO_BYTES + 1), b"unread"])
    await run("gpt-sovits", [(405, {}, TrackedStream([])), (200, {}, get_stream)], fails=True)
    assert get_stream.read_count == 1


async def main() -> None:
    await test_bounded_streaming()
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

    dispatch = {
        "type": "dispatch",
        "cartridgeId": "chat",
        "actor": "player",
        "requestId": "tts-secret-test",
        "expectedHeadVersion": 0,
        "cmd": {"type": "playerMessage", "text": "hello"},
        "noriTtsConfig": raw,
    }
    _install_dispatch_tts_config(dispatch)
    assert "noriTtsConfig" not in dispatch
    assert get_runtime_tts_config()["apiKey"] == secret
    clear_runtime_tts_config()
    assert get_runtime_tts_config() == {}

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
        "message.noriTtsConfig = runtimePayload()",
        'channel: "nori.tts.test"',
        "localStorage",
        "sessionStorage",
    ):
        assert marker in client_js

    assert 'channel: "nori.tts.config"' not in client_js
    assert "protectCredentialTargets" in client_js
    assert "const guarded = protectCredentialTargets(before)" in client_js

    clear_runtime_tts_config()
    assert get_runtime_tts_config() == {}
    print("[ok] browser TTS settings cover provider protocols, redaction, testing, and playback bridge")


if __name__ == "__main__":
    asyncio.run(main())
