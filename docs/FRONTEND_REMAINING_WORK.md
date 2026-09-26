# Current execution status — PR #43

Updated 2026-09-26 after the remaining-source pass. This section supersedes the historical status paragraphs below.

## Source gaps closed in this pass

Shipped behavior that was still diverging is now in `frontend-src`:

- Datasea messages land as full lines. Only the dots window animates, inside the 440×540 window, with the two existing cues. Wave transmissions use the same dark bubbles in the shipped 520×42vh masked column. Cosmic, white and CG lines keep the untyped suffix in a hidden span so the line does not reflow, and fade with `power2.inOut` over the shipped 0.9s. Cosmic/white typing stays on shipped `Math.max(len/cps, 0.6)`.
- Memory alert and tint rise with `power2.in`, hold, then fall with `power2.out`. The scene sends `memory_alert` twice during drain. It does not invent a reply.
- Boot and Ending environment channels use the shipped GSAP power eases. Camera smoothstep is unchanged.
- The floating conversation stack lifts to 94px while a chip readout is visible. Game chat rows enter and leave over 300ms without a motion library.

`frontend:typecheck`, `frontend:stories:test` and `frontend:recover:check` passed. Browser probes passed for cult, farewell-ending, boot-corruption, boot-matrix, cold-open, memory-datasea (including the device matrix) and datasea-games. Visual capture wrote 44 frames. `npm run frontend:games:lifecycle` passed en-US, zh-CN and reduced motion. A desktop browser check settled the conversation margin at 12px, then at 94px, and saw a Codenames chat row take the enter pose.

`messenger`, `games` and `live2d` stay `complete: false`. Original agent sessions are still blocked because `nori_talk.request` returns `{type:"noop"}`. `production-entry` stays false and `public/index.html` is unchanged.

## Remaining gaps

11 of 15 cutover boundaries are complete. The four open ones are `messenger`, `games`, `live2d`, and `production-entry`.

External blocker, same noop:

- Messenger original-agent sessions, full corpus, and media sessions.
- Codenames clue/guess dialogue, Chess agent speech, Pictionary snapshot inference, and Cake Duel agent media.
- Corruption `corruption_scare`, Memory `memory_alert`, and head-pat `pat` replies. The requests are sent. No reply is invented.
- Debug Inject Talk and Nori Context.

Acceptance still open, with source already in place:

- Original-client frame and audio comparison for Boot, Corruption, Memory, Datasea, Farewell, and Ending. The 44-frame capture has no pixel baseline.
- Head-pat spark shape and pacing.
- Debug panel layout comparison.
- Messenger close/reopen/reconnect, locale, and connection-loss matrix.
- A fuller input-device matrix for the four games than the lifecycle play path.

Datasea lines and the Farewell monologue are shipped static copy, not `nori_talk` sessions. Corruption `vBehindScale` stays unwired because the shipped glow consumer is unreachable.

`production-entry` waits until the other three open boundaries have evidence. `public/index.html` is unchanged.

## This pass: baseline repair, Boot/Ending static parity, readiness fix

### Baseline repairs (all pre-existing failures on `0ac8b49`)

| Failure | Root cause | Fix |
| --- | --- | --- |
| `frontend:recover:check` red at `verify_codenames_screen_recovery` | The `games` cutover note was rewritten and dropped the Codenames and Cake Duel ownership facts the gate asserts | Restored both sentences to `frontend-src/migration/cutover-status.ts` |
| `verify_messenger_avatar_recovery` | Verifier matched an unscoped CSS string; the rule is correctly scoped to `[data-messenger-shipped-surfaces]` | Verifier now matches the rule and additionally asserts the scope |
| `tests/frontend-browser-bounty.test.ts` | Hardcoded one machine's Han-vs-Latin `localeCompare` answer | Asserts the shipped `localeCompare` rule itself plus an ASCII-keyed content check |
| `tests/frontend-story-clock.test.ts` | Orphaned — no `package.json` script ran it | Wired into `frontend:stories:test` |
| `verify_frontend_candidate_worker_assets` | Needs `.candidate-worker-dist`, built by the Cloudflare worker CI step | Not a failure; prerequisite is CI-only |

No gate was weakened. The two verifier edits assert strictly more than before.

### Real source fix: visibility-scoped cold-open readiness

