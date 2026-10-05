# Full frontend source cutover

PR #28 established a maintainable recovered source tree. This migration moves the actual production frontend from the historical hashed JavaScript entry to `frontend-src/`.

## Safety rule

The source app must never import `index-CyHAbkO5.js` or `NormalApp-Cn6agT0F.js` as a shortcut. `public/index.html` stays on the historical entry as the rollback path.

## Current source status — HEAD `085bad3`

All seven story producers are registered in the source call chain (`StoryScenes` plus the runtime `STORY_ORDER` support set). The six non-Cult segments remain source-owned reconstructions without original visual, narrative, media and agent parity. Datasea source/probe coverage includes all three waves and all twelve games; original visual, media and agent acceptance remain open. The Debug panel and scene editor are source-owned; the remaining Debug gaps are original layout comparison and the private Inject Talk/Nori Context handlers. At that HEAD the five false gates were `messenger`, `games`, `live2d`, `supporting-apps` and `production-entry`. Current state: `supporting-apps` closed in `705a2e7` and `production-entry` closed in `dd13547`, so only `messenger`, `games` and `live2d` remain false. Cloudflare Workers Builds deploys the source-app candidate by default; `public/index.html` is the preserved legacy rollback entry.

## Build contracts

The production build is:

- `npm run frontend:app:build` — application-mode build rooted at `frontend-src/index.html` and `frontend-src/main.tsx`.

The app build writes to ignored `.frontend-app-build/` until the production entry boundary is ready. It bundles React and runtime dependencies rather than externalizing them.

## Candidate preparation

`node scripts/prepare_frontend_cutover_candidate.mjs` builds an isolated local
overlay from the source application output and the existing static public
assets. It also snapshots and hashes the production entry's JavaScript/CSS
rollback set and performs an exact index restore drill. Use `--materialize` for
a self-contained CI or deployment dry-run artifact; the default relative
symlink overlay is local-only and avoids duplicating the public asset tree.

See [the candidate and rollback procedure](FRONTEND_CUTOVER_CANDIDATE.md) for
the verified boundaries and remaining production evidence. Preparing this
artifact does not change the public entry, feature gates, or deployment.

## Migration order

1. Browser main renderer (`BrowserPageView`) and sandbox/navigation behavior.
2. Signal Messenger plus shared chat/media presentation.
3. Mail, Files and Messenger presentation.
4. Cake Duel, Codenames, Chess and Pictionary presentation/controllers.
5. Live2D/Nori scene lifecycle and visual integration.
6. CSS ownership is complete: source modules and generated utilities replace the historical stylesheet link. See `FRONTEND_CSS_RECOVERY.md`.
7. Add the deploy-stage frontend build to the Cloudflare build command. Done in `dd13547`.
8. Serve the source build as the production entry and mark `production-entry` complete. Done in `dd13547`: the deploy wrapper materializes the source candidate; `public/index.html` stays as the explicit legacy rollback entry rather than being rewritten.
9. Remove historical JavaScript chunks only after production behavior comparison and rollback validation.

## Acceptance criteria for each boundary

A boundary can be marked complete only when:

- its production behavior is implemented under `frontend-src/`;
- the source application build includes it without importing a historical JavaScript chunk;
- TypeScript typecheck passes;
- the application-mode Vite build passes;
- recovery evidence or protocol tests cover the behavior being replaced;
- any required static assets remain available through Cloudflare Assets/R2;
- the migration fallback for that boundary is no longer needed.

## Final cutover checklist

Before changing `public/index.html`:

- source app has no historical JS imports;
- source app has no historical CSS import;
- `npm run frontend:typecheck` passes;
- `npm run frontend:app:build` passes;
- `npm run frontend:games:test` and `npm run frontend:suites:test` pass;
- Cloudflare dry-run passes with the generated source assets staged;
- browser smoke tests cover boot, login, desktop, launching/closing apps, persistence and sign-out;
- a rollback path to the previous public entry is documented for the first production deployment.

The goal is a boring final switch: by the time `public/index.html` changes, all risky migration work should already have happened behind the source-app build contract.

## Games integration progress

All four games have source-driven screens and runtime bindings. Codenames has a deterministic 13-step tutorial and results surface, Pictionary has source-owned help/results surfaces, Chess has the complete 22-ply tutorial, and Cake Duel has a source runtime/controller with start/game/results routes. [The game recovery ledger](FRONTEND_GAMES_RECOVERY.md) records the remaining full lifecycle, visual and original-agent/media acceptance. Source application integration and full-production parity remain distinct acceptance steps.

## Supporting applications

Settings, About, system alerts and Credits have source components and desktop bindings. The Debug panel and scene editor are also source-owned, including the production-bound Live2D, Audio, Pat, reaction, scenario, tuner and notification controls. [The supporting-app ledger](FRONTEND_SYSTEM_RECOVERY.md) records the remaining original layout comparison and private Inject Talk/Nori Context handlers under the still-false `supporting-apps` boundary.

## Nori scene integration

[The scene recovery ledger](FRONTEND_SCENE_RECOVERY.md) records speech cuts, emotion timing, idle/sleep and story-fact poses, thinking light, model face/texture controls, screen effects and the six-mode corruption voice DSP. The source Three.js environment, camera, shadow and scan/audio transforms are bound, and all seven story producers are registered. The six non-Cult segments still need original visual, narrative, media and agent parity; real-model and scene-tool fixtures do not close that gap. Live2D and Messenger remain incomplete.
