# Farewell and Ending recovery evidence

This reconstruction is based on the repository's shipped `public/assets/NormalApp-Cn6agT0F.js`
and shipped media. The historical bundle was inspected as text only; it is not imported or
executed by the recovered source.

## Farewell

The shipped definition identifies a 4.4 second entrance, voice playback beginning at 8.4
seconds, 21 timed clips from `public/audio/arg-finale/`, a background track beginning at 18
seconds, a hard cut to black at 117.41 seconds, and a five second black hold. It also identifies
the expression family used by the sequence. `farewell-timeline.ts` preserves those media IDs,
durations, gaps, expression categories, and cut boundary. It intentionally does not duplicate
the historical dialogue in source or invent replacement dialogue.

`FarewellScene` owns a scene lease, monotonic clock and scene audio handles. Its dedicated
WebGL2 compositor samples the maintained Live2D canvas and restores the evidenced white void,
contact shadow, bleaching, upper rim light, presence fade and hard black cut. Visibility pauses
the timeline. A story-instance fence stops late animation/audio work after replacement. The
scene projects speaking expression categories into the maintained model state and exposes a
non-dialogue transmission indicator. At completion it requests the sentinel once and reloads
only from the director's acknowledgement callback. Failed acknowledgement remains under the
director's existing retry policy and does not reload early.

## Ending

The shipped Ending definition provides the phase order `void`, `rise`, `push`, `hold`, `draw`,
`morph`, `blobHold`, `reveal`, `approach`, gated `ready`, and `settle`. It also provides the
2.4 second void hold, 12 second ascent, 3.2 second push and the three shipped cold-open audio
cues. `ending-timeline.ts` retains this phase order and projects ascent, plankton, glyph draw,
morph, reveal and wake burst values through the existing `NoriSceneStore` cold-open channel.
The existing renderer remains the owner of ocean, glyph and wake GPU resources.

`EndingScene` cannot pass the zero-duration ready phase until the explicit WAKE action. It
pauses both clock and audio while the document is hidden, owns and releases its scene layer,
and only submits completion after settle. Story replacement invalidates callbacks and releases
media/state.

## Known limits

- Farewell uses a dedicated `/Nori_web/Nori.model3.json` actor because the desktop
  `/ARGNori_web/` model does not contain the Finale expressions. The recovered actor applies
  each shipped `Finale_*` expression and corresponding Idle motion index at its cue boundary;
  the shared desktop actor is suppressed for the scene.
- The Farewell compositor uses the shipped 24×48 periodic alpha-bound sampling, smoothing,
  model rectangle, stance-based contact shadow and multi-tap upper rim calculation. It still
  needs frame-by-frame comparison against an original-client capture.
- Ending uses the shipped default phase durations and recovered ascent/arrival/formed/face/rest
  camera presets, smooth transitions, look-at rotations, FOV and far-plane progression.
- Ending observes the maintained renderer's fallback/error status and releases the scene before
  offering Retry, which forces cold-open resources to be recreated.
- Local `nori_talk.request` returns `noop`; this does not affect these shipped static voice
  tracks, but it remains a blocker for broader original-agent parity.

## Validation

`tests/farewell-ending.test.ts` covers the recovered cue/cut boundaries, the non-skippable
wake gate and the wake projection. `scripts/frontend_farewell_ending_probe.mjs` mounts the
production Finale actor, WebGL compositor, Ending scene and cold-open renderer. It asserts
acknowledgement-before-reload, replacement cleanup, resource failure/retry, and the wake gate,
and captures two local evidence frames. The browser probe was authored on 2026-09-18 but could
not be executed in the current workspace because the Playwright Chromium executable was not
present; typecheck, production build and the focused Node tests passed. Browser evidence must
remain pending until that executable is supplied.

## Cold-open readiness is visibility-scoped

Ending's 30 s cold-open readiness budget now comes from
`frontend-src/story/story-readiness.ts` instead of a local `readyDeadline` variable, so
Ending and Boot cannot drift apart again. Behaviour is unchanged: the budget restarts on
`visibilitychange` and never extends while the tab is hidden. Covered by
`tests/frontend-story-clock.test.ts`.

## Browser evidence status

The browser probe now runs in this workspace. On 2026-09-26 `scripts/smoke_frontend_recovery_surfaces.mjs
farewell-ending` passed end to end — "Farewell/Ending probe passed: Finale actor/WebGL,
ack ordering, cancellation, resource retry and wake gate" — superseding the pending
note above. The original-line copy and voice comparison against the shipped run remains
open; `nori_talk.request` is still a local no-op.
