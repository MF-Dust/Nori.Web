"""Nuitka entrypoint for the self-contained local Nori.Web distribution."""

from __future__ import annotations

import uvicorn

from backend.core.config import HOST, PORT
from backend.virtual_apps import live_pack
from server import app


def main() -> None:
    print(f"NoriOS local compatibility server: http://{HOST}:{PORT}")
    print(f"Arcade WebSocket: ws://{HOST}:{PORT}/api/arcade/web/v1")
    print(live_pack.summary())
    print("Press Ctrl+C to stop the server.")

    # The compiled distribution is a deployment artifact, not a development
    # reloader. Passing the app object directly also avoids Uvicorn having to
    # import a source module by name from inside a Nuitka standalone build.
    uvicorn.run(app, host=HOST, port=PORT, reload=False)


if __name__ == "__main__":
    main()
