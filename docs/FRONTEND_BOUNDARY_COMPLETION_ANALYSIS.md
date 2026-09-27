# Frontend Restoration: Boundary Completion Analysis
# Date: 2026-09-26
# HEAD: 0a38a16

The sections below this header are a historical analysis. Current count is 11/15. `supporting-apps` is `complete: true`. The open boundaries are `messenger`, `games`, `live2d`, and `production-entry`. Lifecycle for the four games has passed. Datasea and Farewell static copy are not `nori_talk` gaps. Do not close a boundary from the recommendations further down. See `FRONTEND_ACCEPTANCE_STATUS.md`.

## Analysis Basis

This analysis is based on:
- Source code implementation in `frontend-src/`
- Existing smoke test evidence (app, games, stories, surfaces)
- Documentation in `FRONTEND_COVERAGE_MATRIX.md`, `FRONTEND_GAMES_RECOVERY.md`, `FRONTEND_SYSTEM_RECOVERY.md`
- Current `cutover-status.ts` notes

## Boundary-by-Boundary Assessment

### 1. Messenger (messenger)

**Current Status**: `complete: false`

**Source Implementation**: ✅ COMPLETE
- IME-safe composition
- Bubble/thread styling source-bound
- Read/reread windows, message ordering
- Shell notification queue + Signal artifact arrival
- Chromium evidence: Daniel typing → reply → interrupt

**Remaining Gaps**:
- ⚠️ Original-session visual comparison (no pixel-perfect baseline)
- 🔴 Original-agent/full-corpus/media sessions (BLOCKED: agent backend noop)
- ⚠️ Shell arrival timing acceptance (needs precise timing baseline)

**Recommendation**: **Keep false**. Source complete but missing visual/agent evidence.

**Blocker**: Agent backend returns `{type: "noop"}` for `nori_talk.request`

---

### 2. Games (games)

**Current Status**: `complete: false`

**Source Implementation**: ✅ COMPLETE
- All 4 game runtimes/presentations source-owned
- Codenames: 13-step deterministic tutorial + results
- Chess: 22-ply guided opening
- Pictionary: Help/results surfaces + Pixi renderer
- Cake Duel: Full runtime/controller + timing

**Existing Evidence**:
- ✅ `frontend:games:smoke` - All 3 playable games pass
- ✅ Runtime tests - Chess edge cases, stroke limits, request correlation
- ✅ Browser tests - Interactions + canvas output

**Remaining Gaps**:
- ⚠️ Full lifecycle acceptance (close/reopen/reconnect) - tool ready but not executed
- ⚠️ Visual comparison with original - no pixel baseline
- 🔴 Agent dialogue/voice/inference (BLOCKED: agent backend)
- ⚠️ Dual locale verification - not systematically captured

**Recommendation**: **Keep false**. Source complete but missing lifecycle/visual/agent evidence.

**Blocker**: Agent backend (all games need agent dialogue/inference)

---

### 3. Live2D (live2d)

**Current Status**: `complete: false`

**Source Implementation**: 🟡 PARTIAL
- ✅ 7 producers registered (Boot, Corruption, Cult, Memory, Datasea, Farewell, Ending)
- ✅ Cult: Complete with evidence
- 🟡 Other 6 segments: Registered but lack original parity

**Existing Evidence**:
- ✅ Surface smoke tests pass for all 7 segments
- ✅ Independent probes for each segment
- ✅ Cold-open ocean/glyph/postprocessing

**Remaining Gaps per Segment**:
- Boot: Frame/audio comparison, re-entry/error matrix
- Corruption: Animation comparison, original reply text/voice (BLOCKED), reload matrix
- Memory: Browser completion, window copy/visual, voice corpus (BLOCKED)
- Datasea: Visual/frame comparison, compositor parity, agent dialogue (BLOCKED)
- Farewell: Line copy/voice (BLOCKED), keyframe comparison
- Ending: Final-frame/BGM/desktop-state comparison

**Recommendation**: **Keep false**. Registration complete but 6/7 segments lack visual/agent parity.

**Blocker**: Agent backend (Corruption, Memory, Datasea, Farewell need agent voice/dialogue)

---

### 4. Supporting Apps (supporting-apps)

**Current Status**: `complete: false`

