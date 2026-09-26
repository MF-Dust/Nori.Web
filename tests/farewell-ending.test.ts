import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { StoryClock } from "../frontend-src/story/story-clock";
import {
  FAREWELL_CUES,
  FAREWELL_CUT_AT,
  FAREWELL_DURATION,
  FAREWELL_LINE_EXIT,
  FAREWELL_LINE_SETTLE,
  FAREWELL_SUBTITLE_FROM,
  FAREWELL_SUBTITLE_LINES,
  farewellFrame,
  farewellSubtitle,
  farewellSubtitleStack,
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

test("an evicted line keeps rendering for its exit and the stack settle", () => {
  assert.equal(FAREWELL_LINE_EXIT, 0.35);
  assert.equal(FAREWELL_LINE_SETTLE, 0.3);
  // Eviction is index-based: cue 0 leaves the window when cue 3 lands.
  const evictedAt = FAREWELL_CUES[FAREWELL_SUBTITLE_LINES].at;
  const phases = (time: number) =>
    farewellSubtitleStack(time).map(({ cue, phase }) => `${cue.id}:${phase}`);
  assert.deepEqual(phases(evictedAt - 0.001), [
    "3b7rzf:live",
    "jkd6mr:live",
    "aghhjs:live",
  ]);
  // The shipped AnimatePresence holds the evicted bubble, and it stays above the
  // live three in the tree it never left.
  assert.deepEqual(phases(evictedAt), [
    "3b7rzf:exit",
    "jkd6mr:live",
    "aghhjs:live",
    "vwkwr6:live",
  ]);
  assert.deepEqual(phases(evictedAt + FAREWELL_LINE_EXIT - 0.001), [
    "3b7rzf:exit",
    "jkd6mr:live",
    "aghhjs:live",
    "vwkwr6:live",
  ]);
  // Boundaries are sampled a millisecond past: 0.35 + 0.3 is not exactly
  // representable, and a frame is the resolution the scene actually has.
  assert.deepEqual(phases(evictedAt + FAREWELL_LINE_EXIT + 0.001), [
    "3b7rzf:settle",
    "jkd6mr:live",
    "aghhjs:live",
    "vwkwr6:live",
  ]);
  assert.deepEqual(
    phases(evictedAt + FAREWELL_LINE_EXIT + FAREWELL_LINE_SETTLE - 0.001),
    ["3b7rzf:settle", "jkd6mr:live", "aghhjs:live", "vwkwr6:live"],
  );
  assert.deepEqual(phases(evictedAt + FAREWELL_LINE_EXIT + FAREWELL_LINE_SETTLE), [
    "jkd6mr:live",
    "aghhjs:live",
    "vwkwr6:live",
  ]);
  // Every eviction is cue index + 3 landing, and never two at once: the 0.65s
  // retention window is shorter than the gap the cue table guarantees.
  for (let index = 0; index + FAREWELL_SUBTITLE_LINES < FAREWELL_CUES.length; index++) {
    const at = FAREWELL_CUES[index + FAREWELL_SUBTITLE_LINES].at;
    const held = farewellSubtitleStack(at);
    assert.equal(held[0].cue.id, FAREWELL_CUES[index].id);
    assert.equal(held[0].phase, "exit");
    assert.equal(held.length, FAREWELL_SUBTITLE_LINES + 1);
    assert.equal(
      farewellSubtitleStack(
        at + FAREWELL_LINE_EXIT + FAREWELL_LINE_SETTLE + 0.001,
      ).length,
      FAREWELL_SUBTITLE_LINES,
    );
  }
  // The window bounds are unchanged: no bubble before the first cue, and the
  // hard cut takes the whole stack without an exit.
  assert.deepEqual(phases(FAREWELL_SUBTITLE_FROM), []);
  assert.deepEqual(phases(FAREWELL_CUT_AT), []);
  assert.equal(farewellSubtitleStack(FAREWELL_CUT_AT - 0.001).length, 3);
});

/**
 * The shipped overlay's motion constants, read straight out of `jQe` in the
 * published bundle: enter 0.4s, exit 0.35s, layout settle 0.3s, all on
 * ease [0.32, 0.72, 0, 1], plus the bubble styling the port has to match.
 */
const shipped = readFileSync("public/assets/NormalApp-Cn6agT0F.js", "utf8");
const bubble = shipped.slice(
  shipped.indexOf("function jQe("),
  shipped.indexOf("function HQe("),
);

test("the shipped overlay carries the enter, exit and settle motion", () => {
  assert.match(bubble, /layout: "position"/);
  assert.match(bubble, /initial: \{ opacity: 0, y: 40, scale: 0\.9 \}/);
  assert.match(bubble, /animate: \{ opacity: 1, y: 0, scale: 1 \}/);
  assert.match(
    bubble,
    /exit: \{\s*opacity: 0,\s*y: -60,\s*scale: 0\.85,\s*transition: \{ duration: 0\.35, ease: \[0\.32, 0\.72, 0, 1\] \},?\s*\},/,
  );
  assert.match(
    bubble,
    /transition: \{\s*duration: 0\.4,\s*ease: \[0\.32, 0\.72, 0, 1\],\s*layout: \{ duration: 0\.3, ease: \[0\.32, 0\.72, 0, 1\] \},?\s*\},/,
  );
});

test("the CSS carries the shipped bubble styling, unchanged", () => {
  assert.match(
    bubble,
    /background: `linear-gradient\(135deg, \$\{Np\.mint\}F2 0%, \$\{Np\.mintLight\}F6 50%, \$\{Np\.mint\}F2 100%\)`/,
  );
  assert.match(bubble, /borderRadius: "16px 16px 16px 4px"/);
  assert.match(bubble, /border: "1px solid rgba\(126, 168, 172, 0\.38\)"/);
  assert.match(
    bubble,
    /className: "text-\[14px\] leading-relaxed font-semibold",\s*style: \{ color: Np\.dark, fontFamily: '"Nunito", system-ui, sans-serif' \}/,
  );
  const css = readFileSync("frontend-src/story/farewell-scene.css", "utf8");
  const rule = (selector: string) =>
    css.slice(
      css.indexOf(selector),
      css.indexOf("}", css.indexOf(selector)) + 1,
    );
  for (const declaration of [
    "background:linear-gradient(135deg,#d2e8e9f2 0%,#caf5f1f6 50%,#d2e8e9f2 100%)",
    "border-radius:16px 16px 16px 4px",
    "border:1px solid rgba(126,168,172,.38)",
    "color:#56565f",
    "font:600 14px/1.625 Nunito,system-ui,sans-serif",
    "animation:farewell-line-in .4s cubic-bezier(.32,.72,0,1) both",
  ])
    assert.ok(rule(".farewell-line{").includes(declaration), declaration);
  for (const declaration of [
    "right:20px",
    "bottom:11%",
    "width:min(340px,34vw)",
    "gap:8px",
  ])
    assert.ok(rule(".farewell-subtitles{").includes(declaration), declaration);
});

test("the CSS reproduces the shipped exit and the layout settle", () => {
  const css = readFileSync("frontend-src/story/farewell-scene.css", "utf8");
  assert.match(
    css,
    /@keyframes farewell-line-exit\{from\{opacity:1;transform:none\}to\{opacity:0;transform:translateY\(-60px\) scale\(\.85\)\}\}/,
  );
  assert.match(
    css,
    /\.farewell-line\[data-line\]\{animation:farewell-line-exit \.35s cubic-bezier\(\.32,\.72,0,1\) both\}/,
  );
  // The settle is a CSS transition on the evicted line's own box geometry, so
  // the stack's slot closes with the shipped ease and no JS tween.
  assert.match(css, /transition-duration:\.3s/);
  assert.match(css, /transition-timing-function:cubic-bezier\(\.32,\.72,0,1\)/);
  assert.match(
    css,
    /transition-property:line-height,padding-block,border-block-width,margin-bottom/,
  );
  assert.match(
    css,
    /\.farewell-line\[data-line=settle\]\{line-height:0;padding-block:0;border-block-width:0;margin-bottom:-8px;overflow:hidden\}/,
  );
  // Reduced motion drops both halves rather than only the enter.
  assert.match(
    css,
    /@media \(prefers-reduced-motion:reduce\)\{\.farewell-line\{animation:none;transition:none\}\}/,
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
