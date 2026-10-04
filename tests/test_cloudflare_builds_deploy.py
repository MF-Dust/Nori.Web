from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = ROOT / "scripts" / "cloudflare_builds_deploy.py"

spec = importlib.util.spec_from_file_location("nori_cloudflare_builds_deploy", MODULE_PATH)
assert spec is not None and spec.loader is not None
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def verify_rust_toolchain() -> None:
    # Existing tools must be reused; missing components are installed separately.
    for missing, has_target, version in [
        (set(), True, "0.8.7"),
        ({"cargo", "rustup", "worker-build"}, False, ""),
        ({"cargo"}, True, "0.8.7"),
        ({"rustup"}, True, "0.8.7"),
        (set(), False, "0.8.7"),
        ({"worker-build"}, True, ""),
        (set(), True, "0.8.6"),
    ]:
        calls: list[list[str]] = []

        def fake_run(command, **kwargs):
            calls.append(list(command))
            stdout = ""
            if command == ["rustup", "target", "list", "--installed"]:
                stdout = "x86_64-unknown-linux-gnu\n"
                if has_target:
                    stdout += "wasm32-unknown-unknown\n"
            elif command[-1] == "--version":
                stdout = version + "\n"
            return subprocess.CompletedProcess(command, 0, stdout, "")

        with patch.dict(os.environ, {"PATH": "/tools"}), patch.object(
            module.shutil, "which",
            side_effect=lambda name: None if name in missing else f"/tools/{name}",
        ), patch.object(module, "_run", side_effect=fake_run):
            module.ensure_rust_toolchain()
            cargo_bin = str(Path.home() / ".cargo" / "bin")
            assert os.environ["PATH"].split(os.pathsep)[0] == cargo_bin
            expected: list[list[str]] = []
            if missing & {"cargo", "rustup"}:
                expected.append([
                    "sh", "-c",
                    "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs "
                    f"| sh -s -- -y --profile minimal --default-toolchain {module.RUST_TOOLCHAIN}",
                ])
            expected.append(["rustup", "target", "list", "--installed"])
            if not has_target:
                expected.append(["rustup", "target", "add", "wasm32-unknown-unknown"])
            if "worker-build" not in missing:
                expected.append(["/tools/worker-build", "--version"])
            if "worker-build" in missing or version != "0.8.7":
                expected.append([
                    "cargo", "install", "worker-build", "--version", "0.8.7", "--locked",
                ])
            assert calls == expected, (calls, expected)

            if not missing and has_target and version == "0.8.7":
                first_path = os.environ["PATH"]
                calls.clear()
                module.ensure_rust_toolchain()
                assert os.environ["PATH"] == first_path
                assert calls == expected

    with patch.object(module, "_run") as run:
        module.prepare_runtime()
        run.assert_called_once_with(["worker-build", "--release"], cwd=module.WORKER_ROOT)


