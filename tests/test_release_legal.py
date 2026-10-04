"""Focused checks for source/notice delivery (no compiler or network required)."""
from __future__ import annotations

import hashlib
import io
import json
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from scripts import release_legal as legal

ROOT = Path(__file__).resolve().parent.parent


class ReleaseLegalTests(unittest.TestCase):
    def test_spdx_gpl_compatibility_policy(self):
        cases = {
            "MIT OR Proprietary": True,
            "MIT AND Apache-2.0": True,
            "MIT AND Proprietary": False,
            "Apache-2.0 WITH LLVM-exception": True,
            "MIT WITH LLVM-exception": False,
            "(MIT OR Proprietary) AND GPL-3.0-or-later": True,
            "MIT OR (Proprietary AND Unknown-License)": True,
            "(MIT AND Proprietary) OR Unknown-License": False,
            "Unknown-License": False,
            "(MIT OR Apache-2.0": False,
            # Legacy crates.io slash lists mean OR.
            "MIT/Apache-2.0": True,
            "MIT / Proprietary": True,
            "Proprietary/Unknown-License": False,
        }
        for expression, expected in cases.items():
            with self.subTest(expression=expression):
                self.assertEqual(legal.spdx_is_gpl_compatible(expression), expected)

    def test_license_text_supplements_are_version_pinned(self):
        # Only exact name/version pairs whose declared license matches the
        # shipped text may be supplemented; anything else must still fail.
        for (name, version), supplement in legal.LICENSE_TEXT_SUPPLEMENTS.items():
            with self.subTest(crate=f"{name}=={version}"):
                self.assertTrue(version and version[0].isdigit())
                self.assertTrue(legal.spdx_is_gpl_compatible(supplement["license"]))
                self.assertTrue((legal.ROOT / supplement["text"]).is_file())
                self.assertIn(name, supplement["notice"])

    def test_project_archive_uses_worktree_and_rejects_untracked_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            (root / "server.py").write_text("old", encoding="utf-8")
            subprocess.run(["git", "add", "server.py"], cwd=root, check=True)
            (root / "server.py").write_text("actual build source", encoding="utf-8")
            (root / "uv.lock").write_text("generated lock", encoding="utf-8")
            (root / "rust").mkdir()
            (root / "rust/Cargo.lock").write_text("generated Cargo lock", encoding="utf-8")
            with tempfile.TemporaryDirectory() as out:
                archive = Path(out) / "project.zip"
                legal.archive_project(archive, root)
                with zipfile.ZipFile(archive) as source:
                    self.assertEqual(source.read("server.py"), b"actual build source")
                    self.assertIn("uv.lock", source.namelist())
                    self.assertIn("rust/Cargo.lock", source.namelist())
                (root / "forgotten.py").write_text("untracked", encoding="utf-8")
                with self.assertRaisesRegex(RuntimeError, "git add"):
                    legal.archive_project(archive, root)
                legal.archive_project(archive, root, allow_untracked=True)
                with zipfile.ZipFile(archive) as source:
                    self.assertEqual(source.read("forgotten.py"), b"untracked")

    def test_dependency_graph_honors_extras_and_platform_markers(self):
        deps = {
            "service": SimpleNamespace(version="1.0", requires=['transport[standard]>=1', 'other; sys_platform == "never"']),
            "transport": SimpleNamespace(version="1.0", requires=['extra-lib; extra == "standard"']),
            "extra-lib": SimpleNamespace(version="1.0", requires=[]),
        }
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "pyproject.toml").write_text('[project]\ndependencies=["service"]\n[project.optional-dependencies]\nlocal=[]\n')
            with patch.object(legal.metadata, "distribution", side_effect=deps.__getitem__):
                result = legal.runtime_distributions(root)
            self.assertEqual(len(result), 3)

    def test_sdist_is_exact_version_and_checksum_verified(self):
        dist = SimpleNamespace(metadata={"Name": "chess"}, version="1.11.2")
        data = b"source archive bytes"
        entry = {"packagetype": "sdist", "filename": "chess-1.11.2.tar.gz", "url": "https://files.pythonhosted.org/chess.tar.gz", "digests": {"sha256": hashlib.sha256(data).hexdigest()}}
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(legal, "urlopen", side_effect=[io.BytesIO(json.dumps({"urls": [entry]}).encode()), io.BytesIO(data)]) as request:
                record = legal.download_sdist(dist, Path(tmp))
                self.assertIn("/chess/1.11.2/json", request.call_args_list[0].args[0])
                self.assertEqual(record["sha256"], hashlib.sha256(data).hexdigest())
                self.assertEqual((Path(tmp) / record["file"]).read_bytes(), data)
            with patch.object(legal, "urlopen", side_effect=[io.BytesIO(json.dumps({"urls": [entry]}).encode()), io.BytesIO(b"wrong")]):
                with self.assertRaisesRegex(RuntimeError, "checksum"):
                    legal.download_sdist(dist, Path(tmp))

    def test_bundle_contains_license_source_and_version_records(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "repo"
            (root / "public/legal").mkdir(parents=True)
            for name in legal.NOTICE_FILES:
                (root / name).write_text("license text", encoding="utf-8")
                (root / "public/legal" / name).write_text("license text", encoding="utf-8")
            (root / "README.md").write_text("readme", encoding="utf-8")
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            subprocess.run(["git", "add", "."], cwd=root, check=True)
            license_file = Path("chess.dist-info/licenses/LICENSE.txt")
            (root / license_file).parent.mkdir(parents=True)
            (root / license_file).write_text("GNU GENERAL PUBLIC LICENSE", encoding="utf-8")
            subprocess.run(["git", "add", "."], cwd=root, check=True)
            dist = SimpleNamespace(metadata={"Name": "chess"}, version="1.11.2", files=[license_file], locate_file=lambda p: root / p, read_text=lambda _: "Name: chess")
            data = b"source"
            entry = {"packagetype": "sdist", "filename": "chess.tar.gz", "url": "https://example.test/source", "digests": {"sha256": hashlib.sha256(data).hexdigest()}}
            destination = Path(tmp) / "bundle"
            with patch.object(legal, "runtime_distributions", return_value=[dist]), patch.object(legal, "urlopen", side_effect=[io.BytesIO(json.dumps({"urls": [entry]}).encode()), io.BytesIO(data)]):
                legal.prepare_legal_bundle(destination, root)
            self.assertTrue((destination / "source/project.zip").is_file())
            self.assertEqual((destination / "source/dependencies/chess.tar.gz").read_bytes(), data)
            self.assertIn("chess==1.11.2", (destination / "source/requirements-runtime.txt").read_text())
            self.assertTrue((destination / "licenses/PYTHON-LICENSE.txt").is_file())
            self.assertTrue(list((destination / "licenses/python").rglob("LICENSE.txt")))
            self.assertEqual(json.loads((destination / "source/dependencies.json").read_text())[0]["version"], "1.11.2")
            from scripts import build_nuitka
            release = Path(tmp) / "release"
            release.mkdir()
            with patch.object(build_nuitka, "ROOT", root), patch.object(build_nuitka, "BUILD_ROOT", Path(tmp)):
                destination.rename(Path(tmp) / "legal")
                build_nuitka._copy_release_metadata(release)
            self.assertTrue((release / "source/project.zip").is_file())
            self.assertTrue((release / "COPYRIGHT.md").is_file())

    def test_browser_notices_and_font_licenses_ship_together(self):
        import re
        for name in legal.NOTICE_FILES:
            self.assertEqual((ROOT / name).read_bytes(), (ROOT / "public/legal" / name).read_bytes())
        for entry in ("public/index.html", "frontend-src/index.html"):
            html = (ROOT / entry).read_text(encoding="utf-8")
            self.assertIn('id="nori-community-notice"', html)
            self.assertIn('href="/legal/index.html"', html)
            self.assertIn('href="/nori-legal.css"', html)
        page = (ROOT / "public/legal/index.html").read_text(encoding="utf-8")
        for link in re.findall(r'href="([^"]+)"', page):
            if not link.startswith(("/", "https:")):
                self.assertTrue((ROOT / "public/legal" / link).is_file(), link)
        fonts = list((ROOT / "public/legal/fonts").glob("*-OFL.txt"))
        self.assertEqual(len(fonts), 6)
        for font in fonts:
            self.assertIn("SIL OPEN FONT LICENSE", font.read_text(encoding="utf-8").upper())


if __name__ == "__main__":
    unittest.main()
