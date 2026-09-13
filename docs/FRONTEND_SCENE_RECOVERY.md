# Nori scene and speech recovery

This increment connects the source conversation to the real ARGNori model. It does not complete the outer 3D scene or the story director.

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

Three.js camera/environment/shadows, gesture plugins, story reveal and interrupt choreography, full corruption/finale sequences, remaining scene audio cues, and live-agent synchronization remain open. The scene host now accepts a controlled subset of the original director state; the remaining director producers are not yet restored. The `live2d` and `messenger` cutover flags therefore remain incomplete.

## Conversation and shell handoff

The scene store now carries the original `normal`, `bubbles` and `hidden` chat modes plus the `auto`, `silent` and named desktop music choices. Normal chat fades out during takeover; bubbles-only mode removes the composer. Hidden content is inert, loses input focus, ignores the focus shortcut and rejects sends at the controller boundary. Returning to normal keeps the draft. Scene music overrides are released back to fact-selected desktop music through the same shared mixer.

Corrupt model texture now selects the shipped red bubble gradient, angular border, glow and dark text. Visual characters change at the original 110 ms / 12% cadence. Assistive text remains stable and the reduced-motion preference stops the changing characters. Normal send/receive cues are connected; hidden, cinematic and corrupt bubbles do not emit the normal receive cue.

Between `arg.memory.shown` and `arg.ending.shown`, player messages are shown locally without a chat command, matching the shipped void conversation. The latest twenty local lines are retained for the current world and discarded on world replacement. World facts are read through one shared `WorldStore.facts()` implementation.

Chip scanning subscribes directly to the scene store. Takeover or non-normal chat mode cancels the scan and prevents reentry, including after a late RPC result. Scene updates that leave the blocked state unchanged do not repeatedly reset the chip.

The runtime suite now has 39 passing tests. The real-model browser fixture also checks hidden input, focus-shortcut blocking, draft restoration, red bubble styles, stable assistive text, reduced motion and suppressed receive cues. `nori-corrupt-chat.png` is included in the application artifact. These are restored scene consumers and fact-driven conversation behavior; full cinematic timeline producers remain open. The corruption voice DSP is now restored as described below.


## Corruption voice processing

`VoiceCorruption` and its source-owned AudioWorklet restore all six shipped presets: unstable, glitch, robot, ghost, demon and haywire. The processing chain includes sample holding, stutter/dropout/burst events, FFT overlap-add spectral modes, waveshaping, ring modulation, band filtering, delay modulation, compression and the original room impulse. The default scene effect uses unstable at intensity 0.7. Normal speech uses the dry branch; toggles use the original 120 ms equal-power transition.

The scene store's `corruptVoice` consumer connects to the shared mixer before spatial placement, voice gain and master gain. It remembers a scene selected before the audio unlock gesture. Effects are allocated lazily, worklet module loading is shared per audio context, and native stages remain usable if worklet loading or construction fails. A late module resolution cannot reattach a disposed effect. Speech resets rebuild active effects to discard captured samples and reverb tails; scene release restores the dry path. Disposal disconnects nodes, stops oscillators and closes the worklet port. Bypass additionally clears the historical processor's captured sample ring to avoid replay on reactivation.

`tests/frontend-voice-corruption.test.ts` compares all six worklet presets against the authorized shipped processor sample for sample across 102,400 samples per preset. It also covers dry bypass, captured-sample cleanup, concurrent initialization, current scene state, disposal races, retry after synchronous loading failure, room impulse timing and waveshaping. `scripts/frontend_voice_corruption_probe.mjs` renders the full chain in Chromium for each preset, verifies dry output and native fallback, and checks actual scene binding, pre-unlock activation, mixer gain, speech reset and disposal. Numerical results are saved as `voice-corruption.json` in the application smoke artifact.

The behavioral references are `public/assets/NormalApp-Cn6agT0F.js` and `public/assets/corruptionProcessor.worklet-lw-jqXOl.js`. The application build emits its own worklet from `frontend-src/runtime/corruption-processor.worklet.js`; historical JavaScript is only a test oracle. The cinematic producers that drive corruption over time, the other scene cues and the overall scene/audio cutover boundary remain unfinished.
