"""Browser-origin checks cover both ASGI and the Worker/DO fast paths."""

from __future__ import annotations

import ast
import asyncio
import sys
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import httpx
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from backend.core.request_origin import is_same_origin_request
from server import create_app

CONVEX_PATHS = {"/api/query", "/api/mutation", "/api/action", "/api/function", "/api/query_at_ts", "/api/query_ts"}
API_PATHS = ["/api/arcade/ws-ticket", *sorted(CONVEX_PATHS)]
WS_PATHS = ["/api/arcade/web/v1", "/api/arcade/web/v1/media"]


def test_asgi() -> None:
    with TestClient(create_app(include_static=False), base_url="https://nori.test") as client:
        for origin in ("https://foreign.test", "null", "http://nori.test", "https://nori.test:444"):
            for path in API_PATHS:
                response = client.post(path, headers={"Origin": origin}, json={"path": "auth/wsTickets:issueWebUserWsTicket"})
                assert response.status_code == 403, (origin, path, response.text)
                assert "set-cookie" not in response.headers
                assert "access-control-allow-origin" not in response.headers
            assert client.get("/api/auth/get-session", headers={"Origin": origin}).status_code == 403
            for path in WS_PATHS:
                try:
                    with client.websocket_connect("wss://nori.test" + path, headers={"Origin": origin}):
                        raise AssertionError("foreign WebSocket accepted")
                except WebSocketDisconnect as exc:
                    assert exc.code == 1008 and exc.reason == "origin_forbidden"
        for headers in ({}, {"Origin": "https://nori.test"}, {"Origin": "https://nori.test:443"}):
            assert client.post("/api/arcade/ws-ticket", headers=headers).status_code == 200
        # Vite's proxy preserves Host; it does not need a wildcard CORS exception.
        assert client.post("/api/arcade/ws-ticket", headers={"Host": "localhost:5173", "Origin": "https://localhost:5173"}).status_code == 200
        for path in WS_PATHS:
            for headers in ({}, {"Origin": "https://nori.test"}):
                try:
                    with client.websocket_connect("wss://nori.test" + path, headers=headers, subprotocols=["arcade.v1", "ticket.invalid"]):
                        raise AssertionError("invalid ticket accepted")
                except WebSocketDisconnect as exc:
                    assert exc.reason == "session_invalid", exc.reason


def load_fetch(path: str, class_name: str, namespace: dict):
    # Execute the real routing method under CPython without requiring Workers JS.
    tree = ast.parse((ROOT / path).read_text(encoding="utf-8"))
    cls = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == class_name)
    method = next(node for node in cls.body if isinstance(node, ast.AsyncFunctionDef) and node.name == "fetch")
    exec(compile(ast.Module(body=[method], type_ignores=[]), path, "exec"), namespace)
    return namespace["fetch"]


async def test_edge() -> None:
    bindings = []

    def response(body, *, status=200):
        return httpx.Response(status, text=body)

    async def bootstrap(*args):
        return response("bootstrap")

    runtime = SimpleNamespace(
        urlsplit=urlsplit, is_same_origin_request=is_same_origin_request,
        Response=response, _apply_runtime_bindings=lambda env: bindings.append(env),
    )
    common = {"urlsplit": urlsplit, "is_same_origin_request": is_same_origin_request,
              "Response": response, "_apply_runtime_bindings": runtime._apply_runtime_bindings,
              "_is_websocket": lambda request: False, "_R2_MODEL_PATH": "/model.glb",
              "_serve_bootstrap_api": bootstrap}
    worker_fetch = load_fetch("worker.py", "Default", dict(common))
    do_fetch = load_fetch("worker.py", "NoriArcadeSession", dict(common))
    entry_fetch = load_fetch("cloudflare/entry.py", "Default", {
        "_runtime": runtime, "_EDGE_CONVEX_PATHS": CONVEX_PATHS,
        "_serve_edge_convex_api": bootstrap,
    })
    owner = SimpleNamespace(env=object())
    for fetch, paths in ((worker_fetch, [*API_PATHS, *WS_PATHS]), (entry_fetch, CONVEX_PATHS), (do_fetch, WS_PATHS)):
        for path in paths:
            for origin in ("https://foreign.test", "null"):
                bindings.clear()
                request = SimpleNamespace(url="https://nori.test" + path, headers={"origin": origin})
                result = await fetch(owner, request)
                assert result.status_code == 403, (path, origin)
                assert not bindings, "reject before bindings, session creation, or routing"
            for headers in ({}, {"origin": "https://nori.test"}):
                request = SimpleNamespace(url="https://nori.test" + path, headers=headers)
                result = await fetch(owner, request)
                assert result.status_code == (426 if fetch is do_fetch else 200)


def main() -> None:
    assert is_same_origin_request("https://nori.test", "wss://nori.test/api/arcade/web/v1")
    assert is_same_origin_request("http://[::1]:4173", "ws://[::1]:4173/api/arcade/web/v1")
    for origin in ("", "null", "https://user@nori.test", "https://nori.test/api", "https://nori.test?x", "https://nori.test:bad", "https://nori.test\n"):
        assert not is_same_origin_request(origin, "https://nori.test/api/query"), origin
    test_asgi()
    asyncio.run(test_edge())
    print("[ok] same-origin HTTP, Convex, main/media WebSocket and Worker/DO boundaries")


if __name__ == "__main__":
    main()
