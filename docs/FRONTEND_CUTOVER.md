# Full frontend source cutover

PR #28 established a maintainable recovered source tree. This migration moves the actual production frontend from the historical hashed JavaScript entry to `frontend-src/`.

## Safety rule

`public/index.html` remains on the historical entry until every item in `frontend-src/migration/cutover-status.ts` is complete. The source app must never import `index-CyHAbkO5.js` or `NormalApp-Cn6agT0F.js` as a shortcut.

`npm run frontend:cutover:check` enforces that rule in CI.

## Build contracts

There are now two independent builds:

- `npm run frontend:build` — library-mode build for the recovered modules.
- `npm run frontend:app:build` — application-mode build rooted at `frontend-src/index.html` and `frontend-src/main.tsx`.

The app build writes to ignored `.frontend-app-build/` until the production entry boundary is ready. It bundles React and runtime dependencies rather than externalizing them.

## Migration order

1. Browser main renderer (`BrowserPageView`) and sandbox/navigation behavior.
2. Signal Messenger plus shared chat/media presentation.
3. Mail, Files and Messenger presentation.
4. Cake Duel, Codenames, Chess and Pictionary presentation/controllers.
5. Live2D/Nori scene lifecycle and visual integration.
6. Move the shipped stylesheet into source-owned CSS/modules and remove the temporary `index-FU-0vwSE.css` link.
7. Add the deploy-stage frontend build to the Cloudflare build command.
8. Switch `public/index.html` to the source build and mark `production-entry` complete.
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

- `FRONTEND_CUTOVER_BOUNDARIES` has no `complete: false` entries;
- source app has no historical JS imports;
- source app has no historical CSS import;
- `npm run frontend:typecheck` passes;
- `npm run frontend:build` passes;
- `npm run frontend:app:build` passes;
- `npm run frontend:cutover:check` passes;
- `npm run frontend:recover:check` passes;
- Cloudflare dry-run passes with the generated source assets staged;
- browser smoke tests cover boot, login, desktop, launching/closing apps, persistence and sign-out;
- a rollback path to the previous public entry is documented for the first production deployment.

The goal is a boring final switch: by the time `public/index.html` changes, all risky migration work should already have happened behind the source-app build contract.
