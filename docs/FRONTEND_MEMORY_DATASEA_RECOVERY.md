# Memory and Datasea source recovery evidence

This change reconstructs maintainable source behavior from the repository's shipped `public/assets/NormalApp-Cn6agT0F.js` and public assets. The historical application JavaScript is evidence only and is never imported or executed by these modules.

## Memory

The shipped definition identifies a 2.5 second intro; five ordered, user-advanced windows; a 16.5 second log flood; 7 second attack; 1.2 second sweep; 10 second compute drain; and 2.4 second void settle. It also identifies the siren and power-down assets, window-pop interaction, lockdown, model tint, chat bubble handoff, compute drain, and void environment projection.

`memory-scene.tsx` owns these gates and transitions. It loads the canonical and flood training-log artifacts through the production Files model and displays their actual names, ordered items, photo/poem/turn structure, and flood contents. The timeline does not start until the five canonical logs are available. It completes only after the void phase has actually elapsed. Visibility pauses its monotonic clock. Story replacement, unmount, failure, or world replacement synchronously fences animation, audio, and the scene lease. The local `nori_talk.request` handler remains a noop, so no interruption dialogue is invented.

## Datasea

The shipped definition identifies the ordered descent, messages, visualization entrance, wave input gate, convergence, cosmic, white, and CG phases. The recovered camera follows the evidenced `(0, 0, 7.4)` to `(0, -190, 7.4)` descent and rotates downward to `-PI/2`, with a 60 degree field of view. The scene uses the shipped nebula, displacement and two touch CG images, and schedules all eight available Datasea audio assets at the corresponding transition families.

The dedicated Three.js renderer loads `cosmicweb.min.glb`, the nebula color texture, and displacement height texture. It applies an owned displacement/dissolve shader to the GLB geometry, renders an 8,000-point depth field, changes fog and material travel during the cosmic pass, and runs bloom plus a final tone-grade pass through `EffectComposer`. The wave gate restores the shipped three-wave roster and ordering of steady, resonance, current, relay, echo, denoise, discern, ripple, sweep, unknot, lure, and balance interactions; each game has its own progress or tuning control and all four games must solve before a wave advances. The scene adds white and CG overlays around this GPU pipeline. Load failure suspends the scene and offers a fresh retry. Resize updates renderer, composer, camera aspect and capped device pixel ratio. Exit disposes GLB geometry, materials, textures, postprocessing targets and the WebGL renderer, as well as audio and the scene lease. Completion occurs only after the CG phase elapses.

## Remaining limits

- Dialogue and voice reveal timing cannot be closed against the original agent while the backend `nori_talk.request` path returns `noop`; these scenes do not invent replacements.
- The renderer now consumes the 28 MB GLB and both shipped textures, but the historical renderer has additional bespoke mote, gas-shell, environment-transform and exact kernel behavior that remains pending visual comparison.
- The twelve wave games now have distinct source-owned mechanics and preserve the shipped roster/grouping/gates, but their full historical canvas simulations include thousands of additional lines of per-game physics and remain an explicit fidelity gap.
- Cosmic and white phase durations are evidence-based fixed production defaults. Exact line-derived durations remain tied to copyrighted narrative strings and editor hold parameters in the shipped bundle, so this implementation does not claim frame-perfect parity.
- Visual screenshot comparison against an independently runnable historical client remains outstanding.

## Browser acceptance

`scripts/frontend_memory_datasea_probe.mjs` mounts the production scene components through a test-only runtime boundary. It advances every Memory record gate, verifies completion and cancellation cleanup, injects a Datasea GLB failure, retries with the real asset, checks the route gate and cosmic pass, and verifies completion plus WebGL canvas/lease cleanup. It captures Memory windows/lockdown and Datasea route/cosmic frames in the caller-provided scratch artifact directory. The probe is designed for the repository's Chromium CI; local execution in the recovery workspace was unavailable because its Playwright browser process could not be launched there.
