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

    assert 'pathnameOf(value) === "/api/debug/perf-vitals"' in SHIM
    assert "window.fetch = function noriFetch" in SHIM
    assert "navigator.sendBeacon = function noriSendBeacon" in SHIM

    # Runtime compatibility additions may handle the local guest access gate,
    # but they must never patch Arcade/WebSocket transport or intercept general
    # application API traffic.
    assert "WebSocket.prototype" not in SHIM
    assert "/api/arcade" not in SHIM

    print("[ok] browser runtime shim preserves telemetry and transport boundaries")


if __name__ == "__main__":
    main()
