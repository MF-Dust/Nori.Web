# Frontend recovery: remaining acceptance work

This ledger expands the five incomplete cutover boundaries into concrete tasks. It records source ownership and verification separately from original visual/agent parity. The authoritative switch remains `frontend-src/migration/cutover-status.ts`.

| Area | Current source coverage | Remaining acceptance work |
| --- | --- | --- |
| Boot | Director, gated clock, scene/audio consumers | Shatter, ocean descent, glyph-to-model transition, wake interaction and full audio sequence |
| Corruption climax | Eleven-phase Debug study, six antivirus microgames, camera/light/model projection, local audio, QTE and wake gates | Original entry/heal overlays, exact microgame animation and tuning/steering disturbance parity, original reply text and voice handoff, production registration |
| Memory | Training-log preview, scene effects and gated clock | Five interactive windows, flood/sweep, compute drain, interrupt dialogue and void handoff |
| Datasea | Shared scene host and Three environment | Dedicated scene passes, camera choreography, audio and white-screen handoff |
| Farewell | Director priority and completion fencing | Dedicated model/voice presentation, line timing and acknowledged reload |
| Ending | Director and input-gate infrastructure | Void ascent, glyph formation, wake and desktop return |
| Scene authoring | Validated UTF-8 import/export, phase creation/reordering/removal, audio-track forms with source offsets, camera/environment/model/chat forms, paused timeline and exact phase seeking, gate rearming and scoped preview cleanup | Original per-cinematic tuners and controls for remaining dedicated render passes |
| Head gesture | Projected head input, horizontal-motion qualification, one completion per hold, spring motion, keyboard alternative, procedural filtered-noise rubbing, cancellable spark bursts and cartridge-scoped pat request | Original particle appearance comparison and private-agent reply/media synchronization |
| Other model effects | Thinking, face, sleep, Three scene, scan/spatial projection | Original bloom/SMAA and cold-open/datasea render passes |
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

The editor now exposes every supported model/light/chat channel as a form, plus phase IDs/durations/gates, reordering/removal and audio IDs/paths/intervals/buses/loop/fades/source offsets. All mutations use the import/export validator. Model dim accepts 0–4, which includes the inspected 2.8 and 3.0 cinematic values. Channel selection follows phase identity when phases move. Dedicated cold-open/datasea passes and their tuners remain absent.

Each director activation has a separate instance identity. Same-ID world replacement resets the director and invalidates old acknowledgements/retries/completion callbacks; Cult, Corruption preview and Debug overrides release their old resources on replacement or takeover. Production stories still require their real producer registration.

### Concrete external acceptance blocker

`backend/services/event_dispatcher.py` explicitly returns `{type: "noop"}` for `nori_talk.request`; `tests/test_live_backend_logic.py` verifies that behavior. This backend cannot serve as proof of the original pat/corruption/game agent response and speech choreography. Request delivery and local rendering can be verified here. Original-agent acceptance requires that implementation and a runnable test session. This limitation does not account for the six unfinished renderers: their source reconstruction remains separate outstanding work, and no overall completion is claimed.