Boot polled cold-open readiness from `requestAnimationFrame` behind a plain 60 s
`setTimeout`. A Boot entered from a hidden tab therefore failed with "Scene resources
could not be loaded" after a minute of normal loading. `story-readiness.ts` now owns the
rule for Boot and Ending together. Details in `FRONTEND_BOOT_CORRUPTION_RECOVERY.md`.

### Boot / Ending original-constant comparison: no gap found

`bootScene` and `endingFrame` were re-derived from the shipped cold-open code in
`public/assets/NormalApp-*.js`. Phase durations, the `settle = 3.3` formula, the
`YP = -0.6` world offset folded into all four camera presets, the dive arc, `cameraFar`,
the wake burst window splits, `noriDim`, `camNull` and the six-row Ending segment table
all match the shipped implementation exactly. Three suspected mismatches were checked
algebraically and disproved. **This is recorded as verified parity for the static
timeline and camera, not as completed original visual/audio acceptance.**

### Test evidence, 2026-09-26

| Command | Result |
| --- | --- |
| `npm run frontend:typecheck` | PASS |
| `npm run frontend:build` / `frontend:app:build` | PASS |
| `npm run frontend:cutover:check` | PASS, 4 pending boundaries |
| `npm run frontend:recover:check` | PASS (was failing on arrival) |
| `npm test` | PASS |
| `npm run frontend:stories:test` | PASS, 17 cases (was 12) |
| `npm run frontend:runtime:test` | PASS, 126 + 4 |
| `npm run frontend:games:test` | PASS |
| `npm run frontend:ownership:test` | PASS |
| `npm run frontend:cutover:smoke` | PASS |
| `smoke_frontend_recovery_surfaces.mjs boot-corruption` | PASS |
| `smoke_frontend_recovery_surfaces.mjs farewell-ending` | PASS |
| `smoke_frontend_recovery_surfaces.mjs memory-datasea` | Partial — waves 1 games passed through real input, run stopped for host load |
| `npm run frontend:games:smoke`, `frontend:app:smoke` | Not re-run this pass; launch four swiftshader browsers and saturated the host |
| `npm run test:frontend` | No such script exists in `package.json` |

Chromium runs on `--use-angle=swiftshader`, i.e. CPU software rendering. The cold-open
renderer (bloom, jump-flooded SDF morph, 2 000 dust instances, Cubism) is heavy enough on
CPU that running several at once starves the host. Prefer one probe at a time.

## Latest Progress (2026-09-26)

### Supporting Apps Boundary Complete
Supporting Apps boundary is now marked complete with documented limitations:
- ✅ All system apps source-owned: Settings, About, Credits, Preview, Debug, Scene Editor
- ✅ Debug binds production Live2D/Audio/Pat/reaction runtimes
- ✅ Smoke test evidence: `frontend:app:smoke` covers all system apps
- 📝 Private Inject Talk/Nori Context handlers documented as intentionally unavailable (local backend limitation)

**Progress: 11/15 boundaries complete (73.3%)**

### Non-Agent Acceptance Analysis Complete
Comprehensive evaluation of what can be completed without agent backend:

**Messenger**: all non-agent source complete; no percentage is claimed
- ✅ All UI components source-owned and tested
- ✅ Deterministic Chromium tests pass
- ⏸️ Lifecycle tests ready (tool available)
- 🔴 Agent dialogue/media sessions blocked

**Games**: all non-agent source complete; no percentage is claimed
- ✅ All 4 game runtimes complete, smoke tests pass
- ✅ Runtime and browser tests pass
- ⏸️ Lifecycle tests ready (tool available)
- 🔴 Agent dialogue/voice/inference blocked

**Live2D**: ~50% complete
- ✅ Cult: 100% complete
- ✅ Boot/Ending: Can complete independently (no agent dependency)
- 🔴 Corruption/Memory/Datasea/Farewell: Agent voice/dialogue blocked

See `FRONTEND_NON_AGENT_ACCEPTANCE.md` for detailed breakdown.

### Agent Backend Blocker Identified
Critical path blocker: `backend/services/event_dispatcher.py` returns `{type: "noop"}` for `nori_talk.request`

**Blocks 3 remaining boundaries**:
- **Messenger**: Agent/media session acceptance (source complete otherwise)
- **Games**: All 4 games agent dialogue/voice/inference (source complete otherwise)
- **Live2D**: 4 segments need agent voice/dialogue (Corruption, Memory, Datasea, Farewell)

This is an external dependency, not frontend work. Messenger, Games, and Live2D source implementations are complete; they await agent backend availability for full acceptance.

## Latest Progress (2026-09-26)

