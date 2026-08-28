# Cloudflare live-world archive

Cloudflare should not bundle or decode the complete `backend/data/live_world_pack.json` inside the Durable Object. The source archive is about 11.7 MiB on disk and expands substantially when decoded into Python objects.

The Cloudflare deployment therefore keeps the source file in the repository but uploads a partitioned layout to the existing private `NORI_ASSETS_R2` bucket (`nori-web-assets`). The Durable Object loads only the lightweight core at startup. Mail, Files, Signal data, and browser-page shards are fetched from R2 only when the client requests them.

## Prepare and upload the R2 layout

Run a dry preparation first to see the object count and largest shard:

```powershell
uv run python scripts/upload_cloudflare_live_pack.py
```

Then upload the generated layout directly to the existing private R2 bucket:

```powershell
uv run python scripts/upload_cloudflare_live_pack.py --upload
```

The script reads `backend/data/live_world_pack.json` and creates temporary objects under:

```text
runtime/live/core.json
runtime/live/mail_artifacts.json
runtime/live/file_artifacts.json
runtime/live/signal_thread_artifacts.json
runtime/live/signal_message_artifacts.json
runtime/live/browser-index.json
runtime/live/browser/<shard>.json
```

Browser pages are split into 32 deterministic shards by default. The generated files live only in a temporary directory while uploading; they are not committed to Git.

The old object `runtime/live_world_pack.json` is no longer read by the sharded Worker and may be left in R2 or deleted later.

## Deploy

After uploading the layout, deploy normally:

```powershell
uv run pywrangler deploy
```

`NORI_DISABLE_LIVE_PACK` defaults to `0` for Cloudflare. Set it to `1` only when mock/demo data is explicitly desired.

Expected cold-start logs now look like:

```text
[live_pack] core loaded from R2: live pack: mails=lazy files=lazy threads=lazy messages=lazy pages=lazy facts=120 world=...
```

Opening individual apps causes only the required sections to appear, for example:

```text
[live_pack] section loaded: mail_artifacts=15
[live_pack] browser shard loaded: 0a pages=...
```

The R2 bucket should remain private; the Worker accesses it through the `NORI_ASSETS_R2` binding and does not require a public R2 URL or R2 access-key secret.
