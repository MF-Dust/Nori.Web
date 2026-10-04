"""Collect legal notices and corresponding sources for local desktop releases.

The Python collector requires an ordinary PyPI environment; patched dependencies
need their modified source, not an upstream sdist.
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
import tempfile
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


def archive_project(destination: Path, root: Path = ROOT, *, allow_untracked: bool = False) -> None:
    untracked = subprocess.check_output(
        ["git", "ls-files", "--others", "--exclude-standard", "-z"], cwd=root
    )
    extra = set(filter(None, untracked.decode("utf-8").split("\0")))
    allowed_locks = {"uv.lock", "rust/Cargo.lock"}
    if extra - allowed_locks and not allow_untracked:
        raise RuntimeError("Stage intended source/legal files with git add before packaging; untracked files are not archived.")
    files = set(subprocess.check_output(["git", "ls-files", "--cached", "-z"], cwd=root).decode("utf-8").split("\0")) | extra
    # strict_timestamps=False clamps pre-1980 mtimes (ZIP cannot store them).
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED, strict_timestamps=False) as archive:
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


GPL_COMPATIBLE_LICENSES = {
    "MIT",
    "Apache-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "ISC",
    "Zlib",
    "0BSD",
    "CC0-1.0",
    "Unlicense",
    "BSL-1.0",
    "Unicode-3.0",
    "Unicode-DFS-2016",
    "MPL-2.0",
    "GPL-3.0",
    "GPL-3.0-only",
    "GPL-3.0-or-later",
    "GPL-3.0+",
    "LGPL-2.1",
    "LGPL-2.1-only",
    "LGPL-2.1-or-later",
    "LGPL-2.1+",
    "LGPL-3.0",
    "LGPL-3.0-only",
    "LGPL-3.0-or-later",
    "LGPL-3.0+",
    "CDLA-Permissive-2.0",
}
GPL_COMPATIBLE_WITH = {("Apache-2.0", "LLVM-exception")}

# Crates whose published package omits the license text although their
# declared license is one this project already ships verbatim. Pinned by
# version so an upgrade is re-reviewed. The supplied text is the project's own
# LICENSE (GPL-3.0); the notice records where the declaration comes from.
LICENSE_TEXT_SUPPLEMENTS = {
    ("shakmaty", "0.30.1"): {
        "license": "GPL-3.0-or-later",
        "text": "LICENSE",
        "notice": (
            "shakmaty 0.30.1 (https://github.com/niklasf/shakmaty) by Niklas Fiekas.\n"
            "Its Cargo.toml declares `license = \"GPL-3.0-or-later\"` and its README states:\n"
            "\"shakmaty is licensed under the GPL-3.0 (or any later version at your option).\"\n"
            "The published crate does not include the license text; COPYING is the\n"
            "GNU General Public License version 3 text shipped with this project.\n"
        ),
    },
}


def normalize_spdx(expression: str) -> str:
    """Read legacy crates.io `MIT/Apache-2.0` lists as `MIT OR Apache-2.0`."""
    return re.sub(r"\s*/\s*", " OR ", expression.strip())


class _SpdxPolicyParser:
    def __init__(self, expression: str):
        self.tokens = re.findall(r"\(|\)|[^\s()]+", expression)
        self.position = 0

    def parse(self) -> bool:
        result = self._parse_or()
        if self.position != len(self.tokens):
            raise ValueError("Unexpected SPDX token")
        return result

    def _peek(self) -> str | None:
        return self.tokens[self.position] if self.position < len(self.tokens) else None

    def _take(self) -> str:
        token = self._peek()
        if token is None:
            raise ValueError("Unexpected end of SPDX expression")
        self.position += 1
        return token

    def _parse_or(self) -> bool:
        value = self._parse_and()
        while self._peek() == "OR":
            self._take()
            right = self._parse_and()
            value = value or right
        return value

    def _parse_and(self) -> bool:
        value = self._parse_term()
        while self._peek() == "AND":
            self._take()
            right = self._parse_term()
            value = value and right
        return value

    def _parse_term(self) -> bool:
        if self._peek() == "(":
            self._take()
            value = self._parse_or()
            if self._take() != ")":
                raise ValueError("Unclosed SPDX parenthesis")
            return value

        license_id = self._take()
        if license_id in {"AND", "OR", "WITH", ")"}:
            raise ValueError("Expected SPDX license identifier")
        if self._peek() == "WITH":
            self._take()
            exception = self._take()
            return (license_id, exception) in GPL_COMPATIBLE_WITH
        return license_id in GPL_COMPATIBLE_LICENSES


def spdx_is_gpl_compatible(expression: str | None) -> bool:
    if not expression:
        return False
    try:
        return _SpdxPolicyParser(normalize_spdx(expression)).parse()
    except ValueError:
        return False


def _rust_linked_packages(root: Path, target_triple: str) -> tuple[dict, dict, list[dict]]:
    manifest = root / "rust" / "Cargo.toml"
    metadata = json.loads(
        subprocess.check_output(
            [
                "cargo", "metadata", "--format-version", "1", "--locked",
                "--filter-platform", target_triple, "--manifest-path", str(manifest),
            ],
            cwd=root,
            text=True,
        )
    )
    local_manifest = (root / "rust" / "crates" / "nori-local" / "Cargo.toml").resolve()
    roots = [
        package for package in metadata["packages"]
        if package["name"] == "nori-local" and Path(package["manifest_path"]).resolve() == local_manifest
    ]
    if len(roots) != 1:
        raise RuntimeError(f"Expected one nori-local package in cargo metadata, found {len(roots)}")
    root_package = roots[0]

    tree = subprocess.check_output(
        [
            "cargo", "tree", "--locked", "--manifest-path", str(manifest), "-p", "nori-local",
            "--target", target_triple, "-e", "normal", "--prefix", "none", "--format", "{p}",
        ],
        cwd=root,
        text=True,
    )
    tree_keys = set()
    for line in tree.splitlines():
        match = re.match(r"^(\S+) v([^\s(]+)(?:\s+\(.*\))?$", line.strip())
        if not match:
            raise RuntimeError(f"Cannot parse cargo tree package: {line}")
        tree_keys.add((match.group(1), match.group(2)))

    packages_by_key = {}
    for package in metadata["packages"]:
        packages_by_key.setdefault((package["name"], package["version"]), []).append(package)
    root_key = (root_package["name"], root_package["version"])
    missing = sorted(tree_keys - packages_by_key.keys())
    if missing:
        raise RuntimeError(f"cargo tree packages missing from cargo metadata: {missing}")
    linked = []
    for key in sorted(tree_keys - {root_key}):
        candidates = packages_by_key[key]
        if len(candidates) != 1:
            raise RuntimeError(f"Ambiguous cargo metadata package for cargo tree entry {key}")
        linked.append(candidates[0])
    return root_package, metadata, sorted(linked, key=lambda item: (item["name"].lower(), item["version"]))


def _vendor_directories(vendor_root: Path) -> dict[tuple[str, str], Path]:
    found = {}
    for manifest in vendor_root.glob("*/Cargo.toml"):
        try:
            package = tomllib.loads(manifest.read_text(encoding="utf-8"))["package"]
        except (OSError, KeyError, tomllib.TOMLDecodeError):
            continue
        found[(package.get("name", ""), package.get("version", ""))] = manifest.parent
    return found


def _crate_license_files(package: dict, package_root: Path, root: Path) -> list[Path]:
    paths = {
        path for path in package_root.rglob("*")
        if path.is_file() and re.match(r"^(LICENSE|LICENCE|COPYING|NOTICE)([._-].*)?$", path.name, re.I)
    }
    license_file = package.get("license_file")
    if license_file:
        declared = Path(license_file)
        declared = declared if declared.is_absolute() else package_root / declared
        try:
            if declared.resolve().is_relative_to(package_root.resolve()) and declared.is_file():
                paths.add(declared)
        except OSError:
            pass
    if not paths and package.get("source") is None and (root / "LICENSE").is_file():
        paths.add(root / "LICENSE")
    return sorted(paths, key=lambda path: path.as_posix().lower())


def _crate_tree_checksum(directory: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted((item for item in directory.rglob("*") if item.is_file()), key=lambda item: item.as_posix()):
        if path.name in {".cargo-checksum.json", ".cargo-ok"}:
            continue
        digest.update(path.relative_to(directory).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
    return digest.hexdigest()


def prepare_rust_legal_bundle(
    destination: Path,
    *,
    target_triple: str,
    root: Path = ROOT,
    allow_untracked: bool = False,
) -> list[dict]:
    """Collect the host-target nori-local dependency sources and notices."""
    destination.mkdir(parents=True, exist_ok=True)
    for name in NOTICE_FILES:
        shutil.copy2(root / name, destination / name)
        if (root / name).read_bytes() != (root / "public/legal" / name).read_bytes():
            raise RuntimeError(f"Stale browser notice {name}; run npm run legal:refresh")

    source_dir = destination / "source"
    source_dir.mkdir(exist_ok=True)
    archive_project(source_dir / "project.zip", root, allow_untracked=allow_untracked)
    root_package, _, linked = _rust_linked_packages(root, target_triple)

    with tempfile.TemporaryDirectory(prefix="nori-rust-vendor-") as temporary:
        vendor_root = Path(temporary) / "vendor"
        subprocess.run(
            ["cargo", "vendor", "--quiet", "--locked", "--manifest-path", str(root / "rust" / "Cargo.toml"), str(vendor_root)],
            cwd=root,
            check=True,
            stdout=subprocess.PIPE,
            text=True,
        )
        vendored = _vendor_directories(vendor_root)
        lock_data = tomllib.loads((root / "rust" / "Cargo.lock").read_text(encoding="utf-8"))
        lock_packages = lock_data.get("package", [])
        licenses_root = destination / "legal" / "licenses"
        licenses_root.mkdir(parents=True, exist_ok=True)
        failures = []
        records = []
        summary = [
            f"Rust host target: {target_triple}",
            f"Cargo package: {root_package['name']}=={root_package['version']}",
            f"Linked crates (excluding the binary package): {len(linked)}",
            "Policy: each SPDX expression must have an allowed GPL-3.0-or-later-compatible branch; AND requires all branches, OR requires one.",
            "",
        ]

        for package in linked:
            name, version = package["name"], package["version"]
            key = (name, version)
            source = package.get("source")
            crate_root = vendored.get(key) if source else Path(package["manifest_path"]).parent
            if source and crate_root is None:
                failures.append(f"{name}=={version}: source missing from cargo vendor output")
                continue
            expression = package.get("license")
            if not expression:
                failures.append(f"{name}=={version}: missing SPDX license expression")
            elif not spdx_is_gpl_compatible(expression):
                failures.append(f"{name}=={version}: incompatible or unknown SPDX expression {expression!r}")

            license_files = _crate_license_files(package, crate_root, root) if crate_root else []
            supplement = LICENSE_TEXT_SUPPLEMENTS.get(key)
            if not license_files and supplement and supplement["license"] == expression:
                license_dir = licenses_root / f"{name}-{version}"
                license_dir.mkdir(parents=True, exist_ok=True)
                shutil.copy2(root / supplement["text"], license_dir / "COPYING")
                (license_dir / "NOTICE.supplemental.txt").write_text(supplement["notice"], encoding="utf-8")
                summary.append(f"{name} {version}: license text supplied from project {supplement['text']} (see NOTICE.supplemental.txt)")
            elif not license_files:
                failures.append(f"{name}=={version}: missing license/notice files")
            else:
                license_dir = licenses_root / f"{name}-{version}"
                for license_path in license_files:
                    relative = license_path.relative_to(crate_root) if license_path.is_relative_to(crate_root) else Path(license_path.name)
                    target = license_dir / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(license_path, target)

            checksum = next(
                (
                    item.get("checksum") for item in lock_packages
                    if item.get("name") == name and item.get("version") == version and item.get("source") == source
                ),
                None,
            )
            if source and checksum is None and crate_root:
                checksum_file = crate_root / ".cargo-checksum.json"
                if checksum_file.is_file():
                    checksum = json.loads(checksum_file.read_text(encoding="utf-8")).get("package")
                if checksum is None:
                    checksum = _crate_tree_checksum(crate_root)
            records.append(
                {
                    "name": name,
                    "version": version,
                    "license_expression": expression,
                    "repository": package.get("repository"),
                    "checksum": checksum,
                    "source": source or "workspace",
                }
            )
            summary.append(f"{name} {version}: {expression or 'MISSING'}")

        if failures:
            for failure in failures:
                print(f"[license-policy] {failure}", file=sys.stderr, flush=True)
            raise RuntimeError(f"Rust dependency license policy rejected {len(failures)} issue(s)")

        # crates.io packages may carry epoch mtimes; ZIP cannot store pre-1980.
        with zipfile.ZipFile(
            source_dir / "rust-vendor.zip", "w", compression=zipfile.ZIP_DEFLATED, strict_timestamps=False
        ) as archive:
            for package in linked:
                if not package.get("source"):
                    continue
                crate_root = vendored[(package["name"], package["version"])]
                archive_prefix = f"vendor/{crate_root.name}/"
                for path in sorted(item for item in crate_root.rglob("*") if item.is_file()):
                    archive.write(path, archive_prefix + path.relative_to(crate_root).as_posix())

        (source_dir / "dependencies.json").write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")
        (destination / "RUST-LICENSE-SUMMARY.txt").write_text("\n".join(summary) + "\n", encoding="utf-8")
        dev_note = (
            "This development build's project.zip includes untracked worktree files collected using --allow-untracked.\n"
            if allow_untracked else ""
        )
        (source_dir / "README.md").write_text(
            "# Rust corresponding source\n\n"
            "`project.zip` contains the actual project worktree used for this build. "
            "`rust-vendor.zip` contains exact vendored source for the normal host-target dependency graph of `nori-local`; "
            "`dependencies.json` records each linked crate's version, license expression, repository, checksum, and source.\n\n"
            f"{dev_note}"
            "Rebuild with the Rust toolchain version recorded in `../BUILD_INFO.txt` using:\n\n"
            "```sh\n"
            "cargo build --release --locked -p nori-local --manifest-path rust/Cargo.toml\n"
            "```\n\n"
            "The root `RUST-LICENSE-SUMMARY.txt` records the license policy results for this bundle. "
            "Project-owned assets may have separate rights; see COPYRIGHT.md before redistribution.\n",
            encoding="utf-8",
        )
    return records
