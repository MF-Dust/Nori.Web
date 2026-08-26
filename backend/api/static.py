"""Static file serving and SPA fallback routing."""

from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..core.config import PUBLIC_DIR

static_router = APIRouter(tags=["static"])


def register_mimetypes() -> None:
    """Register custom MIME types required by NoriOS frontend assets."""
    mimetypes.add_type("audio/mp4", ".m4a")
    mimetypes.add_type("audio/mpeg", ".mp3")
    mimetypes.add_type("audio/wav", ".wav")
    mimetypes.add_type("audio/ogg", ".ogg")
    mimetypes.add_type("application/octet-stream", ".moc3")
    mimetypes.add_type("application/javascript", ".worklet")
    mimetypes.add_type("model/gltf-binary", ".glb")


def safe_static_path(full_path: str) -> Optional[Path]:
    requested = (PUBLIC_DIR / full_path).resolve()
    try:
        requested.relative_to(PUBLIC_DIR.resolve())
    except ValueError:
        return None
    return requested


@static_router.get("/{full_path:path}")
async def serve_static_or_spa(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    file_path = safe_static_path(full_path)
    if file_path and file_path.is_file():
        media_type, _ = mimetypes.guess_type(str(file_path))
        return FileResponse(
            file_path,
            media_type=media_type or "application/octet-stream",
            headers={"Cache-Control": "no-cache" if file_path.suffix == ".html" else "public, max-age=31536000, immutable"},
        )
    index = PUBLIC_DIR / "index.html"
    if index.is_file():
        return FileResponse(index, media_type="text/html; charset=utf-8", headers={"Cache-Control": "no-cache"})
    raise HTTPException(status_code=404, detail="Not found")
