# Frontend cutover candidate and rollback drill

This procedure prepares the same isolated source-app candidate used by the
Cloudflare production deployment without changing `public/index.html`.
`scripts/cloudflare_builds_deploy.py` runs the materialized form automatically
and deploys through `.wrangler-candidate.json`. The historical public entry and
its required executable assets remain available for explicit rollback.

## Prepare the source build

```bash
npm run frontend:app:build
node scripts/prepare_frontend_cutover_candidate.mjs
```

The default command creates two ignored directories:

- `.frontend-app-build/cutover-candidate/` is a complete local view of the
  candidate site. Generated source-app files are regular files. Existing
  `public/` assets are relative symlinks, including the historical chunks kept
  for comparison and rollback.
- `.frontend-app-build/cutover-rollback/` contains the current production
  index, every local JavaScript and CSS file directly referenced by that index,
  and `rollback-manifest.json` with their byte counts and SHA-256 hashes.

The symlink overlay avoids copying the roughly 182 MB public tree for each
local check. It is a local staging view and must not be uploaded as a deployment
artifact. Prepare a self-contained directory for CI or a Cloudflare dry-run
with:

```bash
node scripts/prepare_frontend_cutover_candidate.mjs \
  --materialize \
  --candidate /path/to/candidate \
  --rollback /path/to/rollback
```

Materialized mode copies the public assets and contains no symlinks. Deployment
tooling may also upload the generated build and static public roots as one
logical asset set if it supports multiple input roots; generated/public path
collisions remain an error either way.

## Checks performed

The preparer fails before replacing its previous candidate outputs when any of
these contracts is broken:

- the source index or any generated JavaScript, MJS, or CSS refers to an exact
  historical application chunk name;
- a generated path would overwrite an existing public asset;
- an index reference, lazy JavaScript chunk, UI font, PDF preview/worker data,
  corruption audio worklet, Live2D model, soundtrack, Cubism runtime, or Sarasa
  font is absent from the candidate;
- the private live-world archive appears in the static candidate;
- the `NORI_ASSETS_R2` binding or live-world fingerprint synchronization
  contract is absent;
- a copied rollback file differs from its production SHA-256 hash.

The browser may still load the explicit vendor/runtime boundary referenced by
the source index: Cubism Core, `nori-runtime-shims.js`, the repository-owned
AI/provider/TTS/UI settings and wallpaper compatibility scripts,
`nori-settings-glass.css`, and `fonts.css`. These are the same maintained
compatibility entry files used by the existing public index. Historical application chunks remain
present in the staged public asset set for rollback, but the candidate index and
generated source graph do not execute them.

## Rollback drill

Preparation performs an exact local swap test:

1. Save the candidate index bytes and hash.
2. Replace the candidate index with the saved production index.
3. Confirm the replacement equals the production index hash.
4. Confirm every JavaScript and CSS file required by that production index is
   reachable from the candidate and equals its saved hash.
5. Restore the candidate index and confirm its original hash.
6. Re-hash the production sources to confirm the drill did not modify them.

The result is recorded under `rollbackDrill` in
`rollback-manifest.json`. This verifies the file set and the reversible index
swap; it does not simulate CDN caches or constitute a production rollback.

For an emergency production rollback, set
`NORI_DEPLOY_LEGACY_FRONTEND=1` in Workers Builds and retry the deployment, or
run the wrapper with `--legacy-frontend`. That path uses the unchanged
`wrangler.jsonc` Assets directory, `public/`. Remove the variable after recovery
to return subsequent deployments to the source candidate.

## Candidate browser and Worker evidence

The `candidate` job in `frontend-recovery-surfaces.yml` builds and materializes
the source entry, then serves that exact directory through Vite preview. The
browser probe checks model loading, chat, Terminal, persistence after reload,
narrow layout, missing resources and historical application requests. This
probe passed on `c9fb95c4` and `a72aea36`; it is not a full authentication or
production deployment test.

The same job writes a temporary Wrangler configuration whose Assets directory
is the materialized candidate, preserving the production configuration. It
runs `pywrangler deploy --dry-run` and checks the required game word modules,
live-world archive exclusion, frontend asset exclusion and the 3 MiB gzip
budget. The dry-run runs after successful staging even if visual capture fails.
On `a72aea36` Wrangler completed with 2458.76 KiB gzip; the subsequent asset
guard incorrectly treated two unrelated `LICENSE` basenames as a leak.

The corrected asset guard compares SHA-256 file contents, allowing dependency
license notices in both distributions. It detects even renamed frontend
payloads in the Worker output. A regression case covers the observed license
collision and a genuinely copied payload. The corrected guard was
verified by [run 35361093541](https://github.com/MF-Dust/Nori.Web/actions/runs/35361093541)
on head `719b9993` (CI merge ref `d011f8bf`): candidate browser, paired visual
capture, asset-content guard and Worker dry-run all passed. Visual differences
found by inspecting those images are tracked separately from capture success.

## Remaining parity evidence

The production entry is source-owned. Full recovery readiness remains false
until the remaining parity boundaries close, including:

- the normal typecheck, build, recovery, ownership, cutover, and application
  smoke gates;
- the visual and original-agent acceptance recorded by the recovery ledgers;
- browser acceptance for the remaining Messenger, games, Live2D and supporting
  app differences.
