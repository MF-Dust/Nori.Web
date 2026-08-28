from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = (ROOT / "public" / "index.html").read_text(encoding="utf-8")
SHIM = (ROOT / "public" / "nori-runtime-shims.js").read_text(encoding="utf-8")


def main() -> None:
    shim_script = '<script src="/nori-runtime-shims.js"></script>'
    app_script = '<script type="module" crossorigin src="/assets/index-CyHAbkO5.js"></script>'
    assert shim_script in INDEX
    assert app_script in INDEX
    assert INDEX.index(shim_script) < INDEX.index(app_script)

    assert 'url.pathname === "/api/debug/perf-vitals"' in SHIM
    assert "window.fetch = function noriFetch" in SHIM
    assert "navigator.sendBeacon = function noriSendBeacon" in SHIM

    # This shim must stay scoped to optional telemetry. Arcade transport and
    # application APIs must remain untouched.
    assert "WebSocket.prototype" not in SHIM
    assert "/api/arcade" not in SHIM

    print("[ok] browser runtime shim suppresses only optional perf-vitals telemetry")


if __name__ == "__main__":
    main()
