# Frontend Boundary Completion Checklist
# Date: 2026-09-26
# HEAD: 0a38a16
# Purpose: Systematic verification checklist for non-agent work
#
# Current count is 11/15. supporting-apps is complete.
# messenger, games, live2d, and production-entry stay false.
# See FRONTEND_ACCEPTANCE_STATUS.md. Boxes below are evidence, not gate flips.

## Messenger Boundary

### Source Implementation ✅
- [x] IME-safe composition
- [x] Duplicate-send fencing
- [x] Failed-send draft preservation
- [x] Scroll retention
- [x] Image failure/preview focus
- [x] Bubble/thread styling (source-bound)
- [x] Read/unread metadata
- [x] Shell notification queue
- [x] Signal artifact-delta notifications

### Existing Test Evidence ✅
- [x] Deterministic Chromium tests pass
- [x] Runtime tests pass
- [x] Browser acceptance tests pass

### Remaining Non-Agent Work
- [ ] Messenger close/reopen/reconnect lifecycle
- [x] Conversation stack lift checked in the browser (12px rest, 94px with a chip readout)
- [x] Story visual frames captured (44). No original-client pixel baseline, so this is not a parity verdict
- [ ] Dual locale verification (English/Chinese) for Messenger
- [ ] Connection loss handling

### Blocked by Agent Backend 🔴
- [ ] Original-agent dialogue sessions
- [ ] Full-corpus agent responses
- [ ] Media sessions with agent

---

## Games Boundary

### Source Implementation ✅
- [x] Codenames: 13-step tutorial, flying cards, results
- [x] Chess: 22-ply opening, legal moves
- [x] Pictionary: Pixi renderer, help, results
- [x] Cake Duel: Full runtime/controller

### Existing Test Evidence ✅
- [x] `frontend:games:smoke` passes (verified 2026-09-26)
- [x] Runtime tests pass (chess edge cases, strokes, correlation)
- [x] Browser tests pass (interactions, canvas)

### Remaining Non-Agent Work
- [x] Lifecycle tests (close/reopen/reconnect) — `npm run frontend:games:lifecycle` passed
- [x] Visual frames captured — `frontend_visual_comparison.mjs`, 44 frames, no pixel verdict
- [x] Dual locale verification (en-US and zh-CN) in that lifecycle run
- [x] Reduced motion mode verification in that lifecycle run
- [ ] Input device matrix (mouse/keyboard/touch) beyond the lifecycle play path
- [x] Codenames chat row enter pose checked in the browser

### Blocked by Agent Backend 🔴
- [ ] Codenames: Agent dialogue/voice, clue/guess sessions
- [ ] Chess: Agent speech choreography
- [ ] Pictionary: Live-agent snapshot inference
- [ ] Cake Duel: Agent media sessions

---

## Live2D Boundary

### Source Implementation ✅
- [x] 7 producers registered
- [x] Cult segment: 100% complete
- [x] Boot/Corruption/Memory/Datasea/Farewell/Ending: Structure complete
- [x] Surface smoke tests pass
- [x] Scene editor functional

### Cult Segment
- [x] Browser probe passed (`smoke_frontend_recovery_surfaces.mjs cult`)
- [ ] Original visual/audio parity is not claimed from that probe alone

### Boot Segment: Can Complete (No Agent Dependency)
- [x] Producer registered
- [x] Scene structure
- [x] Environment channels use the shipped GSAP power eases; camera smoothstep kept
- [ ] Frame/audio comparison against an original playthrough
- [x] Re-entry/error matrix (`boot-matrix` 8/8)

### Ending Segment: Can Complete (No Agent Dependency)
- [x] Producer registered
- [x] Scene structure
- [ ] Final-frame/BGM/desktop-state comparison

### Corruption Segment: Partial (Agent Blocked)
- [x] Eleven-phase preview
- [x] Six antivirus microgames
- [x] Debug tab preview
- [ ] Animation comparison against an original playthrough
- [x] Reload matrix (`boot-corruption` reload at the voice gate and after the QTE)
- [ ] Original reply text/voice 🔴 BLOCKED (`corruption_scare` request is sent; backend returns noop)

