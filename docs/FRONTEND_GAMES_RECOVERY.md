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

The Codenames start/results wrappers are an integration scaffold. Pictionary currently uses Canvas2D. Neither is a claim of pixel-identical recovery.

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

The Chromium suite mounts the actual React game screens with a test transport and checks interactions and canvas output. CI publishes desktop/compact screenshots in the frontend-games-smoke artifact. It uses the same temporary shipped stylesheet as the source preview. These are interaction tests and review images, not a golden-image comparison with the original app or a live backend end-to-end test.

## Remaining work before the Games gate can be completed

- Codenames needs original start/results decoration, scripted tutorial gates and epilogue, controller-driven shake/flying-card/reveal ordering, visibility fences paced by those animations, and event-based sudden-death chat.
- Chess needs the full original tutorial presentation, notification and sound routing, result/overlay timing and visual comparison.
- Pictionary needs progressive English/Chinese/pinyin hints, original renderer/animation fidelity, original help/results decoration and sound routing. Check snapshot inference against a live agent.
- Verify closing/reopening games and reconnecting through the real world/media lifecycle. Current tests cover the transport contract with controlled events.
- Verify both locales, original window sizes, input devices and reduced motion in full desktop composition.

## Remaining full frontend boundaries

Games is only part of the final cutover. Shared Messenger/chat/media, Live2D/Nori scene lifecycle, global CSS ownership and production entry remain incomplete. SourceApp still has incomplete facts/auth/bootstrap integration and some app presentations are not bound there. In particular, a recovered module in the source library is not proof that every source-entry user flow is connected.

The authoritative gate remains frontend-src/migration/cutover-status.ts. Keep Games and the other pending boundaries false until their production behavior is restored and verified. This PR does not switch public/index.html or remove historical assets.
