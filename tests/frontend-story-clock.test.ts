import test from "node:test";
import assert from "node:assert/strict";
import { StoryClock } from "../frontend-src/story/story-clock";
import { StoryAudio } from "../frontend-src/story/story-audio";

test("story clock parks at each interactive gate without consuming waiting time", () => {
  const clock = new StoryClock([
    { id: "arrive", duration: 2 },
    { id: "read", duration: 0, pauseAtStart: true },
    { id: "wake", duration: 0, pauseAtStart: true },
    { id: "settle", duration: 3 },
  ]);
  clock.advance(100);
  assert.equal(clock.advance(10100).parkedAt, "read");
  assert.equal(clock.snapshot().time, 2);
  assert.equal(clock.wake("wake", 11000), false);
  assert.equal(clock.wake("read", 11000), true);
  assert.equal(clock.snapshot().parkedAt, "wake");
  clock.advance(90000);
  assert.equal(clock.snapshot().time, 2);
  clock.wake("wake", 90000);
  assert.equal(clock.advance(92999).complete, false);
  assert.equal(clock.advance(93000).complete, true);
});
test("suspension preserves a pending gate and disposal prevents later playback", () => {
  const clock = new StoryClock([
    { id: "ready", duration: 0, pauseAtStart: true },
    { id: "play", duration: 7 },
  ]);
  clock.advance(0);
  clock.suspend(1000);
  clock.resume(5000);
  assert.equal(clock.snapshot().parkedAt, "ready");
  clock.wake("ready", 5000);
  clock.advance(6000);
  clock.suspend(6500);
  clock.resume(20000);
  assert.equal(clock.advance(21000).time, 2.5);
  assert.equal(clock.advance(20500).time, 2.5);
  clock.dispose();
  clock.resume(22000);
  assert.equal(clock.advance(90000).time, 2.5);
  assert.equal(clock.snapshot().playing, false);
  assert.throws(() => new StoryClock([{ id: "bad", duration: Infinity }]));
});
test("story audio waits for unlock, resumes at the current offset and cancels pending tracks", () => {
  let unlocked = false;
  const calls: Array<{ elapsed: () => number; stopped: boolean; src: string }> =
    [];
  const mixer = {
    canPlay: () => unlocked,
    playSceneAudio(src: string, options: { elapsed: () => number }) {
      const call = { src, elapsed: options.elapsed, stopped: false };
      calls.push(call);
      return () => {
        call.stopped = true;
      };
    },
  };
  const audio = new StoryAudio(mixer, [
    { id: "drone", src: "/drone", at: 1, until: 5 },
  ]);
  const clock = new StoryClock([{ id: "scene", duration: 7 }]);
  clock.advance(0);
  audio.sync(clock.advance(2000));
  assert.equal(calls.length, 0);
  unlocked = true;
  audio.sync(clock.advance(3000));
  assert.equal(calls[0].elapsed(), 2);
  audio.sync(clock.advance(3500));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].elapsed(), 2.5);
  clock.suspend(3500);
  audio.sync(clock.snapshot());
  assert.equal(calls[0].stopped, true);
  clock.resume(20000);
  audio.sync(clock.snapshot());
  assert.equal(calls.length, 2);
  assert.equal(calls[1].elapsed(), 2.5);
  audio.sync(clock.advance(22000));
  assert.equal(calls[1].stopped, true);
  audio.dispose();
  audio.sync(clock.snapshot());
  assert.equal(calls.length, 2);
});
