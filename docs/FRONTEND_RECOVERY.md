# Frontend bundle recovery

The repository currently ships the NoriOS frontend as Vite-generated JavaScript/CSS chunks under `public/assets/`. The recovery tooling turns those deployment artifacts into a readable source tree for maintenance and migration work.

## Run locally

```bash
npm ci
npm run recover:frontend
```

Generated files are written to `recovered-src/` and are ignored by Git.

The output contains:

- `original/` — exact `sourcesContent` recovered from source maps when a shipped chunk contains an inline/local map.
- `chunks/` — syntax-preserving, deminified JavaScript for every shipped Vite chunk.
- `reports/` — per-chunk dependency/export/symbol/string-hint reports.
- `manifest.json` — machine-readable inventory sorted by original chunk size.
- `MODULE_GRAPH.md` — first-pass static/dynamic chunk dependency graph.

## Run with GitHub Actions

Open **Actions → Frontend Bundle Recovery → Run workflow**. The workflow is manual-only (`workflow_dispatch`). It installs the existing frontend toolchain, runs the recovery command, and uploads `recovered-src/` as an artifact for 14 days.

The optional `ref` input can point at another branch/tag/commit so different shipped frontend versions can be compared without modifying the recovery tool itself.

## Recovery levels

### Exact recovery

If a chunk has a source map with `sourcesContent`, the original embedded files are copied to `recovered-src/original/`. File paths are sanitized before extraction.

### Bundle-source recovery

When source maps are absent, the JavaScript runtime semantics are still present in the Vite chunk. The tool parses/formats that JavaScript and records its module dependencies, exports and surviving symbol/string clues. This produces maintainable JavaScript, but it cannot uniquely recreate information that the minifier removed, including:

- original TypeScript types/interfaces;
- comments not present in the bundle;
- original local variable names;
- exact pre-bundle file boundaries;
- JSX/TSX spelling when the bundle only contains compiled JSX calls.

Those details are reconstructed in a second pass by using chunk names, imports/exports, React component signatures, state keys, API/event strings and behavior tests.

## Recommended migration order

1. Recover all chunks and keep `manifest.json` as the baseline.
2. Start with small named chunks such as auth providers, panels and individual app screens.
3. Give surviving components/hooks/stores stable semantic names.
4. Move each understood module into a normal `src/` tree and add behavior tests against the shipped bundle.
5. Tackle `NormalApp-*` last; it contains shared runtime/vendor/application code and benefits the most from symbols recovered from smaller chunks first.
6. Once the reconstructed Vite build is behavior-compatible, replace `public/assets` bundle overrides gradually rather than in one large cutover.

## Provenance

Every generated chunk report includes the SHA-256 of the input asset. Keep that hash when documenting manual renames so a recovered module can always be traced back to the exact shipped bundle it was derived from.
