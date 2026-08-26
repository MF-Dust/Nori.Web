"""Root entrypoint forwarding to tests/test_backend_integration.py."""

import asyncio
import threading
import time

from tests.test_backend_integration import run, run_server

if __name__ == "__main__":
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    time.sleep(0.8)
    asyncio.run(run())
    print("[ok] REST, ticket, Arcade JSON protocol, and media framing verified")