### Memory Segment: Partial (Agent Blocked)
- [x] Producer registered
- [x] Scene structure
- [x] Browser completion (`memory-datasea` five read gates, flood, completion)
- [x] Alert/tint curves match shipped `DJ`; `memory_alert` is sent twice during drain
- [ ] Window copy/visual comparison
- [ ] Voice corpus 🔴 BLOCKED (no reply is invented)

### Datasea Segment: Partial (static text, not an agent session)
- [x] All 3 waves, 12 games, including the device matrix
- [x] Static text
- [x] Message window, wave column, and typewriter layout match the shipped structure
- [ ] Visual/frame comparison against an original client
- [ ] Agent dialogue is not a Datasea `nori_talk` gap; do not invent lines

### Farewell Segment: Partial (static monologue)
- [x] Producer registered
- [x] Scene structure and verbatim subtitle text
- [x] Behavioral probe passed (ack, cancel, reload, wake gate)
- [ ] Keyframe and playback comparison against an original client
- [ ] The static finale tracks are not blocked by `nori_talk`

---

## Test Execution Plan

### Phase 1: Verification (No App Required) ✅
- [x] Build passes
- [x] Type check passes
- [x] Cutover check passes
- [x] Unit tests pass

### Phase 2: Lifecycle Tests (Requires Running App)
```bash
# Games lifecycle
node scripts/frontend_games_lifecycle_test.mjs

# Should test:
# - Chess: Open → Play → Close → Reopen
# - Codenames: Tutorial → Close → Reopen → Resume
# - Pictionary: Draw → Disconnect → Reconnect → Continue
# - Cake Duel: Challenge → Close → Reopen → State preserved
```

### Phase 3: Visual Baseline Capture (Requires Running App)
```bash
# Visual comparison
node scripts/frontend_visual_comparison.mjs

# Should capture:
# - Messenger: Thread view, compose, bubbles
# - Games: Start screens, gameplay, results
# - Live2D: Key frames for each segment
```

### Phase 4: Debug Layout (Requires Running App)
```bash
# Debug layout
node scripts/frontend_debug_layout_capture.mjs

# Should capture:
# - All Debug tabs
# - Scene editor
# - Corruption preview
```

### Phase 5: Dual Locale Verification (Requires Running App)
```bash
# English (default)
npm run frontend:app:smoke

# Chinese
LANG=zh-CN npm run frontend:app:smoke
```

---

## Completion Criteria

### Messenger
**Required before any gate change:**
- [x] Source implementation complete
- [x] Existing tests pass
- [x] Conversation stack lift checked
- [ ] Messenger close/reopen/reconnect lifecycle
- [ ] Original-client visual comparison
- [ ] Dual locale verified
- [ ] Agent sessions, or an explicit decision to keep the boundary false while noop stands

The boundary stays `complete: false`.

### Games
**Required before any gate change:**
- [x] Source implementation complete
- [x] Existing tests pass
- [x] Lifecycle tests executed (`npm run frontend:games:lifecycle`)
- [x] Visual frames captured (44). No original-client pixel baseline
- [x] Dual locale verified
- [x] Reduced motion verified
- [ ] Agent dialogue, voice, and inference, or an explicit decision to keep the boundary false while noop stands

The boundary stays `complete: false`.

### Live2D: Segment-by-Segment
**Cult:** browser probe passed. That is not a pixel-parity claim.

**Boot & Ending**
- [x] Boot re-entry matrix
- [x] Ending behavioral probe, including desktop residue
- [ ] Original keyframe, BGM, and desktop-state comparison

**Agent-blocked replies:** Corruption `corruption_scare`, Memory `memory_alert`, and head-pat `pat`. Datasea and Farewell static copy are not in that set.

---

## Progress Tracking

### Current Status (2026-09-26, HEAD 0a38a16)
- Typecheck, stories (44), recover check, cutover check: pass. Cutover reports 4 pending boundaries.
- Games lifecycle: pass for en-US, zh-CN, and reduced motion.
- Story surfaces listed in `FRONTEND_ACCEPTANCE_STATUS.md`: pass.
- Visual capture: 44 frames, no pixel verdict.

### Still open
- Original-client frame and audio comparison
- Messenger lifecycle, locale, and connection-loss matrix
- Full input-device matrix for the four games
- Agent replies listed above
- `production-entry`
