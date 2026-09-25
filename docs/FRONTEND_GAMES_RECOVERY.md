# Remaining game recovery

At HEAD `085bad3`, all four games have source-owned screens and runtime bindings. Codenames has a deterministic 13-step tutorial and results surface; Pictionary has source-owned help/results surfaces; Chess has the complete 22-ply tutorial; Cake Duel has a source runtime/controller and start/game/results binding. These are source/runtime coverage, not original parity. The remaining Games work is full lifecycle, visual comparison and original-agent/media acceptance. The five false gates remain `messenger`, `games`, `live2d`, `supporting-apps` and `production-entry`; this ledger does not change them. These source modules do not import historical JavaScript chunks.

## Recovered in this PR

| Area | Source behavior | Evidence |
| --- | --- | --- |
| Shared cartridge lifecycle | Retain/release, mount, request-ID acknowledgements, 15-second failure timeout, visibility advancement, disposal; commands are not replayed automatically | Arcade protocol, GameService and WorldStore |
| Chess | Board and original SVG pieces; legal click/drag moves; castling, en passant and promotion; history replay, captures, side/difficulty selection, tutorial move restrictions, draw/takeback responses, resign and result review | ChessScreen-D3ynrc3S.js; backend/cartridges/chess.py; chess.js 1.4.0 |
| Pictionary | 2/3/5-minute setup, round role routing, normalized 128-point strokes, pencil palette, eraser, undo/clear, resized PNG snapshots, sample playback and redraw, guesses, five-second intermission, source-owned help/results surfaces and session results | StartScreen-DVcRTtZt.js; GameScreen-CgEXO_XJ.js; moleskineComponents-DxZW-ZrL.js; drawings.json; backend/cartridges/pictionary.py |
| Drawing transport | Bounded stroke queue, round/epoch fencing, revision events, snapshot request correlation, pending-request serialization | Shipped pictionary.revision / pictionary.snapshot.request / pictionary.snapshot channels |
| Codenames | Deterministic 13-step tutorial/gates, board/header/chat/key/help presentation bound to cartridge state; start/reset/rematch, clue validation, selected cards, tap-to-confirm, end-turn eligibility, durable turn transcript, sudden-death scenarios, timed turn/outcome overlays and expanded results | NormalApp gPe, j$, UIController; GameScreen-BU9F4fB5.js; backend/cartridges/codenames.py |
| Cake Duel | Source runtime/controller with connection and request fencing, start/game/results routes, challenge/Wolfy timing, claim/reaction events and replay/reset handling | Source runtime, presentation binding and lifecycle tests; full desktop lifecycle/visual/agent parity remains open |
| Base locale | Shipped English and Simplified Chinese base tables, fallback/interpolation/plural selection; source app respects stored language | i18n-DtIC1LRi.js Gu / Id |

The Codenames start/results and Pictionary help/results surfaces are source-owned, but their remaining decoration and scene behavior are not claimed to be pixel-identical. Pictionary now uses Pixi.js 8.17.1 for the drawing surface.

## Hint, reveal and audio completion pass

- Pictionary now restores progressive English letters and Chinese pinyin initials, difficulty-based initial delays, cubic acceleration and repeated-letter grouping. The timer is scoped to round identity, role, locale and active state. Chinese syllables accept null initials; missing pinyin remains masked instead of leaking the answer.
- The shared mixer exposes caller-owned cancellable loops. Pen scratching stops after 180 ms without movement, on pointer release, round change, disconnect/unmount and before a late audio decode can start. Tool, wrong-guess, correct-answer, skip, low-time and intermission cues use the existing SFX bus.
- Codenames now queues replicated states behind the two-second suspense animation and 500 ms card flight. The controller advances each corresponding visibility version only after presentation; later acknowledgements do not expose a still-hidden head. World replacement, disconnect, cartridge reseed and release abort pending work.
- Reveals cover agent, assassin and both bystander slots. Landing completion has a 700 ms fallback when browser animation callbacks cannot fire. Reduced motion skips visual transforms while preserving the transition contract.
- Tutorial gates support the shipped highlighted cells, wait turns, free-clue and free-guess lessons. Card selection updates the clue count, tap-to-confirm and clue/overlay sounds are connected, and the clue highlight lasts three seconds. Ordinary results wait 1.5 seconds for a win or five seconds for a loss; tutorial epilogues reset after six seconds with a bounded three-second retry cadence on failure.
- Restored the omitted Codenames card stylesheet, palette, hover/selection, glow and suspense animation. Fixed 177 theme-token declaration boundaries that previously prevented semantic Tailwind colors from compiling. Browser checks now assert the computed card face and semantic background rather than just the presence of class names.

