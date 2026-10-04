"""Legacy smoke command; now verifies the Rust local distribution."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from scripts import smoke_release


def main() -> None:
    print("[release] smoke_nuitka.py now uses Rust; prefer scripts/smoke_release.py.", file=sys.stderr)
    smoke_release.main()


if __name__ == "__main__":
    main()
