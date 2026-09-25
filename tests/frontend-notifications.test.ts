import assert from "node:assert/strict";
import test from "node:test";
import {
  createNotificationStore,
  notificationInputFromMessage,
} from "../frontend-src/state/notification-store";
import {
  SignalArrivalTracker,
  signalArrivalPreview,
  type SignalConversation,
  type SignalMessage,
} from "../frontend-src/apps/messenger";
import {
  createSignalPendingFocusStore,
} from "../frontend-src/apps/messenger-interactions";

function message(
  id: string,
  overrides: Partial<SignalMessage> = {},
): SignalMessage {
  return {
    threadId: "thread",
    messageId: id,
    sender: "Fixture",
    kind: "text",
    body: id,
    timestamp: "2026-08-31T10:00:00Z",
    self: false,
    raw: {},
    ...overrides,
  };
}

function conversation(messages: SignalMessage[]): SignalConversation {
  return {
    thread: {
      threadId: "thread",
      title: "Fixture",
      participants: ["Fixture", "我"],
      service: false,
      raw: {},
    },
    messages,
  };
}

test("notification.pushed parser keeps valid fields and rejects malformed events", () => {
  const parsed = notificationInputFromMessage({
    type: "event",
    channel: "notification.pushed",
    payload: {
      id: "note-1",
      appId: "mail",
      title: "Mail",
      subtitle: "New",
      body: "One message",
      durationMs: 500,
      onClick: { type: "open-app", appId: "mail", args: { folder: "inbox" } },
    },
  } as never);
  assert.deepEqual(parsed, {
    id: "note-1",
    input: {
      appId: "mail",
      title: "Mail",
      subtitle: "New",
      body: "One message",
      durationMs: 500,
      action: {
        type: "open-app",
        appId: "mail",
        args: { folder: "inbox" },
      },
    },
  });
  assert.equal(
    notificationInputFromMessage({
      type: "event",
      channel: "notification.pushed",
      payload: { title: "missing id" },
    } as never),
    null,
  );
  assert.equal(
    notificationInputFromMessage({
      type: "event",
      channel: "other",
      payload: { id: "x", title: "No" },
    } as never),
    null,
  );
});

test("notification store caps, defers, flushes, dismisses, and rate-limits cues", () => {
  let time = 1000;
  let sequence = 0;
  const cues: string[] = [];
  const store = createNotificationStore({
    maxItems: 3,
    now: () => time,
    createId: () => `id-${++sequence}`,
    playCue: (cue) => cues.push(cue),
  });
  store.push({ title: "one" });
  time += 1000;
  store.push({ title: "two" });
  time += 1000;
  store.setSuppressed(true);
  store.push({ title: "deferred" });
  assert.deepEqual(store.snapshot().queue.map((item) => item.title), [
    "two",
    "one",
  ]);
  assert.deepEqual(store.snapshot().deferred.map((item) => item.title), [
    "deferred",
  ]);
  store.setSuppressed(false);
  assert.deepEqual(store.snapshot().queue.map((item) => item.title), [
    "deferred",
    "two",
    "one",
  ]);
  assert.equal(store.snapshot().deferred.length, 0);
  store.push({ title: "overflow" });
  assert.deepEqual(store.snapshot().queue.map((item) => item.title), [
    "overflow",
    "deferred",
    "two",
  ]);
  store.dismiss("id-4");
  assert.deepEqual(store.snapshot().queue.map((item) => item.title), [
    "deferred",
    "two",
  ]);
  time += 100;
  store.push({ title: "same-cue" });
  assert.equal(cues.filter((cue) => cue === "comms-notify-toast-in").length, 3);
  time += 300;
  store.push({ title: "later-cue" });
  assert.equal(cues.filter((cue) => cue === "comms-notify-toast-in").length, 4);
  store.dismissAll();
  assert.equal(store.snapshot().queue.length, 0);
  assert.equal(store.snapshot().deferred.length, 0);
});

test("Signal arrival tracker seeds history, ignores self/duplicates, and resets worlds", () => {
  const tracker = new SignalArrivalTracker();
  const first = conversation([message("history")]);
  assert.deepEqual(tracker.update("world-a", [first]), []);
  const second = conversation([
    ...first.messages,
    message("incoming", {
      timestamp: "2026-08-31T11:00:00Z",
    }),
    message("self", {
      sender: "我",
      self: true,
      timestamp: "2026-08-31T11:01:00Z",
    }),
  ]);
  const arrivals = tracker.update("world-a", [second]);
  assert.deepEqual(arrivals.map((arrival) => arrival.message.messageId), [
    "incoming",
  ]);
  assert.deepEqual(tracker.update("world-a", [second]), []);
  assert.equal(signalArrivalPreview(message("preview", { body: "a\nb" })), "a b");
  assert.equal(
    signalArrivalPreview(message("photo", { kind: "image" }), {
      recalled: "已撤回",
      image: "照片",
      file: "文件",
    }),
    "照片",
  );
  assert.deepEqual(tracker.update("world-c", []), []);
  assert.deepEqual(tracker.update("world-c", [first]), []);
  assert.deepEqual(tracker.update("world-b", [first]), []);
  assert.equal(
    tracker.update("world-b", [
      conversation([message("new", { timestamp: "2026-09-01T10:00:00Z" })]),
    ]).length,
    1,
  );
});

test("Signal pending focus is single-consumer and observable", () => {
  const store = createSignalPendingFocusStore();
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  store.set("thread-a");
  store.set("thread-a");
  assert.equal(updates, 1);
  assert.equal(store.get(), "thread-a");
  assert.equal(store.consume(), "thread-a");
  assert.equal(store.get(), null);
  assert.equal(updates, 2);
  unsubscribe();
});
