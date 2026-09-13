# Nori scene and speech recovery

The source conversation now connects to the real ARGNori model, a source-owned Three.js environment and the first recovered story timeline. Full cinematic and gesture parity remains open.

## Restored behavior

- Chat operation `cutBlockId` is an inclusive speech watermark. Later scheduled nodes and queued chunks are removed, late PCM and encoded decode results are rejected, and cancelled blocks do not send `audioDone`. World/reconnect resets clear watermarks. Speech lifecycle subscriptions drive expression timing.
- Newly revealed agent speech selects the shipped emotion expression. Initial history and world reseeds remain silent. Expressions hold for three seconds, coalesce pending changes, clear ten seconds after speech completion, and suppress during scenes, sleep and disconnect.
- Fifteen seconds without input or speech selects the sleep motion. New messages, input and speech wake the model. Executing chat turns, exclusive apps and active scenes inhibit inactivity sleep.
- Story facts select glitch, kneel and calm-kneel idle motions. Kneeling disables lip sync. Normal lip amplitude and expression-dependent form blend use the original configuration.
- The thinking light changes its breathing speed and range over a 300 ms blend while a connected turn is executing.
- A source scene store binds corrupt texture, rest pose, explicit eye/mouth parameters, smile/sleep expressions, vignette, blur and white flash to the source model and shell. Nested scene owners restore the surviving owner; released and previous-world owners cannot write back. Effect layers do not intercept input.

## Evidence and validation

The behavioral reference is the repository's authorized `public/assets/NormalApp-Cn6agT0F.js`: speech cuts, emotion mapping/hold controller, idle controller and fact selection, thinking-light/cinematic-face plugins, model lip settings and scene effect bindings. The application imports the recovered source modules, never that historical chunk.

`tests/frontend-nori-scene.test.ts` covers expression timing, history fences, idle/fact selection, scene ownership, face cleanup and thinking interpolation. `tests/frontend-runtime.test.ts` also checks inclusive cuts, already-scheduled cancellation and encoded-decode races.

`scripts/frontend_nori_scene_probe.mjs` runs from the full application smoke suite. Its transport fixture mounts the production `NoriStage`, the real model and source effects. It checks emotion holds, executing-turn sleep inhibition, timed sleep/wake, all fact-selected poses, lip enablement, texture/rest state, nested scenes, reset and unmount. Screenshots are included in the application smoke artifact. This fixture verifies model integration, not an end-to-end story sequence.

## Remaining boundary

Postprocessing, gesture plugins, story reveal and interrupt choreography, the six remaining cinematics, remaining scene audio cues, and live-agent synchronization remain open. The source scene host and director now support the cult timeline; the other producers are not yet restored. The `live2d` and `messenger` cutover flags therefore remain incomplete.

## Conversation and shell handoff

The scene store now carries the original `normal`, `bubbles` and `hidden` chat modes plus the `auto`, `silent` and named desktop music choices. Normal chat fades out during takeover; bubbles-only mode removes the composer. Hidden content is inert, loses input focus, ignores the focus shortcut and rejects sends at the controller boundary. Returning to normal keeps the draft. Scene music overrides are released back to fact-selected desktop music through the same shared mixer.

Corrupt model texture now selects the shipped red bubble gradient, angular border, glow and dark text. Visual characters change at the original 110 ms / 12% cadence. Assistive text remains stable and the reduced-motion preference stops the changing characters. Normal send/receive cues are connected; hidden, cinematic and corrupt bubbles do not emit the normal receive cue.

Between `arg.memory.shown` and `arg.ending.shown`, player messages are shown locally without a chat command, matching the shipped void conversation. The latest twenty local lines are retained for the current world and discarded on world replacement. World facts are read through one shared `WorldStore.facts()` implementation.

Chip scanning subscribes directly to the scene store. Takeover or non-normal chat mode cancels the scan and prevents reentry, including after a late RPC result. Scene updates that leave the blocked state unchanged do not repeatedly reset the chip.

The runtime suite now has 46 passing tests. The real-model browser fixture also checks hidden input, focus-shortcut blocking, draft restoration, red bubble styles, stable assistive text, reduced motion and suppressed receive cues. `nori-corrupt-chat.png` is included in the application artifact. These are restored scene consumers and fact-driven conversation behavior; full cinematic timeline producers remain open. The corruption voice DSP is now restored as described below.


## Corruption voice processing

