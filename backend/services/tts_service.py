"""Browser-configurable TTS providers for Nori chat and Settings tests."""

from __future__ import annotations

import base64
import io
import re
import wave
from dataclasses import dataclass
from typing import Any, Dict
from urllib.parse import urlencode

import httpx

from .tts_runtime_config import get_runtime_tts_config

MAX_AUDIO_BYTES = 8 * 1024 * 1024


class TTSServiceError(RuntimeError):
    """A provider failure safe to surface without including credentials."""

    def __init__(self, provider: str, message: str) -> None:
        super().__init__(message)
        self.provider = provider


@dataclass(frozen=True)
class EncodedSpeech:
    data: bytes
    mime: str
    provider: str

    def as_event_payload(self) -> Dict[str, Any]:
        return {
            "audio": base64.b64encode(self.data).decode("ascii"),
            "mime": self.mime,
            "provider": self.provider,
        }


def provider_endpoint(base_url: str, suffix: str) -> str:
    """Append a provider path once while accepting a full endpoint from users."""
    base = str(base_url or "").strip().rstrip("/")
    normalized_suffix = "/" + str(suffix or "").strip().lstrip("/")
    if base.lower().endswith(normalized_suffix.lower()):
        return base
    return base + normalized_suffix


def _response_mime(response: httpx.Response, fallback: str) -> str:
    value = str(response.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
    if value.startswith("audio/") or value == "application/octet-stream":
        return value
    return fallback


def _bounded_audio(data: bytes, provider: str) -> bytes:
    if not data:
        raise TTSServiceError(provider, "语音服务返回了空音频")
    if len(data) > MAX_AUDIO_BYTES:
        raise TTSServiceError(provider, "语音服务返回的音频过大")
    return data


def pcm16_to_wav(pcm: bytes, *, sample_rate: int = 24_000) -> bytes:
    """Wrap mono signed PCM16 returned by Gemini in a browser-playable WAV."""
    if len(pcm) % 2:
        pcm = pcm[:-1]
    output = io.BytesIO()
    with wave.open(output, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm)
    return output.getvalue()


class TTSService:
    def __init__(self, *, timeout: float = 45.0) -> None:
        self.timeout = timeout

    async def synthesize(self, text: str, config: Dict[str, Any] | None = None) -> EncodedSpeech:
        cfg = dict(config) if isinstance(config, dict) else get_runtime_tts_config()
        if cfg.get("enabled") is not True:
            raise TTSServiceError("disabled", "浏览器 TTS 未启用")
        clean_text = str(text or "").strip()
        if not clean_text:
            raise TTSServiceError(str(cfg.get("provider") or "tts"), "没有可合成的文本")
        if len(clean_text) > 4000:
            clean_text = clean_text[:4000]

        provider = str(cfg.get("provider") or "openai-compatible")
        try:
            if provider == "custom":
                return await self._custom(clean_text, cfg)
            if provider == "gpt-sovits":
                return await self._gpt_sovits(clean_text, cfg)
            if provider == "minimax":
                return await self._minimax(clean_text, cfg)
            if provider == "gemini":
                return await self._gemini(clean_text, cfg)
            return await self._openai(clean_text, cfg)
        except TTSServiceError:
            raise
        except httpx.TimeoutException as exc:
            raise TTSServiceError(provider, "语音服务请求超时") from exc
        except httpx.HTTPError as exc:
            raise TTSServiceError(provider, f"语音服务网络请求失败: {type(exc).__name__}") from exc
        except Exception as exc:
            raise TTSServiceError(provider, f"语音服务响应无法解析: {type(exc).__name__}") from exc

    async def _post_json(
        self,
        *,
        provider: str,
        url: str,
        payload: Dict[str, Any],
        api_key: str = "",
        key_header: str = "Authorization",
    ) -> httpx.Response:
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers[key_header] = f"Bearer {api_key}" if key_header.lower() == "authorization" else api_key
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=False) as client:
            response = await client.post(url, headers=headers, json=payload)
        if response.is_success:
            return response
        detail = response.text[:300].replace("\n", " ").strip()
        raise TTSServiceError(
            provider,
            f"语音服务请求失败: HTTP {response.status_code}" + (f" {detail}" if detail else ""),
        )

    async def _openai(self, text: str, cfg: Dict[str, Any]) -> EncodedSpeech:
        provider = "openai-compatible"
        base = str(cfg.get("baseUrl") or "https://api.openai.com/v1")
        url = provider_endpoint(base, "/audio/speech")
        payload = {
            "model": str(cfg.get("model") or "gpt-4o-mini-tts"),
            "input": text,
            "voice": str(cfg.get("voice") or "nova"),
            "speed": float(cfg.get("speed") or 1.0),
        }
        response = await self._post_json(
            provider=provider,
            url=url,
            payload=payload,
            api_key=str(cfg.get("apiKey") or ""),
        )
        data = _bounded_audio(response.content, provider)
        return EncodedSpeech(data, _response_mime(response, "audio/mpeg"), provider)

    async def _custom(self, text: str, cfg: Dict[str, Any]) -> EncodedSpeech:
        provider = "custom"
        url = str(cfg.get("baseUrl") or "").strip()
        if not url:
            raise TTSServiceError(provider, "未配置自定义 TTS 请求端点")
        response = await self._post_json(
            provider=provider,
            url=url,
            payload={
                "text": text,
                "voice": str(cfg.get("voice") or ""),
                "speed": float(cfg.get("speed") or 1.0),
            },
            api_key=str(cfg.get("apiKey") or ""),
        )
        data = _bounded_audio(response.content, provider)
        return EncodedSpeech(data, _response_mime(response, "audio/mpeg"), provider)

    async def _gpt_sovits(self, text: str, cfg: Dict[str, Any]) -> EncodedSpeech:
        provider = "gpt-sovits"
        base = str(cfg.get("baseUrl") or "http://127.0.0.1:9880")
        url = provider_endpoint(base, "/tts")
        payload = {
            "text": text,
            "text_lang": str(cfg.get("textLang") or "zh"),
            "ref_audio_path": str(cfg.get("refAudio") or ""),
            "prompt_text": str(cfg.get("promptText") or ""),
            "prompt_lang": str(cfg.get("promptLang") or "zh"),
            "speed_factor": float(cfg.get("speed") or 1.0),
        }
        headers = {"Content-Type": "application/json"}
        api_key = str(cfg.get("apiKey") or "")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=False) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.is_success and response.content:
                data = _bounded_audio(response.content, provider)
                return EncodedSpeech(data, _response_mime(response, "audio/wav"), provider)

            query = urlencode(
                {
                    "text": text,
                    "text_lang": payload["text_lang"],
                    "ref_audio_path": payload["ref_audio_path"],
                    "prompt_text": payload["prompt_text"],
                    "prompt_lang": payload["prompt_lang"],
                    "speed_factor": payload["speed_factor"],
                }
            )
            response = await client.get(f"{url}?{query}", headers=headers)

        if not response.is_success:
            raise TTSServiceError(provider, f"GPT-SoVITS 合成失败: HTTP {response.status_code}")
        data = _bounded_audio(response.content, provider)
        return EncodedSpeech(data, _response_mime(response, "audio/wav"), provider)

    async def _minimax(self, text: str, cfg: Dict[str, Any]) -> EncodedSpeech:
        provider = "minimax"
        base = str(cfg.get("baseUrl") or "https://api.minimaxi.com/v1")
        url = provider_endpoint(base, "/t2a_v2")
        response = await self._post_json(
            provider=provider,
            url=url,
            api_key=str(cfg.get("apiKey") or ""),
            payload={
                "model": str(cfg.get("model") or "speech-2.8-turbo"),
                "text": text,
                "stream": False,
                "voice_setting": {
                    "voice_id": str(cfg.get("voice") or "male-qn-qingse"),
                    "speed": float(cfg.get("speed") or 1.0),
                },
                "audio_setting": {
                    "sample_rate": 32000,
                    "format": "mp3",
                    "channel": 1,
                },
                "output_format": "hex",
            },
        )
        body = response.json()
        base_resp = body.get("base_resp") if isinstance(body, dict) else None
        status_code = base_resp.get("status_code") if isinstance(base_resp, dict) else 0
        if status_code not in {0, None}:
            status_msg = str(base_resp.get("status_msg") or "MiniMax TTS 请求失败")
            trace_id = str(body.get("trace_id") or "") if isinstance(body, dict) else ""
            suffix = f" trace_id={trace_id}" if trace_id else ""
            raise TTSServiceError(provider, f"MiniMax TTS {status_code}: {status_msg}{suffix}")
        data_node = body.get("data") if isinstance(body, dict) else None
        audio_hex = data_node.get("audio") if isinstance(data_node, dict) else None
        if not isinstance(audio_hex, str) or not audio_hex:
            raise TTSServiceError(provider, "MiniMax TTS 响应缺少 data.audio")
        try:
            audio = bytes.fromhex(audio_hex)
        except ValueError as exc:
            raise TTSServiceError(provider, "MiniMax TTS 返回了无效的 hex 音频") from exc
        return EncodedSpeech(_bounded_audio(audio, provider), "audio/mpeg", provider)

    async def _gemini(self, text: str, cfg: Dict[str, Any]) -> EncodedSpeech:
        provider = "gemini"
        base = str(cfg.get("baseUrl") or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        model = str(cfg.get("model") or "gemini-3.1-flash-tts-preview")
        if base.lower().endswith(":generatecontent"):
            url = base
        else:
            url = f"{base}/models/{model}:generateContent"
        response = await self._post_json(
            provider=provider,
            url=url,
            api_key=str(cfg.get("apiKey") or ""),
            key_header="x-goog-api-key",
            payload={
                "contents": [{"parts": [{"text": text}]}],
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {
                                "voiceName": str(cfg.get("voice") or "Kore")
                            }
                        }
                    },
                },
            },
        )
        body = response.json()
        try:
            part = body["candidates"][0]["content"]["parts"][0]
        except (KeyError, IndexError, TypeError) as exc:
            raise TTSServiceError(provider, "Gemini TTS 响应缺少音频内容") from exc
        inline = part.get("inlineData") or part.get("inline_data") if isinstance(part, dict) else None
        if not isinstance(inline, dict) or not isinstance(inline.get("data"), str):
            raise TTSServiceError(provider, "Gemini TTS 响应缺少 inlineData.data")
        try:
            audio = base64.b64decode(inline["data"], validate=True)
        except Exception as exc:
            raise TTSServiceError(provider, "Gemini TTS 返回了无效的 base64 音频") from exc
        mime = str(inline.get("mimeType") or inline.get("mime_type") or "audio/L16;rate=24000")
        if "wav" in mime.lower():
            return EncodedSpeech(_bounded_audio(audio, provider), "audio/wav", provider)
        rate_match = re.search(r"rate=(\d+)", mime, re.IGNORECASE)
        sample_rate = int(rate_match.group(1)) if rate_match else 24_000
        wav = pcm16_to_wav(audio, sample_rate=sample_rate)
        return EncodedSpeech(_bounded_audio(wav, provider), "audio/wav", provider)


TTS_SERVICE = TTSService()
