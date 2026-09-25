# Current execution status — PR #43

Updated 2026-09-18. This section supersedes the historical status paragraphs below.

Six production story components are now registered in source alongside Cult. The implementation includes Boot fracture and timeline, Corruption overlays and input gates, Memory archive presentation, Datasea GLB/material/postprocessing and twelve microgames, a dedicated Farewell actor and Ending camera/wake timeline. Registration and shared lifecycle wiring are implemented; full behavioral, narrative and visual acceptance remains separate.

Messenger interaction fixes, real Debug socket/compute controls, Credits SVGs, expression/motion scene channels, game presentation and model-reaction integration are in the current implementation batch. `FRONTEND_COVERAGE_MATRIX.md` records all 15 registered applications and their remaining evidence. Independent Chromium jobs prevent one broken surface from hiding other results.

Evidence checkpoint: 2026-09-18 16:15 UTC. Later head results are recorded in PR #43 Checks and its delivery description. The local test baseline is 106 runtime cases, 11 story cases, 20 game cases and 3 historical-asset scanner cases passing. Browser verification runs in GitHub Actions because the execution sandbox denies Chromium socket creation. The cold-open fault probe isolates failed/retried/cancelled image loads in fresh contexts; CI 35354435518 passed the full source application smoke. On head `f7a7fa6683adc8c9088d416a2fa6784c94464ac1`, surface run `35364523143` passed Debug, cold-open, Boot/Corruption, Farewell/Ending and Messenger; job `105663601161` also passed all 12 Datasea games through real pointer/keyboard input. Debug job `105663601223` covers the UI-to-facade contract. In the prior Worker job `105661992194`, `Nori scene and cold-open lifecycle` passed against the real NoriStage model, including catalog, physics restoration and HeadPat restoration assertions. The job then failed in Scene editor because the new Audio Debug tab had dropped the real `Corrupt voice` checkbox. Commit `7de88a5` restores that checkbox and the Desktop music selector through the existing DebugScreen scene lease, preserving story/world/unmount cleanup. Worker run `35365741254`, job `105667661060`, then passed the unchanged Scene tools assertions, the complete Scene editor step, the real NoriStage/cold-open probe and every later source-app probe.

All five incomplete cutover gates stay false. Shatter and Datasea have production-backed dedicated tuners, and the shipped Debug chunk contains no other per-cinematic tuner tabs. The general tabs now bind the mounted Live2D model, persistent audio settings and mixer/speech runtime, production head-pat recognizer/spring/input/synth, 28 production reaction events, and the real notification RPC/event stream. The remaining Debug gaps are the runtime internals that source does not expose, Cake Duel and forced reaction diagnostics, original layout comparison, and the private Inject Talk/Nori Context handlers. Those two private-agent tabs report the blocker and observable session state without substitute actions. `nori_talk.request` remains a documented local no-op, so this environment cannot certify original agent replies. Static narrative placeholders and private-agent speech are tracked separately from renderer completion. No production entry has been switched.

See `FRONTEND_RECOVERY_EXECUTION_PLAN.md` for task IDs and the scene-specific recovery documents for exact boundaries.

## Shared window/browser lifecycle pass

Window content callbacks now keep stable identities while Zustand title/status updates remain idempotent, and all source subscription unsubscribe callbacks return `void` rather than `Set.delete()` booleans. Browser title/favicon/envelope/status/scroll notifications are guarded from effect re-entry. This removes the source-entry maximum-update-depth/white-screen failure seen when opening Browser and Doodle; the real application smoke now reaches the in-game page and continues through the remaining desktop probes.
## Notification substrate pass

The source shell now owns a session notification queue with the recovered 50-item/5-visible limits, story-time deferral, hover-paused auto-dismiss, overflow/clear actions, shipped notification styling, localized labels, and audio cue de-duplication. `notification.pushed` is decoded through one strict source parser and is mounted over the real desktop shell; the Debug Notifications tab reports the same queue instead of claiming it is unavailable. Signal artifact deltas now establish a silent first-history baseline, emit one arrival notification per unseen incoming message, and hand a pending thread focus to Messenger. Unit and browser coverage pins queue, parser, arrival, pending-focus, and shell behavior. Original visual comparison and private-agent/media acceptance remain separate Messenger work.

## Live2D Debug parity pass

The source Debug Live2D tab now drives the mounted production model for the shipped idle-state override, automatic sleep/wake fade values, direct Idle/Sleep transition audition, lip-sync amplitude override, mouth-open gain, amplitude/constant mouth-form modes, and per-expression lip-sync shares. The talking simulator uses the shipped 48 ms amplitude trace and releases its override on stop, story takeover or unmount. The normal fact-derived idle state and production speech amplitude remain the default path when Debug overrides are cleared. Original Debug layout comparison and the remaining audio/pat/reaction internals stay separate acceptance work.

