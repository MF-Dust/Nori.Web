from __future__ import annotations

import importlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")
WORKER = (ROOT / "worker.py").read_text(encoding="utf-8")


def main() -> None:
    # Cloudflare module/DO startup must not import the HTTP framework. The
    # boundary now lives in worker.py instead of a custom lazy ASGI proxy.
    for name in ("worker", "server", "fastapi", "backend.api"):
        sys.modules.pop(name, None)
    importlib.import_module("worker")
    assert "server" not in sys.modules
    assert "fastapi" not in sys.modules
    assert "backend.api" not in sys.modules

    assert "_FASTAPI_APP = None" in WORKER
    assert "def _get_fastapi_app" in WORKER
    assert "from server import app" in WORKER
    assert "from server import create_app" not in WORKER
    assert "await _get_fastapi_app()(scope, receive, send)" in WORKER

    # Startup-critical endpoints must be checked before the generic ASGI path.
    bootstrap_pos = WORKER.index("bootstrap = await _serve_bootstrap_api")
    asgi_pos = WORKER.index("return await asgi.fetch(_cloudflare_asgi_app")
    assert bootstrap_pos < asgi_pos

    # Importing server explicitly is allowed to realize the conventional
    # FastAPI application; this happens only for non-bootstrap HTTP APIs.
    server = importlib.import_module("server")
    assert callable(server.app)
    assert "fastapi" in sys.modules
    assert "backend.api" in sys.modules

    # Arcade world state only needs a WebSocket-shaped object at runtime; the
    # FastAPI WebSocket class remains typing-only in the DO path.
    importlib.import_module("backend.session.world")

    # The production Durable Object subclass caches the exact SQLite snapshot
    # and serializes only after a message has finished mutating world state.
    assert "self._persisted_world_snapshot" in ENTRY
    assert "snapshot != self._persisted_world_snapshot" in ENTRY
    assert "await self._persist_world(world)" in ENTRY
    assert "before = _runtime.world_snapshot_json" not in ENTRY

    print("[ok] DO/bootstrap paths avoid FastAPI cold-start CPU and redundant snapshots")


if __name__ == "__main__":
    main()