def main() -> None:
    # Domains remain Dashboard-managed; Rust must not introduce a new DO migration.
    wrangler_source = (ROOT / "wrangler.jsonc").read_text(encoding="utf-8")
    config = json.loads(re.sub(r"^\s*//.*$", "", wrangler_source, flags=re.MULTILINE))
    assert config["name"] == "nori-web"
    assert config["compatibility_date"] == "2026-08-28"
    assert config["workers_dev"] is False
    assert config["preview_urls"] is True
    assert "routes" not in config and "route" not in config
    assert not (ROOT / ".python-version").exists()
    assert "python_workers" not in wrangler_source
    assert "python_modules" not in config
    assert not {"base_dir", "find_additional_modules", "rules"} & config.keys()
    assert config["main"] == "rust/crates/nori-worker/build/worker/shim.mjs"
    assert config["build"] == {
        "command": "worker-build --release", "cwd": "rust/crates/nori-worker",
    }
    assert (ROOT / config["build"]["cwd"]).is_dir()
    assert config["durable_objects"]["bindings"] == [
        {"name": "NORI_ARCADE", "class_name": "NoriArcadeSession"},
    ]
    assert config["migrations"] == [
        {"tag": "v1", "new_sqlite_classes": ["NoriArcadeSession"]},
    ]
    assert config["assets"] == {
        "directory": "./public", "binding": "ASSETS",
        "not_found_handling": "single-page-application",
        "run_worker_first": ["/api/*", "/datasea/cosmicweb.min.glb"],
    }
    assert config["r2_buckets"] == [
        {"binding": "NORI_ASSETS_R2", "bucket_name": "nori-web-assets"},
    ]
    assert config["vars"] == {"NORI_DISABLE_LIVE_PACK": "0"}
    assert json.loads((ROOT / "package.json").read_text())["devDependencies"]["wrangler"] == "4.147.0"

    first = module.live_pack_fingerprint()
    assert first == module.live_pack_fingerprint()
    assert first.startswith("v1:")
    assert len(first.split(":", 1)[1]) == 64

    # Both archive content and partition/upload logic must invalidate the R2 marker.
    with TemporaryDirectory(prefix="nori-builds-test-") as temp:
        root = Path(temp)
        source = root / "live_world_pack.json"
        tool = root / "upload_cloudflare_live_pack.py"
        source.write_text('{"world":1}', encoding="utf-8")
        tool.write_text("# layout v1\n", encoding="utf-8")
        with patch.object(module, "SOURCE_PACK", source), patch.object(module, "LIVE_PACK_TOOL", tool):
            baseline = module.live_pack_fingerprint()
            source.write_text('{"world":2}', encoding="utf-8")
            assert module.live_pack_fingerprint() != baseline
            source.write_text('{"world":1}', encoding="utf-8")
            tool.write_text("# layout v2\n", encoding="utf-8")
            assert module.live_pack_fingerprint() != baseline

    with patch.object(module.shutil, "which", return_value="/tools/npx"):
        assert module.wrangler_command() == ["/tools/npx", "wrangler"]

    # Deployment is non-interactive without the unsupported --yes switch.
    with patch.object(module, "_run") as run:
        module.deploy_worker(["npx", "wrangler"], config=ROOT / ".wrangler-candidate.json")
        command = run.call_args.args[0]
        assert command == ["npx", "wrangler", "deploy", "--config", ".wrangler-candidate.json"]
        assert "--yes" not in command
        assert run.call_args.kwargs["env"]["CI"] == "true"

    verify_rust_toolchain()

    # Frontend preparation retains locked dependencies and root-local config output.
    with TemporaryDirectory(prefix="nori-frontend-deploy-test-") as temp:
        root = Path(temp)
        candidate_index = root / "candidate" / "index.html"
        candidate_index.parent.mkdir(parents=True)
        candidate_index.write_text("source", encoding="utf-8")
        frontend_config = root / ".wrangler-candidate.json"
        frontend_config.write_text("{}", encoding="utf-8")
        with patch.object(module, "FRONTEND_CANDIDATE_INDEX", candidate_index), patch.object(
            module, "FRONTEND_CONFIG", frontend_config,
        ), patch.object(module.shutil, "which", side_effect=lambda name: f"/tools/{name}"), patch.object(
            module, "_run",
        ) as run:
            assert module.prepare_source_frontend() == frontend_config
            assert [call.args[0] for call in run.call_args_list] == [
                ["/tools/npm", "ci", "--no-audit", "--no-fund"],
                ["/tools/npm", "run", "frontend:app:build"],
                ["/tools/node", str(module.FRONTEND_CANDIDATE_TOOL), "--materialize"],
                ["/tools/node", str(module.FRONTEND_CONFIG_TOOL)],
            ]

    # Deploy builds once through Wrangler; prepare-only builds without R2/deploy.
    # Legacy frontend still installs local Wrangler and deploys the Rust Worker.
    for switches, expected in [
        ([], ["frontend", "toolchain", "sync", ("deploy", ROOT / ".wrangler-candidate.json")]),
        (["--skip-live-pack"], ["frontend", "toolchain", ("deploy", ROOT / ".wrangler-candidate.json")]),
        (["--prepare-only"], ["frontend", "toolchain", "runtime"]),
        (["--skip-live-pack", "--legacy-frontend"], ["npm-ci", "toolchain", ("deploy", None)]),
    ]:
        events: list[object] = []

        def deploy(base, **kwargs):
            assert base == ["npx", "wrangler"]
            events.append(("deploy", kwargs.get("config")))

        with patch.object(sys, "argv", ["cloudflare_builds_deploy.py", *switches]), patch.dict(
            os.environ, {"NORI_DEPLOY_LEGACY_FRONTEND": "0"},
        ), patch.multiple(
            module,
            prepare_source_frontend=lambda: events.append("frontend") or (ROOT / ".wrangler-candidate.json"),
            install_node_dependencies=lambda: events.append("npm-ci"),
            ensure_rust_toolchain=lambda: events.append("toolchain"),
            prepare_runtime=lambda: events.append("runtime"),
            wrangler_command=lambda: ["npx", "wrangler"],
            sync_live_pack=lambda *args, **kwargs: events.append("sync"),
            deploy_worker=deploy,
        ):
            module.main()
            assert events == expected, (events, expected)

    print("[ok] Rust bootstrap, source frontend, frontend rollback, R2 fingerprint, routing, bindings, migration, and CI deploy mode")


if __name__ == "__main__":
    main()
