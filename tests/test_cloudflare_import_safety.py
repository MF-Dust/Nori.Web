"""Regression checks for Cloudflare Python Worker startup restrictions.

Workers load modules from a read-only filesystem and forbid randomness while
the Worker starts (``OSError: Randomness is not allowed while a Worker is
starting``), which fails deployment validation with code 10021.
"""

from __future__ import annotations

import os
import pathlib
import runpy
import secrets
import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

_original_mkdir = pathlib.Path.mkdir


def _blocked_mkdir(self, *args, **kwargs):
    raise AssertionError(f"import-time mkdir is not Cloudflare-safe: {self}")


pathlib.Path.mkdir = _blocked_mkdir
try:
    import backend.core.config  # noqa: F401
finally:
    pathlib.Path.mkdir = _original_mkdir

print("[ok] backend.core.config imports without filesystem mutations")


def _blocked_entropy(*args, **kwargs):
    raise AssertionError("import-time randomness is not Cloudflare-safe")


config_path = ROOT / "backend" / "core" / "config.py"
with patch.object(sys, "platform", "emscripten"), patch.dict(os.environ, {}, clear=True), patch.object(
    secrets, "token_urlsafe", _blocked_entropy
), patch.object(secrets, "token_bytes", _blocked_entropy), patch.object(os, "urandom", _blocked_entropy):
    namespace = runpy.run_path(str(config_path))
assert namespace["SECRET_KEY"] == "", "the Worker key must come from runtime bindings"

print("[ok] backend.core.config uses no randomness while a Worker starts")
