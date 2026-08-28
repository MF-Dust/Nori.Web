from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = ROOT / "scripts" / "cloudflare_builds_deploy.py"

spec = importlib.util.spec_from_file_location("nori_cloudflare_builds_deploy", MODULE_PATH)
assert spec is not None and spec.loader is not None
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def main() -> None:
    # Workers Builds already supplies Python. A repository .python-version makes
    # Cloudflare's environment manager install another interpreter before every
    # production deploy, which was the largest observed build-time cost.
    assert not (ROOT / ".python-version").exists()

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

    # Wrangler 4.127 rejects `deploy --yes` for configured Workers. Production
    # deploys instead force CI mode, which lets Wrangler use its non-interactive
    # fallback for any Dashboard-vs-source confirmation prompts.
    calls: list[tuple[list[str], dict[str, object]]] = []
    original_run = module._run
    try:
        def fake_run(command, **kwargs):
            calls.append((list(command), dict(kwargs)))

        module._run = fake_run
        module.deploy_worker(["pywrangler"])
    finally:
        module._run = original_run

    assert len(calls) == 1
    command, kwargs = calls[0]
    assert command == ["pywrangler", "deploy"]
    assert "--yes" not in command
    deploy_env = kwargs.get("env")
    assert isinstance(deploy_env, dict)
    assert deploy_env.get("CI") == "true"

    # Normal production deployment must not pre-stage the runtime. pywrangler
    # invokes Wrangler, and Wrangler executes the custom build hook exactly once.
    # `--prepare-only` remains the explicit diagnostic staging path.
    original_argv = sys.argv
    original_prepare = module.prepare_runtime
    original_pywrangler = module.pywrangler_command
    original_sync = module.sync_live_pack
    original_deploy = module.deploy_worker
    try:
        normal_calls: list[object] = []
        sys.argv = ["cloudflare_builds_deploy.py", "--skip-live-pack"]
        module.prepare_runtime = lambda: normal_calls.append("prepare")
        module.pywrangler_command = lambda: ["pywrangler"]
        module.sync_live_pack = lambda *args, **kwargs: normal_calls.append("sync")
        module.deploy_worker = lambda base: normal_calls.append(("deploy", list(base)))
        module.main()
        assert "prepare" not in normal_calls
        assert "sync" not in normal_calls
        assert ("deploy", ["pywrangler"]) in normal_calls

        prepare_calls: list[object] = []
        sys.argv = ["cloudflare_builds_deploy.py", "--prepare-only"]
        module.prepare_runtime = lambda: prepare_calls.append("prepare")
        module.deploy_worker = lambda base: prepare_calls.append(("deploy", list(base)))
        module.main()
        assert prepare_calls == ["prepare"]
    finally:
        sys.argv = original_argv
        module.prepare_runtime = original_prepare
        module.pywrangler_command = original_pywrangler
        module.sync_live_pack = original_sync
        module.deploy_worker = original_deploy

    print(
        "[ok] Workers Builds deploy fingerprint, bundled Python, CI mode, and single-stage runtime path behave correctly"
    )


if __name__ == "__main__":
    main()
