# Maintainable frontend source

This directory is the clean-room maintenance source for the local Nori.Web frontend runtime.

The shipped UI under `public/assets/` is a set of hashed Vite JavaScript/CSS chunks without source maps. That means the exact original TypeScript/TSX file tree, local identifiers, comments, source paths and type annotations cannot be recovered reliably. The recovery pipeline therefore separates two things:

1. `.frontend-recovery/` — generated analysis material for **every shipped JavaScript and CSS chunk** (module graph, symbol inventory, API/storage/protocol strings, feature grouping and optional beautified copies). This directory is never committed.
2. `frontend-src/` — stable TypeScript written from verified protocol behavior and observable runtime contracts. This is the code intended for optimization and long-term maintenance.

## Reconstructed runtime coverage

```text
frontend-src/
├── runtime/
│   ├── protocol.ts          # Arcade wire types and paths
│   ├── http.ts              # auth/ticket/Convex HTTP compatibility
│   ├── auth.ts              # local auth/session controller
│   ├── arcade-client.ts     # main WebSocket + reconnect policy
│   ├── media-client.ts      # media WebSocket
│   ├── event-rpc.ts         # correlated event-channel RPC
│   ├── json-patch.ts        # RFC 6902 patch application
│   ├── world-store.ts       # replicated cartridge/world state
│   └── frontend-runtime.ts  # high-level runtime facade
├── services/
│   ├── artifacts.ts         # Manifold artifact list/fetch
│   ├── manifold.ts          # chip/command/bookmark/bounty RPC
│   ├── desktop.ts           # shell/game/talk/settings channels
│   ├── chat.ts              # chat cartridge commands
│   └── games.ts             # Cake Duel/Codenames/Chess/Pictionary transport
├── apps/
│   ├── browser.ts
│   ├── files.ts
│   ├── mail.ts
│   ├── messenger.ts
│   └── terminal.ts
├── features/catalog.ts      # crosswalk from hashed chunks to maintained modules
└── index.ts                 # public maintenance API
```

This layer intentionally does not copy the minified production implementation into the repository. Visual React components can now be replaced feature-by-feature on top of these stable controllers without having to reverse-engineer transport/state logic again.

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
└── pretty/assets/*          # local analysis copies only
```

Validate that all shipped chunks are still covered and that the clean-room source typechecks:

```bash
npm run frontend:typecheck
npm run frontend:recover:check
```

When upstream frontend assets change, the recovery check fails if major expected feature chunks disappear or stop being classified, making bundle drift visible before maintenance work silently targets stale code.
