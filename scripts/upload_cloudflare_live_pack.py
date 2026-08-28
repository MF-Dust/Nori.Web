"""Prepare and optionally upload a memory-safe Cloudflare live-world layout.

The source archive remains `backend/data/live_world_pack.json`. Cloudflare
receives a lightweight core, four artifact sections, a small browser index,
and hashed browser shards in the existing private R2 bucket.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PACK = ROOT / "backend" / "data" / "live_world_pack.json"
R2_PREFIX = "runtime/live"
HEAVY_KEYS = {
    "mail_artifacts",
    "file_artifacts",
    "signal_thread_artifacts",
    "signal_message_artifacts",
    "browser_pages",
}


def canonical_lookup(url: str) -> str:
    raw = (url or "").strip()
    try:
        parts = urlsplit(raw)
    except Exception:
        return raw.lower()
    if not parts.netloc:
        return re.sub(r"/{2,}", "/", raw).lower()
    path = re.sub(r"/{2,}", "/", parts.path or "")
    query = f"?{parts.query}" if parts.query else ""
    return f"{parts.scheme.lower()}://{parts.netloc.lower()}{path}{query}"


def lookup_variants(url: str) -> set[str]:
    c = canonical_lookup(url)
    variants = {c, c.rstrip("/"), c.rstrip("/") + "/"}
    if "://" in c:
        swapped = (
            "https://" + c.split("://", 1)[1]
            if c.startswith("http://")
            else "http://" + c.split("://", 1)[1]
        )
        variants.update({swapped, swapped.rstrip("/"), swapped.rstrip("/") + "/"})
    return {item for item in variants if item}


def _page_seed(entry: dict[str, Any], index: int) -> str:
    data = entry.get("data") if isinstance(entry.get("data"), dict) else {}
    for value in (entry.get("key"), data.get("url"), entry.get("id")):
        if isinstance(value, str) and value:
            return canonical_lookup(value)
    return f"page-{index}"


def partition_pack(pack: dict[str, Any], shard_count: int = 32) -> dict[str, Any]:
    if shard_count < 1 or shard_count > 256:
        raise ValueError("shard_count must be between 1 and 256")

    objects: dict[str, Any] = {
        f"{R2_PREFIX}/core.json": {
            key: value for key, value in pack.items() if key not in HEAVY_KEYS
        },
        f"{R2_PREFIX}/mail_artifacts.json": pack.get("mail_artifacts", []),
        f"{R2_PREFIX}/file_artifacts.json": pack.get("file_artifacts", []),
        f"{R2_PREFIX}/signal_thread_artifacts.json": pack.get(
            "signal_thread_artifacts", []
        ),
        f"{R2_PREFIX}/signal_message_artifacts.json": pack.get(
            "signal_message_artifacts", []
        ),
    }

    pages = pack.get("browser_pages")
    pages = pages if isinstance(pages, list) else []
    width = max(2, len(f"{shard_count - 1:x}"))
    shards: dict[str, list[dict[str, Any]]] = {}
    entries: dict[str, str] = {}

    for index, raw_entry in enumerate(pages):
        if not isinstance(raw_entry, dict):
            continue
        seed = _page_seed(raw_entry, index)
        number = int.from_bytes(
            hashlib.sha256(seed.encode("utf-8")).digest()[:4], "big"
        )
        shard = f"{number % shard_count:0{width}x}"
        shards.setdefault(shard, []).append(raw_entry)

        data = raw_entry.get("data") if isinstance(raw_entry.get("data"), dict) else {}
        aliases = {
            raw_entry.get("key"),
            data.get("url"),
            *(raw_entry.get("aliases") or []),
        }
        for alias in aliases:
            if not isinstance(alias, str) or not alias:
                continue
            for variant in lookup_variants(alias):
                entries.setdefault(variant, shard)

    objects[f"{R2_PREFIX}/browser-index.json"] = {
        "version": 1,
        "shards": shard_count,
        "entries": entries,
    }
    for shard, shard_pages in sorted(shards.items()):
        objects[f"{R2_PREFIX}/browser/{shard}.json"] = shard_pages
    return objects


def _write_object(root: Path, key: str, data: Any) -> Path:
    target = root / Path(*key.split("/"))
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    return target


def _pywrangler_command() -> list[str]:
    executable = shutil.which("pywrangler")
    if executable:
        return [executable]
    return ["uv", "run", "pywrangler"]


def upload_objects(bucket: str, files: list[tuple[str, Path]]) -> None:
    base = _pywrangler_command()
    total = len(files)
    for position, (key, path) in enumerate(files, 1):
        print(
            f"[{position:02d}/{total:02d}] {key} "
            f"({path.stat().st_size / 1024:.1f} KiB)"
        )
        subprocess.run(
            [
                *base,
                "r2",
                "object",
                "put",
                f"{bucket}/{key}",
                f"--file={path}",
                "--content-type=application/json",
                "--remote",
            ],
            cwd=ROOT,
            check=True,
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bucket", default="nori-web-assets")
    parser.add_argument("--shards", type=int, default=32)
    parser.add_argument(
        "--upload",
        action="store_true",
        help="Upload the prepared objects to R2. Without this flag only report sizes.",
    )
    args = parser.parse_args()

    pack = json.loads(SOURCE_PACK.read_text(encoding="utf-8"))
    if not isinstance(pack, dict):
        raise SystemExit("live_world_pack.json root must be a JSON object")

    objects = partition_pack(pack, args.shards)
    with tempfile.TemporaryDirectory(prefix="nori-live-pack-") as temp:
        root = Path(temp)
        files = [(key, _write_object(root, key, data)) for key, data in objects.items()]
        total_bytes = sum(path.stat().st_size for _, path in files)
        largest = max(files, key=lambda item: item[1].stat().st_size)

        print(
            f"Prepared {len(files)} R2 objects from {SOURCE_PACK.name}: "
            f"{total_bytes / 1024 / 1024:.2f} MiB total"
        )
        print(
            f"Largest object: {largest[0]} "
            f"({largest[1].stat().st_size / 1024:.1f} KiB)"
        )
        if not args.upload:
            print("Dry run only. Re-run with --upload to write these objects to R2.")
            return
        upload_objects(args.bucket, files)

    print("Live-world R2 layout uploaded successfully.")


if __name__ == "__main__":
    main()
