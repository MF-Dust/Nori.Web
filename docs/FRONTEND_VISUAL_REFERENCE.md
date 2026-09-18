# Frontend visual reference capture

`scripts/frontend_visual_reference_probe.mjs` produces paired review artifacts from two isolated static entries:

- `reference/` serves the checked-in shipped `public/index.html` and its historical application assets.
- `candidate/` serves `.frontend-app-build/cutover-candidate`, which must be a materialized source candidate.

Both entries use isolated reset worlds in the same disposable local backend and fixed browser configuration: 1366 × 900 viewport, DPR 1, `zh-CN`, dark color scheme and reduced motion. The probe initializes the public `arcade-language` preference to `zh-CN` in both isolated origins because the shipped application initializes its i18n runtime to that locale. It unlocks Credits before either desktop capture, then records the same five states: desktop, focused chat composer, About, Settings and Credits. It does not submit chat text. Before each target it resets only the disposable test world and waits for both reset acknowledgement and the new world payload, preventing the reference Credits visit from contaminating candidate state.

## CI invocation

Install the repository’s normal Node/Python dependencies and Chromium, then run:

```sh
npm run frontend:app:build
npm run frontend:cutover:candidate -- --materialize
node scripts/frontend_visual_reference_probe.mjs
```

The four deterministic game start routes are captured separately so the
historical entry cannot mutate the candidate's game world:

```bash
node scripts/frontend_visual_games_probe.mjs
```

That probe starts a fresh local backend for each entry, fixes both contexts to
`zh-CN`, 1366 × 900, DPR 1 and reduced motion, and records the outer window
geometry for Codenames, Pictionary, Chess and Cake Duel. It opens only each
start route and exits without starting a game, so it neither invokes private
agent output nor treats locally authored tutorial narrative as original text.

The Python environment must provide FastAPI, HTTPX, python-chess, Uvicorn and websockets, matching `frontend:app:smoke`. `NORI_TEST_PYTHON` and `NORI_TEST_CHROMIUM` can select CI-managed executables. The backend and preview ports default to 47179, 47180 and 47181 and can be changed with `NORI_VISUAL_BACKEND_PORT`, `NORI_VISUAL_REFERENCE_PORT` and `NORI_VISUAL_CANDIDATE_PORT`.

Upload `frontend-visual-reference/` as the CI artifact. It contains the five system PNGs and four game-start PNGs per entry, per-probe manifests, target metadata and bounded backend logs. `NORI_VISUAL_OUTPUT` changes the system artifact directory; `NORI_VISUAL_GAMES_OUTPUT` changes the game subdirectory.

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

The follow-up c771 candidate capture (manifest CI merge revision `d608e30f7867de4d67e9c7b3cdcde21930108dee`) confirmed the recovered notice dimensions, glass treatment and tail. It also exposed a structural 36 px vertical mismatch: the candidate notice was anchored to the conversation panel while the shipped notice is a direct child of the relatively positioned composer. The source notice has now been moved into that composer, preserving the recovered `bottom: calc(100% + 14px)` relationship without adding a screenshot-specific offset. This correction remains pending a paired recapture.

The ca657 capture (CI merge `2369f3e43024f9daaf042fe1d1d61edbbf2861f0`, run `35364031025`, artifact `10554938927`) was reviewed next. The focused composer and chip notice now align with the reference; Credits content, outer geometry, brand icons and window outlines also agree in these captured states. Settings volume geometry and interface localization are restored. Its four differing navigation/audio glyphs were checked against shipped symbols and corrected to Gauge, Monitor, Music and MicVocal. The extra source speech-activation control remains functional and is not claimed as shipped visual parity.

This review also found that the historical About screenshot contained no visible window even though its heading had satisfied Playwright's visibility check. It is invalid About evidence. The capture now waits for the actual window and all ancestor opacities to reach their visible state; About acceptance requires a fresh capture. Dock completion notice and dynamic application icon differences were identified for source correction. Live2D idle/time variance remains outside pixel-parity claims.

The Dock fixes now follow the shipped `MOe` and `q4` contracts: Credits displays its attention dot and persistent thank-you tooltip after `arg.farewell.shown` until `credits.opened`; iconless Settings uses its gear glyph instead of an empty icon surface. Focused regression tests cover both conditions. A paired recapture remains required.

The first game capture exposed a historical Pictionary title composed of two identical heading layers. The probe now resolves readiness inside the unique exclusive window and checks ancestor opacity. It retains strict window-count, historical-asset isolation and page-error assertions. The available Codenames pair also exposed an incorrectly expanded initial difficulty panel and unsupported card container; source now follows the shipped two-step mission setup and initial 320 px menu. Pictionary's reference failure image and start-screen source established its 408 × 580 notebook proportions and absence of the extra source label; those differences were corrected. Chess and Cake Duel have no completed historical pair in that capture, so no visual equivalence is inferred for them.

The next candidate job `105667660666` (run `35365741246`, PR head `7de88a5`, CI merge `b59f13e6c425a71e8880212a3a4e107556031e79`, artifact `10555883987`) passed the static candidate browser, all five system captures, all four game captures and Worker dry-run. Direct image review now confirms a valid visible About pair with matching window geometry, logo, initial credits text and clipping. Settings navigation/audio glyphs and its Dock gear are present. The Credits attention marker was still missing in the candidate image. Investigation proved fixture contamination: the reference Credits visit had already set `credits.opened` in their shared backend world. The probe now resets that disposable world before each target and asserts the real red badge, thank-you tooltip and visible opacity. No further source change was needed; a fresh isolated capture is required to accept the marker.

All four game pairs from artifact `10555883987` were reviewed against their shipped chunks. That evidence led to a second concrete correction: Chess board pieces now use the shipped solid black/white fills and shadows rather than blue outline glow; Pictionary now uses the shipped localized cover labels, layered foil title, SVG icons and paper-card/button dimensions; Codenames uses the shipped non-compact compass/title/spacing/button/frame dimensions. Cake Duel's captured start screen showed no material mismatch warranting a source change. These latest changes require recapture; the review does not certify animation, random particle frames, paper texture details, font rasterization or private-agent narrative parity.
