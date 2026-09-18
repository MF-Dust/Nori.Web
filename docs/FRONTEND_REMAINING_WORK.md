# Current execution status — PR #43

Updated 2026-09-18. This section supersedes the historical status paragraphs below.

Six production story components are now registered in source alongside Cult. The implementation includes Boot fracture and timeline, Corruption overlays and input gates, Memory archive presentation, Datasea GLB/material/postprocessing and twelve microgames, a dedicated Farewell actor and Ending camera/wake timeline. Registration and shared lifecycle wiring are implemented; full behavioral, narrative and visual acceptance remains separate.

Messenger interaction fixes, real Debug socket/compute controls, Credits SVGs, expression/motion scene channels, game presentation and model-reaction integration are in the current implementation batch. `FRONTEND_COVERAGE_MATRIX.md` records all 15 registered applications and their remaining evidence. Independent Chromium jobs prevent one broken surface from hiding other results.

The local test baseline is 93 runtime cases, 11 story cases, 20 game cases and 3 historical-asset scanner cases passing. Browser verification runs in GitHub Actions because the execution sandbox denies Chromium socket creation. The cold-open fault probe isolates failed/retried/cancelled image loads in fresh contexts; CI 35354435518 passed the full source application smoke. On `c9fb95c4`, cold-open, Boot/Corruption, Messenger and Debug browser jobs passed; Debug includes the real Meshopt-compressed Datasea GLB, tuning, failure/retry and cleanup. Memory/Datasea is still running, Farewell/Ending needs a harness runtime fix, and the full-app Play Again selector is being repaired.

All five incomplete cutover gates stay false. Shatter and Datasea now have production-backed dedicated tuners. The shipped Debug chunk contains no other per-cinematic tuner tabs; its concrete remaining controls are the general Live2D, Audio, Pat, Reaction, notification, inject-talk and context diagnostics plus original layout comparison. The materialized candidate and static browser smoke work, but the paired original/source visual step currently fails and prevented that run's Worker dry-run. `nori_talk.request` remains a documented local no-op, so this environment cannot certify original agent replies. Static narrative placeholders and private-agent speech are tracked separately from renderer completion. No production entry has been switched.

See `FRONTEND_RECOVERY_EXECUTION_PLAN.md` for task IDs and the scene-specific recovery documents for exact boundaries.

---

# Frontend recovery: remaining acceptance work

This ledger expands the five incomplete cutover boundaries into concrete tasks. It records source ownership and verification separately from original visual/agent parity. The authoritative switch remains `frontend-src/migration/cutover-status.ts`.

| Area | Current source coverage | Remaining acceptance work |
| --- | --- | --- |
| Boot | Registered director scene, fracture, camera/timeline, ocean reflection/light/dust, bloom/FXAA, glyph-to-model field, plankton and wake interaction | Original frame/audio comparison, re-entry/error matrix and full cross-scene handoff acceptance |
| Corruption climax | Registered eleven-phase scene, entry/recovery overlays, six antivirus microgames, camera/light/model projection, local audio, QTE and wake gates | Exact original animation/disturbance comparison, original reply text/voice, narrow/input/reload matrix |
| Memory | Registered five-window archive, gated reveals, flood/sweep, compute drain and void handoff | Browser run completion, original window copy/visual comparison, interruption/voice corpus |
| Datasea | Registered dedicated GLB gas/star/mote materials, temporal/TAA/bloom/FXAA passes, camera phases, twelve WaveGate games and audio | Current browser run completion, white handoff/original frame comparison, full R2/quality/device matrix |
| Farewell | Registered dedicated actor, expression/pose timeline, cue sequencing, completion fencing and acknowledged reload | Harness runtime fix/re-run, original line copy/voice and model keyframe comparison |
| Ending | Registered void-ascent camera, glyph/ocean/wake stages, input gate, audio and desktop return | Harness runtime fix/re-run, original final-frame/BGM/desktop-state comparison |
| Scene authoring | Validated UTF-8 import/export, phase/audio/camera/environment/model/chat forms, paused exact seeking, takeover cleanup, Shatter and Datasea production tuners with range checks; shipped whole-page Glitch parameters and presets are wired to the production filter | Original Scene/Live2D control layout and browser acceptance for the Glitch controls; the shipped Debug chunk has no other dedicated cinematic tuner family |
| Head gesture | Projected head input, horizontal-motion qualification, one completion per hold, spring motion, keyboard alternative, procedural filtered-noise rubbing, cancellable spark bursts and cartridge-scoped pat request | Original particle appearance comparison and private-agent reply/media synchronization |
| Other model effects | Thinking, face, sleep, Three scene, scan/spatial projection, cold-open passes, live silhouette and semantic reaction director | Remaining cinematic composition and original model-motion comparison |
| Codenames | Board/reveal lifecycle, tutorial gates/narrative, forest, sudden-death scenarios and expanded results | Original dialogue/voice and remaining start/results animation comparison; Chess and Cake Duel Debug scenarios are tracked under the shared game-debug surface rather than as Codenames work |
| Chess | Complete 22-ply guided opening, legal play/history and result/request overlays | Result timing visual comparison and original-agent speech choreography |
| Pictionary | Cover/help/results, Pixi drawing, hints/audio, results journal and semantic model reactions | Original animation/model-expression comparison and live-agent snapshot inference |
| Debug labs | Connection/Scene/Audio/Facts/editor plus network faults, real compute ledger, gesture/reaction, Codenames scenarios and Shatter/Datasea tuners; 33 shipped Chess and four Cake Duel scenario IDs are now represented, and the shipped Glitch tuner is production-backed | Isolated browser acceptance for Chess/Cake Duel scenario commands and Glitch cleanup; original Live2D/Audio/Pat/Reaction/notification/inject-talk/context diagnostics and private-agent comparison |
| Agent/media lifecycle | Controlled transport, real local backend, world/reconnect fences and application smoke | Full story and game acceptance against the original agent/media implementation |
| Production entry | Source app builds; materialized candidate, rollback hashes and candidate static smoke pass; historical entry remains protected | Repair paired visual capture, execute skipped candidate Worker dry-run, finish behavior/rollback evidence, then assess switch |

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