---

# Frontend recovery: remaining acceptance work

This ledger expands the five incomplete cutover boundaries into concrete tasks. It records source ownership and verification separately from original visual/agent parity. The authoritative switch remains `frontend-src/migration/cutover-status.ts`.

| Area | Current source coverage | Remaining acceptance work |
| --- | --- | --- |
| Boot | Registered director scene, fracture, camera/timeline, ocean reflection/light/dust, bloom/FXAA, glyph-to-model field, plankton and wake interaction | Original frame/audio comparison, re-entry/error matrix and full cross-scene handoff acceptance |
| Corruption climax | Registered eleven-phase scene, entry/recovery overlays, six antivirus microgames, camera/light/model projection, local audio, QTE and wake gates | Exact original animation/disturbance comparison, original reply text/voice, narrow/input/reload matrix |
| Memory | Registered five-window archive, gated reveals, flood/sweep, compute drain and void handoff | Browser run completion, original window copy/visual comparison, interruption/voice corpus |
| Datasea | Registered GLB materials, temporal/TAA/bloom/FXAA, camera phases, twelve WaveGate games and audio; all 12 independent real-input cases passed in job 105663601161 | Complete three-wave scene integration after the Relay transition wait fix, white handoff/original frame comparison, full R2/quality/device matrix |
| Farewell | Registered dedicated actor, expression/pose timeline, cue sequencing, completion fencing and acknowledged reload; f7a7fa6 isolated Chromium passed | Original line copy/voice and model keyframe comparison |
| Ending | Registered void-ascent camera, glyph/ocean/wake stages, input gate, audio and desktop return; f7a7fa6 isolated Chromium passed | Original final-frame/BGM/desktop-state comparison |
| Scene authoring | Validated UTF-8 import/export, phase/audio/camera/environment/model/chat forms, paused exact seeking, takeover cleanup, Shatter and Datasea production tuners with range checks; shipped whole-page Glitch parameters and presets are wired to the production filter; Live2D Debug controls mutate the mounted production model | Original Scene/Live2D layout and expanded browser acceptance; the shipped Debug chunk has no other dedicated cinematic tuner family |
| Head gesture | Projected head input, horizontal-motion qualification, one completion per hold, tunable production spring/input/friction synth, keyboard alternative, procedural filtered-noise rubbing, cancellable spark bursts and cartridge-scoped pat request | Original armed/zone/model-pointer telemetry, particle appearance comparison and private-agent reply/media synchronization |
| Other model effects | Thinking, face, sleep, Three scene, scan/spatial projection, cold-open passes, live silhouette and semantic reaction director | Remaining cinematic composition and original model-motion comparison |
| Codenames | Board/reveal lifecycle, tutorial gates/narrative, forest, sudden-death scenarios and expanded results | Original dialogue/voice and remaining start/results animation comparison; Chess and Cake Duel Debug scenarios are tracked under the shared game-debug surface rather than as Codenames work |
| Chess | Complete 22-ply guided opening, legal play/history and result/request overlays | Result timing visual comparison and original-agent speech choreography |
| Pictionary | Cover/help/results, Pixi drawing, hints/audio, results journal and semantic model reactions | Original animation/model-expression comparison and live-agent snapshot inference |
| Debug labs | Connection/Scene/Facts/editor plus network faults, real compute ledger, gesture/reaction, Codenames scenarios and Shatter/Datasea tuners; 33 shipped Chess and four Cake Duel scenario IDs; production Glitch, Live2D, Audio, Pat, 28 semantic reactions, and notification RPC/event controls | Unexposed Live2D/Audio/Pat/reaction/notification internals and original layout; private Inject Talk/Nori Context handlers. UI/facade job 105663601223 passed; real-model Nori and restored Audio scene controls passed in job 105667661060 |
| Agent/media lifecycle | Controlled transport, real local backend, world/reconnect fences and application smoke | Full story and game acceptance against the original agent/media implementation |
| Production entry | Source app builds; materialized candidate, rollback hashes and candidate static smoke pass; historical entry remains protected | Candidate job 105667660666 passed static browser, five system/four game captures and Worker dry-run; finish latest capture review and full behavior/rollback evidence before assessing switch |

## Scene editor implementation pass