`VoiceCorruption` and its source-owned AudioWorklet restore all six shipped presets: unstable, glitch, robot, ghost, demon and haywire. The processing chain includes sample holding, stutter/dropout/burst events, FFT overlap-add spectral modes, waveshaping, ring modulation, band filtering, delay modulation, compression and the original room impulse. The default scene effect uses unstable at intensity 0.7. Normal speech uses the dry branch; toggles use the original 120 ms equal-power transition.

The scene store's `corruptVoice` consumer connects to the shared mixer before spatial placement, voice gain and master gain. It remembers a scene selected before the audio unlock gesture. Effects are allocated lazily, worklet module loading is shared per audio context, and native stages remain usable if worklet loading or construction fails. A late module resolution cannot reattach a disposed effect. Speech resets rebuild active effects to discard captured samples and reverb tails; scene release restores the dry path. Disposal disconnects nodes, stops oscillators and closes the worklet port. Bypass additionally clears the historical processor's captured sample ring to avoid replay on reactivation.

`tests/frontend-voice-corruption.test.ts` compares all six worklet presets against the authorized shipped processor sample for sample across 102,400 samples per preset. It also covers dry bypass, captured-sample cleanup, concurrent initialization, current scene state, disposal races, retry after synchronous loading failure, room impulse timing and waveshaping. `scripts/frontend_voice_corruption_probe.mjs` renders the full chain in Chromium for each preset, verifies dry output and native fallback, and checks actual scene binding, pre-unlock activation, mixer gain, speech reset and disposal. Numerical results are saved as `voice-corruption.json` in the application smoke artifact.

The behavioral references are `public/assets/NormalApp-Cn6agT0F.js` and `public/assets/corruptionProcessor.worklet-lw-jqXOl.js`. The application build emits its own worklet from `frontend-src/runtime/corruption-processor.worklet.js`; historical JavaScript is only a test oracle. The cinematic producers that drive corruption over time, the other scene cues and the overall scene/audio cutover boundary remain unfinished.


## Three.js environment and first story timeline

`live2d/scene-renderer.ts` owns Three.js 0.180.0, matching the shipped renderer revision. `scene-materials.js` recovers the original GLSL background, ground grid, particles, bokeh, model surface, alpha silhouette prepass and blurred ground shadow. The host uploads the real Cubism canvas as its own texture. Desktop/exclusive camera positions, pointer parallax, camera rotation/FOV/far plane, shake, darkness, tint, reveal and fact-selected manifold/void palettes are bound to the shared scene state. Resize follows the graphics budget. Unmount cancels animation, removes pointer listeners and disposes textures, render targets, materials and the WebGL context.

The camera and model position now update the shared spatial listener/panner. Chip scan bounds use the projected model surface instead of the hidden source texture canvas. The browser fixture asserts that moving the camera changes the scan projection and voice listener position, while retaining its real-model expression, pose, corruption and cleanup checks. Test time advances through model transitions without rendering hundreds of unnecessary software-GPU frames.

`story/story-director.ts` restores the seven-scene priority catalogue, completion acknowledgement, two-second retry, 1.5-second completion hold, and world/disposal fences. Only `cult-flash` currently has a registered renderer. An earlier eligible unrecovered scene blocks later scenes; the director never fabricates its completion fact.

`story/cult-renderer.ts` uses the original two-pass WebGL2 shaders. `StoryScenes` plays the seven-second cult timeline, the original looping drone and its fade, locks normal scene interaction, and reports `arg.cult_truth` after rendering. Decode latency offsets playback into the current timeline; completion or world replacement stops audio. Reduced motion uses a static frame. Renderer failure exposes Retry and never reports successful completion.

`frontend-story-feedback.test.ts` covers priority, acknowledgement/retry, duplicate completion and stale-world handling, alongside Chess feedback transitions. `frontend_scene_tools_probe.mjs` exercises the real cult shaders/audio, successful completion, cancellation and released scene state. Its screenshots include `cult-flash.png` and `debug-audio.png`.

Still required: boot, corruption climax, memory, datasea, farewell and ending timelines; their interaction, speech and audio choreography; original bloom/SMAA and advanced scene render passes; gesture plugins; full live-agent story verification. The five cutover boundaries remain false.


## Paused timelines and audio ownership

The shared `StoryClock` now supports ordered phases, explicit input gates, zero-duration consecutive gates, suspension, monotonic time and disposal. Resuming starts a fresh wall-clock anchor, so time spent waiting for input or outside the tab cannot skip later content. An input must identify the current gate before it can advance the scene.

