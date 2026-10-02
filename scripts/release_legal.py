"""Collect desktop licenses and corresponding source before Nuitka compilation.

Requires an ordinary, unmodified PyPI runtime environment. Patched dependencies
need their modified source supplied separately; an upstream sdist is not enough.
"""
from __future__ import annotations

import hashlib
import importlib.metadata as metadata
import json
import re
import shutil
import subprocess
import sys
import sysconfig
import tomllib
import zipfile
from collections import deque
from pathlib import Path
from urllib.request import urlopen

from packaging.requirements import Requirement
from packaging.utils import canonicalize_name

ROOT = Path(__file__).resolve().parent.parent
NOTICE_FILES = ("LICENSE", "COPYRIGHT.md", "THIRD_PARTY_NOTICES.md")


def runtime_distributions(root: Path = ROOT) -> list[metadata.Distribution]:
    project = tomllib.loads((root / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    pending = deque(Requirement(r) for r in project["dependencies"] + project["optional-dependencies"]["local"])
    visited = set()
    distributions = {}
    while pending:
        requirement = pending.popleft()
        if requirement.marker and not requirement.marker.evaluate():
            continue
        name = canonicalize_name(requirement.name)
        dist = metadata.distribution(name)
        if dist.version not in requirement.specifier:
            raise RuntimeError(f"Installed {name}=={dist.version} does not satisfy {requirement}")
        distributions[name] = dist
        key = (name, frozenset(requirement.extras))
        if key in visited:
            continue
        visited.add(key)
        for value in dist.requires or []:
            child = Requirement(value)
            if child.marker is None or any(
                child.marker.evaluate({"extra": extra}) for extra in {"", *requirement.extras}
            ):
                child.marker = None  # Already evaluated in the parent's extras context.
                pending.append(child)
    return [distributions[name] for name in sorted(distributions)]


def download_sdist(dist: metadata.Distribution, destination: Path) -> dict:
    name, version = dist.metadata["Name"], dist.version
    with urlopen(f"https://pypi.org/pypi/{name}/{version}/json", timeout=60) as response:
        release = json.load(response)
    source = next((f for f in release["urls"] if f["packagetype"] == "sdist"), None)
    if source is None:
        raise RuntimeError(f"No upstream source archive for {name}=={version}")
    filename = source["filename"]
    if Path(filename).name != filename or "\\" in filename:
        raise ValueError(f"Unsafe source filename: {filename}")
    with urlopen(source["url"], timeout=120) as response:
        data = response.read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != source["digests"]["sha256"]:
        raise RuntimeError(f"Source checksum mismatch: {filename}")
    (destination / filename).write_bytes(data)
    return {"name": name, "version": version, "file": filename, "url": source["url"], "sha256": digest}


def copy_dependency_licenses(dist: metadata.Distribution, destination: Path) -> None:
    directory = destination / f"{canonicalize_name(dist.metadata['Name'])}-{dist.version}"
    directory.mkdir(parents=True)
    found = False
    for file in dist.files or []:
        if re.match(r"^(licen[cs]e|copying|notice|copyright|authors)([.\-_]|$)", file.name, re.I):
            # Keep nested license filenames distinct, but never copy outside the destination.
            relative = Path(*[p for p in file.parts if p not in ("..", ".")])
            target = directory / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dist.locate_file(file), target)
            found = True
    # python-chess 1.999 is a metadata-only shim for chess and omits LICENSE
    # from its installed files. Its own METADATA declares GPL-3.0+; retain that
    # declaration and supply the full GPL text rather than dropping the notice.
    if not found and canonicalize_name(dist.metadata["Name"]) == "python-chess" and dist.metadata.get("License") == "GPL-3.0+":
        shutil.copy2(ROOT / "LICENSE", directory / "LICENSE")
        found = True
    if not found:
        raise RuntimeError(f"Missing installed license files for {dist.metadata['Name']}")
    (directory / "METADATA.txt").write_text(dist.read_text("METADATA") or "", encoding="utf-8")


def archive_project(destination: Path, root: Path = ROOT) -> None:
    untracked = subprocess.check_output(
        ["git", "ls-files", "--others", "--exclude-standard", "-z"], cwd=root
    )
    extra = set(filter(None, untracked.decode("utf-8").split("\0")))
    if extra - {"uv.lock"}:
        raise RuntimeError("Stage intended source/legal files with git add before packaging; untracked files are not archived.")
    files = set(subprocess.check_output(["git", "ls-files", "--cached", "-z"], cwd=root).decode("utf-8").split("\0")) | extra
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name in sorted(filter(None, files)):
            path = root / name
            if path.is_file():
                archive.write(path, name)  # Actual worktree bytes, including tracked modifications.


def prepare_legal_bundle(destination: Path, root: Path = ROOT) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for name in NOTICE_FILES:
        shutil.copy2(root / name, destination / name)
        if (root / name).read_bytes() != (root / "public/legal" / name).read_bytes():
            raise RuntimeError(f"Stale browser notice {name}; run npm run legal:refresh")
    source_dir = destination / "source"
    source_dir.mkdir()
    archive_project(source_dir / "project.zip", root)
    dependencies = source_dir / "dependencies"
    dependencies.mkdir()
    licenses = destination / "licenses"
    licenses.mkdir()
    python_license = next((p for p in (
        Path(sys.base_prefix) / "LICENSE.txt",
        Path(sysconfig.get_path("stdlib")) / "LICENSE.txt",
    ) if p.is_file()), None)
    if python_license is None:
        raise RuntimeError("Cannot locate the build interpreter's LICENSE.txt")
    shutil.copy2(python_license, licenses / "PYTHON-LICENSE.txt")
    records = []
    requirements = []
    for dist in runtime_distributions(root):
        print(f"[source] {dist.metadata['Name']}=={dist.version}", flush=True)
        copy_dependency_licenses(dist, licenses / "python")
        records.append(download_sdist(dist, dependencies))
        requirements.append(f"{dist.metadata['Name']}=={dist.version}")
    (source_dir / "dependencies.json").write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")
    (source_dir / "requirements-runtime.txt").write_text("\n".join(requirements) + "\n", encoding="utf-8")
    (source_dir / "README.md").write_text(
        "# Desktop corresponding source\n\n"
        "Unzip project.zip into a new directory. It contains the actual tracked worktree used for this build, "
        "including public assets, backend data, build scripts and license notices. Asset rights remain separate; "
        "read COPYRIGHT.md before redistribution.\n\n"
        f"Build interpreter: {sys.version}\n\n"
        "Create a virtual environment with that Python version, then install the pinned runtime:\n\n"
        "```sh\npython -m pip install -r ../requirements-runtime.txt\n"
        "python -m pip install nuitka==4.2 packaging\npython server.py\n```\n\n"
        "The same-version runtime source archives are in ../dependencies/ (URLs and SHA-256 in ../dependencies.json). "
        "To modify a dependency, unpack its archive and install that directory instead. "
        "Building native dependencies from source may also require their documented C/Rust build tools.\n\n"
        "For a standalone build, see docs/LOCAL_NUITKA.md. Initialize a Git repository and stage the unpacked files "
        "before running scripts/build_nuitka.py. No signing key or activation key is required to run a modified local build. "
        "The collector fetches upstream sources; if you patch a dependency, you must also replace its source delivery "
        "with the actual modified source. Do not describe an upstream sdist as your patched source.\n",
        encoding="utf-8",
    )
