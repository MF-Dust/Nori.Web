# Current execution status — PR #43

Updated 2026-09-18. This section supersedes the historical status paragraphs below.

Six production story components are now registered in source alongside Cult. The implementation includes Boot fracture and timeline, Corruption overlays and input gates, Memory archive presentation, Datasea GLB rendering, a dedicated Farewell actor and Ending camera/wake timeline. Registration is implemented; full behavioral and visual acceptance is pending. Datasea microgames and Memory choreography are under substantive review.

Messenger interaction fixes, real Debug socket/compute controls, Credits SVGs, expression/motion scene channels, game presentation and model-reaction integration are in the current implementation batch. `FRONTEND_COVERAGE_MATRIX.md` records all 15 registered applications and their remaining evidence. Independent Chromium jobs prevent one broken surface from hiding other results.

The local test baseline is 92 runtime cases, 10 story cases, 20 game cases and 3 historical-asset scanner cases passing. Browser verification runs in GitHub Actions because the execution sandbox denies Chromium socket creation. The cold-open fault probe now isolates failed/retried/cancelled image loads in fresh contexts; CI 35354435518 passed the full source application smoke. Integration 3e2808 also passed independent cold-open and Boot/Corruption jobs. The new remaining surface failures are being repaired.

All five incomplete cutover gates stay false. Required remaining work includes actual browser acceptance, original/source visual comparison, any defects found by those runs, dedicated scene tuners, original-agent/media integration, candidate-entry verification and rollback evidence. `nori_talk.request` remains a documented local no-op, so this environment cannot certify original agent replies. No production entry has been switched.

See `FRONTEND_RECOVERY_EXECUTION_PLAN.md` for task IDs and the scene-specific recovery documents for exact boundaries.

---

# Frontend recovery: remaining acceptance work

This ledger expands the five incomplete cutover boundaries into concrete tasks. It records source ownership and verification separately from original visual/agent parity. The authoritative switch remains `frontend-src/migration/cutover-status.ts`.

| Area | Current source coverage | Remaining acceptance work |
| --- | --- | --- |
| Boot | Director, gated clock, ocean reflection/light/dust, bloom/FXAA, live glyph-to-model field, plankton and wake-burst renderers | Shatter, camera/timing integration, wake interaction and full audio sequence |
| Corruption climax | Eleven-phase Debug study, six antivirus microgames, camera/light/model projection, local audio, QTE and wake gates | Original entry/heal overlays, exact microgame animation and tuning/steering disturbance parity, original reply text and voice handoff, production registration |
| Memory | Training-log preview, scene effects and gated clock | Five interactive windows, flood/sweep, compute drain, interrupt dialogue and void handoff |
| Datasea | Shared scene host and Three environment | Dedicated scene passes, camera choreography, audio and white-screen handoff |
| Farewell | Director priority and completion fencing | Dedicated model/voice presentation, line timing and acknowledged reload |
| Ending | Director, input-gate infrastructure and shared ocean/glyph/wake render stages | Void ascent timeline, interaction, audio and desktop return |
| Scene authoring | Validated UTF-8 import/export, phase creation/reordering/removal, audio-track forms with source offsets, camera/environment/model/chat forms, paused timeline and exact phase seeking, gate rearming and scoped preview cleanup | Original per-cinematic tuners and controls for remaining dedicated render passes |
| Head gesture | Projected head input, horizontal-motion qualification, one completion per hold, spring motion, keyboard alternative, procedural filtered-noise rubbing, cancellable spark bursts and cartridge-scoped pat request | Original particle appearance comparison and private-agent reply/media synchronization |
| Other model effects | Thinking, face, sleep, Three scene, scan/spatial projection, cold-open bloom/FXAA/tilt and live silhouette passes | Datasea dedicated passes and remaining cinematic composition |
| Codenames | Board/reveal lifecycle, tutorial gates, forest, expanded victory/defeat results and statistics | Full scripted backend tutorial, narrative/sudden-death dialogue, remaining start/results animation comparison |
| Chess | Complete 22-ply guided opening against the local backend | Result/overlay timing comparison and original-agent speech choreography |
| Pictionary | Pixi drawing, hints/audio and expanded session-results journal | Remaining cover/help animation comparison, model-expression choreography and live-agent snapshot inference |
| Debug labs | Connection, Scene, Audio, Facts and scoped scene-project preview | Network/compute/reaction labs, game scenario injection and remaining advanced scene channels |
| Agent/media lifecycle | Controlled transport, real local backend, world/reconnect fences and application smoke | Full story and game acceptance against the original agent/media implementation |
| Production entry | Source application builds; historical entry stays protected by the cutover gate | Switch only after remaining behavior is verified; production/regression and rollback checks |

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

The editor now exposes every supported model/light/chat channel as a form, plus phase IDs/durations/gates, reordering/removal and audio IDs/paths/intervals/buses/loop/fades/source offsets. All mutations use the import/export validator. Model dim accepts 0–4, which includes the inspected 2.8 and 3.0 cinematic values. Channel selection follows phase identity when phases move. The subsequent graphics pass adds cold-open pass channels; datasea passes and original per-cinematic tuners remain open.

Each director activation has a separate instance identity. Same-ID world replacement resets the director and invalidates old acknowledgements/retries/completion callbacks; Cult, Corruption preview and Debug overrides release their old resources on replacement or takeover. Production stories still require their real producer registration.

### Concrete external acceptance blocker

`backend/services/event_dispatcher.py` explicitly returns `{type: "noop"}` for `nori_talk.request`; `tests/test_live_backend_logic.py` verifies that behavior. This backend cannot serve as proof of the original pat/corruption/game agent response and speech choreography. Request delivery and local rendering can be verified here. Original-agent acceptance requires that implementation and a runnable test session. This limitation does not account for the six unfinished renderers: their source reconstruction remains separate outstanding work, and no overall completion is claimed.

## Cold-open graphics pass

The source renderer now owns the ocean group, animated water/reflection, godrays, 2,000 dust instances, three bloom iterations, FXAA and tilt-shift composition. A static glyph field and single-channel half-float SDF blend into the live Cubism silhouette through jump flooding. The red-channel upload format is regression-tested; the browser screenshots caught and resolved an incorrect two-channel alias. The cold-open owner also includes 3,000 plankton points and the procedural wake haze/branch particles.

The editor exposes ocean/glyph, plankton and wake controls, interpolates nested cold-open values and validates the original motion-blur range through 3.5. Resources load lazily on scene entry. Missing texture requests expose failure, successful siblings are disposed, and late image callbacks cannot revive a released scene. Closing the owner restores the normal background and releases textures, materials, targets and particles.

Chromium verifies real-model ocean, glyph, morph, formed and wake frames, resize, missing assets, cancellation and late loads. Unit coverage checks single-channel SDF layout, signed distances, disposal and nested project interpolation. These graphics stages are now usable source components; the six full production cinematic timelines remain separately tracked above.
