import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as tabs from "../../frontend-src/screens/debug-system-tabs";

test("notification debug payload matches the fields mirrored by the real backend", () => {
  assert.deepEqual(
    tabs.notificationPushPayload({
      title: "  ",
      subtitle: " Server subtitle ",
      body: "Body",
      durationMs: "2500",
      openAppId: " mail ",
    }),
    {
      title: "NoriOS",
      subtitle: "Server subtitle",
      body: "Body",
      durationMs: 2500,
      onClick: { type: "open-app", appId: "mail" },
    },
  );
  assert.deepEqual(
    tabs.notificationPushPayload({
      title: "Title",
      subtitle: "",
      body: "",
      durationMs: "not-a-number",
      openAppId: "",
    }),
    { title: "Title" },
  );
});

test("notification debug observes only valid notification.pushed events", () => {
  assert.deepEqual(
    tabs.notificationFromMessage({
      type: "event",
      channel: "notification.pushed",
      payload: {
        id: "note-1",
        title: "Hello",
        subtitle: "From the server",
        durationMs: 500,
        onClick: { type: "open-app", appId: "mail" },
      },
    }),
    {
      id: "note-1",
      title: "Hello",
      subtitle: "From the server",
      durationMs: 500,
      onClick: { type: "open-app", appId: "mail" },
    },
  );
  assert.equal(
    tabs.notificationFromMessage({
      type: "event",
      channel: "notification.pushed",
      payload: { title: "missing id" },
    }),
    null,
  );
  assert.equal(
    tabs.notificationFromMessage({
      type: "event",
      channel: "debug.chat_inject_talk.response",
      payload: { id: "not-a-note", title: "No" },
    }),
    null,
  );
});

test("audio debug syncs the real settings snapshot into mixer and speech runtime", () => {
  const calls = [];
  const frontend = {
    audio: { sync: (settings) => calls.push(["mixer", settings]) },
    speech: {
      setVolume: (volume, rate) => calls.push(["speech", volume, rate]),
    },
  };
  let updated = false;
  tabs.syncDebugAudioSettings(frontend, () => {
    updated = true;
  });
  assert.equal(updated, true);
  assert.equal(calls[0][0], "mixer");
  assert.equal(calls[0][1].masterVolume, 80);
  assert.deepEqual(calls[1], ["speech", 1, 1]);
});

test("audio spatial gain follows the shipped inverse-distance equation", () => {
  const spatial = tabs.spatialGain({
    listenerPos: { x: 0, y: 0, z: 100 },
    speechPos: { x: 0, y: 0, z: 0 },
    distanceParams: {
      model: "inverse",
      refDistance: 50,
      maxDistance: 10000,
      rolloffFactor: 1,
    },
  });
  assert.equal(spatial?.distance, 100);
  assert.equal(spatial?.gain, 0.5);
});

test("unavailable agent tabs contain no substitute event calls", async () => {
  const source = await readFile(
    resolve("frontend-src/screens/debug-system-tabs.tsx"),
    "utf8",
  );
  assert.equal((source.match(/frontend\.rpc\.call/g) ?? []).length, 1);
  assert.match(source, /"notification\.debug\.push"/);
  assert.doesNotMatch(source, /sendEvent\(\s*["']nori_talk\.request/);
  assert.doesNotMatch(
    source,
    /\.call[^\n]+debug\.chat_(?:inject_talk|context)/,
  );
});
