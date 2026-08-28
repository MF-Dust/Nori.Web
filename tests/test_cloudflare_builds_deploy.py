from __future__ import annotations

import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = ROOT / "scripts" / "cloudflare_builds_deploy.py"

spec = importlib.util.spec_from_file_location("nori_cloudflare_builds_deploy", MODULE_PATH)
assert spec is not None and spec.loader is not None
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def main() -> None:
    first = module.live_pack_fingerprint()
    second = module.live_pack_fingerprint()
    assert first == second
    assert first.startswith("v1:")
    assert len(first.split(":", 1)[1]) == 64

    # The R2 marker must change for either world-content changes or changes to
    # the partition/upload algorithm, otherwise CI could keep a stale layout.
    original_source = module.SOURCE_PACK
    original_tool = module.LIVE_PACK_TOOL
    try:
        with TemporaryDirectory(prefix="nori-builds-test-") as temp:
            root = Path(temp)
            source = root / "live_world_pack.json"
            tool = root / "upload_cloudflare_live_pack.py"
            source.write_text('{"world":1}', encoding="utf-8")
            tool.write_text("# layout v1\n", encoding="utf-8")
            module.SOURCE_PACK = source
            module.LIVE_PACK_TOOL = tool

            baseline = module.live_pack_fingerprint()
            source.write_text('{"world":2}', encoding="utf-8")
            source_changed = module.live_pack_fingerprint()
            assert source_changed != baseline

            source.write_text('{"world":1}', encoding="utf-8")
            tool.write_text("# layout v2\n", encoding="utf-8")
            tool_changed = module.live_pack_fingerprint()
            assert tool_changed != baseline
    finally:
        module.SOURCE_PACK = original_source
        module.LIVE_PACK_TOOL = original_tool

    print("[ok] Workers Builds deploy fingerprint tracks world data and R2 layout logic")


if __name__ == "__main__":
    main()
