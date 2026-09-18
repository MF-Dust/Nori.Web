# Frontend visual reference capture

`scripts/frontend_visual_reference_probe.mjs` produces paired review artifacts from two isolated static entries:

- `reference/` serves the checked-in shipped `public/index.html` and its historical application assets.
- `candidate/` serves `.frontend-app-build/cutover-candidate`, which must be a materialized source candidate.

Both entries use the same disposable local backend and fixed browser configuration: 1366 × 900 viewport, DPR 1, `en-US`, dark color scheme and reduced motion. The probe unlocks Credits before either desktop capture, then records the same five states: desktop, focused chat composer, About, Settings and Credits. It does not submit chat text or reset the world.

## CI invocation

Install the repository’s normal Node/Python dependencies and Chromium, then run:

```sh
npm run frontend:app:build
npm run frontend:cutover:candidate -- --materialize
node scripts/frontend_visual_reference_probe.mjs
```

The Python environment must provide FastAPI, HTTPX, python-chess, Uvicorn and websockets, matching `frontend:app:smoke`. `NORI_TEST_PYTHON` and `NORI_TEST_CHROMIUM` can select CI-managed executables. The backend and preview ports default to 47179, 47180 and 47181 and can be changed with `NORI_VISUAL_BACKEND_PORT`, `NORI_VISUAL_REFERENCE_PORT` and `NORI_VISUAL_CANDIDATE_PORT`.

Upload `frontend-visual-reference/` as the CI artifact. It contains five PNGs and `metadata.json` for each entry, plus a top-level `manifest.json` and bounded backend log. `NORI_VISUAL_OUTPUT` changes the artifact directory.

## Evidence boundary

The probe verifies that the reference executed at least one historical JS/CSS asset and that the candidate executed none of the historical application inventory. The two origins and browser contexts remain separate; only the reference server can enter through `public/index.html`.

Screenshot hashes, browser/runtime metadata, loaded scripts/styles, console errors, failed static responses and the candidate marker are recorded for review. Successful capture means only that comparable evidence was generated. Pixel parity, typography parity and interaction parity remain pending until a reviewer inspects the paired images and records the result outside the generated manifest.
