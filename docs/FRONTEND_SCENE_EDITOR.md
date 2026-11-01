# Source scene editor

The Debug **Scene editor** implements a local project workflow: import a JSON file, edit supported channels or the JSON document, inspect the timeline, and export a validated project. It remains an authoring tool. It does not emit completion facts or claim original per-cinematic behavior, visual, media or agent parity.

## Files and validation

**Import project** accepts a local JSON document up to 100,000 UTF-8 bytes. A UTF-8 BOM is accepted. Limits are checked before reading the file and again against the decoded text. Invalid input leaves the existing document unchanged; importing does not start playback. A read finishing after the editor unmounts is ignored.

**Export project** validates the current document and downloads normalized JSON under a path-safe `nori-scene-*.json` filename. Download URLs are released after use and on unmount. This is a browser download, not a write to the repository or a server.

Projects retain the existing strict schema: at most 64 unique phases, 32 unique audio tracks and 600 seconds. Only local `/audio/` paths with supported audio extensions are allowed. Unknown nested camera keys, nonfinite values, reversed audio intervals and invalid fog ranges are rejected. The importer does not execute code or follow URLs.

## Timeline inspection

**Preview position** seeks to a time and pauses. Input gates strictly before that time are skipped for this preview; gates at or after it are rearmed. Coincident zero-duration gates retain their original order. Phase buttons address a phase exactly, allowing selection of a later phase sharing the same timestamp without consuming an earlier gate's input.

Seeking to the endpoint holds the last projection for inspection. **Restart preview** starts again at zero. Ordinary uninterrupted playback still releases the preview at completion. **Continue phase** acknowledges the current preview gate only; a hidden document cannot acknowledge it.

`srcStart` selects the source-file offset independently of timeline elapsed time and fade envelopes. Looping files wrap their offset; non-looping files never restart after their source endpoint.

`StoryAudio.seek` cancels both active and pending track handles. Resuming recreates the current interval at its new offset, including a seek within the same audio track. No audio plays while scrubbing. A manual pause survives a hide/show cycle.

## Channel editing

**Camera and environment channels** selects the initial state or a phase target. It exposes camera position and rotation, field of view, far plane, model dolly, fog, manifold/void environment weights, and alert intensity/time. Rotation is in radians. Number fields apply on blur or Enter. Empty fields inherit; **Auto** explicitly restores nullable channels to renderer defaults.

The form and JSON document use the same validator. Numeric/vector endpoints interpolate smoothly. Nullable camera/environment channels switch from automatic mode to the first explicit value at phase entry, avoiding invalid interpolation from a zero field of view. Existing eye/mouth interpolation is preserved. Fog endpoints are checked with inherited values; valid linear blends keep near below far.

Model, expression, chat and lighting channels now also have form controls. The **Phases and audio tracks** section supports phase creation, ordering, removal, IDs, durations and input gates, plus track paths, time intervals, buses, looping, gain, fades and source offsets. Invalid edits leave the last valid document intact. Phase/channel selection follows the phase ID when reordering. Removing a phase is rejected if existing audio intervals no longer fit. These controls target the current source renderer; original per-cinematic tuners and unimplemented render passes remain separate acceptance work.

## Ownership and regression coverage

`ScenePreview` owns its clock, audio handles and scene lease. It has no director or network-command dependency. Stop, unmount, world departure/replacement (including a same-ID replacement snapshot), and production-story takeover synchronously release the preview. Late frames cannot write back through a released lease. A production story is rechecked before acquiring a new preview layer.

`frontend-scene-transport.test.ts` adds five cases for seek/gate ordering, finite/clamped targets, suspended/disposed clocks, trailing gates and audio discontinuities. `frontend-scene-editor.test.ts` adds ten cases for file validation/round-trip, channel projection, fog constraints and preview lifecycle. Both are included in the existing runtime suite.

`frontend_scene_editor_probe.mjs` is wired into the end of the scene tools smoke, after the real-time cult test. It is designed to check file round-trip, rejected and oversized imports, form edits, paused scrubbing, exact phase selection, completion fencing, 390px layout, same-world replacement and production-story takeover. The successful browser run produced `scene-editor-roundtrip.json`, `scene-editor-compact.png` and `scene-editor-scrub.png`; these artifacts were generated and inspected when applying the patch.

## Ocean and glyph channels

The channel editor includes an explicit/off/inherit cold-open mode and all ocean, glyph, morph, model-form and wash values. `oceanEdge` supports 0–4, including the original 3.5 camera-speed limit; other nested values are 0–1. Plankton, wake-burst strength and age are separate numeric channels. Nested numeric endpoints interpolate during preview; `null` releases the graphics owner. File import/export and every form edit use the same validator.
