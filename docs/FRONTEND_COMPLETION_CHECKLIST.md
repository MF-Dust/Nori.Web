# Frontend Boundary Completion Checklist
# Date: 2026-09-26
# Purpose: Systematic verification checklist for non-agent work

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
- [ ] Lifecycle tests (close/reopen/reconnect)
- [ ] Visual baseline capture
- [ ] Dual locale verification (English/Chinese)
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
- [ ] Lifecycle tests (close/reopen/reconnect) - Tool ready: `frontend_games_lifecycle_test.mjs`
- [ ] Visual baseline capture - Tool ready: `frontend_visual_comparison.mjs`
- [ ] Dual locale verification (English/Chinese)
- [ ] Reduced motion mode verification
- [ ] Input device matrix (mouse/keyboard/touch)

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

### Cult Segment: Complete ✅
- [x] Full visual/audio/interaction parity
- [x] Browser smoke tests
- [x] Independent probe verified

### Boot Segment: Can Complete (No Agent Dependency)
- [x] Producer registered
- [x] Scene structure
- [ ] Frame/audio comparison
- [ ] Re-entry/error matrix

### Ending Segment: Can Complete (No Agent Dependency)
- [x] Producer registered
- [x] Scene structure
- [ ] Final-frame/BGM/desktop-state comparison

### Corruption Segment: Partial (Agent Blocked)
- [x] Eleven-phase preview
- [x] Six antivirus microgames
- [x] Debug tab preview
- [ ] Animation comparison
- [ ] Reload matrix
- [ ] Original reply text/voice 🔴 BLOCKED

### Memory Segment: Partial (Agent Blocked)
- [x] Producer registered
- [x] Scene structure
- [ ] Browser completion
- [ ] Window copy/visual
- [ ] Voice corpus 🔴 BLOCKED

### Datasea Segment: Partial (Agent Blocked)
- [x] All 3 waves, 12 games
- [x] Static text (197 lines)
- [ ] Visual/frame comparison
- [ ] Compositor parity
- [ ] Agent dialogue 🔴 BLOCKED

### Farewell Segment: Partial (Agent Blocked)
- [x] Producer registered
- [x] Scene structure
- [ ] Keyframe comparison
- [ ] Line copy/voice 🔴 BLOCKED

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

### Messenger: Can Mark "UI Complete, Agent Pending"
**Required:**
- [x] Source implementation complete
- [x] Existing tests pass
- [ ] Lifecycle tests executed
- [ ] Visual baseline captured
- [ ] Dual locale verified

**Then update to:**
```typescript
{ 
  id: "messenger", 
  complete: false,
  note: "UI/lifecycle/styling complete and verified. Remaining: agent dialogue, media sessions, full corpus."
}
```

### Games: Can Mark "Gameplay Complete, Agent Pending"
**Required:**
- [x] Source implementation complete
- [x] Existing tests pass
- [ ] Lifecycle tests executed
- [ ] Visual baseline captured
- [ ] Dual locale verified
- [ ] Reduced motion verified

**Then update to:**
```typescript
{ 
  id: "games", 
  complete: false,
  note: "All 4 game runtimes complete and lifecycle-verified. Remaining: agent dialogue/voice/inference."
}
```

### Live2D: Segment-by-Segment
**Cult: Already complete ✅**

**Boot & Ending: Can complete independently**
- [ ] Keyframe capture
- [ ] Animation timing
- [ ] Error paths

**Other 4: Agent-blocked**
- Remain incomplete until agent backend available

---

## Progress Tracking

### Current Status (2026-09-26)
- Build/Type/Cutover: ✅ All pass
- Unit tests: ✅ Pass
- Games smoke: ✅ Pass

### Awaiting App Startup
- Lifecycle tests
- Visual baselines
- Debug layout
- Dual locale

### Blocked by Agent Backend
- Messenger: Agent sessions
- Games: Agent dialogue
- Live2D: 4 segment voices
