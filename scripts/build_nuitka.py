"""Legacy build command; now builds the Rust local distribution, not Nuitka."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from scripts import build_release


def build(*, clean: bool = True, allow_untracked: bool = False) -> Path:
    print("[release] build_nuitka.py now uses Rust; prefer scripts/build_release.py.", file=sys.stderr)
    if not clean:
        print(
            "[release] --no-clean is obsolete: Cargo reuses its compilation cache; release files are always rebuilt.",
            file=sys.stderr,
        )
    return build_release.build(allow_untracked=allow_untracked)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--no-clean", action="store_true", help="deprecated compatibility flag; release files are always rebuilt")
    parser.add_argument(
        "--allow-untracked",
        action="store_true",
        help="include untracked source files and mark the build development-only",
    )
    args = parser.parse_args()
    build(clean=not args.no_clean, allow_untracked=args.allow_untracked)


if __name__ == "__main__":
    main()
