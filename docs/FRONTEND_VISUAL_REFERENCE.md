# Frontend visual reference capture

`scripts/probes/frontend_visual_reference_probe.mjs` produces paired review artifacts from two isolated static entries:

- `reference/` serves the checked-in shipped `public/index.html` and its historical application assets.
- `candidate/` serves `.artifacts/build/app/cutover-candidate`, which must be a materialized source candidate.

Both entries use isolated reset worlds in the same disposable local backend and fixed browser configuration: 1366 × 900 viewport, DPR 1, `zh-CN`, dark color scheme and reduced motion. The probe initializes the public `arcade-language` preference to `zh-CN` in both isolated origins because the shipped application initializes its i18n runtime to that locale. It unlocks Credits before either desktop capture, then records the same five states: desktop, focused chat composer, About, Settings and Credits. It does not submit chat text. Before each target it resets only the disposable test world and waits for both reset acknowledgement and the new world payload, preventing the reference Credits visit from contaminating candidate state.

## CI invocation

Install the repository’s normal Node/Python dependencies and Chromium, then run:

```sh
npm run frontend:app:build
npm run frontend:cutover:candidate -- --materialize
node scripts/probes/frontend_visual_reference_probe.mjs
```

The four deterministic game start routes are captured separately so the
historical entry cannot mutate the candidate's game world:

```bash
node scripts/probes/frontend_visual_games_probe.mjs
```

That probe starts a fresh local backend for each entry, fixes both contexts to
`zh-CN`, 1366 × 900, DPR 1 and reduced motion, and records the outer window
geometry for Codenames, Pictionary, Chess and Cake Duel. It opens only each
start route and exits without starting a game, so it neither invokes private
agent output nor treats locally authored tutorial narrative as original text.

The probe uses the Rust local backend (`cargo build --release -p nori-local`), matching `frontend:app:smoke`. `NORI_TEST_CHROMIUM` can select a CI-managed browser. The backend and preview ports default to 47179, 47180 and 47181 and can be changed with `NORI_VISUAL_BACKEND_PORT`, `NORI_VISUAL_REFERENCE_PORT` and `NORI_VISUAL_CANDIDATE_PORT`.

Upload `.artifacts/visual-reference/` as the CI artifact. It contains the five system PNGs and four game-start PNGs per entry, per-probe manifests, target metadata and bounded backend logs. `NORI_VISUAL_OUTPUT` changes the system artifact directory; `NORI_VISUAL_GAMES_OUTPUT` changes the game subdirectory.

Each target is attempted independently. If one target fails partway through, its completed state records, `capture-failure.png` and failure metadata are retained and the other target still runs. After both attempts the probe raises an aggregate error so incomplete evidence remains a failing CI result.

## Evidence boundary

The probe verifies that the reference executed at least one historical JS/CSS asset and that the candidate executed none of the historical application inventory. The two origins and browser contexts remain separate; only the reference server can enter through `public/index.html`.

Screenshot hashes, browser/runtime metadata, loaded scripts/styles, console errors, failed static responses and the candidate marker are recorded for review. Successful capture means only that comparable evidence was generated. Pixel parity, typography parity and interaction parity remain pending until a reviewer inspects the paired images and records the result outside the generated manifest.

The historical floating composer uses a separate visual prompt and leaves its text input unnamed. The probe therefore identifies the single visible text input inside a form before any desktop window is opened, then records its native control attributes in each target's metadata. It does not add an accessible name, placeholder or any other test-only DOM state.

The historical Settings implementation likewise leaves each Radix slider thumb unnamed. The paired Settings state uses the first of the four visible sound sliders, which is master volume in both implementations, and records that control's native attributes without asserting that the two accessibility trees are already equal.

Review notes from individual CI captures are not kept here; they live with the PR that produced them.
