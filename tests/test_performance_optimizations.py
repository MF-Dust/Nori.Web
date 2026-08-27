"""Performance and static delivery optimization tests."""

import asyncio
from pathlib import Path
import sys
import threading
import time
import httpx
import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server import app

HOST = "127.0.0.1"
PORT = 4188
BASE_URL = f"http://{HOST}:{PORT}"


def run_server():
    uvicorn.run(app, host=HOST, port=PORT, log_level="warning")


async def verify_optimizations():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Test Gzip compression on large JS bundle
        res = await client.get(
            "/assets/NormalApp-Cn6agT0F.js",
            headers={"Accept-Encoding": "gzip"},
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert res.headers.get("content-encoding") == "gzip", "Missing gzip Content-Encoding header"
        assert "max-age=31536000" in res.headers.get("cache-control", ""), "Missing immutable Cache-Control"
        assert "etag" in res.headers, "Missing ETag header"
        etag = res.headers["etag"]
        print(f"[ok] Gzip compression verified: NormalApp-Cn6agT0F.js transferred with gzip (ETag: {etag})")

        # 2. Test CSS Gzip compression
        css_res = await client.get(
            "/assets/index-FU-0vwSE.css",
            headers={"Accept-Encoding": "gzip"},
        )
        assert css_res.status_code == 200
        assert css_res.headers.get("content-encoding") == "gzip"
        print("[ok] Gzip compression verified: index-FU-0vwSE.css transferred with gzip")

        # 3. Test Conditional GET (304 Not Modified)
        etag_res = await client.get(
            "/",
            headers={"If-None-Match": etag},
        )
        # Fetch root ETag first
        root_res = await client.get("/")
        assert root_res.status_code == 200
        root_etag = root_res.headers.get("etag")
        assert root_etag, "Root / index.html should have ETag"

        root_304 = await client.get("/", headers={"If-None-Match": root_etag})
        assert root_304.status_code == 304, f"Expected 304, got {root_304.status_code}"
        print(f"[ok] ETag & 304 Not Modified verified for index.html ({root_etag})")

        # 4. Test HTTP 206 Partial Content (Audio Range request)
        audio_url = "/audio/sfx/pop.mp3"
        # First check full audio
        audio_full = await client.get(audio_url)
        assert audio_full.status_code == 200
        total_len = len(audio_full.content)
        assert total_len > 0

        # Range request for first 100 bytes
        range_res = await client.get(audio_url, headers={"Range": "bytes=0-99"})
        assert range_res.status_code == 206, f"Expected 206, got {range_res.status_code}"
        assert range_res.headers.get("content-range") == f"bytes 0-99/{total_len}"
        assert len(range_res.content) == 100
        assert range_res.headers.get("accept-ranges") == "bytes"
        print(f"[ok] HTTP 206 Partial Content verified for audio range requests ({audio_url})")

        # 5. Test fonts.css and preloaded resources
        fonts_res = await client.get("/fonts.css")
        assert fonts_res.status_code == 200
        assert "SarasaFixed" in fonts_res.text
        assert "font-display: swap" in fonts_res.text
        print("[ok] fonts.css typography mapping verified")


def main():
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    time.sleep(0.8)
    asyncio.run(verify_optimizations())
    print("[ok] ALL performance and static delivery optimizations verified successfully!")


if __name__ == "__main__":
    main()
