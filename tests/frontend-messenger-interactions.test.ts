import assert from "node:assert/strict";
import test from "node:test";
import {
  compareSignalConversationRecency,
  draftAfterSuccessfulSend,
  isConversationNearBottom,
  isMessageCompositionActive,
  shouldSubmitMessageKey,
  signalThreadReadState,
} from "../frontend-src/apps/messenger-interactions";

test("message Enter handling does not submit an IME confirmation", () => {
  assert.equal(shouldSubmitMessageKey({ key: "Enter" }), true);
  assert.equal(
    shouldSubmitMessageKey({ key: "Enter", shiftKey: true }, false, true),
    false,
  );
  assert.equal(shouldSubmitMessageKey({ key: "Enter" }, true), false);
  assert.equal(
    shouldSubmitMessageKey({
      key: "Enter",
      nativeEvent: { isComposing: true },
    }),
    false,
  );
  assert.equal(shouldSubmitMessageKey({ key: "Enter", keyCode: 229 }), false);
  assert.equal(
    isMessageCompositionActive({ key: "Process", keyCode: 229 }),
    true,
  );
});

test("conversation scroll follows only readers already near the newest message", () => {
  assert.equal(
    isConversationNearBottom({
      scrollHeight: 1000,
      scrollTop: 552,
      clientHeight: 400,
    }),
    true,
  );
  assert.equal(
    isConversationNearBottom({
      scrollHeight: 1000,
      scrollTop: 551,
      clientHeight: 400,
    }),
    false,
  );
});

test("service send completion preserves text entered while the request was pending", () => {
  assert.equal(draftAfterSuccessfulSend("  sent text  ", "sent text"), "");
  assert.equal(
    draftAfterSuccessfulSend("next draft", "sent text"),
    "next draft",
  );
});


test("Signal unread state follows shipped thread read/reread windows", () => {
  const thread = {
    threadId: "daniel",
    title: "Daniel",
    participants: ["Daniel", "我"],
    service: true,
    unreadFrom: "2026-08-10T00:00:00",
    readFact: "signal.daniel.read",
    reread: {
      when: "daniel.deadman.delivered",
      readFact: "signal.daniel.dm1.read",
      unreadFrom: "2026-08-31T00:00:00",
    },
    raw: {},
  };
  const message = (
    id: string,
    timestamp: string,
    self = false,
  ) => ({
    threadId: "daniel",
    messageId: id,
    sender: self ? "我" : "Daniel",
    kind: "text",
    body: id,
    timestamp,
    self,
    raw: {},
  });
  const messages = [
    message("too-old", "2026-08-01T12:00:00"),
    message("initial-a", "2026-08-20T12:00:00"),
    message("initial-b", "2026-08-30T12:00:00"),
    message("self-after", "2026-08-31T09:00:00", true),
    message("reread-a", "2026-08-31T10:00:00"),
  ];
  const facts = new Set(["daniel.deadman.delivered"]);
  const hasFact = (fact: string) => facts.has(fact);

  assert.deepEqual(
    signalThreadReadState(thread, messages, new Set(), hasFact),
    {
      read: false,
      unreadCount: 3,
      pendingReadFacts: ["signal.daniel.read", "signal.daniel.dm1.read"],
    },
  );
  assert.deepEqual(
    signalThreadReadState(
      thread,
      messages,
      new Set(["signal.daniel.read"]),
      hasFact,
    ),
    {
      read: false,
      unreadCount: 1,
      pendingReadFacts: ["signal.daniel.dm1.read"],
    },
  );
  assert.deepEqual(
    signalThreadReadState(
      thread,
      messages,
      new Set(["signal.daniel.read", "signal.daniel.dm1.read"]),
      hasFact,
    ),
    { read: true, unreadCount: 0, pendingReadFacts: [] },
  );
  assert.deepEqual(
    signalThreadReadState(
      { ...thread, readFact: undefined, reread: undefined },
      messages,
      new Set(),
      hasFact,
    ),
    { read: true, unreadCount: 0, pendingReadFacts: [] },
  );
});

test("Signal thread recency matches shipped newest-message ordering", () => {
  const conversation = (threadId: string, timestamp?: string) => ({
    thread: {
      threadId,
      title: threadId,
      participants: [],
      service: false,
      raw: {},
    },
    messages: timestamp
      ? [{
          threadId,
          messageId: threadId + "-1",
          sender: threadId,
          kind: "text",
          body: threadId,
          timestamp,
          self: false,
          raw: {},
        }]
      : [],
  });
  const ordered = [
    conversation("older", "2026-08-20T10:00:00"),
    conversation("empty"),
    conversation("newer", "2026-08-31T10:00:00"),
  ].sort(compareSignalConversationRecency);
  assert.deepEqual(ordered.map((item) => item.thread.threadId), [
    "newer",
    "older",
    "empty",
  ]);
});
