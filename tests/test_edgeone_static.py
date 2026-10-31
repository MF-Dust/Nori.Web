import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from scripts import build_edgeone_static as pack


class EdgeOneStaticTest(unittest.TestCase):
    def test_archive_and_limits(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "public"
            for tree in (*pack.TREES, "legal"):
                (source / tree).mkdir(parents=True)
                (source / tree / "asset.bin").write_bytes(b"test")
            original = '@font-face { src: url("/fonts/a.woff2") }'
            (source / "fonts.css").write_text(original)
            (source / "cosmicweb.min.glb").write_bytes(b"not migrated")
            output = root / "assets.zip"
            count, _ = pack.build(source, output)
            with zipfile.ZipFile(output) as archive:
                self.assertEqual(count, len(archive.namelist()))
                self.assertNotIn("cosmicweb.min.glb", archive.namelist())
                self.assertIn("index.html", archive.namelist())
                self.assertIn("legal/asset.bin", archive.namelist())
                self.assertIn(b'url("./fonts/a.woff2")', archive.read("fonts.css"))
                rules = json.loads(archive.read("edgeone.json"))["headers"]
                self.assertEqual(len(rules), len(pack.TREES) + 1)
                self.assertTrue(all({"key": "Access-Control-Allow-Origin", "value": "*"} in rule["headers"] for rule in rules))
            self.assertEqual((source / "fonts.css").read_text(), original)
            with patch.object(pack, "MAX_FILE_BYTES", 3):
                with self.assertRaisesRegex(ValueError, "File exceeds"):
                    pack.build(source, root / "too-large.zip")
            self.assertFalse((root / "too-large.zip").exists())
            with patch.object(pack, "MAX_FILES", 1):
                with self.assertRaisesRegex(ValueError, "quota exceeded"):
                    pack.build(source, root / "too-many.zip")