## Verification

Run:

```sh
npm ci
npm run frontend:typecheck
npm run frontend:build
npm run frontend:app:build
npm run frontend:cutover:check
npm run frontend:recover:check
npx playwright install chromium
npm run frontend:games:smoke
```

The behavioral suite executes the actual schemas/models/controller against a simulated Arcade transport. It checks legal chess edge cases, history, clocks, stroke payload limits, request correlation, unmount cleanup, stale round work and locale/clue logic.

The Chromium suite mounts the actual React game screens with a test transport and checks interactions and canvas output. CI publishes desktop/compact screenshots in the frontend-games-smoke artifact. It now uses the generated source application stylesheet, after the CSS ownership recovery documented in FRONTEND_CSS_RECOVERY.md. These are interaction tests and review images, not a golden-image comparison with the original app or a live backend end-to-end test.

## Remaining work before the Games gate can be completed

- Codenames' deterministic tutorial and results are source-owned. Remaining work is the original scripted-agent dialogue/voice, sudden-death event chat, start/results visual comparison and full lifecycle acceptance. The local backend currently starts tutorial mode at `free_play`; the frontend gates also support scripted states from a compatible backend, but that is not original-agent evidence.
- Chess' 22-ply guided opening is source-owned and interaction-tested. Remaining work is result/overlay timing, original-agent speech choreography, visual comparison and full lifecycle acceptance.
- Pictionary help/results are source-owned. Remaining work is original animation/decoration and model-expression choreography, full lifecycle acceptance and live-agent snapshot inference; progressive hints and SFX are connected.
- Cake Duel's source runtime/controller and start/game/results binding are present. Remaining work is full desktop lifecycle, visual comparison and original-agent/media acceptance, including challenge/Wolfy/resource and close/reopen evidence.
- Verify closing/reopening games and reconnecting through the real world/media lifecycle. Current tests cover the transport contract with controlled events.
- Verify both locales, original window sizes, input devices and reduced motion in full desktop composition.

## Remaining full frontend boundaries

Games is only part of the final cutover. The remaining boundaries are Messenger story/corruption/reveal choreography, full game lifecycle/fidelity and live-agent/media verification, the six non-Cult story segments' original Live2D parity, Debug original layout/private handlers, scene audio and production entry. Auth/bootstrap, source CSS ownership, shared audio, Preview, chips and Daniel integration have separate completed recovery records. A recovered module alone does not establish whole-app parity.

The authoritative gate remains frontend-src/migration/cutover-status.ts. Keep Games and the other pending boundaries false until their production behavior is restored and verified. This PR does not switch public/index.html or remove historical assets.


## Original card art and Chess transition feedback

Codenames board reveals, flying cards and the help sheet now share the recovered original treasure, monster and berry SVG artwork. The start menu includes the original layered forest backdrop. The assets live under `frontend-src/screens/` and do not import historical JavaScript. The deterministic tutorial is source-owned; remaining original start/results decoration and tutorial-agent narrative are still tracked above.

Chess now routes transition-only move, check, capture, castle and promotion cues. Checkmate delays the end cue by 200 ms. Draw/takeback responses show the original three-second notices and response cue; cancelling one's own request does not look like an opponent refusal. Presentation epochs and reconnect resets suppress historical feedback and clear delayed effects. Unit coverage includes checkmate timing, acknowledgement transitions, cancelled requests and world/reconnect fences. The browser game suite still covers all three playable screens, including the new Codenames SVGs in the existing reveal/flight path.


