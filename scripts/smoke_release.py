"""Launch and verify a packaged Rust Nori.Web distribution."""
from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RELEASE_ROOT = ROOT / "build" / "release"


def _find_executable(release_dir: Path | None = None) -> Path:
    if release_dir is None:
        candidates = [
            path for path in RELEASE_ROOT.glob("Nori.Web-*")
            if path.is_dir() and (path / "source" / "rust-vendor.zip").is_file()
        ]
        if len(candidates) != 1:
            raise RuntimeError(f"Expected one Rust release directory under {RELEASE_ROOT}, found {candidates}")
        release_dir = candidates[0]
    release_dir = release_dir.resolve()
    binary = release_dir / ("Nori.Web.exe" if sys.platform == "win32" else "Nori.Web")
    if not binary.is_file():
        raise RuntimeError(f"Packaged executable not found: {binary}")
    return binary


def _free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


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
        time.sleep(0.25)
    raise RuntimeError(f"Timed out waiting for {url}: {last_error}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release_dir", nargs="?", type=Path, help="release directory (defaults to the sole Rust release)")
    args = parser.parse_args()
    binary = _find_executable(args.release_dir)
    release_dir = binary.parent
    port = _free_port()
    env = os.environ.copy()
    env.update(
        {
            "HOST": "127.0.0.1",
            "PORT": str(port),
            "NORI_DISABLE_LIVE_PACK": "1",
        }
    )

    process = subprocess.Popen(
        [str(binary)],
        cwd=release_dir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    output: list[str] = []

    def collect_output() -> None:
        if process.stdout:
            output.extend(process.stdout)

    reader = threading.Thread(target=collect_output, daemon=True)
    reader.start()
    base = f"http://127.0.0.1:{port}"
    try:
        status = _wait_for(f"{base}/api/entry-status")
        if b'"status":"ok"' not in status and b'"status": "ok"' not in status:
            raise RuntimeError(f"Unexpected entry-status payload: {status[:200]!r}")

        index = _wait_for(f"{base}/")
        if b"<html" not in index.lower() and b"<!doctype html" not in index.lower():
            raise RuntimeError("Packaged root response does not look like HTML")
        if b"nori-community-notice" not in index:
            raise RuntimeError("Packaged page is missing the unofficial project notice")
        for path in (
            "legal/index.html",
            "legal/LICENSE",
            "legal/npm-NOTICES.txt",
            "legal/fonts/Sarasa-OFL.txt",
        ):
            if not _wait_for(f"{base}/{path}"):
                raise RuntimeError(f"Empty packaged legal file: {path}")

        required = (
            "LICENSE",
            "COPYRIGHT.md",
            "THIRD_PARTY_NOTICES.md",
            "BUILD_INFO.txt",
            "RUST-LICENSE-SUMMARY.txt",
            "source/project.zip",
            "source/rust-vendor.zip",
            "source/dependencies.json",
        )
        for path in required:
            if not (release_dir / path).is_file():
                raise RuntimeError(f"Missing release legal/source file: {path}")
        dependency_file = release_dir / "source" / "dependencies.json"
        dependencies = json.loads(dependency_file.read_text(encoding="utf-8"))
        if not dependencies:
            raise RuntimeError("Rust dependency manifest is empty")
        for dependency in dependencies:
            for key in ("name", "version", "license_expression", "repository", "checksum"):
                if key not in dependency:
                    raise RuntimeError(f"Rust dependency record is missing {key}: {dependency}")
        vendor_archive = release_dir / "source" / "rust-vendor.zip"
        if not zipfile.is_zipfile(vendor_archive):
            raise RuntimeError("Rust vendor source is not a valid ZIP archive")
        with zipfile.ZipFile(vendor_archive) as vendor:
            if not vendor.namelist():
                raise RuntimeError("Rust vendor source archive is empty")
        license_root = release_dir / "legal" / "licenses"
        if not license_root.is_dir():
            raise RuntimeError("Rust license directory is missing: legal/licenses")
        license_dirs = [path for path in license_root.iterdir() if path.is_dir()]
        if not license_dirs or not any(path.is_file() for directory in license_dirs for path in directory.rglob("*")):
            raise RuntimeError("No Rust dependency license files were packaged")

        log = "".join(output)
        if "Arcade WebSocket:" not in log:
            raise RuntimeError(f"Packaged server did not print its Arcade WebSocket startup line: {log[:1000]}")
        print(
            f"[ok] Rust release serves API + SPA + legal notices; {len(dependencies)} linked crates and source delivery verified: {binary}"
        )
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)
        reader.join(timeout=2)


if __name__ == "__main__":
    main()
