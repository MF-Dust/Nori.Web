"""Production deploy entrypoint for Cloudflare Workers Builds.

Workers Builds currently does not honor Wrangler custom-build configuration, so
this wrapper explicitly prepares the staged Python runtime before invoking
pywrangler.  It also keeps the private R2 live-world layout synchronized without
re-uploading it on every unrelated code change.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PACK = ROOT / "backend" / "data" / "live_world_pack.json"
LIVE_PACK_TOOL = ROOT / "scripts" / "upload_cloudflare_live_pack.py"
PREPARE_TOOL = ROOT / "scripts" / "prepare_cloudflare_runtime.py"
R2_BUCKET = "nori-web-assets"
R2_MARKER_KEY = "runtime/live/source-fingerprint.txt"
FINGERPRINT_VERSION = "v1"


def _run(command: list[str], *, check: bool = True, capture: bool = False) -> subprocess.CompletedProcess[str]:
    printable = " ".join(command)
    print(f"+ {printable}")
    return subprocess.run(
        command,
        cwd=ROOT,
        check=check,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )


def pywrangler_command() -> list[str]:
    """Return pywrangler from the active uv environment.

    Workers Builds should invoke this script through ``uv run python``.  uv adds
    the project environment's executable directory to PATH, so pywrangler is
    normally directly discoverable here.
    """
    executable = shutil.which("pywrangler")
    if executable:
        return [executable]
    uv = shutil.which("uv")
    if uv:
        return [uv, "run", "pywrangler"]
    raise RuntimeError(
        "pywrangler is unavailable. Run this script via "
        "`uv run python scripts/cloudflare_builds_deploy.py`."
    )


def live_pack_fingerprint() -> str:
    """Fingerprint both source content and partitioning logic.

    Including the upload tool means a future sharding/layout change triggers an
    R2 refresh even when live_world_pack.json itself did not change.
    """
    digest = hashlib.sha256()
    digest.update(FINGERPRINT_VERSION.encode("ascii"))
    for path in (SOURCE_PACK, LIVE_PACK_TOOL):
        digest.update(b"\0")
        digest.update(path.name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
    return f"{FINGERPRINT_VERSION}:{digest.hexdigest()}"


def read_remote_fingerprint(base: list[str]) -> str | None:
    with tempfile.TemporaryDirectory(prefix="nori-r2-marker-") as temp:
        marker = Path(temp) / "source-fingerprint.txt"
        result = _run(
            [
                *base,
                "r2",
                "object",
                "get",
                f"{R2_BUCKET}/{R2_MARKER_KEY}",
                f"--file={marker}",
                "--remote",
            ],
            check=False,
            capture=True,
        )
        if result.returncode != 0 or not marker.exists():
            details = (result.stderr or result.stdout or "").strip()
            if details:
                print(f"R2 fingerprint marker unavailable ({details.splitlines()[-1]})")
            else:
                print("R2 fingerprint marker unavailable; a live-pack refresh is required.")
            return None
        return marker.read_text(encoding="utf-8").strip() or None


def write_remote_fingerprint(base: list[str], fingerprint: str) -> None:
    with tempfile.TemporaryDirectory(prefix="nori-r2-marker-") as temp:
        marker = Path(temp) / "source-fingerprint.txt"
        marker.write_text(fingerprint + "\n", encoding="utf-8")
        _run(
            [
                *base,
                "r2",
                "object",
                "put",
                f"{R2_BUCKET}/{R2_MARKER_KEY}",
                f"--file={marker}",
                "--content-type=text/plain; charset=utf-8",
                "--remote",
            ]
        )


def sync_live_pack(base: list[str], *, force: bool = False) -> bool:
    expected = live_pack_fingerprint()
    current = None if force else read_remote_fingerprint(base)
    if current == expected:
        print("Live-world R2 layout is already current; skipping upload.")
        return False

    print("Live-world R2 layout changed; preparing and uploading shards...")
    _run([sys.executable, str(LIVE_PACK_TOOL), "--upload"])
    write_remote_fingerprint(base, expected)
    print("Live-world R2 fingerprint updated.")
    return True


def prepare_runtime() -> None:
    # Do not rely on Wrangler's custom-build hook here. Workers Builds documents
    # that its build pipeline does not honor that configuration automatically.
    _run([sys.executable, str(PREPARE_TOOL)])


def deploy_worker(base: list[str]) -> None:
    _run([*base, "deploy"])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-live-pack",
        action="store_true",
        help="Deploy code without checking or updating the R2 live-world layout.",
    )
    parser.add_argument(
        "--force-live-pack",
        action="store_true",
        help="Re-upload the live-world R2 layout even when its fingerprint matches.",
    )
    parser.add_argument(
        "--prepare-only",
        action="store_true",
        help="Prepare the Cloudflare staging tree without accessing Cloudflare.",
    )
    args = parser.parse_args()

    print(
        "Cloudflare Workers Builds deploy "
        f"(branch={os.getenv('WORKERS_CI_BRANCH', 'local')}, "
        f"commit={os.getenv('WORKERS_CI_COMMIT_SHA', 'local')})"
    )
    prepare_runtime()
    if args.prepare_only:
        print("Prepare-only mode complete.")
        return

    base = pywrangler_command()
    if not args.skip_live_pack:
        sync_live_pack(base, force=args.force_live_pack)
    deploy_worker(base)


if __name__ == "__main__":
    main()
