"""The historical client's story/archive choice reaches the server via a cookie."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.core.story_mode import apply_story_mode_default, story_mode_preference

SHIM = (ROOT / "public" / "nori-runtime-shims.js").read_text(encoding="utf-8")
SETTINGS = (ROOT / "public" / "nori-ui-settings.js").read_text(encoding="utf-8")
ARCADE = (ROOT / "backend" / "api" / "arcade.py").read_text(encoding="utf-8")
WORKER = (ROOT / "worker.py").read_text(encoding="utf-8")


class StoryModeCookieTest(unittest.TestCase):
    def test_cookie_parsing(self):
        self.assertIsNone(story_mode_preference({}))
        self.assertIsNone(story_mode_preference({"cookie": "a=1; nori_full_unlock=maybe"}))
        self.assertTrue(story_mode_preference({"cookie": "a=1; nori_full_unlock=1"}))
        self.assertFalse(story_mode_preference({"cookie": "nori_full_unlock=0; b=2"}))

    def test_default_only_fills_missing_lifecycle_flag(self):
        for kind in ("open_my_web_world", "reset_my_web_world"):
            message = {"type": kind}
            apply_story_mode_default(message, False)
            self.assertIs(message["fullUnlock"], False)

        explicit = {"type": "open_my_web_world", "fullUnlock": True}
        apply_story_mode_default(explicit, False)
        self.assertIs(explicit["fullUnlock"], True, "an explicit client value wins")

        unset = {"type": "open_my_web_world"}
        apply_story_mode_default(unset, None)
        self.assertNotIn("fullUnlock", unset, "no cookie keeps the protocol default")

        other = {"type": "dispatch"}
        apply_story_mode_default(other, False)
        self.assertNotIn("fullUnlock", other)

    def test_clients_and_servers_use_the_cookie_without_patching_transport(self):
        self.assertIn('document.cookie = "nori_full_unlock="', SHIM)
        self.assertNotIn("WebSocket", SHIM)
        self.assertIn('"nori_full_unlock=" + (archiveToggle.checked ? "1" : "0")', SETTINGS)
        self.assertIn("story_mode_preference(websocket.headers)", ARCADE)
        self.assertIn("apply_story_mode_default(message, story_preference)", ARCADE)
        self.assertIn("story_mode_preference(request.headers)", WORKER)
        self.assertIn('full_unlock=message.get("fullUnlock") is not False', WORKER)


if __name__ == "__main__":
    unittest.main()
