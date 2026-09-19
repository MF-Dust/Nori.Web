# Boot and corruption production recovery

Reference: `public/assets/NormalApp-Cn6agT0F.js`, inspected as source text. This recovery does not import or execute that historical application chunk. Status: production components implemented. First CI passed behavioral gates, and screenshot inspection identified a backward-facing boot camera; that defect is corrected with a camera-ray regression and rendered actor visibility check. Updated CI run `35356495551` passed the rendered actor visibility check; the new wake screenshot was inspected and shows the correctly framed sleeping actor. Historical paired visual comparison remains pending. Original agent/media acceptance remains externally blocked by the local `nori_talk.request` noop.

## Boot

- `boot-timeline.ts` recovers the default phase order and durations from `l$e`, `LZ`, `L1`, `sJ`: 13.6-second pre-break interval, surface/descent/push, symbol draw and morph, reveal/approach, explicit wake input, and desktop settle. The camera follows the recovered surface origin, descent arc, arrival/formed/face/rest targets; projection drives the maintained ocean/glyph/silhouette/burst channel.
- `boot-shatter-renderer.js` owns the actual recovered `X7e` renderer and its dependency closure: boot display painting, deterministic fracture graph, crack propagation, baked shard bodies, debris/glitter, glass/edge shaders, corruption pass, bloom, and composition. Three.js vendor names are replaced with maintained package imports; application-global backdrop access becomes an explicit constructor input. No historical React application or store is embedded.
- `boot-scene.tsx` owns the renderer, clock, track handles, resize observer and scene lease. It waits for the shared model/ocean/glyph resources, times out failed readiness, offers retry, leaves the ready gate only on user input, and emits `boot.completed` only after settle. Replacement immediately invalidates callbacks and releases resources. Retry holds the cold channel inactive for two rendered frames before creating a new resource owner.
- The source schedules the shipped landing/drop/glass/water/bubble/dive/glyph/morph audio assets. The one-shot `until` bounds are source-managed lifetimes because the prior scheduler used decoded asset duration; actual audible comparison remains pending.

Open acceptance: reference/source keyframe comparison, Three shader compilation in Chromium, model camera/glyph alignment, low graphics settings and reduced-motion treatment of the fracture camera, delayed and absent audio, and resource budgets. Static reconstruction is not evidence of visual parity.

## Corruption climax

- `corruption-scene.tsx` mounts the existing eleven-phase timeline in production, minimizes desktop windows, requests the shipped `corruption_scare` talk ID on the reference cadence, and waits for observed speech completion or the reference's 12-second fallback. It does not synthesize agent text.
- `corruption-overlays.js` recovers the shipped entry terminal and healing wave/telemetry passes (`Bqe`, `Kqe`), including the shader waterline, particles, scan/progress and frame decorations. They are owned source modules with React imports and explicit styles.
- All six source microgames gate the transition. Static preference-choice content now comes from the shipped `r_` array, replacing previously authored technical substitute questions. The existing protected target, rhythm, tune/hold, choice lock, steer and release logic is preserved.
- Eerie drone level follows six-game completion; entry and wake cues use the existing mixer. Cleanup stops loops, subscriptions and scene ownership. Hidden/background intervals do not advance input or the voice fallback. The final wake remains a user gate before `virus.cleared`.

The original SVG band-slice/RGB-split/jolt filter is source-owned in `corruption-glitch.js`, with per-instance filter ownership and release. Healing shader failures now stop the scene and expose Retry.

Open acceptance: exact behind-glow channels, all six original/source visual comparisons, original agent response/media causality. Boot and Corruption now constrain Tab navigation to their modal surface and restore prior focus on exit. The local noop response cannot close agent parity.

## Verification

- `node scripts/test_frontend_stories.mjs`: 10 tests passed, including boot wake gating, deterministic fracture topology, independent corruption gates and acknowledgement fencing across same-world replacement, plus the sibling scene suites.
- `npm run frontend:typecheck`: passed after integration.
- `npm run frontend:app:build`: passed for the integrated source components.
- `scripts/frontend_boot_corruption_probe.mjs` uses real production components/model/renderers with transport-only fixtures. It captures fracture, dive and wake; checks no completion before input, real completion after input, corruption request/voice/QTE entry and cancellation without a completion fact.
- `scripts/smoke_frontend_stories.mjs` runs all six production scene probes under a dedicated Vite server. Local Chromium process launch is blocked by the environment's socket permission. GitHub Actions run `35355349021`, boot/corruption job `105633237177`, passed the behavior probe and produced screenshots. Visual inspection caught the wake camera defect despite that pass; the updated probe in run `35356495551`, job `105637021426`, passed its actor pixel comparison, and the new screenshot was inspected. This is not a claim of historical visual parity.
