# Source application, conversation and Live2D recovery

This increment continues PR #43. It makes the source application run against the local backend, but **does not complete production parity or authorize production entry cutover**.

## Implemented

- Effect-owned SourceApp sessions: StrictMode setup/cleanup, authentication, world facts, install guards, reconnect and disposal.
- Main and media sockets fence late HTTP ticket responses, install listeners before opening, time out failed opens, and settle cancellation. Every reopened main socket rejoins the world. Event RPC requests reject on disconnect.
- A source conversation controller queues player messages and audio acknowledgements against the current chat head, correlates request IDs, advances the UI fence, and cancels pending work on world changes/disconnect.
- Chat text matches the Python reducer's control-character removal and 100 Unicode-code-point limit.
- Media decoding follows `backend/core/media.py`: version/channel bytes, LE flags/sequence/block/chunk, network-order UUIDs, PCM16 LE, mono 32 kHz.
- Gesture-enabled WebAudio playback orders and deduplicates chunks, bounds queued samples, acknowledges start/end per block, applies persisted master/voice settings and playback rate, exposes amplitude for lip sync, and supports configured encoded TTS events.
- Text mode is selected on join/reconnect, releasing pending speech without requiring an autoplay permission. Enabling speech during a text reply ignores pre-existing operations so a partial old stream cannot block later replies. Media failures return to text mode.
- Source conversation UI includes history, send, speech mode, connection/error state and collapse. This is an operational source presentation, not a claim of original Messenger UI parity.
- Terminal is bound to recovered Files tree operations and the original `nas.connect`, `nas.list`, `nas.read`, `nas.download` commands. The local backend may reject NAS commands it does not implement.
- Basic Preview handles text, images, embedded PDFs and structured training logs, sets its title and emits read facts. Original PDF worker controls, rich training-log rendering, recovery effects and full Preview parity remain outstanding.
- Signal and vault clients unwrap the command envelope correctly; a transport-level `ok` no longer overrides a business-level rejection. Embedded Browser pages retain their envelope API.

## Live2D provenance and lifecycle

`frontend-src/live2d/engine.js` recovers the isolated Cubism framework and model engine block in `public/assets/NormalApp-Cn6agT0F.js`, from `class it` through `function mce`, before `let If = null`. Top-level symbols were renamed with TypeScript's symbol checker, preserving local scopes. The engine has no historical JavaScript imports; its only external SDK global is the existing separately shipped `Live2DCubismCore` asset. Existing model/Core distribution terms continue to apply.

| Shipped binding | Source binding |
| --- | --- |
| qs | Live2DEngine |
| uce | Live2DSession |
| oce | Live2DModel |
| ace | ModelLoader |
| Lae / Dae | ResourceLoader / ResourceResolver |
| Oae / Pae / Aae | CanvasSession / PointerInput / Camera |
| cce / t9 | TextureCache / ModelPaths |
| eR / tR / nR / rR / iR | drag / blink / breath / physics / lip-sync plugins |

`engine.d.ts` types the public boundary. `NoriStage` owns a fresh canvas per effect lifetime, loads `/ARGNori_web/ARGNori.model3.json`, starts the shipped `Idle:0` loop and enables physics/lip-sync with the shipped disabled drag/blink/breath settings.

Lifecycle fixes found during real Chromium runs:

- Destroying a session now destroys the canvas session and its WebGL/listener resources.
- A cancelled or replaced model load cannot adopt a late model; the late result is released.
- Engine/session disposal is idempotent.
- Core's fixed callback table is not reallocated on each StrictMode initialization. A stable log callback is reused while framework instances can still be disposed.

The original Three.js scene, camera/parallax, shadow, custom expression/gesture/thinking plugins, cinematics and story choreography are not yet reconstructed. The Live2D boundary remains incomplete.

## Validation

```sh
npm ci
npm run frontend:typecheck
npm run frontend:runtime:test
npm run frontend:recover:check
npm run frontend:app:build
npm run frontend:games:smoke
# Install pyproject.toml runtime dependencies plus the local extra and Chromium first.
npm run frontend:app:smoke
npm run frontend:cutover:check
```

The source app smoke starts an isolated local backend and Vite in one process tree, uses real model assets and WebSockets, and checks desktop CSS, text replies, actual PCM playback acknowledgements, reconnect, Terminal, About, Settings persistence/rendering/network/reset and Credits. It rejects historical JavaScript requests and browser errors. `NORI_TEST_PYTHON` and `NORI_TEST_CHROMIUM` optionally select installed executables. CI uploads screenshots.

Remaining production blockers are recorded in `frontend-src/migration/cutover-status.ts`. Settings, About, system alerts and Credits now have source components and bindings; [the supporting-app ledger](FRONTEND_SYSTEM_RECOVERY.md) records their verification and remaining visual/audio edges. Debug, full Preview and shared music/SFX/story integrations still need recovery before the production entry can change.
