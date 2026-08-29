# Frontend recovery and maintenance workflow

Nori.Web ships a production Vite frontend in `public/assets/`. The JavaScript chunks are minified/renamed and no `sourceMappingURL` references are present, so exact original source recovery is not technically possible from the repository alone. In particular, original TypeScript types, comments, local variable names, pre-bundle file boundaries and JSX source locations are unavailable.

The repository therefore uses a three-part recovery model: exhaustive shipped-bundle analysis, maintainable clean-room source, and an independently buildable recovered-source artifact.

## 1. Exhaustive shipped-bundle analysis

Run:

```bash
npm ci
npm run frontend:recover
```

The analyzer walks every JavaScript and CSS chunk in `public/assets/` and records stable evidence useful for maintenance:

- hashes and byte sizes;
- static/dynamic imports and re-exports;
- exported/imported alias bindings;
- top-level function/class/variable inventory;
- runtime signals such as fetch/WebSocket/timers/storage/animation-frame use;
- `/api/*` endpoints, storage keys, protocol/event strings and external URLs;
- Vite lazy chunk references and dependency graph;
- feature classification for auth, Arcade, chat, Browser, Mail, Files, Messenger, Terminal, games and debug tooling;
- CSS selectors, variables, asset URLs, media queries and keyframes;
- optional beautified local copies for reading during analysis.

Generated files live under `.frontend-recovery/` and are ignored by Git. They are analysis material rather than project source.

The output set is:

```text
.frontend-recovery/
├── manifest.json
├── chunk-graph.json
├── MODULE_MAP.md
├── SYMBOL_INDEX.json
├── FEATURE_MAP.md
├── style-manifest.json
├── STYLE_MAP.md
├── symbols/*.json
└── pretty/assets/*
```

Use `npm run frontend:recover -- --metadata-only` to skip the formatted JavaScript/CSS copies while keeping the complete structural inventory.

## 2. Clean-room maintenance source

`frontend-src/` contains stable TypeScript/TSX reconstructed from verified HTTP/WebSocket protocol behavior and observable application behavior.

The recovered runtime currently covers:

- local auth/session and ticket HTTP calls;
- Arcade main WebSocket negotiation (`arcade.v1` + `ticket.*` subprotocol);
- reconnect behavior with protocol-level keepalive disabled by default to avoid waking hibernating Durable Objects unnecessarily;
- Arcade media WebSocket negotiation;
- correlated event-channel RPC;
- RFC 6902 cartridge patch application;
- replicated world/cartridge store;
- Manifold artifact, chip, command, bookmark and bounty operations;
- Browser, Mail, Files, Messenger and Terminal application models;
- Chat commands and audio acknowledgements;
- Cake Duel, Codenames, Chess and Pictionary cartridge transport;
- desktop game/talk/network event channels.

Recovered UI/state slices now include:

- public `IntroPage` structure and interaction behavior with content separated into typed data;
- `SidebarNavButton`;
- `useCompactHeight` and `useElementSize`;
- Browser app intent/open semantics;
- Browser popup/window shell around the still-separate `BrowserPageView` migration boundary;
- Signal login, recovery and temporary-password screens plus `signal.login` / `signal.recover` command adapters;
- `marginalGrowthStore` state transitions and camera-clamp interpolation, with defaults that still belong to `NormalApp` passed in explicitly.

The clean-room source is intentionally named and typed for maintainability rather than trying to preserve meaningless minifier identifiers. Hidden values are not guessed: unresolved constants remain explicit dependencies until their owning bundle boundary is verified.

## 3. Independent recovered-source build

The clean-room source has its own Vite library build:

```bash
npm run frontend:build
```

It writes an ignored `.frontend-build/` ES-module artifact with source maps. This build does not replace the historical production entry yet. Its purpose during migration is to prove that recovered modules form a coherent, bundleable source tree.

The production cutover should happen only after the desktop React root, window manager and required presentation layers are reconstructed and behavior-checked. At that point the source build can become the producer of `public/assets` rather than a parallel maintenance artifact.

## Drift protection

`npm run frontend:recover:check` performs a metadata-only full scan and requires every analyzed JavaScript chunk to also exist in the symbol inventory. It additionally asserts that the major shipped feature chunks remain discoverable and that CSS recovery is non-empty.

The normal GitHub pull-request CI runs:

```bash
npm run frontend:typecheck
npm run frontend:build
npm run frontend:recover:check
```

so type errors, bundling failures and upstream asset replacement are checked independently.

## Manual full recovery artifact

The **Frontend Recovery** GitHub Actions workflow is manually triggered. Before generating its artifact it typechecks and builds the clean-room source, then produces the complete recovery analysis. Unless `metadata_only` is selected, the artifact also contains locally beautified JavaScript/CSS copies for inspection.

Those generated copies are deliberately not committed. Future code changes should be implemented in `frontend-src/` and verified against protocol behavior/tests rather than editing hashed production bundles directly.

## Current migration boundary

The main remaining high-value boundaries are:

1. `NormalApp-*`: desktop/window manager, shared stores, sound/UI primitives and presentation glue.
2. `BrowserPageView-*` and `BrowserApp-*`: browser rendering/sandbox/UI behavior beyond the recovered popup shell and app model.
3. `ChatPanel-*` and media presentation.
4. Mail, Files, Messenger and Terminal presentation layers.
5. Game presentation layers.
6. Live2D/Nori scene and desktop presentation.
7. Maintainable CSS ownership and final production source entry.

Prefer extracting small, independently observable chunks and stable contracts before cutting into the large `NormalApp` bundle. Every migrated boundary should remain traceable to its shipped chunk and should pass typecheck, source build and recovery drift checks.
