# Remaining game recovery

This change makes Chess, Pictionary and the existing Codenames presentation reachable from the source application. Cake Duel retains its existing controller. These source modules do not import historical JavaScript chunks.

## Recovered in this PR

| Area | Source behavior | Evidence |
| --- | --- | --- |
| Shared cartridge lifecycle | Retain/release, mount, request-ID acknowledgements, 15-second failure timeout, visibility advancement, disposal; commands are not replayed automatically | Arcade protocol, GameService and WorldStore |
| Chess | Board and original SVG pieces; legal click/drag moves; castling, en passant and promotion; history replay, captures, side/difficulty selection, tutorial move restrictions, draw/takeback responses, resign and result review | ChessScreen-D3ynrc3S.js; backend/cartridges/chess.py; chess.js 1.4.0 |
| Pictionary | 2/3/5-minute setup, round role routing, normalized 128-point strokes, pencil palette, eraser, undo/clear, resized PNG snapshots, sample playback and redraw, guesses, five-second intermission, session results | StartScreen-DVcRTtZt.js; GameScreen-CgEXO_XJ.js; moleskineComponents-DxZW-ZrL.js; drawings.json; backend/cartridges/pictionary.py |
| Drawing transport | Bounded stroke queue, round/epoch fencing, revision events, snapshot request correlation, pending-request serialization | Shipped pictionary.revision / pictionary.snapshot.request / pictionary.snapshot channels |
| Codenames | Existing board/header/chat/key/help presentation bound to cartridge state; start/reset/rematch, clue validation, selected cards, tap-to-confirm, end-turn eligibility, durable turn transcript, timed turn/outcome overlays | NormalApp gPe, j$, UIController; GameScreen-BU9F4fB5.js; backend/cartridges/codenames.py |
| Base locale | Shipped English and Simplified Chinese base tables, fallback/interpolation/plural selection; source app respects stored language | i18n-DtIC1LRi.js Gu / Id |

The Codenames start/results wrappers retain simplified decoration. Pictionary currently uses Canvas2D. Neither is a claim of pixel-identical recovery.

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

- Codenames still needs original start/results decoration, full card illustrations, narrative/tutorial dialogue and event-based sudden-death chat. The local backend currently starts tutorial mode at `free_play`; the frontend gates also support scripted states from a compatible backend. Validate the full scripted tutorial with its agent.
- Chess needs the full original tutorial presentation, notification and sound routing, result/overlay timing and visual comparison.
- Pictionary still needs original renderer/animation fidelity, original help/results decoration and scene-expression choreography. Progressive hints and SFX are connected. Check snapshot inference against a live agent.
- Verify closing/reopening games and reconnecting through the real world/media lifecycle. Current tests cover the transport contract with controlled events.
- Verify both locales, original window sizes, input devices and reduced motion in full desktop composition.

## Remaining full frontend boundaries

Games is only part of the final cutover. The remaining boundaries are Messenger story/corruption/reveal choreography, game fidelity and live-agent verification, the outer Live2D 3D scene/story runtime, Debug and remaining scene audio, and production entry. Auth/bootstrap, source CSS ownership, shared audio, Preview, chips and Daniel integration have separate completed recovery records. A recovered module alone does not establish whole-app parity.

The authoritative gate remains frontend-src/migration/cutover-status.ts. Keep Games and the other pending boundaries false until their production behavior is restored and verified. This PR does not switch public/index.html or remove historical assets.