## Pixi drawing surface

`pictionary-renderer.ts` replaces the Canvas2D stroke renderer with Pixi.js 8.17.1, matching the shipped engine version. Source-owned Graphics paths use round joins/caps, the existing normalized strokes, pen/eraser widths and replay timing. Rendering is explicit, and the renderer is loaded only when a drawing surface mounts. PNG snapshots force a current render and export the displayed pixels through a small Canvas2D copy.

Each effect lifetime owns a fresh canvas and renderer. Input waits for initialization; a cancelled import never creates a renderer, and an initialization that finishes after unmount is disposed. Resizing redraws the stored strokes, and unmount releases the scene and renderer. Existing browser tests now require a ready Pixi canvas before drawing and still verify normalized transport, distinct drawn/undone snapshots, eraser width and round-change cancellation. `pictionary-pixi-strokes.png` shows a stroke before undo.

This closes the Canvas2D substitute in the drawing path. Original help/results decoration, expression choreography and live-agent snapshot inference remain pending.


## Chess guided opening: completed interaction gap

The tutorial now runs all 22 plies through the source desktop, Arcade transport and local Python opponent before handing off to `free_play`. The backend previously started directly at that handoff. Player and agent moves now follow the shared protocol sequence, each accepted move advances the replicated step and emits `tutorial_step`, and game actions unlock after the final black move. Unsupported steps and off-script moves cannot silently enter free play. Python embeds the sequence for Worker import safety; a reducer test checks it against `shared/chess-tutorial.json` used by the frontend.

The source screen provides authored English/Chinese teaching notes, move coordinates, progress, opponent-wait and free-play instructions. These notes are a local educational presentation, not a transcript of original agent dialogue. The board highlights only the taught source/target, filters legal-move markers to that target, accepts click/drag, and uses a mint pulse with a reduced-motion alternative. History review hides current-move highlights and offers a return-to-live action. Disconnect cancels a held drag and blocks moves until reconnection. Unknown tutorial steps stay locked with a visible explanation.

Compact rails keep their heading accessible when content overflows. Full-desktop testing also found the ordinary window-position effect overwriting the exclusive game's inset layout, placing Exit underneath the topbar. The effect now leaves exclusive geometry to WindowChrome, so the tutorial can be exited and reopened with actual pointer input.

Verification added in this pass:

- Reducer checks execute the full opening, reject wrong moves/actors and restricted actions without state/version changes, verify check blocking and both castles, then exercise free play and restart. The sequence parity check runs in CI with the cartridge suite.
- The React browser suite visits every player/wait step and the handoff. It checks Chinese instructions, ordinary free moves, restricted targets, history review, interrupted drag, reconnection, unknown steps and compact/reduced-motion behavior.
- The full application smoke plays all 22 plies against the real local backend, continues with a free move and opponent reply, restarts a tutorial, and checks that exit/unmount followed by reopen yields a clean setup. It does not replace the local opponent with the original private agent.

Review images are `chess-tutorial-zh.png`, `chess-tutorial-compact.png`, `chess-tutorial-free-play.png` in the games artifact and `chess-tutorial-local-backend.png` in the application artifact. This closes the guided-opening interaction gap; the Games production gate remains false for the separately listed work.


## Results presentation pass

Codenames now has a full result surface over the forest background, original treasure/monster art, reason-aware victory/defeat text, treasure totals, spent rounds and turn count. Existing 1.5-second win / five-second loss presentation gates and rematch/reset transport remain intact.

Pictionary now presents a session sheet with a tape motif, solved/attempted score, duration, accuracy, fastest and mean solve times. The history journal identifies the drawing role and differentiates solved, skipped and unfinished entries. Empty history and restart are supported. Short-window CSS and reduced-motion fallbacks cover both result surfaces.

Browser tests exercise both Codenames outcomes and actions, and mixed Pictionary outcomes/statistics/restart. The new layout is source-owned; remaining animation, typography and original-agent comparison are tracked in [FRONTEND_REMAINING_WORK.md](FRONTEND_REMAINING_WORK.md).
