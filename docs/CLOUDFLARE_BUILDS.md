# Cloudflare Workers Builds

Nori.Web is designed to deploy from the `master` branch through Cloudflare's
native GitHub integration. The repository keeps Wrangler configuration as the
source of truth, while `scripts/cloudflare_builds_deploy.py` provides the
production deploy entrypoint.

## Why a deploy wrapper exists

The wrapper synchronizes the private R2 live-world layout and then invokes
`pywrangler deploy`. Normal production deploys intentionally do **not** call
`scripts/prepare_cloudflare_runtime.py` first: pywrangler invokes Wrangler, and
Wrangler executes the repository's Custom Build hook itself. This keeps runtime
staging to one pass instead of two. The explicit `--prepare-only` mode remains
available for diagnostics.

The wrapper forces `CI=true` for the final Worker deployment. Wrangler uses its
non-interactive fallback for confirmation prompts in CI, including harmless
Dashboard-vs-source metadata differences. Do not add `--yes` to the deploy
command: Wrangler 4.127 rejects that flag when a Wrangler configuration file is
already present.

The same wrapper synchronizes the private R2 live-world layout. It compares
`runtime/live/source-fingerprint.txt` with a fingerprint derived from both:

- `backend/data/live_world_pack.json`
- `scripts/upload_cloudflare_live_pack.py`

If the fingerprint matches, R2 upload is skipped. If either the world archive or
partitioning logic changes, the live pack is re-sharded, uploaded, and the marker
is updated before the Worker is deployed.

## Cloudflare Dashboard configuration

In the existing `nori-web` Worker, open **Settings > Build** and connect the
GitHub repository `MF-Dust/Nori.Web`.

Use these production settings:

- Production branch: `master`
- Root directory: repository root / leave blank
- Build command: leave blank
- Deploy command:
  `pipx run --spec uv==0.12.7 uv run python scripts/cloudflare_builds_deploy.py`
- Non-production branch builds: disabled
- Build caching: enabled

Add only this build variable:

- `SKIP_DEPENDENCY_INSTALL=1`

Do **not** set `PYTHON_VERSION`, and do not add a repository `.python-version`
file for Workers Builds. Cloudflare's build image already supplies a compatible
Python 3 runtime, while an explicit Python pin makes the environment manager
install another Python before every production build. Nori.Web itself supports
Python `>=3.11`, so the bundled Workers Builds interpreter is sufficient.

`SKIP_DEPENDENCY_INSTALL` avoids an unnecessary automatic pip install because
`uv run` manages the project environment itself.

The deploy command deliberately keeps `pipx run --spec uv==0.12.7` even when a
particular Cloudflare image happens to have `uv` on PATH. `pipx` is part of the
supported build image toolchain and this keeps the deployment entrypoint pinned
and reproducible; its overhead is small compared with installing another Python
runtime.

Use Cloudflare's generated Workers Builds API token unless there is a reason to
supply a custom one. The generated token includes the permissions required to
deploy Workers and update R2.

### Dashboard-only observability metadata

The Workers API exposes `observability.redact_query_string`, but Wrangler
4.127's `wrangler.jsonc` schema does not currently accept that field. It is
therefore intentionally not committed to this repository. If the Dashboard
shows `redact_query_string: false` as remote-only metadata, leave it in the
Dashboard; Wrangler's CI fallback handles that metadata difference without an
interactive prompt.

GitHub Actions fails if Wrangler reports `Unexpected fields found`, preventing
unsupported Dashboard/API fields from silently creeping back into
`wrangler.jsonc`.

## Runtime secrets

Build variables and runtime variables are separate. Do not place runtime API
keys in Workers Builds variables merely to make deployment work. Runtime secrets
such as `SECRET_KEY` stay under the Worker's **Variables & Secrets** settings (or
are managed with Wrangler secrets) and are not committed to the repository.

## Preview branches

Nori.Web uses a Durable Object. Cloudflare does not generate Preview URLs for
Workers that implement Durable Objects, so non-production Workers Builds are
intentionally disabled. Pull requests continue to use GitHub Actions for tests,
Python compilation, JavaScript checks, and the Free-plan bundle-size guard.

## Manual deployment remains available

For an emergency/manual deployment, the existing local command still works:

```text
uv run pywrangler deploy
```

To run the same CI wrapper locally:

```text
uv run python scripts/cloudflare_builds_deploy.py
```

Useful emergency switches:

```text
uv run python scripts/cloudflare_builds_deploy.py --skip-live-pack
uv run python scripts/cloudflare_builds_deploy.py --force-live-pack
uv run python scripts/cloudflare_builds_deploy.py --prepare-only
```
