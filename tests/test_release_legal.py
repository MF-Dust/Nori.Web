"""Focused checks for source/notice delivery (no compiler or network required)."""
from __future__ import annotations

import io
import json
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path
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
            (root / "main.rs").write_text("old", encoding="utf-8")
            subprocess.run(["git", "add", "main.rs"], cwd=root, check=True)
            (root / "main.rs").write_text("actual build source", encoding="utf-8")
            (root / "uv.lock").write_text("generated lock", encoding="utf-8")
            (root / "rust").mkdir()
            (root / "rust/Cargo.lock").write_text("generated Cargo lock", encoding="utf-8")
            with tempfile.TemporaryDirectory() as out:
                archive = Path(out) / "project.zip"
                legal.archive_project(archive, root)
                with zipfile.ZipFile(archive) as source:
                    self.assertEqual(source.read("main.rs"), b"actual build source")
                    self.assertIn("uv.lock", source.namelist())
                    self.assertIn("rust/Cargo.lock", source.namelist())
                (root / "forgotten.rs").write_text("untracked", encoding="utf-8")
                with self.assertRaisesRegex(RuntimeError, "git add"):
                    legal.archive_project(archive, root)
                legal.archive_project(archive, root, allow_untracked=True)
                with zipfile.ZipFile(archive) as source:
                    self.assertEqual(source.read("forgotten.rs"), b"untracked")

    def test_rust_linked_packages_disables_color_and_deduplicates_tree(self):
        root_package = {
            "name": "nori-local",
            "version": "2.0.0",
            "manifest_path": str(ROOT / "rust/crates/nori-local/Cargo.toml"),
        }
        http = {"name": "http", "version": "1.5.0"}
        metadata = {"packages": [root_package, http, {"name": "unlinked", "version": "1.0.0"}]}
        tree = (
            "nori-local v2.0.0 (/workspace/path with spaces/nori-local)\n"
            "http v1.5.0\n"
            "http v1.5.0 (*)\n"
        )

        def cargo_output(command, **kwargs):
            if command[1] == "metadata":
                return json.dumps(metadata)
            self.assertEqual(command[:2], ["cargo", "tree"])
            self.assertIn("--color", command)
            self.assertEqual(command[command.index("--color") + 1], "never")
            return tree

        with patch.object(legal.subprocess, "check_output", side_effect=cargo_output):
            self.assertEqual(
                legal._rust_linked_packages(ROOT, "test-target"),
                (root_package, metadata, [http]),
            )

    def test_rust_bundle_contains_license_source_and_version_records(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "repo"
            (root / "public/legal").mkdir(parents=True)
            for name in legal.NOTICE_FILES:
                (root / name).write_text("license text", encoding="utf-8")
                (root / "public/legal" / name).write_text("license text", encoding="utf-8")
            (root / "rust").mkdir()
            registry = "registry+https://github.com/rust-lang/crates.io-index"
            (root / "rust/Cargo.lock").write_text(
                '[[package]]\nname = "dependency"\nversion = "1.2.3"\n'
                f'source = "{registry}"\nchecksum = "pinned-checksum"\n',
                encoding="utf-8",
            )
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            subprocess.run(["git", "add", "."], cwd=root, check=True)
            crate = Path(tmp) / "dependency"
            (crate / "src").mkdir(parents=True)
            (crate / "LICENSE").write_text("MIT license text", encoding="utf-8")
            (crate / "src/lib.rs").write_text("pub fn example() {}", encoding="utf-8")
            package = {"name": "dependency", "version": "1.2.3", "license": "MIT", "source": registry}
            destination = Path(tmp) / "bundle"
            with (
                patch.object(legal, "_rust_linked_packages", return_value=({"name": "nori-local", "version": "2.0.0"}, {}, [package])),
                patch.object(legal, "_vendor_directories", return_value={("dependency", "1.2.3"): crate}),
                patch.object(legal, "subprocess", wraps=subprocess) as commands,
            ):
                commands.run.return_value = subprocess.CompletedProcess(["cargo", "vendor"], 0)
                records = legal.prepare_rust_legal_bundle(destination, root=root, target_triple="test-target")
            with zipfile.ZipFile(destination / "source/project.zip") as source:
                self.assertIn("rust/Cargo.lock", source.namelist())
            with zipfile.ZipFile(destination / "source/rust-vendor.zip") as source:
                self.assertEqual(source.read("vendor/dependency/src/lib.rs"), b"pub fn example() {}")
            self.assertEqual((destination / "legal/licenses/dependency-1.2.3/LICENSE").read_text(), "MIT license text")
            self.assertEqual(json.loads((destination / "source/dependencies.json").read_text()), records)
            self.assertEqual(records[0]["version"], "1.2.3")
            self.assertEqual(records[0]["checksum"], "pinned-checksum")
            self.assertIn("test-target", (destination / "RUST-LICENSE-SUMMARY.txt").read_text())
            self.assertTrue((destination / "COPYRIGHT.md").is_file())

    def test_legacy_build_command_delegates_to_rust(self):
        from scripts import build_nuitka, build_release
        release = Path("build/release/Nori.Web-test")
        for arguments in ([], ["--no-clean"], ["--allow-untracked"], ["--no-clean", "--allow-untracked"]):
            with self.subTest(arguments=arguments), patch.object(build_release, "build", return_value=release) as build:
                with patch("sys.argv", ["build_nuitka.py", *arguments]), patch("sys.stderr", new=io.StringIO()) as stderr:
                    build_nuitka.main()
                build.assert_called_once_with(allow_untracked="--allow-untracked" in arguments)
                self.assertIn("now uses Rust", stderr.getvalue())
                self.assertEqual("--no-clean is obsolete" in stderr.getvalue(), "--no-clean" in arguments)
        with patch.object(build_release, "build", return_value=release), patch("sys.stderr", new=io.StringIO()):
            self.assertEqual(build_nuitka.build(), release)

    def test_legacy_smoke_command_delegates_to_rust(self):
        from scripts import smoke_nuitka, smoke_release
        arguments = ["smoke_nuitka.py", "build/release/Nori.Web-test"]
        with patch.object(smoke_release, "main") as smoke, patch("sys.argv", arguments):
            with patch("sys.stderr", new=io.StringIO()) as stderr:
                smoke_nuitka.main()
            smoke.assert_called_once_with()
            self.assertIn("now uses Rust", stderr.getvalue())

    def test_smoke_resolves_relative_release_directory(self):
        from scripts import smoke_release
        with tempfile.TemporaryDirectory(dir=".") as tmp:
            release_dir = Path(tmp)
            binary = release_dir / ("Nori.Web.exe" if smoke_release.sys.platform == "win32" else "Nori.Web")
            binary.touch()
            self.assertEqual(smoke_release._find_executable(release_dir), binary.resolve())

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