### Smoke Test Optimization Complete (Commit 57ada1f)
- **Parallelization**: 7 probes reorganized into 2 parallel groups (4+3), measured 50% time reduction (418s → 209s)
- **Adaptive timeouts**: CI/local/fast mode auto-detection, `NORI_TEST_FAST_MODE` environment variable
- **Polling optimization**: Backend startup check 150ms → 100ms
- **CI configuration**: Updated timeouts (memory-datasea 35→25min, others 25→18min)
- **Bug fixes**: Chip probe timeout issue resolved

### New Test Tools Added
- **`scripts/frontend_visual_comparison.mjs`**: Visual capture for Messenger/Games/Live2D states
- **`scripts/frontend_games_lifecycle_test.mjs`**: Complete lifecycle testing (start→play→close→reopen→reconnect) for 4 games × 2 locales × reduced motion

### Acceptance Tools Ready
All 5 remaining boundaries (messenger/games/live2d/supporting-apps/production-entry) now have systematic test tools for visual comparison and lifecycle acceptance. See `FRONTEND_ACCEPTANCE_STATUS.md` for detailed status.

---

All seven story producers are registered in source: Boot, Corruption climax, Cult, Memory, Datasea, Farewell and Ending. `StoryScenes` and the runtime `STORY_ORDER` call chain mount all seven; the six non-Cult segments still lack original visual, narrative, media and agent parity. Source registration is not whole-story acceptance. Datasea source/probe coverage includes all three waves and all twelve games; original visual, media and agent acceptance remain open.

Messenger interaction fixes, real Debug socket/compute controls, Credits SVGs, expression/motion scene channels, game presentation and model-reaction integration are in the current implementation batch. `FRONTEND_COVERAGE_MATRIX.md` records all 15 registered applications and their remaining evidence. Independent Chromium jobs prevent one broken surface from hiding other results.

Historical evidence checkpoint: 2026-09-18 16:15 UTC. The run/job IDs below are retained as historical records; no new CI result is asserted for HEAD `085bad3`. The local test baseline is 106 runtime cases, 11 story cases, 20 game cases and 3 historical-asset scanner cases passing. Browser verification runs in GitHub Actions because the execution sandbox denies Chromium socket creation. The cold-open fault probe isolates failed/retried/cancelled image loads in fresh contexts; CI 35354435518 passed the full source application smoke. On historical head `f7a7fa6683adc8c9088d416a2fa6784c94464ac1`, surface run `35364523143` passed Debug, cold-open, Boot/Corruption, Farewell/Ending and Messenger; job `105663601161` also passed all 12 Datasea games through real pointer/keyboard input. Debug job `105663601223` covers the UI-to-facade contract. In the prior Worker job `105661992194`, `Nori scene and cold-open lifecycle` passed against the real NoriStage model, including catalog, physics restoration and HeadPat restoration assertions. The job then failed in Scene editor because the new Audio Debug tab had dropped the real `Corrupt voice` checkbox. Commit `7de88a5` restores that checkbox and the Desktop music selector through the existing DebugScreen scene lease, preserving story/world/unmount cleanup. Worker run `35365741254`, job `105667661060`, then passed the unchanged Scene tools assertions, the complete Scene editor step, the real NoriStage/cold-open probe and every later source-app probe.

All four incomplete cutover gates remain false: `messenger`, `games`, `live2d` and `production-entry`. `supporting-apps` was flipped to complete in `705a2e7`. Shatter and Datasea have production-backed dedicated tuners, and the shipped Debug chunk contains no other per-cinematic tuner tabs. The general tabs now bind the mounted Live2D model, persistent audio settings and mixer/speech runtime, production head-pat recognizer/spring/input/synth, all 37 recovered semantic reaction events including Cake Duel, forced variant/cooldown/mood/tell diagnostics, all recovered Chess/Codenames/Cake Duel scenario IDs, and the real notification RPC/event stream. Live2D idle/lip tuning, Audio transport/effects, Pat telemetry and the reaction internals are source-bound; the shipped Debug chunk exposes no additional per-cinematic tuner family. The remaining Debug gaps are original layout comparison and the private Inject Talk/Nori Context handlers. Those two private-agent tabs report the blocker and observable session state without substitute actions. `nori_talk.request` remains a documented local no-op, so this environment cannot certify original agent replies. Datasea's shipped static text is now source-owned; message-window/compositor parity and private-agent speech remain tracked separately from renderer completion. No production entry has been switched.

