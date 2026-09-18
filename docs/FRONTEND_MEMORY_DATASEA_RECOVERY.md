# Memory and Datasea source recovery evidence

This change reconstructs maintainable source behavior from the repository's shipped `public/assets/NormalApp-Cn6agT0F.js` and public assets. The historical application JavaScript is evidence only and is never imported or executed by these modules.

## Memory

The shipped definition identifies a 2.5 second intro; five ordered, user-advanced windows; a 16.5 second log flood; 7 second attack; 1.2 second sweep; 10 second compute drain; and 2.4 second void settle. It also identifies the siren and power-down assets, window-pop interaction, lockdown, model tint, chat bubble handoff, compute drain, and void environment projection.

`memory-scene.tsx` owns these gates and transitions. It loads the canonical and flood training-log artifacts through the production Files model and displays their actual names, ordered items, photo/poem/turn structure, and flood contents. The timeline does not start until the five canonical logs are available. It completes only after the void phase has actually elapsed. Visibility pauses its monotonic clock. Story replacement, unmount, failure, or world replacement synchronously fences animation, audio, and the scene lease. The local `nori_talk.request` handler remains a noop, so no interruption dialogue is invented.

## Datasea

The shipped definition identifies the ordered descent, messages, visualization entrance, wave input gate, convergence, cosmic, white, and CG phases. The recovered camera follows the evidenced `(0, 0, 7.4)` to `(0, -190, 7.4)` descent and rotates downward to `-PI/2`, with a 60 degree field of view. The scene uses the shipped nebula, displacement and two touch CG images, and schedules all eight available Datasea audio assets at the corresponding transition families.

The temporal pass is a readable source-owned reconstruction of shipped `iVe` and `$6e`: it retains half-float history, inverse/current and previous view-projection reprojection, 0.9 history contribution, focus distance, invalid-sample rejection, resize, reset, and disposal behavior; exact visual equivalence still depends on paired capture. The dedicated Three.js renderer loads `cosmicweb.min.glb`, the nebula color texture, and displacement height texture. It applies an owned displacement/dissolve shader to the GLB geometry, separates textured gas and emissive shell geometry, renders a deterministic 280-mote wrapped drift volume, changes fog and material travel during the cosmic pass, and runs temporal accumulation, camera reprojection history, bloom, spherical-harmonic environment lighting, ACES tone grading, and FXAA through `EffectComposer`. The wave gate restores the shipped three-wave roster and ordering of steady, resonance, current, relay, echo, denoise, discern, ripple, sweep, unknot, lure, and balance interactions; the twelve source-owned canvas games retain their shipped per-game physics, pointer controls, progress rules and solve callbacks; all four games must solve before a wave advances. The scene adds white and CG overlays around this GPU pipeline. Load failure suspends the scene and offers a fresh retry. Resize updates renderer, composer, camera aspect and capped device pixel ratio. Exit disposes GLB geometry, materials, textures, postprocessing targets and the WebGL renderer, as well as audio and the scene lease. Completion occurs only after the CG phase elapses.

## Remaining limits

- Dialogue and voice reveal timing cannot be closed against the original agent while the backend `nori_talk.request` path returns `noop`; these scenes do not invent replacements.
- The renderer consumes the 28 MB GLB and both shipped textures and restores separate gas/shell materials, wrapped motes, environment lighting, temporal accumulation, camera reprojection history, bloom, tone mapping and antialiasing. Independent historical visual comparison remains necessary before frame-perfect parity can be claimed.
- Default timing is calculated from the shipped numeric choreography: 30.0 seconds descent, 44.8 messages, 14.0 visualization entrance, a 0.5-second gated wave marker, 10.0 convergence, 59.815178571428596 cosmic, 28.3 white, and 11.0 CG. Cosmic markers use the shipped character counts, 10 characters/second, 1.1-second gaps and linger, and numeric hold values.
- Visual screenshot comparison against an independently runnable historical client remains outstanding.

## Browser acceptance

`scripts/frontend_memory_datasea_probe.mjs` mounts the production scene components through a test-only runtime boundary. It advances every Memory record gate, verifies completion and cancellation cleanup, injects a Datasea GLB failure, retries with the real asset, checks each recovered canvas at every wave gate, drives all twelve games through their original pointer/keyboard input handlers, and verifies cosmic completion plus WebGL canvas/lease cleanup. It captures Memory windows/lockdown and Datasea route/cosmic frames in the caller-provided scratch artifact directory. The probe is designed for the repository's Chromium CI; local execution in the recovery workspace was unavailable because its Playwright browser process could not be launched there.

The latest real-input solver additions await CI. The two earlier Memory/Datasea CI attempts stopped at the asset-retry probe boundary; neither proves game interaction or visual parity. Static narrative passages are not reproduced; the wave host preserves measured line lengths and original delivery cadence with neutral placeholders, which remains a visible content fidelity limit.
