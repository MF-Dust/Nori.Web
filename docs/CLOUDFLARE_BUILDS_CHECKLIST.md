# Workers Builds setup checklist

1. Open Cloudflare Dashboard > Workers & Pages > existing `nori-web` > Settings > Build.
2. Connect GitHub repository `MF-Dust/Nori.Web`; production branch: `master`.
3. Root directory: repository root / leave blank; Build command: leave blank.
4. Replace the pipx/uv command with Deploy command:
   `python scripts/cloudflare_builds_deploy.py`.
5. Disable non-production branch builds (Durable Object Workers do not get Preview URLs).
6. Enable build caching and set Build variable `SKIP_DEPENDENCY_INSTALL=1`.
7. Remove any `PYTHON_VERSION` override; do not add `.python-version`. The image's
   Python runs the stdlib-only deploy/upload helpers. No Python Worker dependencies
   are installed.
8. Keep runtime secrets under Worker Variables & Secrets, especially the existing
   nonblank `SECRET_KEY`. Optional AI provider keys remain runtime secrets, not
   Build variables. Keep `NORI_DISABLE_LIVE_PACK=0` unless demo data is intended.
9. Preserve Dashboard-managed domains/routes, `workers_dev=false`, `ASSETS`,
   `NORI_ASSETS_R2` → `nori-web-assets`, and `NORI_ARCADE` → `NoriArcadeSession`.
   Keep the existing `v1` SQLite migration; do not add one for the Rust switch.
10. Record the last successful **Python** version ID from Deployments before the
    first Rust deployment. Snapshots remain JSON strings under `nori:world:v1`
    and `nori:ai-public:v1`, compatible with both runtimes.
11. Leave `NORI_DEPLOY_LEGACY_FRONTEND` unset during normal operation. It only
    restores the historical `public/` frontend, not the Python Worker.
12. Save the integration. A new `master` commit builds the source frontend,
    provisions missing Rust tools, synchronizes changed private R2 shards, and
    deploys the Rust Worker with locked Wrangler 4.147.0.

The Rust-free Workers Builds image is bootstrapped automatically with Rust
1.91.0 (minimal profile), `wasm32-unknown-unknown`, and worker-build 0.8.7. Existing
tools are reused; budget several additional minutes for a cold installation and
compile. Wrangler runs the Rust build hook once, with `CI=true` and no `--yes`.

Before deployment, run the local checks in [CLOUDFLARE_BUILDS.md](CLOUDFLARE_BUILDS.md):
wrapper tests, `--prepare-only`, Wrangler dry-run (WASM < 3 MiB gzip), and the
local HTTP/WebSocket smoke. These do not deploy anything.

**Runtime rollback:** pause automatic Builds, then choose the recorded Python
version in Dashboard Deployments or run
`npx wrangler rollback <LAST_PYTHON_VERSION_ID> --message "Restore last Python Worker"`.
Leave storage, bindings, and `SECRET_KEY` unchanged. Fix/revert the Rust cutover
before resuming Builds; rollback does not rewind DO or R2 data.
