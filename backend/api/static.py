"""Static file serving, Range requests, ETag caching, and SPA fallback routing."""

from __future__ import annotations

import mimetypes
import re
from pathlib import Path
from typing import Generator, Optional

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import FileResponse, StreamingResponse

from ..core.config import PUBLIC_DIR

static_router = APIRouter(tags=["static"])

RANGE_PATTERN = re.compile(r"^bytes=(\d*)-(\d*)$")


def register_mimetypes() -> None:
    """Register custom MIME types required by NoriOS frontend assets."""
    mimetypes.add_type("audio/mp4", ".m4a")
    mimetypes.add_type("audio/mpeg", ".mp3")
    mimetypes.add_type("audio/wav", ".wav")
    mimetypes.add_type("audio/ogg", ".ogg")
    mimetypes.add_type("application/octet-stream", ".moc3")
    mimetypes.add_type("application/javascript", ".worklet")
    mimetypes.add_type("model/gltf-binary", ".glb")
    mimetypes.add_type("font/woff2", ".woff2")


def safe_static_path(full_path: str) -> Optional[Path]:
    requested = (PUBLIC_DIR / full_path).resolve()
    try:
        requested.relative_to(PUBLIC_DIR.resolve())
    except ValueError:
        return None
    return requested


def get_cache_control(file_path: Path) -> str:
    """Determine cache control header based on file immutability."""
    name = file_path.name.lower()
    suffix = file_path.suffix.lower()
    if name in {"index.html", "sw.js", "asset-manifest.json"} or suffix == ".html":
        return "no-cache, no-transform"
    return "public, max-age=31536000, immutable"


def file_range_iterator(file_path: Path, start: int, end: int, chunk_size: int = 64 * 1024) -> Generator[bytes, None, None]:
    """Stream sliced bytes for HTTP 206 Partial Content responses."""
    with open(file_path, "rb") as f:
        f.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            bytes_to_read = min(remaining, chunk_size)
            chunk = f.read(bytes_to_read)
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


@static_router.get("/{full_path:path}")
async def serve_static_or_spa(full_path: str, request: Request):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")

    file_path = safe_static_path(full_path)
    if not (file_path and file_path.is_file()):
        file_path = PUBLIC_DIR / "index.html"
        if not file_path.is_file():
            raise HTTPException(status_code=404, detail="Not found")

    stat_res = file_path.stat()
    file_size = stat_res.st_size
    etag = f'"{int(stat_res.st_mtime):x}-{file_size:x}"'
    cache_control = get_cache_control(file_path)

    # 1. Handle Conditional GET (If-None-Match -> 304)
    if_none_match = request.headers.get("if-none-match")
    if if_none_match:
        client_etags = [t.strip() for t in if_none_match.split(",")]
        if etag in client_etags or f"W/{etag}" in client_etags or "*" in client_etags:
            return Response(
                status_code=304,
                headers={
                    "ETag": etag,
                    "Cache-Control": cache_control,
                    "Accept-Ranges": "bytes",
                },
            )

    media_type, _ = mimetypes.guess_type(str(file_path))
    media_type = media_type or "application/octet-stream"

    # 2. Handle HTTP Range Requests (HTTP 206 Partial Content)
    range_header = request.headers.get("range")
    if range_header and file_size > 0:
        match = RANGE_PATTERN.match(range_header.strip())
        if match:
            start_str, end_str = match.groups()
            if start_str and end_str:
                start = int(start_str)
                end = min(int(end_str), file_size - 1)
            elif start_str:
                start = int(start_str)
                end = file_size - 1
            elif end_str:
                start = max(0, file_size - int(end_str))
                end = file_size - 1
            else:
                start = 0
                end = file_size - 1

            if start <= end < file_size:
                content_length = end - start + 1
                headers = {
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(content_length),
                    "Content-Type": media_type,
                    "ETag": etag,
                    "Cache-Control": cache_control,
                }
                return StreamingResponse(
                    file_range_iterator(file_path, start, end),
                    status_code=206,
                    headers=headers,
                )
            else:
                return Response(
                    status_code=416,
                    headers={
                        "Content-Range": f"bytes */{file_size}",
                        "Accept-Ranges": "bytes",
                    },
                )

    # 3. Standard File Response
    return FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "ETag": etag,
            "Cache-Control": cache_control,
            "Accept-Ranges": "bytes",
        },
    )

