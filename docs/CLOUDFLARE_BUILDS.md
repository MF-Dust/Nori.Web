# Cloudflare Workers Builds

The `master` branch deploys the Rust workers-rs Worker in
`rust/crates/nori-worker` through Cloudflare's GitHub integration.
`wrangler.jsonc` is the production configuration; the Python backend and old
Worker sources remain in the repository until the next migration phase, but are
not bundled or executed by this deployment.

## Build and deploy flow

The Dashboard runs `python scripts/cloudflare_builds_deploy.py`. The wrapper:

1. Runs `npm ci --no-audit --no-fund`, builds the source frontend, and materializes
   the verified candidate/rollback trees.
2. Writes `.wrangler-candidate.json` at the repository root, changing only the
   Assets directory to `.artifacts/build/app/cutover-candidate`. Keeping the
   configuration at the root preserves the Rust `main` and build `cwd` paths.
3. Ensures Rust, the WASM target, and worker-build are available (see below).
4. Compares the private R2 live-pack fingerprint and uploads changed shards.
5. Runs the locked local `npx wrangler deploy --config .wrangler-candidate.json`
   with `CI=true`, without `--yes`.

Wrangler's Custom Build hook runs `worker-build --release` in
`rust/crates/nori-worker`, producing `build/worker/shim.mjs` and its WASM module.
Normal deployments build the Worker once through that hook; there is no Python
runtime staging or pywrangler dependency. Wrangler **4.147.0** is an exact
npm devDependency installed from `package-lock.json`.

The R2 marker `runtime/live/source-fingerprint.txt` fingerprints both
`backend/data/live_world_pack.json` and `scripts/upload_cloudflare_live_pack.py`.
Matching content skips uploads. A content or upload-script change re-shards,
uploads with `npx wrangler r2 object put --remote`, then updates the marker before
deployment. The CLI change itself causes one refresh on the first Rust deploy.

### Rust on the Workers Builds image

Workers Builds supplies Node 24, Python 3.13, curl, and git, but not Rust.
`ensure_rust_toolchain()` prepends `~/.cargo/bin` to child-process `PATH` and:

- If cargo or rustup is missing, runs the HTTPS rustup installer non-interactively
  with `-y --profile minimal --default-toolchain 1.98.0`; otherwise runs
  `rustup toolchain install 1.98.0 --profile minimal` (a no-op when present).
  `RUSTUP_TOOLCHAIN=1.98.0` is then exported, so `cargo install` and Wrangler's
  `worker-build` hook use the pinned toolchain even if a cached rustup defaults
  to another version. The pin must satisfy every locked crate's `rust-version`
  (shakmaty 0.30.1 needs 1.95) and equals the toolchain the `validate-worker`
  CI job uses; `tests/test_cloudflare_builds_deploy.py` enforces both.
- Adds `wasm32-unknown-unknown` to that toolchain only when it is absent.
- Installs `cargo install worker-build --version 0.8.7 --locked` only when the
  executable is missing or its version differs.

No extra Python interpreter or Python project environment is installed. Cold
Rust/tool installation and compilation add several minutes (budget roughly
3–10 minutes, depending on the build image and network); an already-provisioned
or cached environment skips the installations. Enable build caching, but expect
fresh images to need the bootstrap again. GitHub Actions caches Cargo builds and
the worker-build binary separately.

## Cloudflare Dashboard configuration

For the existing `nori-web` Worker, open **Settings > Build** and connect
`MF-Dust/Nori.Web`:

- Production branch: `master`
- Root directory: repository root / leave blank
- Build command: leave blank
- Deploy command: `python scripts/cloudflare_builds_deploy.py`
- Non-production branch builds: disabled
- Build caching: enabled
- Build variable: `SKIP_DEPENDENCY_INSTALL=1`

Remove the old pipx/uv deploy command and any `PYTHON_VERSION` override. Do not
add `.python-version`; the image's Python is sufficient for the stdlib-only
wrapper and R2 partitioning script. Automatic dependency installation is skipped
because the wrapper explicitly installs the locked Node dependencies.

