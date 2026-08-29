# Frontend recovery and clean-room maintenance

The files under `public/assets/` are production Vite chunks. They retain useful chunk names and ESM dependency boundaries, but the repository does not contain source-map references for the shipped JavaScript. As a result, the original TypeScript/TSX source tree, original local identifiers, comments, and types cannot be reconstructed exactly.

The repository therefore uses two separate layers:

1. **Recovery artifacts** — generated locally from the shipped bundles for analysis. These are ignored by Git and are not treated as maintainable source.
2. **Clean-room source** — code written in `frontend-src/` from the verified public protocol, observed module boundaries, and application behavior. This is the source that should gradually replace compatibility shims and hashed production chunks.

## Generate recovery artifacts locally

Install Node dependencies, then run:

```bash
npm ci
npm run frontend:recover
```

Output is written to `.frontend-recovery/`:

```text
.frontend-recovery/
├── manifest.json
├── chunk-graph.json
├── MODULE_MAP.md
└── pretty/
    └── assets/
        └── *.js
```

`pretty/assets/` contains formatted analysis copies of the existing production chunks. They are useful for reading and tracing code, but are deliberately ignored by Git and should not become the project's source of truth.

For a quicker structural pass without writing formatted bundle copies:

```bash
npm run frontend:recover -- --metadata-only
```

## GitHub Actions

The manual **Frontend Recovery** workflow runs the same analyzer and uploads `.frontend-recovery/` as a private workflow artifact. It is intentionally `workflow_dispatch` only.

Open:

```text
Actions → Frontend Recovery → Run workflow
```

The `metadata_only` input can be enabled when only the dependency/API/storage report is needed.

## What the analyzer recovers

For every JavaScript chunk it records:

- byte size and SHA-256 fingerprint;
- static ESM imports and re-exports;
- dynamic `import()` dependencies;
- Vite asset references;
- detected `/api/*` paths;
- browser storage keys used through `localStorage` / `sessionStorage`;
- protocol/event-like string constants;
- external URLs;
- whether a source-map reference exists.

This is enough to build a stable dependency graph and identify which functionality belongs to chunks such as `NormalApp`, `LoginPage`, `ChatPanel`, `BrowserApp`, `MailScreen`, `FilesScreen`, and the game screens without pretending that minified names are original source names.

## Clean-room migration strategy

`frontend-src/` is the maintainable replacement workspace. New work should prefer implementing verified behavior there rather than editing large hashed bundles directly.

A practical migration order is:

1. protocol and transport contracts;
2. authentication and Convex compatibility client;
3. Arcade WebSocket client and stores;
4. settings/runtime compatibility currently implemented as injected shims;
5. smaller apps such as Mail/Files/Browser;
6. game UIs;
7. the large `NormalApp` shell and Live2D stage last.

During migration, the shipped bundle remains the behavioral reference. New source should be tested against the existing backend protocol and browser integration tests before replacing a chunk in `public/index.html`.