The local authoring workflow now includes validated import/export, form editing for camera/environment channels, paused scrubbing and exact phase selection. Coincident gates, replay, audio offsets and hidden/manual pause state have passing unit coverage. Same-world replacement snapshots, production takeover and the browser controls now have passing Chromium coverage. The controller is isolated from story completion and network commands. See [Scene editor](FRONTEND_SCENE_EDITOR.md) for behavior and test details.

This closes the generic file/seek/channel authoring gaps with browser and screenshot acceptance. Exact inspection also isolates instantaneous phases before coincident gates. It does not certify original per-cinematic editor parity or register any remaining story. The production entry and five incomplete cutover boundaries remain unchanged.

## Earlier presentation pass

- Adds a head-gesture input and model plugin using the shipped timing/geometry constants. Hit regions follow projected head bounds, and normal app controls stay outside the gesture surface. Holding Space supplies an accessible alternative. Scene takeover, world epoch changes, blur and disposal stop the gesture.
- Adds a Debug scene-project preview that uses the existing StoryClock, StoryAudio and NoriSceneStore. Project validation rejects invalid durations, duplicate IDs, unsupported properties and nonlocal audio URLs. Preview never calls the director's completion API. Existing production stories keep priority over previews.
- Expands Codenames results with collected/remaining treasures, spent rounds, turns, cause-aware loss text, original card art and rematch/menu actions.
- Expands Pictionary results with solved/attempted totals, duration, accuracy, fastest/average time and a role-aware history journal. Skipped and unfinished words remain distinct. Both result screens adapt to short windows and reduced motion.

The source presentation does not register any unfinished cinematic or certify a pixel-identical reconstruction. The six cinematic rows above remain independent work items; the scene editor supplies a way to inspect and build their source-owned phases.

## Gesture, authoring and replacement follow-up

The head gesture now owns a two-second noise buffer and the inspected parallel filter topology. Velocity controls its envelope and low-pass cutoff through the shared SFX bus. Audio remains lazy until a browser gesture unlocks the mixer; release, blur, takeover and unmount stop the effect. A completed hold emits one `nori_talk.request` with `talkId: pat` scoped to `manifold.web`. It does not fabricate an agent line. Decorative spark bursts are source-owned and honor reduced motion, with original particle appearance still requiring comparison.

The editor now exposes every supported model/light/chat channel as a form, plus phase IDs/durations/gates, reordering/removal and audio IDs/paths/intervals/buses/loop/fades/source offsets. All mutations use the import/export validator. Model dim accepts 0–4, which includes the inspected 2.8 and 3.0 cinematic values. Channel selection follows phase identity when phases move. The subsequent graphics pass adds cold-open pass channels and Datasea passes. Shatter and Datasea have dedicated source tuners; the original Debug chunk provides general Scene and Glitch controls rather than additional per-cinematic tuner tabs.

Each director activation has a separate instance identity. Same-ID world replacement resets the director and invalidates old acknowledgements/retries/completion callbacks; Cult, Corruption preview and Debug overrides release their old resources on replacement or takeover. Production stories still require their real producer registration.

### Concrete external acceptance blocker

`backend/services/event_dispatcher.py` explicitly returns `{type: "noop"}` for `nori_talk.request`; `tests/test_live_backend_logic.py` verifies that behavior. This backend cannot serve as proof of the original pat/corruption/game agent response and speech choreography. Request delivery and local rendering can be verified here. Original-agent acceptance requires that implementation and a runnable test session. This limitation does not account for the six unfinished renderers: their source reconstruction remains separate outstanding work, and no overall completion is claimed.

## Cold-open graphics pass

The source renderer now owns the ocean group, animated water/reflection, godrays, 2,000 dust instances, three bloom iterations, FXAA and tilt-shift composition. A static glyph field and single-channel half-float SDF blend into the live Cubism silhouette through jump flooding. The red-channel upload format is regression-tested; the browser screenshots caught and resolved an incorrect two-channel alias. The cold-open owner also includes 3,000 plankton points and the procedural wake haze/branch particles.

The editor exposes ocean/glyph, plankton and wake controls, interpolates nested cold-open values and validates the original motion-blur range through 3.5. Resources load lazily on scene entry. Missing texture requests expose failure, successful siblings are disposed, and late image callbacks cannot revive a released scene. Closing the owner restores the normal background and releases textures, materials, targets and particles.

Chromium verifies real-model ocean, glyph, morph, formed and wake frames, resize, missing assets, cancellation and late loads. Unit coverage checks single-channel SDF layout, signed distances, disposal and nested project interpolation. These graphics stages are now usable source components; the six full production cinematic timelines remain separately tracked above.
