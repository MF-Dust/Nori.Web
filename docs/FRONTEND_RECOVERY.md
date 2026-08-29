# Frontend recovery and maintenance workflow

Nori.Web ships a production Vite frontend in `public/assets/`. The JavaScript chunks are minified/renamed and no `sourceMappingURL` references are present, so exact original source recovery is not technically possible from the repository alone. In particular, original TypeScript types, comments, local variable names, pre-bundle file boundaries and JSX source locations are unavailable.

The repository therefore uses a two-stage recovery model.

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

`frontend-src/` contains stable TypeScript reconstructed from the verified HTTP/WebSocket protocol and observable application behavior. It currently covers:

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

This source is intentionally named and typed for maintainability rather than trying to preserve meaningless minifier identifiers.

## Drift protection

`npm run frontend:recover:check` performs a metadata-only full scan and requires every analyzed JavaScript chunk to also exist in the symbol inventory. It additionally asserts that the major shipped feature chunks remain discoverable and that CSS recovery is non-empty.

The normal GitHub pull-request CI runs both:

```bash
npm run frontend:typecheck
npm run frontend:recover:check
```

so an upstream asset replacement cannot silently invalidate the maintenance map.

## Manual full recovery artifact

The **Frontend Recovery** GitHub Actions workflow is manually triggered. It produces a 14-day artifact containing the full analysis set and, unless `metadata_only` is selected, locally beautified JavaScript/CSS copies for inspection.

Those generated copies are deliberately not committed. Future code changes should be implemented in `frontend-src/` and verified against protocol behavior/tests rather than editing hashed production bundles directly.

## Recommended migration order

For future optimization work, prefer migrating functionality in this order:

1. Auth and Arcade transport/state replication.
2. Manifold event RPC and virtual applications.
3. Chat/media presentation.
4. Game presentation layers.
5. Desktop shell and Live2D presentation.

The transport/state layers are already represented in `frontend-src/`, so UI migration can happen without changing the server contract.
