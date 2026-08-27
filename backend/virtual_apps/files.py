"""Virtual Files application service.

Serves archived production file artifacts verbatim when the live pack is
installed; otherwise falls back to the built-in demo volume set.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List

from . import live_pack

COLD_VOLUMES = [
    {
        "id": "vol_01",
        "name": "Nori Memory Core",
        "size": "512 MB",
        "sealed": False,
        "files": ["personality_matrix.bin", "live2d_motion_cache.dat"],
    },
    {
        "id": "vol_02",
        "name": "Deep Datasea Archive",
        "size": "2.4 GB",
        "sealed": True,
        "files": ["ocean_echo_sub.dat", "corrupted_signal.log"],
    },
]

VIRTUAL_FILES: List[Dict[str, Any]] = [
    {
        "id": "file_matrix",
        "display_path": "personality_matrix.bin",
        "mime": "application/octet-stream",
        "folder": "Nori Core",
    },
    {
        "id": "file_readme",
        "display_path": "readme.txt",
        "mime": "text/plain",
        "folder": "Documents",
        "content": "NoriOS Local Compatibility Environment\nAll components unlocked by default.",
    },
]


def list_device_volumes() -> List[Dict[str, Any]]:
    return COLD_VOLUMES


def unseal_volume(volume_id: str, key: str) -> Dict[str, Any]:
    for v in COLD_VOLUMES:
        if v["id"] == volume_id:
            v["sealed"] = False
            return {"success": True, "volume": v}
    return {"success": False, "error": "Volume not found"}


def get_file_artifacts(now_ms: int | None = None) -> List[Dict[str, Any]]:
    """Export file objects formatted as Manifold artifacts."""
    if live_pack.is_available():
        return live_pack.file_artifacts()

    now = int(time.time() * 1000) if now_ms is None else now_ms
    artifacts = []
    for file_info in VIRTUAL_FILES:
        artifact = {
            "id": file_info["id"],
            "type": "file",
            "surfacedAt": now - 3600000,
            "data": {
                "display_path": file_info["display_path"],
                "mime": file_info["mime"],
                "folder": file_info["folder"],
            },
        }
        if "content" in file_info:
            artifact["data"]["content"] = file_info["content"]
        artifacts.append(artifact)
    return artifacts
