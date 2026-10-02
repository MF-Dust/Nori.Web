from __future__ import annotations

import ast
import asyncio
import importlib
import json
import sys
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")
WORKER = (ROOT / "worker.py").read_text(encoding="utf-8")


async def verify_heartbeat_fast_path() -> None:
    from backend.core.protocol import error_message
    from backend.session.persistence import world_snapshot_json
    from backend.session.world import WorldSession

    # Execute the actual production handler on CPython, substituting only the
    # Workers transport/runtime bindings unavailable outside Cloudflare.
    production_class = next(node for node in ast.parse(ENTRY).body if isinstance(node, ast.ClassDef) and node.name == "NoriArcadeSession")
    handler = next(node for node in production_class.body if isinstance(node, ast.AsyncFunctionDef) and node.name == "_handle_main_message")
    calls = []

    async def prefetch(env, message):
        calls.append("prefetch")

    async def drain(world):
        calls.append("drain")

    namespace = {
        "_runtime": SimpleNamespace(
            _HibernatingSocketAdapter=lambda websocket, socket_id: websocket,
            error_message=error_message, _drain_world_tasks=drain,
        ),
        "_prefetch_parsed_arcade_message": prefetch,
        "json": json,
    }
    exec(compile(ast.Module(body=[handler], type_ignores=[]), "cloudflare/entry.py", "exec"), namespace)
    world = WorldSession("heartbeat-test")

    class Session:
        env = None

        async def _load_world(self, user_id):
            assert user_id == world.owner_id
            return world

        def _refresh_world_clients(self, active_world):
            assert active_world is world

        async def _capture_ai_settings(self, websocket, attachment, message):
            calls.append("ai")
            return attachment

        async def _capture_tts_settings(self, websocket, attachment, message):
            calls.append("tts")
            return attachment

        async def _persist_world(self, active_world):
            assert active_world is world
            calls.append("snapshot")

    class Socket:
        def __init__(self):
            self.frames = []

        async def send_text(self, text):
            self.frames.append(json.loads(text))

    session, socket = Session(), Socket()
    attachment = {"userId": world.owner_id, "socketId": "heartbeat-socket"}
    handle = namespace["_handle_main_message"]
    before = world_snapshot_json(world)
    for _ in range(20):
        await handle(session, socket, attachment, '{"type":"ping"}')
        assert socket.frames[-1]["type"] == "pong"
        assert isinstance(socket.frames[-1]["now"], int)
    assert calls == [], "heartbeats must not prefetch/configure/drain/serialize world state"
    assert world_snapshot_json(world) == before
    for malformed in ("{", "[]"):
        await handle(session, socket, attachment, malformed)
        assert socket.frames[-1]["type"] == "error"
    assert calls == []
    await handle(session, socket, attachment, '{"type":"open_my_web_world"}')
    assert socket.frames[-1]["type"] == "world_joined"
    assert calls == ["prefetch", "ai", "tts", "drain", "snapshot"]
    assert world_snapshot_json(world) != before, "state-changing messages must still persist"


def main() -> None:
    # CPython cannot import workers-py without Cloudflare's `js` runtime, so
    # validate the module-level import boundary structurally instead of faking
    # a runtime we do not have in CI.
    module = ast.parse(WORKER)
    top_level_server_imports = []
    for node in module.body:
        if isinstance(node, ast.ImportFrom) and node.module == "server":
            top_level_server_imports.append(node)
        elif isinstance(node, ast.Import):
            if any(alias.name == "server" for alias in node.names):
                top_level_server_imports.append(node)
    assert top_level_server_imports == []

    assert "_FASTAPI_APP = None" in WORKER
    assert "def _get_fastapi_app" in WORKER
    assert "from server import app" in WORKER
    assert "from server import create_app" not in WORKER
    assert "await _get_fastapi_app()(scope, receive, send)" in WORKER

    # Startup-critical endpoints must be checked before the generic ASGI path.
    bootstrap_pos = WORKER.index("bootstrap = await _serve_bootstrap_api")
    asgi_pos = WORKER.index("return await asgi.fetch(_cloudflare_asgi_app")
    assert bootstrap_pos < asgi_pos
    for path in (
        "/api/auth/get-session",
        "/api/entry-status",
        "/api/arcade/ws-ticket",
        "/api/auth/convex/token",
    ):
        assert path in WORKER

    # Arcade world state itself must not pull FastAPI into a hibernated DO
    # wake. This part can be validated on ordinary CPython.
    for name in ("fastapi", "backend.api"):
        sys.modules.pop(name, None)
    importlib.import_module("backend.session.world")
    assert "fastapi" not in sys.modules
    assert "backend.api" not in sys.modules

    # The production Durable Object subclass caches the exact SQLite snapshot
    # and serializes only after a message has finished mutating world state.
    assert "self._persisted_world_snapshot" in ENTRY
    assert "snapshot != self._persisted_world_snapshot" in ENTRY
    assert "await self._persist_world(world)" in ENTRY
    assert "before = _runtime.world_snapshot_json" not in ENTRY

    asyncio.run(verify_heartbeat_fast_path())
    print("[ok] DO/bootstrap avoids FastAPI cold paths; real heartbeat handler skips world snapshots while mutations persist")


if __name__ == "__main__":
    main()
