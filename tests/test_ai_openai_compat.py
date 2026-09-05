from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.services import llm_service
from backend.services.llm_service import LLMService


async def main() -> None:
    calls: list[dict] = []

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, *, headers, json):
            calls.append(dict(json))
            request = httpx.Request("POST", url, headers=headers)
            if len(calls) == 1:
                return httpx.Response(
                    400,
                    request=request,
                    json={
                        "error": {
                            "message": (
                                "Unsupported parameter: max_tokens. "
                                "Use max_completion_tokens instead."
                            )
                        }
                    },
                )
            return httpx.Response(
                200,
                request=request,
                json={
                    "choices": [
                        {
                            "message": {
                                "content": [
                                    {"type": "text", "text": "[emotion:happy] "},
                                    {"type": "text", "text": "OK"},
                                ]
                            }
                        }
                    ]
                },
            )

    original_client = llm_service.httpx.AsyncClient
    llm_service.httpx.AsyncClient = lambda **kwargs: FakeClient()
    try:
        content = await LLMService._openai_compatible_reply(
            user_text="hello",
            history=[],
            base_url="https://example.test/v1",
            model="new-model",
            api_key="test-key",
            system_prompt="system",
            temperature=0.5,
            max_tokens=128,
        )
    finally:
        llm_service.httpx.AsyncClient = original_client

    assert content == "[emotion:happy] OK"
    assert len(calls) == 2
    assert calls[0]["max_tokens"] == 128
    assert "max_completion_tokens" not in calls[0]
    assert calls[1]["max_completion_tokens"] == 128
    assert "max_tokens" not in calls[1]

    unrelated = httpx.Response(
        400,
        request=httpx.Request("POST", "https://example.test/v1/chat/completions"),
        json={"error": {"message": "Unknown model"}},
    )
    assert LLMService._needs_max_completion_tokens(unrelated) is False

    print("[ok] OpenAI-compatible chat retries modern token parameters and reads text parts")


if __name__ == "__main__":
    asyncio.run(main())