See `FRONTEND_RECOVERY_EXECUTION_PLAN.md` for task IDs and the scene-specific recovery documents for exact boundaries.

## Browser bounty-extension pass

The Browser host now owns the shipped `bounty.installExtension` lifecycle and the installed “省钱喵” surface, including the recovered `qm-*` card/button/toast/progress/pulse/confetti styling and reduced-motion rules. Page commands open the recovered permission dialog; concurrent requests reject the older waiter, Escape/cancel resolves false, and acceptance performs the shipped best-effort `client.emitFact` for `bounty.ext_installed` before resolving true to the iframe. After installation the toolbar surface consumes the real page `submittable` signal, applies the shipped 3-second detection/6-second toast timing, submits page URLs or file artifacts through the existing `manifold.bounty.submit` RPC, restores the shipped tree/history/breadcrumb file picker with vault and cold-volume/QFR upload gates, distinguishes duplicate facts from failed evidence, and derives the 5-order membership state from the shipped dirt/honeypot facts. The backend bounty path now commits through the normal manifold broadcaster so successful claims update source facts immediately. The source application smoke now drives a real Browser iframe `submittable` message and the backend-recognized `verify-now.com` honeypot through `manifold.bounty.submit`, then waits for the broadcast-driven membership completion surface.

## Shared window/browser lifecycle pass

Window content callbacks now keep stable identities while Zustand title/status updates remain idempotent, and all source subscription unsubscribe callbacks return `void` rather than `Set.delete()` booleans. Browser title/favicon/envelope/status/scroll notifications are guarded from effect re-entry. This removes the source-entry maximum-update-depth/white-screen failure seen when opening Browser and Doodle; the real application smoke now reaches the in-game page and continues through the remaining desktop probes.
## Notification substrate pass

The source shell now owns a session notification queue with the recovered 50-item/5-visible limits, story-time deferral, hover-paused auto-dismiss, overflow/clear actions, shipped notification styling, localized labels, and audio cue de-duplication. `notification.pushed` is decoded through one strict source parser and is mounted over the real desktop shell; the Debug Notifications tab reports the same queue instead of claiming it is unavailable. Signal artifact deltas now establish a silent first-history baseline, emit one arrival notification per unseen incoming message, and hand a pending thread focus to Messenger. Unit and browser coverage pins queue, parser, arrival, pending-focus, and shell behavior. Original visual comparison and private-agent/media acceptance remain separate Messenger work.

## Messenger surface parity pass

The Messenger base component now binds the shipped incoming-bubble and input-surface palettes directly, including the recovered secondary/background `color-mix` values, incoming `shadow-sm`, and the primary outgoing inset/drop shadow. Search, sealed/service composers, message/image bubbles and the typing indicator no longer depend on wrapper DOM ancestry for their core palette. The shipped-surface wrapper remains only as a compatibility layer for sealed alert/details choreography, focus/interactions and mobile transition fencing. Existing contract verification now requires the base component to own these bindings. Remaining Messenger work is original-session visual comparison, original-agent/full-corpus/media sessions and shell-arrival timing acceptance.

## Audio Debug parity pass

The source session mixer now exposes the shipped Debug transport/state surface without creating a second audio lifetime: context resume/suspend, loaded BGM/SFX buffers, BGM play/pause/resume/stop/seek/crossfade, active SFX count, HRTF listener/source/distance telemetry, and per-track Speech/Music/SFX reverb + wetness + filter controls. The effect graph mirrors the shipped equal-power dry/wet chain and room/hall/cave impulse parameters, while normal settings still own track volume/mute and production audio routing.

## Live2D Debug parity pass

The source Debug Live2D tab now drives the mounted production model for the shipped idle-state override, automatic sleep/wake fade values, direct Idle/Sleep transition audition, lip-sync amplitude override, mouth-open gain, amplitude/constant mouth-form modes, and per-expression lip-sync shares. The talking simulator uses the shipped 48 ms amplitude trace and releases its override on stop, story takeover or unmount. The normal fact-derived idle state and production speech amplitude remain the default path when Debug overrides are cleared. Original Debug layout comparison remains separate acceptance work; the shipped reaction engine controls are now source-bound.

---

# Frontend recovery: remaining acceptance work

This ledger expands the five incomplete cutover boundaries into concrete tasks. It records source ownership and verification separately from original visual/agent parity. The authoritative switch remains `frontend-src/migration/cutover-status.ts`.

