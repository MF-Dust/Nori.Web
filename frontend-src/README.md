# Maintainable frontend source

This directory is the clean-room maintenance source for the local Nori.Web frontend runtime and progressively recovered UI.

The shipped UI under `public/assets/` is a set of hashed Vite JavaScript/CSS chunks without source maps. That means the exact original TypeScript/TSX file tree, local identifiers, comments, source paths and type annotations cannot be recovered reliably. The recovery pipeline therefore separates two things:

1. `.frontend-recovery/` — generated analysis material for every shipped JavaScript and CSS chunk. It contains the module graph, symbol inventory, API/storage/protocol strings, feature grouping and optional beautified copies. This directory is never committed.
2. `frontend-src/` — stable, typed source reconstructed from verified protocol behavior and observable runtime/UI contracts. This is the code intended for optimization and long-term maintenance.

## Current source layout

```text
frontend-src/
├── runtime/
│   ├── protocol.ts
│   ├── http.ts
│   ├── auth.ts
│   ├── arcade-client.ts
│   ├── media-client.ts
│   ├── event-rpc.ts
│   ├── json-patch.ts
│   ├── world-store.ts
│   └── frontend-runtime.ts
├── services/
│   ├── artifacts.ts
│   ├── manifold.ts
│   ├── desktop.ts
│   ├── chat.ts
│   ├── games.ts
│   └── signal.ts
├── apps/
│   ├── browser.ts
│   ├── files.ts
│   ├── mail.ts
│   ├── messenger.ts
│   └── terminal.ts
├── intents/
│   └── browser-intent.ts
├── hooks/
│   ├── use-compact-height.ts
│   └── use-element-size.ts
├── components/
│   └── sidebar-nav-button.tsx
├── screens/
│   ├── intro-page.tsx
│   ├── browser-popup-screen.tsx
│   ├── signal-login-screen.tsx
│   ├── signal-reset-screen.tsx
│   └── signal-temp-password-screen.tsx
├── state/
│   └── marginal-growth-store.ts
├── features/catalog.ts
├── vite.config.ts
└── index.ts
```

## Recovery status

The runtime layer covers the verified Arcade transport/state replication, Manifold/event RPC, local auth compatibility and the virtual application data models.

The first UI recovery slices now cover:

- the public intro-page structure and interactions, with editorial content supplied as typed data;
- responsive element-size and compact-height hooks;
- the sidebar navigation primitive;
- Signal login, recovery and temporary-password screens plus command transport;
- Browser app intent/open semantics and the popup shell around `BrowserPageView`;
- the observable Zustand behavior of `marginalGrowthStore`, with still-hidden `NormalApp` defaults injected explicitly rather than guessed.

`BrowserPageView`, the main desktop/window manager, chat/media presentation, game presentation and Live2D/Nori scene remain migration boundaries. A typed bridge around one of those boundaries does not mean that feature is fully reconstructed.

Generated beautified bundles under `.frontend-recovery/pretty/` remain analysis material. They are not project source and should not be edited as the implementation.

## Recovery commands

Generate the complete local analysis set:

```bash
npm ci
npm run frontend:recover
```

The output includes:

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

Validate and build the maintainable source:

```bash
npm run frontend:typecheck
npm run frontend:build
npm run frontend:recover:check
```

`frontend:build` creates an ignored `.frontend-build/` ES-module library with source maps. During migration it exists to give recovered modules a real bundling contract without replacing the historical production entry prematurely. Once the desktop React root is sufficiently reconstructed, this build can become the source of the production `public/assets` output.

The normal pull-request CI runs all three checks, so type errors, bundling errors and shipped-bundle drift are caught independently.
