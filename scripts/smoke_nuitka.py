"""Launch the Nuitka distribution and verify its local HTTP surface."""

from __future__ import annotations

import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RELEASE_ROOT = ROOT / "build" / "release"


def _find_executable() -> Path:
    release_dirs = [path for path in RELEASE_ROOT.glob("Nori.Web-*") if path.is_dir()]
    if len(release_dirs) != 1:
        raise RuntimeError(f"Expected one release directory under {RELEASE_ROOT}, found {release_dirs}")
    binary = release_dirs[0] / ("Nori.Web.exe" if sys.platform == "win32" else "Nori.Web")
    if not binary.is_file():
        raise RuntimeError(f"Compiled executable not found: {binary}")
    return binary


def _wait_for(url: str, timeout: float = 60.0) -> bytes:
    deadline = time.monotonic() + timeout
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as response:
                if response.status == 200:
                    return response.read()
                last_error = RuntimeError(f"{url} returned HTTP {response.status}")
        except (OSError, urllib.error.URLError) as exc:
            last_error = exc
        time.sleep(0.5)
    raise RuntimeError(f"Timed out waiting for {url}: {last_error}")


def main() -> None:
    binary = _find_executable()
    env = os.environ.copy()
    env.update(
        {
            "HOST": "127.0.0.1",
            "PORT": "4173",
            # The smoke test checks the packaged runtime and static files; it
            # does not need to deserialize the full optional archive.
            "NORI_DISABLE_LIVE_PACK": "1",
        }
    )

    process = subprocess.Popen([str(binary)], env=env)
    try:
        status = _wait_for("http://127.0.0.1:4173/api/entry-status")
        if b'"status":"ok"' not in status and b'"status": "ok"' not in status:
            raise RuntimeError(f"Unexpected entry-status payload: {status[:200]!r}")

        index = _wait_for("http://127.0.0.1:4173/")
        if b"<html" not in index.lower() and b"<!doctype html" not in index.lower():
            raise RuntimeError("Packaged root response does not look like HTML")

        print(f"[ok] compiled local distribution serves API + SPA: {binary}")
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)


if __name__ == "__main__":
    main()
