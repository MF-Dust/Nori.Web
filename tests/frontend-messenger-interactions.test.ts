import assert from "node:assert/strict";
import test from "node:test";
import {
  compareSignalConversationRecency,
  createSignalLocalReadFactsStore,
  formatSignalThreadTimestamp,
  groupSignalMessages,
  draftAfterSuccessfulSend,
  signalConversationUnreadCount,
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
    {
      ...message("misflagged-self", "2026-08-31T09:30:00"),
      self: true,
    },
    message("reread-a", "2026-08-31T10:00:00"),
  ];
  const facts = new Set(["daniel.deadman.delivered"]);
  const hasFact = (fact: string) => facts.has(fact);

  assert.deepEqual(
    signalThreadReadState(thread, messages, new Set(), hasFact),
    {
      read: false,
      unreadCount: 4,
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
      unreadCount: 2,
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
  assert.deepEqual(
    signalThreadReadState(
      {
        ...thread,
        reread: undefined,
        unreadFrom: "2026-09-01T00:00:00",
      },
      messages,
      new Set(),
      hasFact,
    ),
    {
      read: false,
      unreadCount: 0,
      pendingReadFacts: ["signal.daniel.read"],
    },
    "read persistence is driven by pending facts even when no messages fall inside the unread window",
  );
});


test("Signal thread timestamps use shipped numeric month/day outside story today", () => {
  const now = new Date(2026, 7, 31, 14, 0, 0);
  const old = new Date(2026, 7, 18, 9, 5, 0);
  assert.equal(
    formatSignalThreadTimestamp("2026-08-18T09:05:00", now),
    old.toLocaleDateString([], { month: "numeric", day: "numeric" }),
  );
  assert.equal(
    formatSignalThreadTimestamp("2026-08-31T09:05:00", now),
    new Date(2026, 7, 31, 9, 5, 0).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
});

test("Signal date groups preserve shipped empty-timestamp continuation and month/day labels", () => {
  const message = (id: string, timestamp: string) => ({
    threadId: "fixture",
    messageId: id,
    sender: "Fixture",
    kind: "text",
    body: id,
    timestamp,
    self: false,
    raw: {},
  });
  const now = new Date(2026, 7, 31, 14, 0, 0);
  const grouped = groupSignalMessages(
    [
      message("dated", "2026-08-18T09:00:00"),
      message("missing", ""),
      message("today", "2026-08-31T09:00:00"),
      message("invalid", "not-a-date"),
    ],
    now,
  );
  assert.equal(grouped.length, 2);
  assert.deepEqual(grouped[0].messages.map((item) => item.messageId), [
    "dated",
    "missing",
  ]);
  assert.deepEqual(grouped[1].messages.map((item) => item.messageId), [
    "today",
    "invalid",
  ]);
  assert.deepEqual(grouped[1].separator, { kind: "today" });
  assert.deepEqual(grouped[0].separator, {
    kind: "date",
    label: new Date(2026, 7, 18, 9, 0, 0).toLocaleDateString([], {
      month: "long",
      day: "numeric",
    }),
  });
  assert.deepEqual(
    groupSignalMessages([message("invalid-first", "")], now),
    [{ key: "", separator: null, messages: [message("invalid-first", "")] }],
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


test("Signal Dock badge sums shipped per-thread unread counts", () => {
  const makeConversation = (
    threadId: string,
    readFact: string | undefined,
    messageCount: number,
  ) => ({
    thread: {
      threadId,
      title: threadId,
      participants: [],
      service: false,
      readFact,
      unreadFrom: "2026-08-01T00:00:00",
      raw: {},
    },
    messages: Array.from({ length: messageCount }, (_, index) => ({
      threadId,
      messageId: `${threadId}-${index}`,
      sender: threadId,
      kind: "text",
      body: "fixture",
      timestamp: `2026-08-${String(index + 10).padStart(2, "0")}T12:00:00`,
      self: false,
      raw: {},
    })),
  });
  const conversations = [
    makeConversation("one", "one.read", 2),
    makeConversation("two", "two.read", 3),
    makeConversation("always-read", undefined, 4),
  ];
  const facts = new Set(["two.read"]);
  assert.equal(
    signalConversationUnreadCount(
      conversations,
      (fact: string) => facts.has(fact),
    ),
    2,
  );
});


test("Signal local read facts publish once and feed the same Dock unread reducer", () => {
  const store = createSignalLocalReadFactsStore();
  let publishes = 0;
  const unsubscribe = store.subscribe(() => publishes++);
  const conversation = {
    thread: {
      threadId: "shared",
      title: "Shared",
      participants: [],
      service: false,
      readFact: "shared.read",
      raw: {},
    },
    messages: [{
      threadId: "shared",
      messageId: "m1",
      sender: "Shared",
      kind: "text",
      body: "fixture",
      timestamp: "2026-08-31T10:00:00",
      self: false,
      raw: {},
    }],
  };

  assert.equal(
    signalConversationUnreadCount([conversation], undefined, store.snapshot()),
    1,
  );
  store.mark(["shared.read"]);
  assert.equal(publishes, 1);
  assert.equal(
    signalConversationUnreadCount([conversation], undefined, store.snapshot()),
    0,
  );
  store.mark(["shared.read"]);
  assert.equal(publishes, 1, "duplicate local reads must not republish");
  store.clear();
  assert.equal(publishes, 2);
  unsubscribe();
});
