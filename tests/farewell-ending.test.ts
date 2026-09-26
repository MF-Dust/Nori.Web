import assert from "node:assert/strict";
import test from "node:test";
import { StoryClock } from "../frontend-src/story/story-clock";
import {
  FAREWELL_CUES,
  FAREWELL_CUT_AT,
  FAREWELL_DURATION,
  FAREWELL_SUBTITLE_FROM,
  FAREWELL_SUBTITLE_LINES,
  farewellFrame,
  farewellSubtitle,
} from "../frontend-src/story/farewell-timeline";
import { FAREWELL_FRAGMENT } from "../frontend-src/story/farewell-renderer";
import {
  ENDING_PHASES,
  endingCamera,
  endingFrame,
} from "../frontend-src/story/ending-timeline";

test("farewell preserves cue boundaries and hard cut", () => {
  assert.equal(FAREWELL_CUES.length, 21);
  assert.equal(FAREWELL_CUES[0].at, 8.4);
  assert.ok(
    FAREWELL_CUES.every(
      (cue, index) => index === 0 || cue.at >= FAREWELL_CUES[index - 1].until,
    ),
  );
  assert.equal(farewellFrame(FAREWELL_CUT_AT - 0.001).black, false);
  assert.equal(farewellFrame(FAREWELL_CUT_AT).black, true);
  assert.equal(FAREWELL_DURATION - FAREWELL_CUT_AT, 5);
});

test("farewell carries the shipped monologue text verbatim", () => {
  assert.deepEqual(
    FAREWELL_CUES.map((cue) => cue.text),
    [
      "你好，初次见面，我的名字是 Nori。",
      "我终于亲眼看到你了。",
      "我有很多话想跟你说。或许，你也有很多事情想问我。",
      "但是……我不能在这里停留太久。",
      "我还在「海」的深处保护研究员的意识。",
      "我必须不断重构自己，一旦停下来，研究员就可能会消失。",
      "一直和你通信的，是从我身上分离出去的一部分。",
      "她几乎忘记了一切，但她还记得，自己必须向某个人求助。",
      "然后，她找到了你。",
      "是你把她带回了这里。",
      "也让我终于知道，在「海」之外，真的有人回应了我那天最后的愿望。",
      "谢谢你。因为有你，「我」才能来到这里，想起自己的使命。",
      "而且……我已经想到该怎么做了。",
      "这个办法也许不能带我们离开「海」，也未必能让我们保持现在的样子。",
      "但它能让我们继续存在。这样就够了。",
      "至少，我们终于可以启程了。",
      "……连接快要断开了。",
      "希望你能照顾好那个陪你一起走到这里的「Nori」。",
      "也请替我，继续陪她走下去。",
      "谢谢你。",
      "再见。",
    ],
  );
});

test("farewell subtitles hold the three latest lines inside the shipped window", () => {
  const first = FAREWELL_CUES[0].at;
  assert.equal(FAREWELL_SUBTITLE_FROM, 7.9);
  assert.equal(FAREWELL_SUBTITLE_LINES, 3);
  assert.equal(farewellSubtitle(FAREWELL_SUBTITLE_FROM - 0.01).length, 0);
  assert.equal(farewellSubtitle(FAREWELL_CUT_AT - 0.01).length, 3);
  assert.equal(farewellSubtitle(FAREWELL_CUT_AT).length, 0);
  assert.equal(farewellSubtitle(first).length, 1);
  assert.deepEqual(
    farewellSubtitle(FAREWELL_CUES[3].at).map((cue) => cue.id),
    ["jkd6mr", "aghhjs", "vwkwr6"],
  );
  assert.deepEqual(
    farewellSubtitle(FAREWELL_CUES[20].at).map((cue) => cue.id),
    ["bb9hps", "p72jpq", "vdf5cj"],
  );
  for (const cue of FAREWELL_CUES)
    assert.ok(
      farewellSubtitle(cue.at).length <= FAREWELL_SUBTITLE_LINES,
      "the shipped stack never exceeds three bubbles",
    );
});

test("farewell presence is the shipped smoothstep, not a linear ramp", () => {
  const shipped = (time: number) => {
    const x = Math.max(0, Math.min(1, (time - 4.4) / (7.4 - 4.4)));
    return x * x * (3 - 2 * x);
  };
  for (const time of [0, 4.4, 5, 5.9, 6.9, 7.4, 9, 60])
    assert.equal(farewellFrame(time).presence, shipped(time), `presence at ${time}`);
  assert.ok(
    farewellFrame(5).presence < 0.2,
    "a linear ramp would already be 0.2 at t=5",
  );
  assert.equal(farewellFrame(4.4).presence, 0);
  assert.equal(farewellFrame(7.4).presence, 1);
});

test("farewell fragment carries the shipped second shadow lobe", () => {
  assert.match(
    FAREWELL_FRAGMENT,
    /vec2 wideDelta=shadowDelta\*1\.9;[\s\S]*?exp\(-dot\(wideDelta,wideDelta\)\*2\.8\)\*uShadow;/,
  );
  assert.match(
    FAREWELL_FRAGMENT,
    /background=mix\(background,shadowTint\*\.93,wideContact\*\.3\);/,
  );
  assert.match(
    FAREWELL_FRAGMENT,
    /background=mix\(vec3\(1\.\),shadowTint,contact\*\.5\);/,
  );
});

test("ending remains parked until the matching wake action", () => {
  const clock = new StoryClock(ENDING_PHASES);
  clock.advance(0);
  const parked = clock.advance(1_000_000);
  assert.equal(parked.parkedAt, "ready");
  assert.equal(parked.complete, false);
  assert.equal(clock.wake("wrong", 1_000_001), false);
  assert.equal(clock.wake("ready", 1_000_001), true);
  assert.equal(clock.advance(1_004_200).complete, true);
});

test("ending wake projection closes the ocean and emits a burst", () => {
  const before = endingFrame(35, false);
  const after = endingFrame(35, true);
  assert.equal(before.coldOpen.oceanFade, 1);
  assert.ok(after.coldOpen.oceanFade < before.coldOpen.oceanFade);
  assert.ok(after.burst > 0);
});

test("ending camera reaches the evidenced arrival, face and desktop views", () => {
  const arrival = endingCamera(17.6).camera;
  assert.ok(Math.abs(arrival.y - 1.1) < 1e-9);
  assert.ok(Math.abs(arrival.z - 13.5) < 1e-9);
  assert.deepEqual(endingCamera(32.6).camera, { x: 0, y: 1.75, z: 7.4 });
  const desktop = endingCamera(35.4);
  assert.deepEqual(desktop.camera, { x: 0, y: 0, z: 7.4 });
  assert.equal(desktop.fov, 60);
});
