# Frontend candidate and rollback

Production serves the source app (`frontend-src/`). `scripts/cloudflare_builds_deploy.py`
and `start.bat` (via `scripts/local/prepare_source_frontend.mjs`) stage it with
`scripts/recovery/prepare_frontend_cutover_candidate.mjs`. `public/index.html`
stays unchanged as the historical rollback entry.

## Prepare the candidate

```bash
npm run frontend:app:build
npm run frontend:cutover:candidate                 # local symlink overlay
npm run frontend:cutover:candidate -- --materialize  # self-contained copy (CI / deploy)
```

Outputs (ignored):

- `.artifacts/build/app/cutover-candidate/` — the generated source build plus
  `public/` assets. The default mode links `public/` files as relative symlinks;
  it is local-only and must not be uploaded. `--materialize` copies them.
- `.artifacts/build/app/cutover-rollback/` — the historical index, every JS/CSS
  file it references, and `rollback-manifest.json` with sizes and SHA-256 hashes.

`--candidate PATH`, `--rollback PATH` and `--build PATH` override the locations.

## Checks performed

The preparer fails before replacing its previous outputs when:

- the source index or generated JS/MJS/CSS references a historical application chunk;
- a generated path would overwrite an existing public asset;
- an index reference, lazy chunk, UI font, PDF worker data, corruption audio
  worklet, Live2D model, soundtrack, Cubism runtime or Sarasa font is missing;
- the private live-world archive appears in the static candidate;
- the `NORI_ASSETS_R2` binding or live-world fingerprint contract is absent;
- a copied rollback file differs from its recorded hash.

It also runs a local rollback drill: swap the candidate index for the historical
one, verify every referenced file by hash, restore the candidate index and
re-hash the sources. The result is recorded under `rollbackDrill` in
`rollback-manifest.json`. This verifies the file set, not CDN behaviour.

The source index still loads the maintained compatibility files shared with the
historical entry: Cubism Core, `nori-runtime-shims.js`, the AI/provider/TTS/UI
settings and wallpaper scripts, `nori-settings-glass.css` and `fonts.css`.

## Emergency rollback

Set `NORI_DEPLOY_LEGACY_FRONTEND=1` in Workers Builds and retry the deployment,
or run `python scripts/cloudflare_builds_deploy.py --legacy-frontend`. That
deploys `public/` through the unchanged `wrangler.jsonc`. Remove the variable
afterwards. Locally, `start.bat` serves `public/` when `NORI_LEGACY_FRONTEND=1`
is set.

## CI

The `candidate` job in `.github/workflows/frontend-recovery-surfaces.yml`
materializes the candidate, runs `npm run frontend:cutover:smoke`, captures the
paired visual references (see [FRONTEND_VISUAL_REFERENCE.md](FRONTEND_VISUAL_REFERENCE.md)),
and dry-runs the Worker with the candidate as its Assets directory, checking
the live-world exclusion and the 3 MiB gzip budget.
