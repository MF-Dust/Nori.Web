# Cloudflare live-world archive

Cloudflare Workers must not bundle `backend/data/live_world_pack.json` into the Worker script because the archive is large and would exceed the Free-plan script-size limit.

The Worker reads the archive privately from the existing `NORI_ASSETS_R2` binding instead.

## Upload the archive

The configured bucket is `nori-web-assets` and the required object key is:

```text
runtime/live_world_pack.json
```

Upload the repository copy with Wrangler:

```bash
uv run pywrangler r2 object put nori-web-assets/runtime/live_world_pack.json \
  --file=backend/data/live_world_pack.json \
  --content-type=application/json \
  --remote
```

On PowerShell, the same command can be entered on one line:

```powershell
uv run pywrangler r2 object put nori-web-assets/runtime/live_world_pack.json --file=backend/data/live_world_pack.json --content-type=application/json --remote
```

Then deploy normally:

```bash
uv run pywrangler deploy
```

`NORI_DISABLE_LIVE_PACK` defaults to `0` for the Cloudflare deployment. Set it to `1` only when you explicitly want mock/demo data.

At runtime, each Worker isolate loads the archive from R2 on first use and keeps the decoded data in memory for subsequent requests. If the R2 object is missing or invalid, the service stays available and falls back to mock data while logging the reason.
