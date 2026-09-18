# Frontend visual reference capture

`scripts/frontend_visual_reference_probe.mjs` produces paired review artifacts from two isolated static entries:

- `reference/` serves the checked-in shipped `public/index.html` and its historical application assets.
- `candidate/` serves `.frontend-app-build/cutover-candidate`, which must be a materialized source candidate.

Both entries use the same disposable local backend and fixed browser configuration: 1366 × 900 viewport, DPR 1, `zh-CN`, dark color scheme and reduced motion. The probe initializes the public `arcade-language` preference to `zh-CN` in both isolated origins because the shipped application initializes its i18n runtime to that locale. It unlocks Credits before either desktop capture, then records the same five states: desktop, focused chat composer, About, Settings and Credits. It does not submit chat text or reset the world.

## CI invocation

Install the repository’s normal Node/Python dependencies and Chromium, then run:

```sh
npm run frontend:app:build
npm run frontend:cutover:candidate -- --materialize
node scripts/frontend_visual_reference_probe.mjs
```

The Python environment must provide FastAPI, HTTPX, python-chess, Uvicorn and websockets, matching `frontend:app:smoke`. `NORI_TEST_PYTHON` and `NORI_TEST_CHROMIUM` can select CI-managed executables. The backend and preview ports default to 47179, 47180 and 47181 and can be changed with `NORI_VISUAL_BACKEND_PORT`, `NORI_VISUAL_REFERENCE_PORT` and `NORI_VISUAL_CANDIDATE_PORT`.

Upload `frontend-visual-reference/` as the CI artifact. It contains five PNGs and `metadata.json` for each entry, plus a top-level `manifest.json` and bounded backend log. `NORI_VISUAL_OUTPUT` changes the artifact directory.

Each target is attempted independently. If one target fails partway through, its completed state records, `capture-failure.png` and failure metadata are retained and the other target still runs. After both attempts the probe raises an aggregate error so incomplete evidence remains a failing CI result.

## Evidence boundary

The probe verifies that the reference executed at least one historical JS/CSS asset and that the candidate executed none of the historical application inventory. The two origins and browser contexts remain separate; only the reference server can enter through `public/index.html`.

Screenshot hashes, browser/runtime metadata, loaded scripts/styles, console errors, failed static responses and the candidate marker are recorded for review. Successful capture means only that comparable evidence was generated. Pixel parity, typography parity and interaction parity remain pending until a reviewer inspects the paired images and records the result outside the generated manifest.

The historical floating composer uses a separate visual prompt and leaves its text input unnamed. The probe therefore identifies the single visible text input inside a form before any desktop window is opened, then records its native control attributes in each target's metadata. It does not add an accessible name, placeholder or any other test-only DOM state.

The historical Settings implementation likewise leaves each Radix slider thumb unnamed. The paired Settings state uses the first of the four visible sound sliders, which is master volume in both implementations, and records that control's native attributes without asserting that the two accessibility trees are already equal.

## Reviewed paired evidence

The paired capture for CI merge revision `d011f8bf7c4e19334f1422c3d32e67e863b64d93` (PR head `719b9993`) was inspected at the configured 1366 × 900 viewport. The manifest records the merge revision executed by CI; it must not be read as the PR head revision. This is a visual review record, not a pixel-parity certification.

- The desktop and focused-composer captures showed matching floating-region width, right alignment, dock-relative vertical placement and focused input geometry within normal antialiasing/frame variance.
- The chip upgrade notice was a deterministic mismatch: the candidate used a full-width mint block in document flow, while the shipped UI uses a 236 px dark glass notice positioned 14 px above the composer, offset 4 px to the right, with a speech tail. The source notice now uses the shipped structure and recovered style values; a new paired capture is still required to accept the change.
- The focused candidate exposed a CPU glyph and charge numeral where the shipped control uses a 16 px `scan-search` glyph whose opacity carries charge state. The source control now uses that glyph, removes the persistent numeral and follows the shipped focused/unfocused colors; recapture remains pending.
- The Live2D frames show different idle posture, blink and vertical silhouette at capture time, but consistent ground anchoring and no independent evidence of a transform or model-scale mismatch. No model scale or offset was changed from these screenshots. A deterministic pose/frozen-clock capture would be required before treating that difference as geometry.
- About, Settings and Credits exposed missing focused window outlines. The source had the theme variables but omitted the base `.gradient-border::before` mask; the shared source utility is now restored from the shipped CSS.
- About and Settings used opaque background tokens over the window glass. Those extra backgrounds have been removed. Settings now uses the recovered 6 px volume track and white 16 px thumb, and its speech activation control follows the volume rows so it no longer displaces the original sound layout.
- The Chinese capture exposed English catalog fallback titles. Registry titles now use the existing app/window translation keys while preserving per-instance custom titles.
- The source entry omitted repository-owned TTS/UI/provider and wallpaper compatibility extensions already present in the public entry. The source entry now loads the same maintained extensions and glass stylesheet; these are not historical application bundles.
- These source fixes require a new paired capture before visual acceptance. This record does not close model timing, all layouts, or the remaining app corpus.
