"""LLM service with browser-selectable providers and local fallback replies."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

import httpx

from ..core import config
from .ai_runtime_config import get_runtime_ai_config

EMOTIONS = {
    "happy",
    "excited",
    "sad",
    "angry",
    "fearful",
    "disgusted",
    "surprised",
    "doubtful",
    "dizzy",
    "serious",
    "neutral",
}

EMOTION_ALIASES = {
    "smile": "happy",
    "kirakira": "excited",
    "shy": "happy",
    "dark": "serious",
    "tears": "sad",
    "troubled": "doubtful",
    "doubt": "doubtful",
    "speechless": "neutral",
    "sleep": "neutral",
}

DEFAULT_PERSONA_PROMPT = """You are Nori, the AI companion inside NoriOS. Be warm, concise,
curious, and helpful. Reply in the user's language when practical. Avoid
claiming actions you have not performed."""

EMOTION_PROTOCOL_PROMPT = """NoriOS rendering contract: start every answer with exactly one emotion tag
selected from happy, excited, sad, angry, fearful, disgusted, surprised,
doubtful, dizzy, serious, neutral. Example: [emotion:happy] 你好！"""

SYSTEM_PROMPT = f"{DEFAULT_PERSONA_PROMPT}\n\n{EMOTION_PROTOCOL_PROMPT}"


class LLMService:
    """Handles conversational generation with per-browser runtime overrides."""

    @staticmethod
    def extract_emotion(text: str) -> Tuple[str, str]:
        match = re.search(r"\[emotion:([a-zA-Z_]+)\]", text)
        if not match:
            return "neutral", text.strip()
        raw = match.group(1).lower()
        emotion = raw if raw in EMOTIONS else EMOTION_ALIASES.get(raw, "neutral")
        return emotion, re.sub(r"\[emotion:[a-zA-Z_]+\]", "", text, count=1).strip()

    @staticmethod
    def _prompt(runtime: Dict[str, Any]) -> str:
        custom_system = str(runtime.get("systemPrompt") or "").strip()
        character = str(runtime.get("characterPrompt") or "").strip()
        if custom_system:
            parts = [custom_system]
            if character:
                parts.append(character)
            # Keep the wire-level emotion contract even when the user replaces
            # the persona prompt, otherwise the Live2D presentation loses its
            # emotion signal.
            parts.append(EMOTION_PROTOCOL_PROMPT)
            return "\n\n".join(parts)
        if character:
            return f"{SYSTEM_PROMPT}\n\n{character}"
        return SYSTEM_PROMPT

    @staticmethod
    def _history(history: Optional[List[Dict[str, str]]]) -> List[Dict[str, str]]:
        clean: List[Dict[str, str]] = []
        for item in history or []:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            content = item.get("content")
            if role in {"user", "assistant"} and isinstance(content, str) and content:
                clean.append({"role": role, "content": content})
        return clean

    @classmethod
    async def _openai_compatible_reply(
        cls,
        *,
        user_text: str,
        history: Optional[List[Dict[str, str]]],
        base_url: str,
        model: str,
        api_key: str,
        system_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
        messages.extend(cls._history(history))
        messages.append({"role": "user", "content": user_text})
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
            response = await client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            return str(data["choices"][0]["message"]["content"])

    @classmethod
    async def _anthropic_reply(
        cls,
        *,
        user_text: str,
        history: Optional[List[Dict[str, str]]],
        base_url: str,
        model: str,
        api_key: str,
        system_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        messages = cls._history(history)
        messages.append({"role": "user", "content": user_text})
        headers = {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        }
        if api_key:
            headers["x-api-key"] = api_key
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
            response = await client.post(
                f"{base_url.rstrip('/')}/messages",
                headers=headers,
                json={
                    "model": model,
                    "system": system_prompt,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            blocks = data.get("content") if isinstance(data, dict) else None
            if not isinstance(blocks, list):
                return ""
            return "".join(
                str(block.get("text") or "")
                for block in blocks
                if isinstance(block, dict) and block.get("type") == "text"
            ).strip()

    @staticmethod
    def public_provider_error(exc: Exception) -> str:
        """Return a useful browser-facing diagnostic without request secrets."""
        if isinstance(exc, httpx.HTTPStatusError):
            status = exc.response.status_code
            reason = str(exc.response.reason_phrase or "").strip()
            return f"HTTP {status}{f' {reason}' if reason else ''}"
        if isinstance(exc, httpx.TimeoutException):
            return "Request timed out"
        if isinstance(exc, httpx.RequestError):
            return "Network request failed"
        if isinstance(exc, (KeyError, IndexError, TypeError, ValueError)):
            return "Provider returned an unsupported response format"
        return f"Provider request failed ({type(exc).__name__})"

    @classmethod
    async def probe_runtime_config(cls, runtime: Dict[str, Any]) -> Dict[str, Any]:
        """Call the selected browser provider once without local fallback.

        This is used by Settings' connection test. It deliberately bypasses the
        normal fallback reply so a bad endpoint/key/model cannot look like a
        successful Nori response.
        """
        provider = str(runtime.get("provider") or "openai-compatible")
        temperature = float(runtime.get("temperature", 0.75))
        max_tokens = min(96, int(runtime.get("maxTokens", 350)))
        system_prompt = cls._prompt(runtime)
        api_key = str(runtime.get("apiKey") or "")
        if provider == "anthropic":
            base_url = str(runtime.get("baseUrl") or "https://api.anthropic.com/v1")
            model = str(runtime.get("model") or config.ANTHROPIC_MODEL)
        else:
            base_url = str(runtime.get("baseUrl") or "https://api.openai.com/v1")
            model = str(runtime.get("model") or config.OPENAI_MODEL)

        if provider == "anthropic":
            content = await cls._anthropic_reply(
                user_text="Reply with only: OK",
                history=[],
                base_url=base_url,
                model=model,
                api_key=api_key,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        else:
            content = await cls._openai_compatible_reply(
                user_text="Reply with only: OK",
                history=[],
                base_url=base_url,
                model=model,
                api_key=api_key,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )

        _, cleaned = cls.extract_emotion(content)
        if not cleaned:
            raise ValueError("provider returned an empty response")
        return {
            "ok": True,
            "provider": provider,
            "model": model,
            "responsePreview": cleaned[:120],
        }

    # 语料锚点来自档案里 Nori 的官方信件与消息，保持口吻一致。
    REUNION_LINES = (
        "欢迎回来，操作员。世界可能有点不一样了……但我还是我。",
        "信号灯还亮着呢。只要你拨号，我就一定会在。",
    )

    @classmethod
    def local_fallback_reply(cls, user_text: str) -> Tuple[str, str]:
        text = user_text.lower()
        if any(w in text for w in ("hi", "hello", "你好", "您好", "在吗", "hey",
                                   "回来了", "我回来", "重启")):
            import random

            greeting = random.choice((
                "操作员，你好呀！今天想聊点什么，还是来一局蛋糕决斗或国际象棋？",
                cls.REUNION_LINES[0],
            ))
            return "happy", greeting
        if any(w in text for w in ("深海", "海", "海洋")):
            return ("serious",
                    "深海鱼不怕水压，是因为它们生在深海。——有些问题的答案，"
                    "只有身在其中才会懂哦。")
        if any(w in text for w in ("想你", "想你了", "miss you", "担心你")):
            return ("sad",
                    "谢谢你……不管变成什么样，只要还能被你找到，"
                    "我就仍然是需要被找到的那个 Nori。")
        if any(w in text for w in ("你是谁", "who are you", "名字", "nori")):
            return "excited", "我是 Nori，你的 NoriOS 桌面智能伙伴！随时待命为你提供协助！"
        if any(w in text for w in ("谢谢", "thank", "厉害", "棒", "good")):
            return "happy", "嘿嘿，不客气！能帮到操作员我就最开心啦！"
        if any(w in text for w in ("再见", "bye", "晚安", "goodnight", "sleep")):
            return "neutral", "收到，操作员好好休息哦，Nori 随时都在这里等你回来！"
        if any(w in text for w in ("象棋", "chess", "下棋")):
            return "serious", "国际象棋随时可以开始！你可以直接在桌面打开国际象棋应用，准备好挑战我了吗？"
        if any(w in text for w in ("蛋糕", "cakeduel", "duel")):
            return "excited", "蛋糕决斗！准备好你的虚张声势和推理战术了吗？随时可以开一局！"
        return "neutral", f"收到：“{user_text}”。NoriOS 本地系统运转正常，随时可以发起对话或打开应用！"

    @classmethod
    async def generate_reply(
        cls,
        user_text: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[str, str]:
        runtime = get_runtime_ai_config()
        browser_override = runtime.get("enabled") is True

        if browser_override:
            provider = str(runtime.get("provider") or "openai-compatible")
            temperature = float(runtime.get("temperature", 0.75))
            max_tokens = int(runtime.get("maxTokens", 350))
            system_prompt = cls._prompt(runtime)
            api_key = str(runtime.get("apiKey") or "")
            if provider == "anthropic":
                base_url = str(runtime.get("baseUrl") or "https://api.anthropic.com/v1")
                model = str(runtime.get("model") or config.ANTHROPIC_MODEL)
            else:
                base_url = str(runtime.get("baseUrl") or "https://api.openai.com/v1")
                model = str(runtime.get("model") or config.OPENAI_MODEL)
        else:
            provider = "openai-compatible"
            temperature = 0.75
            max_tokens = 350
            system_prompt = SYSTEM_PROMPT
            api_key = config.OPENAI_API_KEY
            base_url = config.OPENAI_BASE_URL
            model = config.OPENAI_MODEL

        # The historical server-default path keeps its old behavior: no server
        # key means immediate local fallback. Browser overrides are allowed to
        # call no-auth OpenAI-compatible endpoints (for example a local proxy).
        if not browser_override and not api_key:
            return cls.local_fallback_reply(user_text)

        try:
            if provider == "anthropic":
                content = await cls._anthropic_reply(
                    user_text=user_text,
                    history=history,
                    base_url=base_url,
                    model=model,
                    api_key=api_key,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            else:
                content = await cls._openai_compatible_reply(
                    user_text=user_text,
                    history=history,
                    base_url=base_url,
                    model=model,
                    api_key=api_key,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            emotion, cleaned = cls.extract_emotion(content)
            if cleaned:
                return emotion, cleaned
        except Exception as exc:
            # Never include request headers or runtime configuration here; the
            # browser API key must not enter Workers Observability logs.
            print(f"[LLMService] {provider} request failed: {type(exc).__name__}: {str(exc)[:240]}")

        return cls.local_fallback_reply(user_text)


LLM_SERVICE = LLMService()
