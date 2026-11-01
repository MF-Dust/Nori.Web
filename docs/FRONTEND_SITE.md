# Frontend build and site

The only frontend is the source app in `frontend-src/`. `public/` holds static
assets (Live2D models, audio, fonts, icons, legal pages, settings scripts) and
has no `index.html` of its own.

## Build

```bash
npm run frontend:app:build   # Vite output in .artifacts/build/app (index.html + hashed assets)
```

The build does not copy `public/`; every consumer layers the two trees:

| Consumer | How the build meets `public/` |
| --- | --- |
| `nori-local` (`start.bat`, `npm start`, smokes) | Serves the build dir first, then `public/`. The build dir is `NORI_FRONTEND_DIR`, else `frontend/` next to the executable, else `.artifacts/build/app` under the working directory. |
| Release package | `scripts/build_release.py` ships the build as `frontend/` beside `public/`. |
| Cloudflare Workers Assets | Needs one directory: the staged site below. |

## Staged site

```bash
npm run frontend:site                   # .artifacts/build/site, public/ linked as relative symlinks (local only)
npm run frontend:site -- --materialize  # self-contained copy (CI, deployment)
```

`wrangler.jsonc` uses `.artifacts/build/site` as its Assets directory, and
`scripts/cloudflare_builds_deploy.py` stages it with `--materialize` before
`wrangler deploy`. `--build`, `--public` and `--site` override the locations.

Staging fails when:

- a generated path collides with a public asset, or `public/index.html` exists;
- an index reference, lazy chunk, UI font, PDF worker data, corruption audio
  worklet, Live2D model, soundtrack, Cubism runtime, Sarasa font or the
  `fonts/web` mirror is missing;
- the private live-world archive appears in the site.

The site's marker `.nori-frontend-site.json` is excluded from upload by
`public/.assetsignore`.

## Checks

- `npm run frontend:site:smoke` serves the materialized site with Vite preview
  against a local backend: Live2D, chat, Terminal, reload and a narrow viewport.
- The `validate-worker` job in `.github/workflows/cloudflare-worker.yml` stages
  the site, dry-runs `wrangler deploy`, and checks that no frontend asset leaked
  into the Worker bundle (`scripts/verify/verify_frontend_site_worker_assets.mjs`)
  and that the WASM stays below 3 MiB gzipped.
