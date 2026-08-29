from __future__ import annotations

import ast
import importlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")
WORKER = (ROOT / "worker.py").read_text(encoding="utf-8")


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

    print("[ok] DO/bootstrap source keeps FastAPI off cold paths and avoids redundant snapshots")


if __name__ == "__main__":
    main()
