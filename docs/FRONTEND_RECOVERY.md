# Frontend recovery and maintenance workflow

Nori.Web ships a production Vite frontend in `public/assets/`. The JavaScript chunks are minified/renamed and contain no `sourceMappingURL` references, so the exact original TypeScript/TSX files, comments, local names, types and pre-bundle file boundaries are not recoverable from the repository alone.

The repository therefore uses three layers: exhaustive shipped-bundle evidence, maintainable clean-room source, and an independently buildable recovered-source artifact.

## 1. Exhaustive shipped-bundle evidence

Run:

```bash
npm ci
npm run frontend:recover
```

The analyzer walks every JavaScript/CSS chunk and records hashes, byte sizes, imports/re-exports, symbol inventories, Vite references, API/storage/protocol strings, external URLs, runtime signals, CSS selectors/variables/assets/media queries/keyframes and feature classification.

Generated output lives under ignored `.frontend-recovery/`:

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

Use `npm run frontend:recover -- --metadata-only` when beautified bundle copies are unnecessary. The copies are evidence only and must not be edited as project source.

Large/minified boundaries such as `NormalApp-*` are additionally inspected by targeted AST tooling. Pull-request CI uploads a short-lived NormalApp inspection artifact so recovered behavior remains traceable to the shipped bundle.

## 2. Clean-room maintenance source

`frontend-src/` contains stable TypeScript/TSX reconstructed from verified behavior.

### Runtime and application contracts

Recovered source covers:

- local auth/session/ticket HTTP calls;
- Arcade and media WebSocket negotiation;
- correlated event RPC and RFC 6902 cartridge patching;
- replicated world/cartridge state;
- Manifold artifact/chip/command/bookmark/bounty operations;
- Browser, Mail, Files, Messenger and Terminal models;
- chat/audio acknowledgements;
- Cake Duel, Codenames, Chess and Pictionary transport;
- desktop game/talk/network channels.

### Desktop shell

The former `NormalApp-*` desktop-shell boundary has been decomposed into maintainable modules:

- insertion-ordered production application registry and metadata catalog;
- persisted OS/window store with rehydration repair;
- app install/download/damaged runtime;
- exact work-area, z-layer, animation, snap, cascade and geometry constants;
- focus/minimize/maximize/close/quit/navigation behavior;
- drag/resize interactions, window chrome, controls, overlays and screen router;
- regular/exclusive managed window hosts and window layer;
- `DesktopRoot` and the recovered `DesktopSurface` grid;
- production-style Dock with responsive icon sizing, 1.7x cosine magnification, glass container, running indicator, download state, damaged feedback, context/long-press menu and per-window focus actions;
- production Dock app icon paths and Credits special-case icon layering;
- TopBar system/app menus, battery/Wi-Fi/date presentation and Blue Bay clock behavior;
- Terminal `Shell / Edit / View` app menus and edit bridge;
- persisted `audio-store` (`masterVolume`, track volumes/mutes, spatial voice and voice rate) plus recovered master-volume TopBar control;
- QFR compute display with the recovered compute-drain cap formula and scientific-number formatter;
- fact-driven Dock visibility and app-install gating;
- startup bootstrap semantics, including the `system` process without incorrectly opening About;
- `RecoveredDesktopShell` composing startup lifecycle, desktop surface, windows, TopBar and Dock;
- `createRecoveredDesktopRuntime()` turnkey assembly for production registry plus recovered Signal/Terminal/Browser-popup bindings.

### Recovered feature presentation

Presentation source additionally includes:

- Intro and SidebarNavButton;
- shared ChatPanel and responsive/window hooks;
- Signal login/recovery/temporary-password screens;
- Terminal line editor, shell and xterm window;
- Browser popup shell around the separate BrowserPageView renderer boundary.

Missing presentation is explicit: an unrecovered window/screen renders a migration fallback instead of silently pretending the original source was recovered.

## 3. Independent recovered-source build

```bash
npm run frontend:build
```

This writes ignored `.frontend-build/` ES modules with source maps. It proves that the reconstructed source is a coherent buildable program while the historical production entry remains available for behavior comparison.

The normal pull-request validation runs:

```bash
npm run frontend:typecheck
npm run frontend:build
npm run frontend:recover:check
```

alongside the existing Worker, hibernation, runtime-efficiency and Cloudflare dry-run checks.

## Drift protection

`frontend:recover:check` performs a metadata-only scan, requires analyzed JavaScript chunks to be represented in the symbol inventory, verifies major feature chunks remain discoverable and verifies CSS recovery remains non-empty. This catches a replaced production bundle independently from TypeScript/build failures.

## Remaining migration boundary

The general desktop/window-manager reconstruction is complete enough to be maintained from source. Remaining high-value work is feature-specific presentation and final cutover:

1. `BrowserPageView-*` / Browser main renderer and sandbox behavior.
2. Signal Messenger and broader chat/media presentation.
3. Mail, Files and Messenger window presentation.
4. Game presentation layers.
5. Live2D/Nori scene presentation.
6. Remaining source-owned CSS/visual-system migration.
7. Final production `main.tsx` cutover plus behavior-comparison tests.

These boundaries should be recovered only from observable evidence. Absence of source maps is a hard limit: original comments, original local names and exact historical file boundaries must not be fabricated.