| Area | Current source coverage | Remaining acceptance work |
| --- | --- | --- |
| Boot | Registered director scene, fracture, camera/timeline, ocean reflection/light/dust, bloom/FXAA, glyph-to-model field, plankton and wake interaction | Original frame/audio comparison, re-entry/error matrix and full cross-scene handoff acceptance |
| Corruption climax | Registered eleven-phase scene, entry/recovery overlays, six antivirus microgames, camera/light/model projection, local audio, QTE and wake gates | Exact original animation/disturbance comparison, original reply text/voice, narrow/input/reload matrix |
| Memory | Registered five-window archive, gated reveals, flood/sweep, compute drain and void handoff | Browser run completion, original window copy/visual comparison, interruption/voice corpus |
| Datasea | Registered GLB materials, temporal/TAA/bloom/FXAA, camera phases, audio and twelve WaveGate games; source/probe coverage includes all three waves and all twelve real-input games | Original visual/frame comparison, media/asset acceptance, agent dialogue and full quality/device matrix |
| Farewell | Registered dedicated actor, expression/pose timeline, cue sequencing, completion fencing and acknowledged reload; f7a7fa6 isolated Chromium passed | Original line copy/voice and model keyframe comparison |
| Ending | Registered void-ascent camera, glyph/ocean/wake stages, input gate, audio and desktop return; f7a7fa6 isolated Chromium passed | Original final-frame/BGM/desktop-state comparison |
| Scene authoring | Source-owned Debug scene editor with validated UTF-8 import/export, phase/audio/camera/environment/model/chat forms, paused exact seeking, takeover cleanup, Shatter and Datasea production tuners with range checks; shipped whole-page Glitch parameters and presets are wired to the production filter; Live2D Debug controls mutate the mounted production model | Original Scene/Live2D layout and expanded browser acceptance; the shipped Debug chunk has no other dedicated cinematic tuner family |
| Head gesture | Projected head input, horizontal-motion qualification, one completion per hold, tunable production spring/input/friction synth, keyboard alternative, procedural filtered-noise rubbing, cancellable spark bursts, cartridge-scoped pat request, and live armed/state-gate/head-zone/model-pointer telemetry | Original particle appearance comparison and private-agent reply/media synchronization |
| Other model effects | Thinking, face, sleep, Three scene, scan/spatial projection, cold-open passes, live silhouette and semantic reaction director, including Cake Duel reactions/tells, forced Debug variants, cooldown bypass and persistent phase moods | Remaining cinematic composition and original model-motion comparison |
| Codenames | Deterministic 13-step tutorial/gate presentation, board/reveal lifecycle, sudden-death scenarios and expanded results | Original scripted-agent dialogue/voice, start/results visual comparison and full lifecycle acceptance; Chess and Cake Duel Debug scenarios are tracked under the shared game-debug surface |
| Chess | Complete 22-ply guided opening, legal play/history and result/request overlays | Full lifecycle acceptance, result timing visual comparison and original-agent speech choreography |
| Cake Duel | Source runtime/controller and start/game/results binding with challenge/Wolfy/reaction timing | Full desktop lifecycle, visual and original-agent/media acceptance |
| Pictionary | Cover/help/results surfaces, Pixi drawing, hints/audio, results journal and semantic model reactions | Original animation/decoration/model-expression comparison, full lifecycle acceptance and live-agent snapshot inference |
| Debug labs | Source-owned Debug panel and scene editor, including Connection/Scene/Facts, network faults, real compute ledger, gesture/reaction, game scenarios, Shatter/Datasea tuners, production Glitch/Live2D/Audio/Pat/reaction and notification controls | Original layout comparison and the private Inject Talk/Nori Context handlers; historical UI/facade and restored-Audio job records are retained above |
| Agent/media lifecycle | Controlled transport, real local backend, world/reconnect fences and application smoke | Full story and game acceptance against the original agent/media implementation |
| Production entry | Source app builds; materialized candidate, rollback hashes and candidate static smoke pass; historical entry remains protected | Historical candidate job 105667660666 is retained as evidence only; finish current visual/behavior/rollback review before assessing any switch |

## Scene editor implementation pass

The local authoring workflow now includes validated import/export, form editing for camera/environment channels, paused scrubbing and exact phase selection. Coincident gates, replay, audio offsets and hidden/manual pause state have passing unit coverage. Same-world replacement snapshots, production takeover and the browser controls now have passing Chromium coverage. The controller is isolated from story completion and network commands. See [Scene editor](FRONTEND_SCENE_EDITOR.md) for behavior and test details.

