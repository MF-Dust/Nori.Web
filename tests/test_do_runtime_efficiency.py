from __future__ import annotations

import importlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ENTRY = (ROOT / "cloudflare" / "entry.py").read_text(encoding="utf-8")


def main() -> None:
    # Importing the compatibility server is part of every Cloudflare Worker
    # module load. It must stay cheap until an actual HTTP API request arrives.
    sys.modules.pop("server", None)
    server = importlib.import_module("server")
    assert "fastapi" not in sys.modules
    assert "backend.api" not in sys.modules

    lazy_app = server.create_app(include_static=False)
    assert callable(lazy_app)
    assert "fastapi" not in sys.modules
    assert "backend.api" not in sys.modules

    # Arcade world state only needs a WebSocket-shaped object at runtime; the
    # FastAPI WebSocket class is a typing aid and must not pull the HTTP stack
    # into a hibernated Durable Object wake.
    importlib.import_module("backend.session.world")
    assert "fastapi" not in sys.modules
    assert "backend.api" not in sys.modules

    # The production Durable Object subclass caches the exact SQLite snapshot
    # and serializes only after a message has finished mutating world state.
    assert "self._persisted_world_snapshot" in ENTRY
    assert "snapshot != self._persisted_world_snapshot" in ENTRY
    assert "await self._persist_world(world)" in ENTRY
    assert "before = _runtime.world_snapshot_json" not in ENTRY

    print("[ok] DO wake avoids eager FastAPI initialization and redundant snapshot copies")


if __name__ == "__main__":
    main()
