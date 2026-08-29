from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEADERS = (ROOT / "public" / "_headers").read_text(encoding="utf-8")


def main() -> None:
    assert "/assets/*" in HEADERS
    assert "Cache-Control: public, max-age=31536000, immutable" in HEADERS

    # Mutable bootstrap files keep revalidation semantics so a new deployment
    # cannot strand browsers on an old runtime shim or AI settings bridge.
    for path in ("/index.html", "/nori-ai-settings.js", "/nori-runtime-shims.js"):
        assert path in HEADERS
    assert HEADERS.count("Cache-Control: public, max-age=0, must-revalidate") >= 3

    # Stable-name Live2D/model resources are intentionally not marked immutable;
    # they may be replaced without a filename hash changing.
    assert "/ARGNori_web/*" not in HEADERS

    print("[ok] fingerprinted assets use immutable browser caching while mutable entry files revalidate")


if __name__ == "__main__":
    main()
