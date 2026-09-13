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

Three.js camera/environment/shadows, gesture plugins, story reveal and interrupt choreography, full corruption/finale sequences, scene-specific audio, and live-agent synchronization remain open. The scene host now accepts a controlled subset of the original director state; the remaining director producers are not yet restored. The `live2d` and `messenger` cutover flags therefore remain incomplete.
