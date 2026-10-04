"""Production deploy entrypoint for Cloudflare Workers Builds.

The wrapper builds and verifies the source frontend, bootstraps Rust when
needed, keeps the private R2 live-world layout synchronized, and invokes the
locked local Wrangler with the materialized source candidate. Wrangler runs
worker-build exactly once during deployment. The historical public entry
remains available as an explicit frontend-only rollback path.
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
WORKER_ROOT = ROOT / "rust" / "crates" / "nori-worker"
RUST_TOOLCHAIN = "1.91.0"
WASM_TARGET = "wasm32-unknown-unknown"
WORKER_BUILD_VERSION = "0.8.7"
FRONTEND_CANDIDATE_TOOL = (
    ROOT / "scripts" / "recovery" / "prepare_frontend_cutover_candidate.mjs"
)
FRONTEND_CONFIG_TOOL = (
    ROOT / "scripts" / "lib" / "frontend_candidate_worker_config.mjs"
)
FRONTEND_CANDIDATE_INDEX = (
    ROOT / ".artifacts" / "build" / "app" / "cutover-candidate" / "index.html"
)
FRONTEND_CONFIG = ROOT / ".wrangler-candidate.json"
R2_BUCKET = "nori-web-assets"
R2_MARKER_KEY = "runtime/live/source-fingerprint.txt"
FINGERPRINT_VERSION = "v1"


def _run(
    command: list[str],
    *,
    check: bool = True,
    capture: bool = False,
    env: dict[str, str] | None = None,
    cwd: Path = ROOT,
) -> subprocess.CompletedProcess[str]:
    printable = " ".join(command)
    print(f"+ {printable}")
    return subprocess.run(
        command,
        cwd=cwd,
        check=check,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        env=env,
    )


def wrangler_command() -> list[str]:
    """Use Wrangler 4.147.0 from the dependencies installed by npm ci."""
    return [_required_executable("npx"), "wrangler"]


def ensure_rust_toolchain() -> None:
    """Install missing build tools on the Rust-free Workers Builds image."""
    cargo_bin = str(Path.home() / ".cargo" / "bin")
    path = os.environ.get("PATH", "").split(os.pathsep)
    os.environ["PATH"] = os.pathsep.join(
        [cargo_bin, *(entry for entry in path if entry != cargo_bin)]
    )

    if not shutil.which("cargo") or not shutil.which("rustup"):
        _run([
            "sh", "-c",
            "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs "
            f"| sh -s -- -y --profile minimal --default-toolchain {RUST_TOOLCHAIN}",
        ])

    targets = _run(["rustup", "target", "list", "--installed"], capture=True)
    if WASM_TARGET not in targets.stdout.split():
        _run(["rustup", "target", "add", WASM_TARGET])

    worker_build = shutil.which("worker-build")
    version = (
        _run([worker_build, "--version"], check=False, capture=True)
        if worker_build else None
    )
    if version is None or version.returncode != 0 or version.stdout.strip() != WORKER_BUILD_VERSION:
        _run(["cargo", "install", "worker-build", "--version", WORKER_BUILD_VERSION, "--locked"])


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
    """Build the Rust Worker locally without accessing Cloudflare."""
    _run(["worker-build", "--release"], cwd=WORKER_ROOT)


def _required_executable(name: str) -> str:
    executable = shutil.which(name)
    if executable:
        return executable
    raise RuntimeError(f"{name} is unavailable; install it before deploying.")


def install_node_dependencies() -> None:
    _run([_required_executable("npm"), "ci", "--no-audit", "--no-fund"])


def prepare_source_frontend() -> Path:
    """Build and materialize the verified source frontend deployment tree."""
    npm = _required_executable("npm")
    node = _required_executable("node")
    install_node_dependencies()
    _run([npm, "run", "frontend:app:build"])
    _run([node, str(FRONTEND_CANDIDATE_TOOL), "--materialize"])
    _run([node, str(FRONTEND_CONFIG_TOOL)])
    for path in (FRONTEND_CANDIDATE_INDEX, FRONTEND_CONFIG):
        if not path.is_file():
            raise RuntimeError(f"Source frontend deployment output is missing: {path}")
    print(f"Source frontend deployment tree ready: {FRONTEND_CANDIDATE_INDEX.parent}")
    return FRONTEND_CONFIG


def deploy_worker(base: list[str], *, config: Path | None = None) -> None:
    # Wrangler rejects `wrangler deploy --yes` when a Wrangler config file
    # already exists. Workers Builds is a CI environment, so force CI mode and
    # let Wrangler use its non-interactive fallback for confirmation prompts.
    deploy_env = os.environ.copy()
    deploy_env["CI"] = "true"
    command = [*base, "deploy"]
    if config is not None:
        command.extend(["--config", str(config.relative_to(ROOT))])
    _run(command, env=deploy_env)


def _environment_flag(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes", "on"}


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
        help="Prepare the frontend and Rust Worker without accessing Cloudflare.",
    )
    parser.add_argument(
        "--legacy-frontend",
        action="store_true",
        help="Emergency rollback: deploy the historical public/ frontend instead of the source build.",
    )
    args = parser.parse_args()

    print(
        "Cloudflare Workers Builds deploy "
        f"(branch={os.getenv('WORKERS_CI_BRANCH', 'local')}, "
        f"commit={os.getenv('WORKERS_CI_COMMIT_SHA', 'local')})"
    )

    legacy_frontend = args.legacy_frontend or _environment_flag(
        "NORI_DEPLOY_LEGACY_FRONTEND"
    )

    frontend_config = None
    if legacy_frontend:
        print("Legacy frontend rollback enabled; deploying public/ with the Rust Worker.")
        install_node_dependencies()
    else:
        frontend_config = prepare_source_frontend()

    ensure_rust_toolchain()
    if args.prepare_only:
        prepare_runtime()
        print("Prepare-only mode complete.")
        return

    base = wrangler_command()
    if not args.skip_live_pack:
        sync_live_pack(base, force=args.force_live_pack)
    deploy_worker(base, config=frontend_config)


if __name__ == "__main__":
    main()
