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
- recovered QFR compute drain/formatting presentation;
- a `RecoveredDesktopShell` that composes bootstrap lifecycle, desktop surface, window stack, TopBar and Dock;
- `createRecoveredDesktopRuntime()` turnkey assembly for recovered production presentation bindings and intent routing;
- Signal login/recovery/temporary-password presentation and the Daniel service-thread state machine;
- Mail three-pane presentation, attachment handling and compose failure flow;
- Files artifact/vault normalization, filesystem tree, responsive sidebar, history/breadcrumb navigation, grid/list views, keyboard navigation, sealed cold-volume flow, password vaults, locked-file compute recovery UI, QFR handoff, Preview `{fileId}` launch and external Files intent routing;
- Browser main and popup presentation, persistent tabs/bookmarks, history/scroll restoration, omnibox/search routing, popup/new-tab semantics and Browser intent routing;
- BrowserPageView artifact loading with source-owned `srcdoc` sandboxing, per-page command allowlists, `window.arcade` facts/window/podcast bridge, same-document hash navigation, asset/font inlining, page title/scroll/context-menu relays and error retry behavior;
- Terminal xterm presentation and shell;
- Intro, SidebarNavButton, ChatPanel and shared responsive/window hooks.

The normal maintenance entry can therefore be assembled with source-owned presentation runtimes directly:

```tsx
const bundle = createRecoveredDesktopRuntime({
  terminal: terminalRuntime,
  signal: signalRuntime,
  browser: browserRuntime,
  mail: mailRuntime,
  files: filesRuntime,
});

<RecoveredDesktopShell
  bundle={bundle}
  facts={facts}
  computeState={{ compute, cap, computeDrain }}
/>
```

`bundle.openFilesIntent` reproduces the shipped Files intent boundary: it launches Files when absent, or focuses/creates its main window when already running, while forwarding the requested folder/selection payload.

`bundle.openBrowserIntent` reproduces the shipped Browser intent boundary: it launches Browser with the requested URL when absent, adds a tab and focuses the existing main window when running, and creates a main window directly when the process currently contains popup windows only.

The Browser sandbox keeps command execution page-scoped through each artifact's `allowed_commands` list. The one sanctioned escape to a real OS browser remains an anchor explicitly marked `data-arcade-external="true"`. `bounty.installExtension` is an explicit optional host callback rather than invented behavior, and podcast transport is source-owned while final routing through the OS SFX mixer remains a host-audio integration edge.

The Files cold-volume QFR Dock remains an explicit injected presentation edge because that component belongs to the still-unrecovered Idle/QFR boundary. Files itself no longer imports or delegates to historical JavaScript.

Missing presentation modules are intentionally rendered through explicit migration fallbacks instead of silently delegating their behavior back to minified identifiers.

## Remaining boundaries

The large `NormalApp-*` desktop shell is no longer a general migration boundary. Mail, Signal Messenger, Files and Browser main/popup are source-owned. Remaining work includes:

- broader Messenger/chat-media presentation outside the recovered Signal Messenger boundary;
- Cake Duel, Codenames, Chess and Pictionary presentation;
- Idle/QFR presentation and integration, including the QFR Dock supplied to Files;
- Live2D/Nori scene presentation;
- remaining source-owned CSS/visual-system migration;
- Cloudflare deploy-stage frontend staging and the final production entry switch;
- browser behavior/smoke comparison and historical JavaScript retirement after rollback validation.

Generated beautified bundles under `.frontend-recovery/pretty/` remain evidence, not project source.

## Recovery commands

Generate the full local evidence set:

```bash
npm ci
npm run frontend:recover
```

Validate and build the maintenance source and source application:

```bash
npm run frontend:typecheck
npm run frontend:build
npm run frontend:app:build
npm run frontend:cutover:check
npm run frontend:recover:check
```

`frontend:build` writes an ignored `.frontend-build/` ES-module library with source maps. `frontend:app:build` proves the source-owned browser application composes independently of the historical JavaScript entry. Pull-request CI runs these checks alongside the Worker/Cloudflare validation.
