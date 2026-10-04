# Frontend Restoration Acceptance Status Report

Updated: 2026-09-27  
Authority: `frontend-src/migration/cutover-status.ts`

This report supersedes the older status paragraphs that counted 10/15 or 11/15 boundaries, listed `supporting-apps` as open, or described `production-entry` as false.

## Current count

**12/15 boundaries complete.** Three remain `complete: false`.

Completed: `desktop-shell`, `terminal`, `signal-auth`, `browser-popup`, `browser-main`, `signal-messenger`, `mail`, `files`, `idle-qfr`, `css-ownership`, `supporting-apps`, `production-entry`.

Open: `messenger`, `games`, `live2d`.

`production-entry` was flipped in `dd13547` (2026-09-27). It tracks which frontend the deploy pipeline serves, not parity: Cloudflare Workers Builds (`scripts/cloudflare_builds_deploy.py`) now materializes and deploys the verified source-app candidate by default. `public/index.html` is unchanged and remains the historical rollback entry, selected only through `--legacy-frontend` or `NORI_DEPLOY_LEGACY_FRONTEND=1` (see `docs/CLOUDFLARE_BUILDS.md`). `FRONTEND_CUTOVER_READY` stays false until the three open boundaries close, and historical JavaScript is not retired before rollback validation.

Do not close the three open boundaries from source ownership alone.

## What closed in source

These were real divergences from the shipped bundle. They are now in `frontend-src` and covered by unit tests plus the probes named below.

- Datasea messages land as full lines inside the 440×540 window. Typing is the dots window only. Wave transmissions use the same dark bubbles in the shipped 520×42vh masked column. Cosmic, white, and CG lines keep the untyped suffix in a hidden span and fade with `power2.inOut` over 0.9s.
- Memory alert and tint follow the shipped `power2.in` rise, hold, and `power2.out` fall. The scene sends `memory_alert` twice during drain and does not invent a reply.
- Boot and Ending environment channels use the shipped GSAP power eases. Camera smoothstep is unchanged.
- The floating conversation stack lifts to 94px while a chip readout is visible and rests at 12px. Game chat rows enter and leave over 300ms without a motion library.

### Desktop notification and Idle feedback pass (2026-09-27)

A chunk-by-chunk audit found shipped producers that had no source owner. They are now source-owned in `runtime/os-notifications.ts`, `screens/idle-toasts.tsx` and `screens/idle-cue-context.tsx`, and covered by `tests/frontend/frontend-os-notifications.test.ts`:

- The `downloads-*` chunk: download-complete / already-downloaded toasts for the nine shipped download facts, opening Files at the shipped target. Mail, Messenger, Terminal and BrowserPageView call it. The local backend does not return the shipped `emitted` flag, so Messenger and Browser pass whether the fact was already known.
- NormalApp fact toasts: `system.repaired` (RepairController), compute cap bumps (deferred while an exclusive app runs), the four `gesture.*` warnings, `qfr.installed` (toast, two-second Files decrypting state, Files opened at `RSRCH-COLD-VOL`) and the `act3.paradigm_reveal.due` paradigm reveal (silent desktop toast plus the Idle in-screen toast when Idle is visible).
- Mail arrival toasts (focus the mail on click, dismissed when read) and file-decrypted toasts (silenced between Manifold unlock and completion), each baselined per world like the shipped `Nx`.
- Notification `sfx: null` is silent and keyed dismissal no longer plays a cue, as in the shipped store.
- Idle: the "高维范式 已解锁" and "<generator> 上线" in-screen toasts, the ribbon first-purchase pulse, popup outside-click close, and closing the retrain confirmation after commit. All 21 shipped Idle UI cues are wired: core click/crit/lucky, generator buy, buy mode, upgrade buy, memento claim/complete, retrain, alignment/equilibrium commit, skill fire, popup toggle, cap reached, first online, paradigm toast, and the initialization `Js` schedule.

`features/catalog.ts` now assigns every shipped `public/assets` JS/CSS chunk to an owner, and the test fails if a chunk has no owner or a listed module is missing.

Known approximation: the shipped cap-reached cue is also suppressed by three desktop context flags (`Ige`, `ng`, the post-unlock veil). The source suppresses it only before Idle initialization.

## Evidence from this working tree

Passed locally:

- `npm run frontend:typecheck`
- `npm run frontend:stories:test` (44)
- `npm run frontend:recover:check`
- `npm run frontend:cutover:check` (3 pending boundaries since `dd13547`; this note's original run reported 4)
- Recovery surfaces: `cult`, `farewell-ending`, `boot-corruption` (corruption matrix 8/8), `boot-matrix` (8/8), `cold-open`, `memory-datasea` (including the device matrix), `datasea-games` (12/12)
- `node scripts/probes/frontend_visual_comparison.mjs` (44 frames, no pixel verdict)
- `npm run frontend:games:lifecycle` (en-US, zh-CN, reduced motion)
- Desktop browser check: conversation margin settles at 12px, then at 94px after the genie ease; a Codenames chat row takes the `data-phase="from"` enter pose

`frontend:app:smoke` and `frontend:games:smoke` were not re-run for this note. Earlier 2026-09-26 results for those commands stay historical.

## Open gaps

### External blocker

`backend/services/event_dispatcher.py` returns `{type: "noop"}` for `nori_talk.request`. The request can be sent. The reply, voice, and media cannot be accepted against the original agent.

- Messenger: original-agent sessions, full corpus, media sessions.
- Games: Codenames clue/guess dialogue, Chess agent speech, Pictionary snapshot inference, Cake Duel agent media.
- Stories: Corruption `corruption_scare` and Memory `memory_alert` replies. The requests are wired. No reply text is invented.
- Head-pat `pat` replies.
- Debug Inject Talk and Nori Context. The panels report the blocker. The private handlers are not in the local backend.

Datasea dialogue and the Farewell monologue are shipped static text and audio, not `nori_talk` sessions. Their remaining gap is original playback and frame comparison.

### Acceptance still open

- No stable original-client pixel baseline. The 44-frame capture is review material, not a parity verdict. `live2d` stays false.
- Boot and Ending original frame and audio comparison.
- Corruption animation comparison against an original playthrough. The reload matrix in `boot-corruption` passed.
- Memory window copy and visual comparison. The five-window browser probe passed. `memory_alert` replies stay blocked.
- Datasea frame comparison against an original client. The message window, wave column, and typewriter layout are source-owned.
- Farewell and Ending original keyframe, BGM, and desktop-state comparison. The farewell-ending probe passed its behavioral residue matrix.
- Head-pat spark shape and pacing.
- Debug panel layout comparison.

### Intentionally not ported

Corruption `vBehindScale` / `vBehindOffsetZ` stay unwired. The shipped glow consumer is unreachable, so driving those channels would draw a frame the original client never showed.

## Gate policy

`messenger`, `games`, and `live2d` stay false until the external agent sessions and the original visual comparison have evidence. Documenting the noop is not a reason to flip them. `production-entry` already serves the source frontend by default; it does not certify parity, and the legacy rollback entry stays in place until the other three close and rollback validation has passed.
