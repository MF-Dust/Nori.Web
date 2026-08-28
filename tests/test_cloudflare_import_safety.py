"""Regression check for Cloudflare's read-only Worker module filesystem."""

from __future__ import annotations

import pathlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_original_mkdir = pathlib.Path.mkdir


def _blocked_mkdir(self, *args, **kwargs):
    raise AssertionError(f"import-time mkdir is not Cloudflare-safe: {self}")


pathlib.Path.mkdir = _blocked_mkdir
try:
    import backend.core.config  # noqa: F401
finally:
    pathlib.Path.mkdir = _original_mkdir

print("[ok] backend.core.config imports without filesystem mutations")
