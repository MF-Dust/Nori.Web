"""LLM Service providing OpenAI-compatible requests and rule-based local fallbacks."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

import httpx

from ..core import config

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

SYSTEM_PROMPT = """You are Nori, the AI companion inside NoriOS. Be warm, concise,
curious, and helpful. Reply in the user's language when practical. Start the
answer with a single emotion tag selected from: happy, excited, sad, angry,
fearful, disgusted, surprised, doubtful, dizzy, serious, neutral. Example:
[emotion:happy] 你好！ Avoid claiming actions you have not performed."""


class LLMService:
    """Handles conversational agent generation with multi-provider and fallback support."""

    @staticmethod
    def extract_emotion(text: str) -> Tuple[str, str]:
        match = re.search(r"\[emotion:([a-zA-Z_]+)\]", text)
        if not match:
            return "neutral", text.strip()
        raw = match.group(1).lower()
        emotion = raw if raw in EMOTIONS else EMOTION_ALIASES.get(raw, "neutral")
        return emotion, re.sub(r"\[emotion:[a-zA-Z_]+\]", "", text, count=1).strip()

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
        if config.OPENAI_API_KEY:
            try:
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                if history:
                    messages.extend(history)
                messages.append({"role": "user", "content": user_text})

                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{config.OPENAI_BASE_URL.rstrip('/')}/chat/completions",
                        headers={"Authorization": f"Bearer {config.OPENAI_API_KEY}"},
                        json={
                            "model": config.OPENAI_MODEL,
                            "messages": messages,
                            "temperature": 0.75,
                            "max_tokens": 350,
                        },
                    )
                    response.raise_for_status()
                    content = response.json()["choices"][0]["message"]["content"]
                    emotion, cleaned = cls.extract_emotion(content)
                    if cleaned:
                        return emotion, cleaned
            except Exception as exc:
                print(f"[LLMService] Model request failed: {exc}")

        return cls.local_fallback_reply(user_text)


LLM_SERVICE = LLMService()
