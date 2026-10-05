# Cloudflare live-world archive

The Rust Worker must not bundle or eagerly decode the complete
`backend/data/live_world_pack.json` (about 11.7 MiB on disk). The source archive
stays in the repository; a partitioned layout lives in the existing private R2
bucket `nori-web-assets`, accessed through `NORI_ASSETS_R2`.

The Durable Object loads the lightweight core when opening a world. Mail,
Files, Signal sections, and browser-page shards are fetched only when needed.
This preserves the Python Worker's R2 layout; the runtime switch does not
require new object keys, a public bucket, or R2 access-key secrets.

## Prepare and upload

Install the locked local Wrangler 4.147.0, then inspect the partition sizes:

```bash
npm ci
python scripts/upload_cloudflare_live_pack.py
```

The Python 3 helper uses only the standard library. It does not run the Python
backend or need uv/pywrangler. To upload with authenticated Cloudflare access:

```bash
python scripts/upload_cloudflare_live_pack.py --upload
```

Uploads use `npx wrangler r2 object put ... --remote`, not local R2. Temporary
files are removed after preparation/upload and are not committed. Object keys:

```text
runtime/live/core.json
runtime/live/mail_artifacts.json
runtime/live/file_artifacts.json
runtime/live/signal_thread_artifacts.json
runtime/live/signal_message_artifacts.json
runtime/live/browser-index.json
runtime/live/browser/<shard>.json
```

Browser pages use 32 deterministic shards by default. The obsolete
`runtime/live_world_pack.json` object is not read by the sharded runtime and may
remain in R2.

## Deploy and fingerprint

Production deployment normally handles uploads automatically:

```bash
python scripts/cloudflare_builds_deploy.py
```

The wrapper installs missing Rust tools on Workers Builds, builds the source
frontend, and checks `runtime/live/source-fingerprint.txt` through remote
Wrangler R2 commands. It fingerprints the source archive and upload script;
unchanged inputs skip uploads. Changed inputs upload all shards, then update the
marker before the Rust Worker deploys. The pywrangler-to-Wrangler script change
causes one refresh at the first Rust deployment, even with unchanged archive
content.

Use `--force-live-pack` to re-upload deliberately or `--skip-live-pack` for a
code-only deployment. `--prepare-only` builds the frontend and Rust Worker
without Cloudflare access. The Dashboard Deploy command is
`python scripts/cloudflare_builds_deploy.py`; setup is documented in
[CLOUDFLARE_BUILDS.md](CLOUDFLARE_BUILDS.md).

`NORI_DISABLE_LIVE_PACK` remains `0` in production; use `1` only for intentional
demo/mock data. Local `npx wrangler dev --local` uses local R2, not the production
bucket, and falls back to demo data when shards are absent.

## Durable Object compatibility and rollback

`NoriArcadeSession`, the `NORI_ARCADE` binding, and the existing `v1` SQLite
migration stay unchanged. World snapshots remain JSON strings at
`nori:world:v1`; public AI settings remain JSON strings at `nori:ai-public:v1`
and exclude API keys. There is no storage migration for the Rust replacement.

If needed, pause Workers Builds and roll back to the last working Python
version in Dashboard Deployments or with
`npx wrangler rollback <LAST_PYTHON_VERSION_ID>`. Keep the R2 layout, DO binding,
and `SECRET_KEY`; code rollback does not restore older DO/R2 contents. The
Python runtime has been removed from the repository; restore it from Git history
if a Python-version rollback must be rebuilt.
