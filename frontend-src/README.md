# Maintainable frontend source

This directory is the clean-room maintenance source for the local Nori.Web frontend runtime and progressively recovered UI.

The shipped UI under `public/assets/` is a set of hashed Vite JavaScript/CSS chunks without source maps. The exact original TypeScript/TSX tree, comments, local identifiers, source paths and type annotations therefore cannot be recovered reliably. Recovery instead preserves verified behavior, protocol/data compatibility and stable presentation semantics in source that can be maintained normally.

Two outputs are deliberately separated:

1. `.frontend-recovery/` — generated evidence for every shipped JavaScript/CSS chunk: hashes, dependency graph, symbol/style inventories, API/storage/protocol strings and optional beautified analysis copies. It is ignored by Git.
2. `frontend-src/` — typed source reconstructed from that evidence. This is the implementation intended for development and optimization.

## Recovered source boundary

The source tree now includes:

- Arcade/HTTP/auth/media/event-RPC/world-state runtime contracts;
- Manifold, chat, desktop, games and Signal services;
- Browser/Mail/Files/Messenger/Terminal application models;
- production application/window catalog and production Dock icon resolver;
- the persisted OS/window store, restore repair, app registry and app-install runtime;
- exact recovered window geometry, z-layers, snapping, focus/minimize/maximize, drag/resize and animation constants;
- window chrome, controls, overlays, screen routing and managed window hosts;
- `DesktopRoot`, `DesktopSurface`, production-style `DesktopDock` and `DesktopTopBar`;
- recovered Dock magnification, download/damaged/open/active states and window context actions;
- recovered system menu, Terminal Shell/Edit/View menus and production app-menu fallback semantics;
- recovered `audio-store` plus the TopBar volume menu and slider;
- recovered QFR compute drain/formatting presentation (`qGe` / `XGe`);
- a `RecoveredDesktopShell` that composes bootstrap lifecycle, desktop surface, window stack, TopBar and Dock;
- `createRecoveredDesktopRuntime()` turnkey assembly for recovered production presentation bindings and Terminal edit-menu bridging;
- Signal login/recovery/temporary-password presentation;
- Terminal xterm presentation and shell;
- Browser popup presentation around the still-separate `BrowserPageView` boundary;
- Intro, SidebarNavButton, ChatPanel and shared responsive/window hooks.

The normal maintenance entry can therefore be assembled as:

```tsx
const bundle = createRecoveredDesktopRuntime({
  presentation: {
    terminal: terminalRuntime,
    signal: signalRuntime,
    browserPopup: browserPopupRuntime,
  },
});

<RecoveredDesktopShell
  bundle={bundle}
  facts={facts}
  computeState={{ compute, cap, computeDrain }}
/>
```

Missing presentation modules are intentionally rendered through explicit migration fallbacks instead of silently delegating their behavior back to minified identifiers.

## Remaining boundaries

The large `NormalApp-*` desktop shell is no longer a general migration boundary. The remaining work is feature presentation that cannot be reconstructed by inventing data or UI behavior:

- `BrowserPageView-*` / Browser main renderer and sandbox presentation;
- Signal Messenger and broader chat/media presentation;
- Mail, Files and Messenger window presentation;
- game presentation layers;
- Live2D/Nori scene presentation;
- remaining source-owned CSS/visual-system migration;
- final production `main.tsx` cutover and behavior-comparison tests.

Generated beautified bundles under `.frontend-recovery/pretty/` remain evidence, not project source.

## Recovery commands

Generate the full local evidence set:

```bash
npm ci
npm run frontend:recover
```

Validate and build the maintenance source:

```bash
npm run frontend:typecheck
npm run frontend:build
npm run frontend:recover:check
```

`frontend:build` writes an ignored `.frontend-build/` ES-module library with source maps. Pull-request CI runs all three checks and also keeps the existing Worker/Cloudflare validation intact.
