import assert from "node:assert/strict";
import test from "node:test";
import {
  DATASEA_PHASES,
  dataseaCamera,
} from "../frontend-src/story/datasea-scene";
import {
  MEMORY_PHASES,
  memoryProjection,
} from "../frontend-src/story/memory-scene";
import {
  DATASEA_CG_LINES,
  DATASEA_COSMIC_LINES,
  DATASEA_MESSAGES,
  DATASEA_WAVE_BREAKS,
  DATASEA_WHITE_LINES,
  dataseaCgAt,
  dataseaCosmicAt,
  dataseaMessagesAt,
  dataseaWhiteAt,
} from "../frontend-src/story/datasea-content";
import { StoryClock } from "../frontend-src/story/story-clock";

test("memory retains all five ordered interaction gates", () => {
  const clock = new StoryClock(MEMORY_PHASES);
  clock.advance(0);
  clock.advance(2500);
  for (let index = 1; index <= 5; index++) {
    assert.equal(clock.snapshot().parkedAt, `win${index}`);
    assert.equal(clock.wake(`win${index}`, 2500 + index), true);
    clock.advance(2800 + index);
  }
  assert.equal(clock.snapshot().phase, "flood");
});

test("memory projection orders attack, sweep, drain, and void", () => {
  assert.equal(memoryProjection(20).attack, false);
  assert.equal(memoryProjection(21).attack, true);
  assert.equal(memoryProjection(28).sweep, true);
  assert.equal(memoryProjection(30).drain, true);
  assert.equal(memoryProjection(40).voidProgress > 0, true);
});

test("datasea restores shipped narrative text and timed subtitle layers", () => {
  assert.equal(DATASEA_MESSAGES.length, 13);
  assert.equal(DATASEA_MESSAGES[0].text, "……");
  assert.equal(DATASEA_MESSAGES[2].text, "等一下……是你吗？一直和我通信的那个人？");
  assert.deepEqual(DATASEA_WAVE_BREAKS.map((wave) => wave.length), [6, 10]);
  assert.equal(DATASEA_WAVE_BREAKS[0][0].text, "谢谢……");
  assert.equal(DATASEA_WAVE_BREAKS[1][9].text, "一起走到最后吧。");
  assert.equal(DATASEA_COSMIC_LINES[0].text, "全通道同步恢复确认");
  assert.equal(DATASEA_WHITE_LINES.at(-1)?.text, "我就要让自己的坐标和它重叠了");
  assert.equal(DATASEA_CG_LINES.at(-1)?.text, "啊，原来是这样啊，这是——");
  assert.equal(dataseaMessagesAt(2.5)?.text, "……");
  assert.equal(dataseaCosmicAt(2.1)?.text.length! > 0, true);
  assert.equal(dataseaWhiteAt(3.1)?.text.length! > 0, true);
  assert.equal(dataseaCgAt(1.1)?.text.length! > 0, true);
});

test("datasea parks only for route alignment and descends to evidence camera target", () => {
  assert.deepEqual(
    DATASEA_PHASES.filter((phase) => phase.pauseAtStart).map(
      (phase) => phase.id,
    ),
    ["waves"],
  );
  assert.equal(
    DATASEA_PHASES.find((phase) => phase.id === "messages")?.duration,
    44.8,
  );
  assert.equal(
    DATASEA_PHASES.find((phase) => phase.id === "cosmic")?.duration,
    59.815178571428596,
  );
  assert.equal(
    DATASEA_PHASES.find((phase) => phase.id === "white")?.duration,
    28.3,
  );
  assert.equal(
    DATASEA_PHASES.reduce((sum, phase) => sum + phase.duration, 0),
    198.4151785714286,
  );
  assert.deepEqual(dataseaCamera(0).camera, { x: 0, y: 0, z: 7.4 });
  assert.equal(dataseaCamera(27).camera.y, -190);
  assert.ok(Math.abs(dataseaCamera(13).cameraRot.x + Math.PI / 2) < 1e-9);
});
