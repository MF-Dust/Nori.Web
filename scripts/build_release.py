"""Build a self-contained Rust Nori.Web local distribution."""
from __future__ import annotations

import argparse
import platform
import shutil
import subprocess
import sys
import tomllib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUST_MANIFEST = ROOT / "rust" / "Cargo.toml"
BUILD_ROOT = ROOT / "build" / "rust-release"
RELEASE_ROOT = ROOT / "build" / "release"
sys.path.insert(0, str(ROOT))


def _platform_tag() -> str:
    system = platform.system().lower() or "unknown"
    machine = platform.machine().lower().replace("amd64", "x86_64") or "unknown"
    return f"{system}-{machine}"


def _rustc_info() -> tuple[str, str]:
    details = subprocess.check_output(["rustc", "-vV"], cwd=ROOT, text=True)
    target = next((line.partition(":")[2].strip() for line in details.splitlines() if line.startswith("host:")), None)
    if not target:
        raise RuntimeError("rustc -vV did not report a host target triple")
    version = subprocess.check_output(["rustc", "--version"], cwd=ROOT, text=True).strip()
    return version, target


def build(*, allow_untracked: bool = False) -> Path:
    from scripts.release_legal import RUNTIME_DIRECTORIES, prepare_rust_legal_bundle

    workspace = tomllib.loads(RUST_MANIFEST.read_text(encoding="utf-8"))
    version = workspace["workspace"]["package"]["version"]
    rustc_version, target_triple = _rustc_info()
    release_dir = RELEASE_ROOT / f"Nori.Web-{_platform_tag()}"
    shutil.rmtree(BUILD_ROOT, ignore_errors=True)
    shutil.rmtree(release_dir, ignore_errors=True)
    legal_dir = BUILD_ROOT / "legal"
    legal_dir.mkdir(parents=True)

    try:
        linked_crates = prepare_rust_legal_bundle(
            legal_dir,
            target_triple=target_triple,
            allow_untracked=allow_untracked,
            reuse_runtime_assets=True,
        )
    except Exception:
        shutil.rmtree(BUILD_ROOT, ignore_errors=True)
        raise

    command = [
        "cargo", "build", "--release", "--locked", "-p", "nori-local",
        "--manifest-path", "rust/Cargo.toml",
    ]
    print("[cargo]", " ".join(command), flush=True)
    subprocess.run(command, cwd=ROOT, check=True)

    built_name = "nori-web.exe" if sys.platform == "win32" else "nori-web"
    shipped_name = "Nori.Web.exe" if sys.platform == "win32" else "Nori.Web"
    executable = ROOT / "rust" / "target" / "release" / built_name
    if not executable.is_file():
        raise RuntimeError(f"Cargo release executable is missing: {executable}")

    release_dir.mkdir(parents=True)
    shutil.copy2(executable, release_dir / shipped_name)
    for directory in RUNTIME_DIRECTORIES:
        shutil.copytree(ROOT / directory, release_dir / directory)
    shutil.copy2(ROOT / "README.md", release_dir / "README.md")
    shutil.copytree(legal_dir, release_dir, dirs_exist_ok=True)
    shutil.rmtree(BUILD_ROOT, ignore_errors=True)

    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    build_kind = (
        "DEVELOPMENT ONLY: --allow-untracked was used; untracked worktree files are included in the source delivery."
        if allow_untracked else "release-ready: only tracked worktree files and the allowed lock files are in the source delivery."
    )
    info = release_dir / "BUILD_INFO.txt"
    info.write_text(
        "\n".join(
            [
                "Nori.Web Rust local distribution",
                f"Version: {version}",
                f"Git commit: {commit}",
                f"Rust toolchain: {rustc_version}",
                f"Target triple: {target_triple}",
                f"Platform: {platform.platform()}",
                f"Architecture: {platform.machine()}",
                f"Built at (UTC): {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
                f"Linked crates (excluding nori-local): {len(linked_crates)}",
                f"Build status: {build_kind}",
                "Start Nori.Web, then open http://127.0.0.1:4173/",
                "Configuration uses HOST, PORT, NORI_DISABLE_LIVE_PACK, NORI_PUBLIC_DIR, and NORI_DATA_DIR.",
                "Source delivery: source/project.zip + public/ + backend/data/; see source/README.md to reconstruct.",
                "License summary: see RUST-LICENSE-SUMMARY.txt.",
                "",
            ]
        ),
        encoding="utf-8",
    )

    print(f"[release] ready: {release_dir}")
    return release_dir


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--allow-untracked",
        action="store_true",
        help="include untracked worktree files in the source delivery and mark the build development-only",
    )
    args = parser.parse_args()
    build(allow_untracked=args.allow_untracked)


if __name__ == "__main__":
    main()