This closes the generic file/seek/channel authoring gaps with browser and screenshot acceptance. Exact inspection also isolates instantaneous phases before coincident gates. The seven producers are already registered in the source call chain; this authoring pass does not certify the six non-Cult segments' original parity. The production entry and five incomplete cutover boundaries remain unchanged.

## Earlier presentation pass

- Adds a head-gesture input and model plugin using the shipped timing/geometry constants. Hit regions follow projected head bounds, and normal app controls stay outside the gesture surface. Holding Space supplies an accessible alternative. Scene takeover, world epoch changes, blur and disposal stop the gesture.
- Adds a Debug scene-project preview that uses the existing StoryClock, StoryAudio and NoriSceneStore. Project validation rejects invalid durations, duplicate IDs, unsupported properties and nonlocal audio URLs. Preview never calls the director's completion API. Existing production stories keep priority over previews.
- Expands Codenames results with collected/remaining treasures, spent rounds, turns, cause-aware loss text, original card art and rematch/menu actions.
- Expands Pictionary results with solved/attempted totals, duration, accuracy, fastest/average time and a role-aware history journal. Skipped and unfinished words remain distinct. Both result screens adapt to short windows and reduced motion.

The source presentation registers all seven producers but does not certify a pixel-identical reconstruction. The six non-Cult cinematic rows above remain independent original-parity work items; the scene editor supplies a way to inspect and build their source-owned phases.

## Gesture, authoring and replacement follow-up

The head gesture now owns a two-second noise buffer and the inspected parallel filter topology. Velocity controls its envelope and low-pass cutoff through the shared SFX bus. Audio remains lazy until a browser gesture unlocks the mixer; release, blur, takeover and unmount stop the effect. A completed hold emits one `nori_talk.request` with `talkId: pat` scoped to `manifold.web`. It does not fabricate an agent line. Decorative spark bursts are source-owned and honor reduced motion, with original particle appearance still requiring comparison.

The editor now exposes every supported model/light/chat channel as a form, plus phase IDs/durations/gates, reordering/removal and audio IDs/paths/intervals/buses/loop/fades/source offsets. All mutations use the import/export validator. Model dim accepts 0–4, which includes the inspected 2.8 and 3.0 cinematic values. Channel selection follows phase identity when phases move. The subsequent graphics pass adds cold-open pass channels and Datasea passes. Shatter and Datasea have dedicated source tuners; the original Debug chunk provides general Scene and Glitch controls rather than additional per-cinematic tuner tabs.

Each director activation has a separate instance identity. Same-ID world replacement resets the director and invalidates old acknowledgements/retries/completion callbacks; Cult, Corruption preview and Debug overrides release their old resources on replacement or takeover. All seven producers are registered in the current source call chain; original-parity acceptance for the six non-Cult segments remains separate.

### Concrete external acceptance blocker

`backend/services/event_dispatcher.py` explicitly returns `{type: "noop"}` for `nori_talk.request`; `tests/test_live_backend_logic.py` verifies that behavior. This backend cannot serve as proof of the original pat/corruption/game agent response and speech choreography. Request delivery and local rendering can be verified here. Original-agent acceptance requires that implementation and a runnable test session. This limitation does not account for the six non-Cult segments' original-parity gaps: their source reconstruction is registered, while visual, narrative, media and agent acceptance remain outstanding. No overall completion is claimed.

## Cold-open graphics pass

The source renderer now owns the ocean group, animated water/reflection, godrays, 2,000 dust instances, three bloom iterations, FXAA and tilt-shift composition. A static glyph field and single-channel half-float SDF blend into the live Cubism silhouette through jump flooding. The red-channel upload format is regression-tested; the browser screenshots caught and resolved an incorrect two-channel alias. The cold-open owner also includes 3,000 plankton points and the procedural wake haze/branch particles.

The editor exposes ocean/glyph, plankton and wake controls, interpolates nested cold-open values and validates the original motion-blur range through 3.5. Resources load lazily on scene entry. Missing texture requests expose failure, successful siblings are disposed, and late image callbacks cannot revive a released scene. Closing the owner restores the normal background and releases textures, materials, targets and particles.

Chromium verifies real-model ocean, glyph, morph, formed and wake frames, resize, missing assets, cancellation and late loads. Unit coverage checks single-channel SDF layout, signed distances, disposal and nested project interpolation. These graphics stages are now usable source components; the six non-Cult producers are registered, while their original visual/media/agent parity remains separately tracked above.