`StoryAudio` owns music/SFX/voice track intervals and pending decode handles. It waits for audio unlock, enters a late-loaded track at the current timeline offset, stops tracks on suspension or completion and recreates them at the correct offset when resumed. The mixer supports bounded attack/release envelopes and explicit track routing. The cult scene now uses this shared clock/audio path and pauses when the document becomes hidden.

Three new runtime tests exercise consecutive gates, waiting time, suspension, backwards timestamps, disposal, audio unlock, offset tracking and cancellation. The scene browser probe also verifies that a hidden cult scene holds its position and does not report completion before playback resumes.

This supplies the time and audio infrastructure required by the six remaining cinematics. It does not register those cinematics or emit their completion facts. Inspection also confirmed that the missing bloom and advanced postprocessing belong to cold-open/datasea renderers; they are not a general desktop filter.


## Head gesture and scene authoring pass

`head-pat.ts` samples movement in head-width units. The projected upper head surface accepts sustained horizontal movement, requires one second of qualifying samples, ignores sampling gaps above 250 ms and completes once per held gesture. A model plugin adds damped yaw/pitch/roll offsets. Input supports pointer capture and holding Space; blur, visibility loss, world epoch changes, non-idle poses and active scenes cancel input. A completed local gesture shows a reduced-motion-aware ring; it leaves speech-owned expressions untouched. Original rubbing synthesis, richer particles and agent reaction events remain separate parity work.

The Debug scene editor validates typed JSON projects and previews camera/model/light targets with smooth interpolation, explicit input gates and local audio intervals. Pause/resume, hidden tabs, stop, world replacement and unmount share the clock/audio ownership rules. Preview does not emit story facts and yields to a production story. The sample is an authored camera/light study; it is not a replacement for any of the six unfinished cinematics.

See [the expanded remaining-work ledger](FRONTEND_REMAINING_WORK.md) for individual cinematic acceptance criteria. Browser coverage exercises the real model gesture and scene preview's input gate, restoration and rejected project path.

## Corruption interaction study

The Debug Corruption tab now runs the eleven inspected phases through StoryClock. The voice gate can be acknowledged in the preview and has a 12-second foreground fallback; the QTE gate advances only after all six checks and the 560 ms all-clear delay. Heal and wake consume scoped camera/light/model state and three local timeline audio tracks. Closing, world replacement and production-story takeover release the preview without submitting facts.

The source-owned microgames cover four hostile processes with protected system rows, four abnormal nodes among ten nodes, four separate 84 BPM rhythm hits, three-channel tuning with a continuous 600 ms alignment hold, five retryable binary checks, and two steering holds. Foreground pause, hidden-tab suspension and pointer/keyboard cleanup preserve progress. The layout adapts from three columns to one and uses the existing Sarasa font for Chinese glyph coverage.

This is an interaction study, not a production registration. Node/terminal animation, tuning drift/lock presentation, steering impulse/trail effects, original preference dialogue and the warning/heal renderer still need original-parity work. The five binary prompts here are newly authored technical checks. The voice gate does not impersonate the original agent handoff. Boot, corruption climax, memory, datasea, farewell and ending remain unregistered; all five production boundaries stay false.

Verification includes protected targets, duplicate input, timing and completion fences in unit tests, plus a browser walkthrough of all six microgames and the recovery/wake transition. Screenshots cover the six panels, all-clear state and a 390 px viewport.

## Gesture audio and world replacement

The source gesture now uses a per-model filtered-noise generator with the inspected two-second buffer, 1200/3200 Hz high-pass stages, 5200 Hz peaking stage, 8000–11500 Hz velocity-dependent low-pass, parallel 350 Hz body filters and 0.4 frequency scale. Strength follows `min(1, abs(velocity)/3)^1.4` with 30 ms attack and 60 ms release. The final 0.05 level and 0.5 body gain route through the shared SFX mute/volume controls. Nodes allocate after audio unlock and disconnect on model disposal. Browser verification renders the real filters and checks finite nonzero active output and silent inactive output.

Completion adds a disposable, reduced-motion-aware spark burst and submits the original cartridge-scoped pat request once per hold. The local backend returns `noop`, so original-agent reply/media parity remains unverified. Original particle shape and pacing comparison is still open.

Director activations now carry unique instance IDs. Rejoining the same world invalidates old completion callbacks and pending acknowledgement/retry work. The Cult renderer checks its captured instance before completion and releases on takeover. Corruption previews and Debug overrides now stop for same-ID replacement snapshots as well as changed world IDs.
