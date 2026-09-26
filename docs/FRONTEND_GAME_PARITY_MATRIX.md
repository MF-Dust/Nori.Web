# Frontend game parity matrix

This matrix records observable contracts recovered from the shipped assets. “Browser” means rendered React plus real pointer/keyboard input in Playwright. “Full app” additionally means the source desktop, WebSocket service and local Python cartridge. Unit and static checks prove data/control contracts only; they are not visual-parity evidence.

## Codenames

| Shipped reference symbol / behavior | Source implementation | Automated evidence | Exact remaining gap |
|---|---|---|---|
| `StartScreen-DLxN1cEa.js::_`; forest, difficulty, help and mission/tutorial routes | `screens/codenames-app.tsx`, `codenames-forest.js`, `codenames-help-overlay.tsx` | `smoke_frontend_games.mjs`: menu, help and start route | English isolated-browser coverage exists. No Chinese full-desktop open → Exit → reopen case or paired shipped/source viewport comparison. |
| `GameScreen-BU9F4fB5.js::os`; `NormalApp-Cn6agT0F.js::gPe`, `j$`, `UIController`; clue/guess gates, confirmation, reveal/flight pacing and overlays | `apps/codenames-{model,board-presentation,clue-presentation,reveal}.ts`, `screens/codenames-{screen,board,flying-card,clue-overlay}.tsx` | `frontend-games.test.ts`: clue validation, UI state, reseed fences; browser smoke: real clue/guess/reveal input | Private counterpart clue selection and dialogue/voice are external. No golden animation timing/pixel comparison across viewport and reduced-motion modes. |
| Shipped tutorial route and 13-step UI sequence | `backend/cartridges/codenames.py`, `apps/codenames-tutorial.ts`, `screens/codenames-tutorial-narrative.tsx` | `test_codenames_tutorial_script`; unit tutorial gates in English/Chinese; browser smoke completes all 13 views | State progression is deterministic and playable. Narrative text is locally authored explanatory copy, not a recovered private-agent transcript; original agent wording/voice remains unavailable. |
| Sudden-death layouts and Debug ids `sudden_death_both`, `sudden_death_counterpart_only`, `sudden_death_agent_only` | cartridge `debugLoadScenario`; `codenamesUiState`; source-app Debug dispatch | `test_codenames_debug_scenarios`; browser smoke checks all three board variants | Local scenarios reproduce public game state, not private agent commentary for entering sudden death. |
| `ResultsScreen-en9PN8_z.js::te`; delayed win/loss result and menu/rematch | `screens/codenames-results.tsx`, result timers in `codenames-app.tsx` | browser smoke reaches result and exercises result action | No full-desktop close/reopen regression in either locale; shipped/source result-motion comparison remains open. |

## Chess

| Shipped reference symbol / behavior | Source implementation | Automated evidence | Exact remaining gap |
|---|---|---|---|
| `ChessScreen-D3ynrc3S.js::i4`; legal moves, promotion, requests, history and result overlays | `apps/chess-{model,presentation,feedback}.ts`, `screens/chess-{screen,board,piece}.tsx` | unit legality/history/feedback cases; browser smoke covers promotion, draw/takeback, result and Play Again | No paired shipped/source visual comparison for board overlays, result timing or compact layout. |
| Shipped guided-opening contract | `shared/chess-tutorial.json`, `backend/cartridges/chess.py`, `screens/chess-tutorial.tsx` | `test_chess_tutorial` completes all 22 plies; isolated browser completes Chinese tutorial; `frontend_chess_tutorial_probe.mjs` completes English tutorial through the full desktop/local backend | Tutorial notes are locally authored teaching text, not original-agent dialogue. Original speech choreography/voice remains private. |
| `Debug-D6AtxpLT.js::ss[]`; exact FEN, `startPly`, scripted continuation and move duration | `CHESS_DEBUG_SCENARIOS`, cartridge `debugLoadScenario`, source-app Debug dispatch | `test_chess_debug_scenarios` validates all **33** shipped ids and deterministic next-agent command | Debug UI/browser probe is owned by the Debug suite. Scenario state is exact public fixture data; private reaction generation is not claimed. |
| Desktop lifecycle and restart | source dock/window binding plus `ChessScreen` controller retain/release | `frontend_chess_tutorial_probe.mjs`: open, play, resign, Play Again, Exit, reopen clean position | English full-desktop lifecycle is covered. Chinese full-desktop Exit/reopen is not; Chinese coverage currently uses the isolated browser harness. |

## Pictionary

| Shipped reference symbol / behavior | Source implementation | Automated evidence | Exact remaining gap |
|---|---|---|---|
| `StartScreen-DVcRTtZt.js::Q`; sketchbook cover, duration cards and help | `screens/pictionary-cover.tsx`, `pictionary-help-overlay.tsx` | browser smoke opens/closes cover and help and selects a session | No full-desktop open → Exit → reopen case; Chinese cover/help is rendered by source but not exercised as a full desktop session. |
| `GameScreen-CgEXO_XJ.js::xs`; Pixi drawing, normalized stroke protocol, snapshot requests and progressive hints | `apps/pictionary-{model,runtime,hints}.ts`, `screens/pictionary-{screen,canvas,renderer,use-hints}.tsx` | unit stroke/queue/controller/visibility cases; browser smoke draws through real pointer input and verifies snapshots plus English/Chinese hint states | Local backend cannot reproduce private live-agent drawing interpretation or snapshot inference. Chinese hint evidence alone is not a bilingual lifecycle acceptance test. |
| Shipped expression/reaction choreography and sound cues | `apps/pictionary-reactions.ts`, `use-pictionary-sounds.ts` | unit expression mapping; browser smoke observes reaction/sound/disconnect behavior | Exact original Live2D expression parameters and private voice timing are external; source validates semantic reaction cues only. |
| `ResultsScreen-DIJnNx5D.js::me`; accuracy/round summary and another-round transition | `screens/pictionary-results.tsx`, session-clock model | unit session summary/clock; browser smoke reaches results and restarts | No shipped/source paired result animation capture or full-desktop reopen regression. |

## Four-game locale and lifecycle audit

| Game | English open/close/reopen | Chinese open/close/reopen | Decision |
|---|---|---|---|
| Chess | `npm run frontend:games:lifecycle` opens, plays, closes, reopens and reconnects on the source desktop. | Same lifecycle in zh-CN. | Agent speech remains external. |
| Codenames | Same lifecycle, including a submitted clue. | Same lifecycle in zh-CN. | Agent clue/guess dialogue remains external. |
| Pictionary | Same lifecycle, including a stroke. | Same lifecycle in zh-CN. | Live snapshot inference remains external. |
| Cake Duel | Same lifecycle, and `retain()` unmounts the cartridge on close. | Same lifecycle in zh-CN. | Agent media sessions remain external. |

The local cartridges prove playable deterministic behavior. They do not stand in for private agent models: Codenames dialogue/voice, Chess speech, and Pictionary image inference remain external acceptance boundaries.