Use the generated Workers Builds API token with Worker deployment and R2 access
permissions. Domains and routes remain managed in the Dashboard: the config
keeps `workers_dev=false` and deliberately declares no `routes`. Keep the
existing R2 binding `NORI_ASSETS_R2` → `nori-web-assets`, Durable Object binding
`NORI_ARCADE` → `NoriArcadeSession`, and Assets binding `ASSETS`.

Runtime keys belong in **Variables & Secrets**, not Build variables. Keep the
existing nonblank `SECRET_KEY` unchanged to preserve signed cookies/tickets.
Optional AI keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) are runtime secrets;
provider URLs/models are runtime configuration. `NORI_DISABLE_LIVE_PACK=0`
remains the configured production default. No R2 access-key secret or public
bucket URL is needed.

Dashboard-only metadata should not be copied into the config unless Wrangler's
schema supports it. CI fails on `Unexpected fields found`; the deployment's
`CI=true` handles confirmation prompts without the unsupported `--yes` flag.
Durable Object Workers do not receive Preview URLs, so non-production Builds
remain disabled even though the existing `preview_urls` setting is retained.

## Local preparation and testing

From the repository root, with Node/npm and Rust installed:

```bash
npm ci
rustup target add wasm32-unknown-unknown
cargo install worker-build --version 0.8.7 --locked
cargo test --locked -p nori-core -p nori-worker --manifest-path rust/Cargo.toml
python tests/test_cloudflare_builds_deploy.py
python scripts/cloudflare_builds_deploy.py --prepare-only
npx wrangler deploy --dry-run --config wrangler.jsonc --outdir tmp/wrangler-dry-run
npx wrangler dev --config wrangler.jsonc --local --port 8790 --var SECRET_KEY:x
```

In a second terminal:

```bash
NORI_SMOKE_URL=http://127.0.0.1:8790 node rust/crates/nori-worker/tests/smoke.mjs
```

`--prepare-only` builds the frontend and Rust Worker without reading or writing
Cloudflare resources. It may download npm/Rust build dependencies on a cold
machine. The direct root config serves the historical `public/` frontend;
production uses the generated candidate config. Local R2 may be empty, so the
smoke uses the runtime's demo fallback. Stop the Wrangler parent with Ctrl+C
when finished. CI also checks the output WASM is below 3 MiB gzipped and that the
large live-pack JSON is absent from the module bundle.

Manual production deployment uses the same wrapper (requires Cloudflare auth):

```bash
python scripts/cloudflare_builds_deploy.py
python scripts/cloudflare_builds_deploy.py --skip-live-pack
python scripts/cloudflare_builds_deploy.py --force-live-pack
```

## Storage compatibility and rollback

The Rust Worker exports the same `NoriArcadeSession` class and keeps the existing
`v1` migration's `new_sqlite_classes` unchanged. **Do not add a migration or
create a new namespace for this runtime switch.** World snapshots remain JSON
strings under `nori:world:v1`; sanitized, key-free AI settings remain JSON
strings under `nori:ai-public:v1`. The private R2 shard layout also stays the
same, so the previous Python Worker can read the retained storage.

Before the first Rust production deployment, record the last working Python
version ID in **Deployments** (or `npx wrangler versions list`). If the runtime
must be reverted, pause automatic Builds and select that Python version in the
Dashboard rollback action, or run:

```bash
npx wrangler rollback <LAST_PYTHON_VERSION_ID> --message "Restore last Python Worker"
```

Rollback restores that deployed version and its frontend, not historical DO/R2
data. Leave bindings, the `v1` migration, and `SECRET_KEY` unchanged; no storage
conversion is needed. Resume Builds after fixing or reverting the Rust cutover,
otherwise the next `master` build will deploy Rust again.

For a **frontend-only** emergency rollback while retaining Rust, use
`--legacy-frontend`, or temporarily set the Build variable
`NORI_DEPLOY_LEGACY_FRONTEND=1`. This serves `public/`; it does **not** restore the
Python runtime. Remove the variable after recovery.