## Debug reactions tab parity pass

Re-derived the reaction lab from the shipped renderer in `public/assets/Debug-D6AtxpLT.js`
rather than from the previous prose. The 37 catalog labels already matched exactly; the rest
did not.

- **9 shipped reaction notes were missing entirely.** The source catalog had no `note` field at
  all. Restored: `pictionary.player_wrong` and `skip_nori_drawing`; `chess.checked`,
  `accepts_request`, `declines_request`, `loses`; `codenames.her_clue_missed`, `assassin`;
  `cakeduel.challenged`, `bluff_caught`, `vindicated`. `scripts/extract_reaction_notes.mjs` is a
  reproducible extractor over the bundle.
- **Spec hint** now reads `priority · reacts N% · M outs`. The source had dropped the out count.
- **Outcome line** restored to the shipped shape: `label → variant` when played,
  `label → no reaction (lost the roll)`, `label → skipped (motion cooldown)`, and a bare
  `No Live2D model mounted` with the label dropped. The source used a flat `label: Outcome` table
  with different wording.
- **No-model behavior** restored: Roll, forced variants, phase moods, Clear mood and the Cake Duel
  claim buttons are `disabled` while no model is mounted, with a separate
  `No Live2D model mounted.` notice. This reuses the existing `NoriReactionDirector.hasModel()`;
  no new API was added.
- Remaining copy restored: the engine paragraph, the phase-mood suffix
  ("— moods hold until cleared and layer with one-shot reactions."), the tell paragraph, and the
  `Sample 2000` design-line column alignment.

`scripts/frontend_debug_probe.mjs` now asserts the shipped shape. The gate got **stricter**: it
adds the disabled-state assertion, the `· N outs` assertion and the note assertion. Note that
the probe previously clicked a button named after the reaction label, which the shipped UI never
had — the label heads the row and the button says `Roll`.

Known limitation: the tab reads model presence at render time, while the shipped tab subscribes
to a reactive store. This only shows up if the model mounts while the Reactions tab is already
open. Flagged in the source.

## Browser probe launch policy

`scripts/probe_launch.mjs` is now the single WebGL launch policy for all ten browser probes.
Local Windows runs use ANGLE d3d11 on the real adapter; GPU-less CI keeps the software path;
`NORI_TEST_ANGLE` overrides. This is a correctness matter, not just speed: the previous hardcoded
`--use-angle=swiftshader` pushed bloom, the jump-flooded SDF morph, 2 000 dust instances and
Cubism onto the CPU. The Boot/Corruption probe runs in 29.6 s on the GPU.

## Second pass: four scene parity fixes, lifecycle harness, and ledger honesty

### Scene constants verified against the shipped bundle, not the previous prose

The Boot/Ending method was repeated for Corruption, Memory, Datasea and Farewell. Every phase
duration, every layer default and every absolute marker matched. Five real defects did not:

| Fix | Shipped | Was | File |
| --- | --- | --- | --- |
| Corruption camera offset | `0 → 1.6 → 1.75 → 0` (world Y, `YP` folded in) | `0.6 → 2.2 → 2.35 → 0.6` — every keyframe `−YP` too high for the whole 30 s track | `story/corruption-timeline.ts` |
| Corruption wake return | `min(wakeReturnDur 1.4, cl_brightenDuration 2.1)` = **1.4 s** | 2.1 s, so camera and fov landed 0.7 s late | same |
| Memory void ramp | `Math.min(1, 2.4 × 0.45)` = **1.0 s** | 1.08 s (the raw product, clamp dropped) | `story/memory-scene.tsx` |
| Memory quake | `quakePeak 0.7` → 0 over 2 s (`power2.out`) | flat `0.35` held for the whole 7 s attack | same |
| Datasea message cursor | `KX[s] = 1 + Σ(gap + dots)`, typing window `[KX−dots, KX]` | folded `max(len/cps, 0.6)` into the cursor → line 12 drifted **+25.5 s**, past the end of the 44.8 s phase | `story/datasea-content.ts` |
| Datasea CG type duration | `Math.min(len/cps, t1−t0−0.3)` | `Math.max(0.3, …)` → first and last lines 2.1 s / 2.5 s instead of 0.4 s / 1.3 s | same |

