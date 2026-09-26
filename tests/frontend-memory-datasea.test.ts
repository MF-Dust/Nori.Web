import assert from "node:assert/strict";
import test from "node:test";
import {
  DATASEA_AUDIO,
  DATASEA_PHASES,
  dataseaCamera,
  dataseaWhiteout,
} from "../frontend-src/story/datasea-scene";
import {
  MEMORY_ALERT_OFFSETS,
  MEMORY_PHASES,
  memoryAlertOffsets,
  memoryFloodBoxes,
  memoryFloodOffsets,
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

test("memory flood geometry is the shipped kXe box table and LXe cadence", () => {
  // kXe(3) from mulberry32(1852797545), four draws per record in w,h,fx,fy order.
  assert.deepEqual(memoryFloodBoxes(3), [
    { w: 324, h: 368, fx: 0.17994714868254957, fy: 0.5014762649359181 },
    { w: 353, h: 342, fx: 0.5272060519969091, fy: 0.4411865321174264 },
    { w: 366, h: 352, fx: 0.1548386956285685, fy: 0.05039728644303977 },
  ]);
  // LXe(12, 16.5): gaps 11, ratio (0.25/2)^(1/10), run scaled to floodDur-0.25.
  const offsets = memoryFloodOffsets(12, 16.5);
  assert.equal(offsets.length, 12);
  assert.equal(offsets[0], 0);
  assert.equal(offsets.at(-1), 16.25);
  assert.ok(Math.abs(offsets[1]! - 3.3956657661875025) < 1e-12);
  assert.deepEqual(
    offsets.every((at, index) => index === 0 || at > offsets[index - 1]!),
    true,
  );
  // OXe(sweep - attack - 0.6, void - attack - 0.6) = OXe(6.4, 17.6).
  assert.equal(MEMORY_ALERT_OFFSETS.length, 56);
  assert.deepEqual(
    MEMORY_ALERT_OFFSETS,
    memoryAlertOffsets(6.4, 17.6),
  );
  assert.equal(MEMORY_ALERT_OFFSETS[0], 1.4472361809045227);
  assert.ok(MEMORY_ALERT_OFFSETS.at(-1)! < 17.6);
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

test("datasea audio is the live shipped table with phase-derived times", () => {
  // NormalApp-Cn6agT0F.js (the chunk public/index.html loads through
  // index-CyHAbkO5) is the only place in public/assets that carries this
  // table. Times are 99.3 cosmic / 159.115 white / 187.415 cg / 198.415 end.
  assert.deepEqual(
    DATASEA_AUDIO.map(
      ({ id, at, until, gain, fadeIn, fadeOut, loop }) => ({
        id,
        at,
        until,
        gain,
        fadeIn,
        fadeOut,
        loop: loop === true,
      }),
    ),
    [
      {
        id: "descendBubbles",
        at: 0,
        until: 198.4151785714286,
        gain: undefined,
        fadeIn: undefined,
        fadeOut: undefined,
        loop: false,
      },
      {
        id: "deepSpace",
        at: 99.3,
        until: 159.1151785714286,
        gain: 0.7,
        fadeIn: undefined,
        fadeOut: 6,
        loop: false,
      },
      {
        id: "cosmicAccelWhoosh",
        at: 153.4,
        until: 198.4151785714286,
        gain: 0.7,
        fadeIn: undefined,
        fadeOut: undefined,
        loop: false,
      },
      {
        id: "whiteWave1",
        at: 159.1151785714286,
        until: 198.4151785714286,
        gain: undefined,
        fadeIn: undefined,
        fadeOut: undefined,
        loop: false,
      },
      {
        id: "whiteWave2",
        at: 165.1151785714286,
        until: 198.4151785714286,
        gain: undefined,
        fadeIn: undefined,
        fadeOut: undefined,
        loop: false,
      },
      {
        id: "seasideWaves",
        at: 159.1151785714286,
        until: 193.71517857142862,
        gain: 0.25,
        fadeIn: 3,
        fadeOut: 2.5,
        loop: true,
      },
      {
        id: "dropletTouch",
        at: 191.21517857142862,
        until: 198.4151785714286,
        gain: undefined,
        fadeIn: undefined,
        fadeOut: undefined,
        loop: false,
      },
      {
        id: "cgRiser",
        at: 192.4151785714286,
        until: 198.4151785714286,
        gain: undefined,
        fadeIn: undefined,
        fadeOut: 0.5,
        loop: false,
      },
    ],
  );
  // Every cue the table names has to exist under public/audio/datasea.
  assert.deepEqual(
    [...new Set(DATASEA_AUDIO.map((track) => track.src))].sort(),
    [
      "/audio/datasea/cg-riser.m4a",
      "/audio/datasea/cosmic-accel-whoosh.m4a",
      "/audio/datasea/deep-space.m4a",
      "/audio/datasea/descend-bubbles.m4a",
      "/audio/datasea/droplet-touch.m4a",
      "/audio/datasea/seaside-waves-loop.m4a",
      "/audio/datasea/white-wave-1.m4a",
      "/audio/datasea/white-wave-2.m4a",
    ],
  );
  assert.deepEqual(
    DATASEA_AUDIO.every((track) => track.until > track.at),
    true,
  );
});

test("datasea whiteout is the shipped 1.2s handoff ramp, not a 5s phase ramp", () => {
  // Smoothstep over [white + 3.2, white + 4.4]; the source used to climb
  // linearly over [white, white + 5].
  assert.equal(dataseaWhiteout(159.1151785714286), 0);
  assert.equal(dataseaWhiteout(162.3151785714286), 0);
  assert.ok(Math.abs(dataseaWhiteout(162.9151785714286) - 0.5) < 1e-9);
  assert.equal(dataseaWhiteout(163.5151785714286), 1);
  assert.equal(dataseaWhiteout(187.4151785714286), 1);
});
