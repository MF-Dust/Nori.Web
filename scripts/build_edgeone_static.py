"""Build a standalone EdgeOne direct-upload ZIP; never alter public/."""
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TREES = ("ARGNori_web", "Nori_web", "fonts", "ocean", "cubism_sdk")
MAX_FILE_BYTES = 25_000_000
MAX_FILES = 20_000
MAX_TOTAL_BYTES = 5_000_000_000


def build(source: Path, output: Path) -> tuple[int, int]:
    files = []
    # Font and Cubism notices must travel with the separately hosted files.
    for tree in (*TREES, "legal"):
        directory = source / tree
        if not directory.is_dir():
            raise ValueError(f"Missing resource directory: {directory}")
        files.extend((p.relative_to(source).as_posix(), p) for p in sorted(directory.rglob("*")) if p.is_file())
    css = re.sub(r'url\(([\"\']?)/fonts/', r'url(\1./fonts/', (source / "fonts.css").read_text()).encode()
    cors = {"key": "Access-Control-Allow-Origin", "value": "*"}
    generated = {
        "fonts.css": css,
        "index.html": b'<!doctype html><meta charset="utf-8"><title>Nori Static Assets</title>\n',
        "edgeone.json": json.dumps({"headers": [
            {"source": "/*", "headers": [cors, {"key": "Cache-Control", "value": "public, max-age=300"}]},
            *({"source": f"/{tree}/*", "headers": [cors, {"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]} for tree in TREES),
        ]}, indent=2).encode(),
    }
    sizes = [(name, path.stat().st_size) for name, path in files] + [(name, len(data)) for name, data in generated.items()]
    for name, size in sizes:
        if size > MAX_FILE_BYTES:
            raise ValueError(f"File exceeds {MAX_FILE_BYTES} bytes: {name} ({size})")
    total = sum(size for _, size in sizes)
    if len(sizes) > MAX_FILES or total > MAX_TOTAL_BYTES:
        raise ValueError(f"Static project quota exceeded: {len(sizes)} files, {total} bytes")
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, path in files:
            archive.write(path, name)
        for name, data in generated.items():
            archive.writestr(name, data)
    return len(sizes), total


if __name__ == "__main__":
    output = ROOT / ".artifacts/edgeone/nori-eo-static.zip"
    count, size = build(ROOT / "public", output)
    print(f"{output}\n{count} files, {size / 1048576:.1f} MiB uncompressed")
