"""Build a self-contained local Nori.Web distribution with Nuitka."""

from __future__ import annotations

import argparse
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENTRY = ROOT / "scripts" / "nuitka_entry.py"
BUILD_ROOT = ROOT / "build" / "nuitka"
RELEASE_ROOT = ROOT / "build" / "release"


def _platform_tag() -> str:
    system = platform.system().lower() or "unknown"
    machine = platform.machine().lower().replace("amd64", "x86_64") or "unknown"
    return f"{system}-{machine}"


def _copy_release_metadata(release_dir: Path) -> None:
    for name in ("README.md", "LICENSE"):
        source = ROOT / name
        if source.is_file():
            shutil.copy2(source, release_dir / name)

    info = release_dir / "BUILD_INFO.txt"
    info.write_text(
        "\n".join(
            [
                "Nori.Web Nuitka standalone distribution",
                f"Platform: {platform.platform()}",
                f"Architecture: {platform.machine()}",
                f"Python: {platform.python_version()}",
                "Build mode: standalone",
                "Start the Nori.Web executable, then open http://127.0.0.1:4173/",
                "Configuration is read from the same environment variables as the Python server.",
                "",
            ]
        ),
        encoding="utf-8",
    )


def build(*, clean: bool = True) -> Path:
    if clean:
        shutil.rmtree(BUILD_ROOT, ignore_errors=True)
        shutil.rmtree(RELEASE_ROOT, ignore_errors=True)

    BUILD_ROOT.mkdir(parents=True, exist_ok=True)
    RELEASE_ROOT.mkdir(parents=True, exist_ok=True)

    binary_name = "Nori.Web.exe" if sys.platform == "win32" else "Nori.Web"
    command = [
        sys.executable,
        "-m",
        "nuitka",
        "--mode=standalone",
        "--assume-yes-for-downloads",
        "--remove-output",
        f"--output-dir={BUILD_ROOT}",
        f"--output-filename={binary_name}",
        f"--include-data-dir={ROOT / 'public'}=public",
        f"--include-data-dir={ROOT / 'backend' / 'data'}=backend/data",
        "--include-package=backend",
        "--include-package=uvicorn",
        "--include-package=websockets",
        str(ENTRY),
    ]

    print("[nuitka]", " ".join(str(part) for part in command))
    subprocess.run(command, cwd=ROOT, check=True)

    nuitka_dist = BUILD_ROOT / "nuitka_entry.dist"
    if not nuitka_dist.is_dir():
        candidates = sorted(BUILD_ROOT.glob("*.dist"))
        if len(candidates) != 1:
            raise RuntimeError(f"Unable to locate Nuitka standalone output in {BUILD_ROOT}")
        nuitka_dist = candidates[0]

    release_dir = RELEASE_ROOT / f"Nori.Web-{_platform_tag()}"
    shutil.copytree(nuitka_dist, release_dir)
    _copy_release_metadata(release_dir)

    executable = release_dir / binary_name
    if not executable.is_file():
        raise RuntimeError(f"Compiled executable is missing: {executable}")

    print(f"[nuitka] release ready: {release_dir}")
    return release_dir


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--no-clean",
        action="store_true",
        help="keep existing build directories before compiling",
    )
    args = parser.parse_args()
    build(clean=not args.no_clean)


if __name__ == "__main__":
    main()