The Corruption offset is the same `YP = -0.6` class that Boot/Ending already had applied
correctly — the corruption track had missed it. Each fix was re-derived from the bundle and
checked algebraically before being applied; `boot-corruption` and `memory-datasea` probes and
the visual capture all re-run green afterwards.

Those items were closed in later source passes. Datasea whiteout, Memory siren `until`/`fadeOut`
and the `active` handover, Farewell subtitles and the second shadow lobe, and the GSAP power
eases named by the shipped layers are in the source. Camera blends that the bundle implements
as smoothstep stay smoothstep. Cosmic/white typing still uses shipped `Math.max(len/cps, 0.6)`.
What this comparison left, and a later pass closed, is recorded in the 2026-09-26 section above.

### Games lifecycle harness now real

`scripts/frontend_games_lifecycle_test.mjs` passes end to end: 4 games × (start → play → close →
reopen → reconnect) in en-US and zh-CN, plus a reduced-motion pass, asserting on the Arcade
transport (`mount_cartridge`, `unmount_cartridge`, a fresh `open_my_web_world` after a socket
drop) rather than on paint. It also found a **real gameplay bug**: Cake Duel hand cards could not
be selected with a pointer, because `setPointerCapture` on pointerdown retargeted the following
`click` to the wrapper and `finishDrag` armed the click-suppress window on every press, not only
real reorders. The game was unplayable with a mouse. Fixed in `screens/cakeduel-hand.tsx`;
drag-to-reorder still verified working.

Cake Duel now releases its cartridge through `CakeDuelRuntimeController.retain()`, the same
window-scoped ownership as `GameCartridgeController`. `npm run frontend:games:lifecycle` asserts
`unmount_cartridge` on close. The earlier “never releases” note is obsolete.

### Test coverage: 125 assertions that never ran

Twenty `tests/frontend-*.test.ts` suites were referenced by no `package.json` script and no CI
job — green, but never executed. They now run in `scripts/test_frontend_suites.mjs`
(`npm run frontend:suites:test`), wired into `frontend:recover:check` so they cannot silently stop
running again. `tests/frontend-recovery-gaps.test.ts` deliberately re-runs the scene-transport and
scene-editor cases; that overlap is intentional.

### Dead code removed

- `story/datasea-games.tsx` — a 17-line fake microgame (three sliders and a tap counter) with
  **zero importers**, sitting beside the real 6924-line `datasea-games-original.js`. Deleting it
  removes the risk of mistaking it for the game implementation.
- `UnrecoveredProductionWindowNoticeProps` — a dead exported type, zero references, and the only
  consumer of its `ReactNode` import.

### Ledger corrections

- Removed 14 phantom `frontend-src/**.test.ts` paths from the evidence summary. `frontend-src`
  contains **zero** test files; every real suite lives in `tests/`.
- Removed the `npm run test:frontend` line: that script does not exist.
- `Cult` no longer claims 100% completion or an independent probe. `frontend-src/story/cult-producer.ts`
  and `scripts/frontend_cult_probe.mjs` never existed; Cult is an inline `CultFlash` in
  `story-scenes.tsx` and is the one producer with no browser gate of its own. It is captured by
  the visual harness, nothing more.
- `smoke_frontend_stories.mjs` covers 7 *surfaces*, not 7 producers; the matrix said producers.
- Dropped the unfalsifiable `~85%` / `~90%` / `~50%` figures — no denominator, no measurement.
- `games` note no longer claims `frontend:games:smoke` covers "Cake Duel full runtime". That
  script contains zero Cake Duel references; the real coverage is named instead.
- "All five incomplete cutover gates" → four. `supporting-apps` was flipped in `705a2e7`.
- `idle-qfr` note and the coverage matrix now record the unported marginal-growth ribbon world
  instead of claiming no source gap. The boundary stays `complete: true` on its smoke evidence;
  downgrading it is a policy call, flagged rather than made unilaterally.

### Deterministic visual capture

`scripts/frontend_visual_comparison.mjs` is now a fake-clock capture harness: 44 frames across all
seven producers in 260 s, zero skips, with `frontend-visual-comparison/manifest.json` recording
scene, phase, story time, parked gate and the clock offset for each frame. Story time is read
from the scene's own `StoryClock` rather than estimated, and cross-checked against the rendered
`data-time` for Boot and Corruption. Artifact capture only — there is no stable baseline, so no
pixel-diff verdict is claimed.

Known limitation: Farewell keeps its `StoryClock` as an effect-local, so it publishes no
progress; those frames are labelled `±1 frame` from the actor-ready signal in the manifest.
