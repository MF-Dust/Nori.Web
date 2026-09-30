from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

import httpx

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.api import static
from server import create_app

HEADERS = (ROOT / "public" / "_headers").read_text(encoding="utf-8")
MUTABLE_PATHS = (
    "/index.html", "/nori-ai-settings.js", "/nori-runtime-shims.js",
    "/nori-ai-provider-switch.js", "/nori-tts-settings.js",
    "/nori-ui-settings.js", "/nori-wallpaper-mode.js",
    "/nori-settings-glass.css", "/fonts.css",
)


async def verify_local_cache() -> None:
    original_public = static.PUBLIC_DIR
    try:
        with TemporaryDirectory() as directory:
            static.PUBLIC_DIR = Path(directory)
            (static.PUBLIC_DIR / "assets").mkdir()
            for path in (*MUTABLE_PATHS, "/assets/app-AbCd1234.js"):
                (static.PUBLIC_DIR / path.lstrip("/")).write_text("before", encoding="utf-8")
            transport = httpx.ASGITransport(app=create_app())
            async with httpx.AsyncClient(transport=transport, base_url="http://nori.test", headers={"Accept-Encoding": "identity"}) as client:
                for path in ("/", *MUTABLE_PATHS):
                    response = await client.get(path)
                    assert response.status_code == 200
                    cache = response.headers["cache-control"]
                    assert "immutable" not in cache, f"mutable bootstrap cannot be immutable: {path}"
                    assert "no-cache" in cache or "must-revalidate" in cache
                    revalidated = await client.get(path, headers={"If-None-Match": response.headers["etag"]})
                    assert revalidated.status_code == 304
                    assert revalidated.headers["cache-control"] == cache
                asset = await client.get("/assets/app-AbCd1234.js")
                assert "max-age=31536000" in asset.headers["cache-control"]
                assert "immutable" in asset.headers["cache-control"]

                # Same length, same second, different contents must not return
                # a stale 304 for a newly deployed mutable entry script.
                script = static.PUBLIC_DIR / "nori-runtime-shims.js"
                stamp = 1_700_000_000_100_000_000
                os.utime(script, ns=(stamp, stamp))
                before = await client.get("/nori-runtime-shims.js")
                script.write_text("after!", encoding="utf-8")
                os.utime(script, ns=(stamp, stamp + 1_000_000))
                changed = await client.get("/nori-runtime-shims.js", headers={"If-None-Match": before.headers["etag"]})
                assert changed.status_code == 200 and changed.text == "after!"
                assert changed.headers["etag"] != before.headers["etag"]
    finally:
        static.PUBLIC_DIR = original_public


def main() -> None:
    assert "/assets/*" in HEADERS
    assert "Cache-Control: public, max-age=31536000, immutable" in HEADERS

    # Mutable bootstrap files keep revalidation semantics so a new deployment
    # cannot strand browsers on an old runtime shim or AI settings bridge.
    for path in MUTABLE_PATHS:
        assert f"{path}\n  Cache-Control: public, max-age=0, must-revalidate" in HEADERS
    assert "\n/\n  Cache-Control: public, max-age=0, must-revalidate" in HEADERS

    # Stable-name Live2D/model resources are intentionally not marked immutable;
    # they may be replaced without a filename hash changing.
    assert "/ARGNori_web/*" not in HEADERS

    asyncio.run(verify_local_cache())
    print("[ok] local and edge bootstrap files revalidate; hashed assets remain immutable; same-second updates invalidate ETags")


if __name__ == "__main__":
    main()