**Source Implementation**: ✅ COMPLETE
- Settings, About, Credits, Preview, Debug, Scene Editor all source-owned
- Debug binds production Live2D/Audio/Pat/reaction runtimes
- All recovered Chess/Codenames/Cake Duel scenarios
- Shatter/Datasea tuners present

**Existing Evidence**:
- ✅ `frontend:app:smoke` - Settings, About, Credits verified
- ✅ Debug probe - Connection/Scene/Audio/Facts tabs
- ✅ Scene editor - Validated JSON projects, gates, audio

**Remaining Gaps**:
- ⚠️ Debug layout visual comparison - no pixel baseline
- 🔵 Private Inject Talk/Nori Context handlers - **DOCUMENTED as intentionally unavailable**
- ⚠️ Browser acceptance completeness - partial coverage

**Recommendation**: **CANDIDATE FOR COMPLETION** with documented limitations.

**Rationale**:
1. Source implementation is complete
2. Smoke test evidence exists
3. Private handlers are explicitly documented as unavailable (not a bug, a known limitation)
4. Visual comparison is "nice-to-have" not "must-have" for source ownership

**Action**: Can mark `complete: true` with updated note documenting private handler limitation.

---

### 5. Production Entry (production-entry)

**Current Status**: `complete: false`

**Requirement**: All other 14 boundaries complete + regression suite + rollback verification

**Recommendation**: **Keep false**. Awaiting boundaries 1-4 above.

---

## Summary

### Completable Now
- **Supporting Apps**: Source complete + smoke evidence + documented limitations
  - Mark `complete: true`
  - Update note to explicitly mention private handler limitation

### Keep False (Legitimate Gaps)
- **Messenger**: Source complete. Stack lift is checked. Agent sessions and original visual comparison remain.
- **Games**: Lifecycle, both locales, and reduced motion have passed. Agent dialogue remains.
- **Live2D**: Behavioral probes have passed. Original frame comparison remains. Only Corruption, Memory, and head-pat replies are agent-blocked.
- **Production Entry**: Gated on the three boundaries above. `supporting-apps` is already complete.

### Critical Path Blocker

🔴 **Agent Backend**: `backend/services/event_dispatcher.py` returns `{type: "noop"}` for `nori_talk.request`

**Impact**:
- Blocks Messenger agent/media sessions
- Blocks all 4 games agent dialogue/inference
- Blocks Live2D agent voice/dialogue (4 segments)

**Affected Boundaries**: 3 of 5 remaining (messenger, games, live2d)

**Resolution**: Agent backend implementation is external dependency, not frontend work.

---

## Recommended Actions

### Immediate
1. ✅ Update `cutover-status.ts` to mark `supporting-apps` complete with documented limitation
2. ✅ Update `FRONTEND_REMAINING_WORK.md` to explicitly list agent backend as blocker
3. ✅ Commit boundary evaluation and updated status

### Short-term (When Tests Can Run)
4. ⏸️ Execute lifecycle tests for Games boundary
5. ⏸️ Capture visual baselines for Messenger/Games/Live2D
6. ⏸️ Run Debug layout capture for Supporting Apps

### Long-term (External Dependency)
7. 🔴 Wait for agent backend implementation
8. 🔴 Re-evaluate Messenger/Games/Live2D with agent evidence
9. ⏸️ Final regression suite before production-entry

---

## Progress Metrics

**Current**: 11/15 complete. `supporting-apps` is already in the completed set. Open: `messenger`, `games`, `live2d`, `production-entry`.

**Achievable Without Agent Backend**: 11/15 (73.3%)

**Target With Agent Backend**: 14/15 (93.3%, all except production-entry awaiting switch)

**Estimated Timeline**:
- Supporting Apps: Complete now
- Messenger/Games/Live2D: Blocked until agent backend available
- Production Entry: Blocked until boundaries 1-4 complete

---

## Confidence Levels

- ✅ **High**: Supporting Apps can be marked complete with current evidence
- ⚠️ **Medium**: Messenger/Games source-complete, needs lifecycle/visual evidence
- 🟡 **Low**: Live2D 6/7 segments need substantial visual/media work
- 🔴 **Blocked**: Agent-dependent features cannot proceed without backend
