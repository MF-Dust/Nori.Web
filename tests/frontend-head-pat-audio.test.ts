import test from "node:test";
import assert from "node:assert/strict";
import { HeadPatAudio } from "../frontend-src/live2d/head-pat-audio";

test("gesture audio stays lazy, follows strength and disposes every owned node", () => {
  const nodes: Array<any> = [];
  const parameter = (value = 0) => ({
    value,
    targets: [] as number[],
    setTargetAtTime(next: number) {
      this.value = next;
      this.targets.push(next);
    },
  });
  const node = () => {
    const result = {
      gain: parameter(),
      frequency: parameter(),
      Q: parameter(),
      type: "",
      buffer: null,
      loop: false,
      starts: 0,
      stops: 0,
      disconnected: false,
      connect(target: unknown) {
        return target;
      },
      start() {
        this.starts++;
      },
      stop() {
        this.stops++;
      },
      disconnect() {
        this.disconnected = true;
      },
    };
    nodes.push(result);
    return result;
  };
  const context = {
    currentTime: 0,
    sampleRate: 8000,
    createBufferSource: node,
    createBiquadFilter: node,
    createGain: node,
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
  };
  let unlocked = false;
  const audio = new HeadPatAudio(() =>
    unlocked ? ({ context, input: {} } as any) : null,
  );
  audio.update(3, true);
  assert.equal(nodes.length, 0);
  unlocked = true;
  audio.update(3, true);
  assert.equal(nodes[0].starts, 1);
  const count = nodes.length;
  const stroke = nodes.find((item) => item.gain.targets.length)!;
  assert.equal(stroke.gain.value, 1);
  audio.update(1.5, true);
  assert.equal(stroke.gain.value, 0.5 ** 1.4);
  assert.equal(nodes.length, count);
  audio.stop();
  assert.equal(stroke.gain.value, 0);
  audio.dispose();
  audio.dispose();
  audio.update(3, true);
  assert.equal(nodes[0].stops, 1);
  assert.equal(nodes.length, count);
  assert.ok(nodes.every((item) => item.disconnected));
});
