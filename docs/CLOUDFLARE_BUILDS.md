# Cloudflare Workers Builds

Nori.Web is designed to deploy from the `master` branch through Cloudflare's
native GitHub integration. The repository keeps Wrangler configuration as the
source of truth, while `scripts/cloudflare_builds_deploy.py` provides the
production deploy entrypoint.

## Why a deploy wrapper exists

Cloudflare Workers Builds does not automatically honor Wrangler Custom Builds.
Nori.Web requires `scripts/prepare_cloudflare_runtime.py` to stage the Python
Worker runtime before deployment, so the wrapper runs that preparation
explicitly and then invokes `pywrangler deploy`.

The same wrapper also synchronizes the private R2 live-world layout. It compares
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

Add these build variables:

- `SKIP_DEPENDENCY_INSTALL=1`
- `PYTHON_VERSION=3.13`

`SKIP_DEPENDENCY_INSTALL` avoids an unnecessary automatic pip install because
`uv run` manages the project environment itself.

Use Cloudflare's generated Workers Builds API token unless there is a reason to
supply a custom one. The generated token includes the permissions required to
deploy Workers and update R2.

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
