"""Build the minimal source tree uploaded as the Cloudflare Python Worker.

The repository also contains tests, scraper tooling, frontend assets and local
virtual environments. Wrangler's Python module discovery must not see those
files because they count against the Worker script-size limit. This script is
run automatically by Wrangler's build hook before dev/deploy.
"""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STAGE = ROOT / "cloudflare"
BACKEND_SOURCE = ROOT / "backend"
BACKEND_TARGET = STAGE / "backend"

RUNTIME_DATA_FILES = (
    Path("data/codenames_words.json"),
    Path("data/pictionary_words.json"),
)


def _copy_file(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def main() -> None:
    # Only generated content is removed. cloudflare/entry.py is tracked and is
    # intentionally left in place as Wrangler's stable entrypoint.
    for generated in (STAGE / "worker_runtime.py", STAGE / "server.py"):
        generated.unlink(missing_ok=True)
    if BACKEND_TARGET.exists():
        shutil.rmtree(BACKEND_TARGET)

    _copy_file(ROOT / "worker.py", STAGE / "worker_runtime.py")
    _copy_file(ROOT / "server.py", STAGE / "server.py")

    for source in BACKEND_SOURCE.rglob("*.py"):
        relative = source.relative_to(BACKEND_SOURCE)
        _copy_file(source, BACKEND_TARGET / relative)

    for relative in RUNTIME_DATA_FILES:
        _copy_file(BACKEND_SOURCE / relative, BACKEND_TARGET / relative)

    python_files = sum(1 for _ in BACKEND_TARGET.rglob("*.py"))
    print(
        "Prepared Cloudflare runtime: "
        f"{python_files} backend Python files + {len(RUNTIME_DATA_FILES)} data files"
    )


if __name__ == "__main__":
    main()
