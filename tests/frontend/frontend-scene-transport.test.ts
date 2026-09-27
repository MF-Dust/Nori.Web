import test from "node:test";
import assert from "node:assert/strict";
import { StoryClock } from "../../frontend-src/story/story-clock";
import { StoryAudio } from "../../frontend-src/story/story-audio";

const phases = [
  { id: "arrive", duration: 2 },
  { id: "read", duration: 0, pauseAtStart: true },
  { id: "confirm", duration: 0, pauseAtStart: true },
  { id: "leave", duration: 3 },
];
test("authoring seek rearms coincident gates and excludes wall time", () => {
  const clock = new StoryClock(phases);
  assert.equal(clock.seek(3, 10000).phase, "leave");
  assert.equal(clock.seek(2, 20000).parkedAt, "read");
  assert.equal(clock.wake("read", 90000), true);
  assert.equal(clock.snapshot().parkedAt, "confirm");
  clock.wake("confirm", 91000);
  assert.equal(clock.advance(92000).time, 3);
  assert.equal(clock.seek(0, 150000).parkedAt, null);
  assert.equal(clock.advance(151000).time, 1);
  assert.equal(clock.advance(152000).parkedAt, "read");
});
test("phase seek distinguishes gates sharing a timestamp", () => {
  const clock = new StoryClock(phases);
  assert.equal(clock.seekPhase("confirm", 0).parkedAt, "confirm");
  assert.equal(clock.seekPhase("leave", 0).parkedAt, null);
  assert.equal(clock.snapshot().phase, "leave");
  assert.equal(clock.seekPhase("read", 0).parkedAt, "read");
  const before = clock.snapshot();
  assert.equal(clock.seekPhase("missing", 1), before);
});
test("seek clamps finite targets, preserves suspension and rejects invalid/disposed work", () => {
  const clock = new StoryClock(phases);
  clock.suspend(0);
  assert.equal(clock.seek(-10, 100).time, 0);
  assert.equal(clock.seek(100, 200).complete, true);
  assert.equal(clock.seek(3, 300).playing, false);
  const before = clock.snapshot();
  for (const [time, now] of [
    [NaN, 0],
    [Infinity, 0],
    [1, NaN],
  ])
    assert.equal(clock.seek(time, now), before);
  clock.resume(20000);
  assert.equal(clock.advance(21000).time, 4);
  clock.dispose();
  const disposed = clock.snapshot();
  assert.equal(clock.seek(0, 99999), disposed);
  assert.equal(clock.seekPhase("read", 99999), disposed);
  assert.throws(
    () =>
      new StoryClock([
        { id: "a", duration: 1e308 },
        { id: "b", duration: 1e308 },
      ]),
  );
});
test("seeking to the endpoint still parks at a trailing input gate", () => {
  const clock = new StoryClock([
    { id: "play", duration: 2 },
    { id: "done", duration: 0, pauseAtStart: true },
  ]);
  assert.equal(clock.seek(99, 0).parkedAt, "done");
  assert.equal(clock.snapshot().complete, false);
  clock.wake("done", 100);
  assert.equal(clock.snapshot().complete, true);
  assert.equal(clock.seek(2, 200).parkedAt, "done");
});
test("audio discontinuities cancel pending handles and recreate same-interval offsets", () => {
  const calls: Array<{ offset: () => number; stops: number }> = [];
  const mixer = {
    canPlay: () => true,
    playSceneAudio(_src: string, options: { elapsed: () => number }) {
      const call = { offset: options.elapsed, stops: 0 };
      calls.push(call);
      return () => call.stops++;
    },
  };
  const clock = new StoryClock([{ id: "scene", duration: 10 }]);
  const audio = new StoryAudio(mixer, [
    { id: "music", src: "/audio/cult/drone.ogg", at: 0, until: 10 },
  ]);
  audio.sync(clock.seek(2, 0));
  audio.seek(clock.seek(6, 100));
  assert.equal(calls[0].stops, 1);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].offset(), 6);
  audio.sync(clock.advance(200));
  assert.equal(calls.length, 2);
  clock.suspend(200);
  audio.seek(clock.seek(3, 10000));
  assert.equal(calls[1].stops, 1);
  assert.equal(calls.length, 2);
  clock.resume(20000);
  audio.sync(clock.snapshot());
  assert.equal(calls[2].offset(), 3);
  audio.dispose();
  audio.seek(clock.seek(0, 21000));
  assert.equal(calls[2].stops, 1);
  assert.equal(calls.length, 3);
});
test("timeline audio forwards source offsets without changing timeline fade duration", () => {
  let options: any;
  const audio = new StoryAudio(
    {
      canPlay: () => true,
      playSceneAudio(_src, value) {
        options = value;
        return () => {};
      },
    },
    [
      {
        id: "landing",
        src: "/audio/bgm_landing.m4a",
        at: 2,
        until: 8,
        srcStart: 44,
        fadeIn: 2.5,
      },
    ],
  );
  const clock = new StoryClock([{ id: "boot", duration: 10 }]);
  audio.sync(clock.seek(3, 0));
  assert.equal(options.srcStart, 44);
  assert.equal(options.elapsed(), 1);
  assert.equal(options.duration, 6);
  assert.equal(options.fadeIn, 2.5);
  audio.dispose();
  assert.throws(
    () =>
      new StoryAudio(
        {
          canPlay: () => true,
          playSceneAudio() {
            return () => {};
          },
        },
        [{ id: "invalid", src: "test", at: 0, until: 1, srcStart: -1 }],
      ),
  );
});
