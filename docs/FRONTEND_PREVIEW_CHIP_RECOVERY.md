# Preview, analysis chip and Signal runtime recovery

This slice replaces the simplified Preview and connects the analysis chip and Daniel service conversation to the source desktop. The source app still has incomplete game, scene and production cutover boundaries.

## Preview

`PreviewScreen` now owns literal text markers, image layout, corruption notices and training-log presentation. The text grammar recognizes `**…**`, `<bold>`, `<clue>` and `<red>`; all other markup remains text. Training turns use the shipped mint/player-gray palette, photo asset mapping and centered verse layout instead of a JSON dump.

The PDF viewer owns its toolbar, page input, thumbnails, viewport-based page mounting, zoom range of 25–500%, fit width, keyboard shortcuts, canvas raster and selectable text. It preserves mixed page sizes and bounds raster allocation. Closing or changing a document cancels loading/rendering and destroys its PDF worker. PDF.js 5.4.624 is pinned in the lockfile. Its compatibility build is necessary for Chromium 131, which lacks the modern build's `Uint8Array.toHex` dependency. The package worker, CMaps, standard fonts and WASM codecs are bundled locally; no historical Preview/PDF JavaScript or external CDN is required.

World/Manifold revisions reload the artifact and deduplicate its read fact. Query responses cannot invalidate their own queries. Window title updates are idempotent. Preview publishes `file:<id>` for chip scanning. Locked files continue to use the existing Files recovery dialog before Preview launch.

Evidence: `PreviewScreen-_XO6m4By.js` PDF/text/file presentation and NormalApp training-log component `AXe`.

## Analysis chip

The controller owns:

- `manifold.chip.status`, `manifold.chip.status.changed` and `manifold.chip.scan` contracts with validated replies and a five-second timeout.
- Server/client clock correction, cooling and charge derivation.
- Picking, a minimum 1400 ms scan, an additional 700 ms fried state, and receipt-timed readout.
- Disconnect/world/disabled-state cancellation, stale reply fencing, listener and timer cleanup.

The desktop restores the chip button, offline/cooling feedback, upgrade acknowledgement, target overlays, Escape/background cancellation, terminal-style readout and 28 ms Unicode character reveal with a 30-second lifetime. Reduced motion skips character/scan animation. `system.repaired` enables the chip; `virus.cleared` expands supported applications; the existing memory/ending facts select offline behavior.

Mail, Files and Preview are initially scannable; Browser, Signal and Terminal require the upgrade. Other application targets refuse scanning. Browser tabs publish `page:<envelopeId>`; Mail publishes `mail:<id>` or `mail:inbox`; Signal publishes thread/photo keys; Preview publishes its file key. Nori uses `nori:self`, with the original model part set projected through the Cubism matrix and padded by 14 CSS pixels. Window targets follow current geometry, minimization, exclusive-window exclusion and stacking order.

Evidence: NormalApp `Vet`, `Get`, `Uet`, `Q_e`, `i2e` and the chip protocol schemas. The outer Three.js billboard remains a separate unfinished scene boundary; scan projection currently uses the live source Cubism canvas.

## Signal and artifact runtime connections

The previously isolated Daniel runtime is now instantiated and supplied to the Signal route, with live facts and shared sound cues. A generation fence prevents delayed replies from being appended after reset or disposal. World changes reset local service conversation state. Full story jump/cinematic integration remains open.

Mail and Signal now refresh on actual Manifold revisions and publish scan context. `subscribeManifoldChanges` also fixes the Files/Preview response-to-reload loop that broad WorldStore subscriptions could cause. Old artifact requests cannot overwrite newer results or update an unmounted screen.

## Verification

- Runtime behavior tests cover charge skew/cooling, application eligibility, scan/fried timings, world-switch and disabled-state fencing, teardown, Daniel delayed/resume cancellation, and artifact subscription invalidation.
- The Chromium app smoke opens an authored two-page PDF, checks nonblank canvas pixels and selectable text, exercises page/zoom/sidebar controls, and checks literal text markers and training-log turn layouts.
- The same smoke unlocks the chip in its disposable local backend, cancels selection with Escape, scans the actual Nori target and Mail context, verifies the backend readout and checks artifact request counts stay bounded.
- Screenshots are included with the app smoke artifacts: `preview-pdf.png`, `preview-training-log.png`, `chip-scanning.png`, `chip-readout.png`.
- TypeScript, source application/library builds and the existing recovery/cutover gates remain required.

## Remaining boundaries

The cutover status intentionally stays incomplete. Debug, story/corruption/reveal/interrupt choreography, full 3D scene and gesture integration, remaining game parity, and production entry/rollback verification are still open. This work does not assert full end-to-end story completion or pixel identity with the historical production app.
