import assert from "node:assert/strict";
import test from "node:test";
import {
  AntivirusSession,
  PROCESS_ROWS,
  TUNE_LIMITS,
  ANCHOR_CHECKS,
  type TuneKey,
} from "../../frontend-src/story/antivirus-model";
import { StoryClock } from "../../frontend-src/story/story-clock";
import {
  CORRUPTION_MARKERS,
  CORRUPTION_PHASES,
  corruptionScene,
} from "../../frontend-src/story/corruption-timeline";
const advance = (session: AntivirusSession, seconds: number) => {
  for (let time = 0; time < seconds - 1e-8; time += 0.01) session.step(0.01);
};

test("antivirus protects system processes and normal nodes, deduplicates clear operations", () => {
  const session = new AntivirusSession();
  assert.equal(session.terminate(2), false);
  assert.equal(
    session.clearNode(session.nodes.find((node) => !node.hostile)!.id),
    false,
  );
  for (let index = 0; index < PROCESS_ROWS.length; index++)
    if (PROCESS_ROWS[index].hostile) {
      assert.equal(session.terminate(index), true);
      assert.equal(session.terminate(index), false);
    }
  advance(session, 0.25);
  assert.equal(session.cleared.size, 0);
  advance(session, 0.02);
  assert.equal(session.progress.terminal, 1);
  for (const node of session.nodes.filter((node) => node.hostile)) {
    assert.equal(session.clearNode(node.id), true);
    assert.equal(session.clearNode(node.id), false);
  }
  assert.equal(session.cleared.size, 2);
  assert.equal(session.complete, false);
  session.dispose();
  const time = session.time;
  session.step(1);
  assert.equal(session.time, time);
});
test("rhythm accepts four distinct beats, tuning requires a continuous aligned hold", () => {
  const session = new AntivirusSession();
  assert.equal(session.beat(), false);
  advance(session, 0.44);
  assert.equal(session.beat(), false, "one input per cycle");
  for (let beat = 0; beat < 4; beat++) {
    const goal = (Math.floor(session.time / (60 / 84)) + 1 + 0.62) * (60 / 84);
    advance(session, goal - session.time);
    assert.equal(session.beat(), true);
    assert.equal(session.beat(), false);
  }
  assert.equal(session.progress.rhythm, 1);
  for (const key of Object.keys(TUNE_LIMITS) as TuneKey[])
    session.setTune(key, TUNE_LIMITS[key][2]);
  advance(session, 0.3);
  session.setTune("gain", 0.5);
  advance(session, 0.05);
  assert.equal(session.tuneHold, 0);
  session.setTune("gain", 1);
  advance(session, 0.59);
  assert.equal(session.cleared.has("tune"), false);
  advance(session, 0.03);
  assert.equal(session.cleared.has("tune"), true);
});
test("six checks are required before the 560ms all-clear handoff", () => {
  const session = new AntivirusSession();
  assert.equal(session.chooseAnchor(1), false);
  for (const item of ANCHOR_CHECKS) {
    assert.equal(session.chooseAnchor(item.safe), true);
    assert.equal(session.chooseAnchor(item.safe), false);
    advance(session, 0.61);
  }
  for (let time = 0; time < 30 && !session.cleared.has("steer"); time += 0.01) {
    session.steer(session.target.x, session.target.y);
    session.step(0.01);
  }
  assert.equal(session.cleared.has("steer"), true);
  session.release();
  assert.equal(session.pointer, null);
  PROCESS_ROWS.forEach((row, index) => {
    if (row.hostile) session.terminate(index);
  });
  for (const node of session.nodes.filter((node) => node.hostile))
    session.clearNode(node.id);
  for (const key of Object.keys(TUNE_LIMITS) as TuneKey[])
    session.setTune(key, TUNE_LIMITS[key][2]);
  advance(session, 0.7);
  for (let beat = 0; beat < 4; beat++) {
    const goal = (Math.floor(session.time / (60 / 84)) + 1 + 0.62) * (60 / 84);
    advance(session, goal - session.time);
    session.beat();
  }
  assert.equal(session.cleared.size, 6);
  assert.equal(session.complete, false);
  advance(session, 0.55);
  assert.equal(session.complete, false);
  advance(session, 0.02);
  assert.equal(session.complete, true);
});
test("corruption clock cannot pass the voice, antivirus or wake gates implicitly", () => {
  const clock = new StoryClock(CORRUPTION_PHASES);
  clock.advance(0);
  clock.advance(90000);
  assert.equal(clock.snapshot().parkedAt, "awaitVoice");
  assert.equal(clock.wake("qte", 90000), false);
  clock.wake("awaitVoice", 90000);
  clock.advance(180000);
  assert.equal(clock.snapshot().parkedAt, "qte");
  assert.equal(corruptionScene(clock.snapshot()).corruptVoice, true);
  clock.wake("qte", 180000);
  clock.advance(181000);
  assert.equal(corruptionScene(clock.snapshot()).corruptVoice, false);
  clock.advance(270000);
  assert.equal(clock.snapshot().parkedAt, "wake");
  const asleep = corruptionScene(clock.snapshot());
  assert.equal(asleep.noriSleep, true);
  assert.equal(asleep.fov, 15);
  clock.suspend(270000);
  clock.wake("wake", 270000);
  clock.advance(370000);
  assert.equal(clock.snapshot().time, CORRUPTION_MARKERS.wake);
  clock.resume(370000);
  clock.advance(380000);
  assert.equal(clock.snapshot().complete, true);
  assert.equal(corruptionScene(clock.snapshot()).noriSleep, false);
});
