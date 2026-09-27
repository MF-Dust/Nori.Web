import assert from "node:assert/strict";
import test from "node:test";
import { MessengerAppModel } from "../../frontend-src/apps/messenger";

test("Signal artifact parser matches shipped required fields and kind fallbacks", async () => {
  const artifacts = {
    async signalThreads() {
      return [
        {
          id: "valid-artifact",
          type: "signal_thread",
          data: {
            thread_id: "valid",
            title: "Valid",
            participants: ["Valid", "我"],
          },
        },
        {
          id: "missing-title",
          type: "signal_thread",
          data: { thread_id: "missing-title" },
        },
      ];
    },
    async signalMessages() {
      return [
        {
          id: "valid-message-artifact",
          type: "signal_message",
          data: {
            thread_id: "valid",
            message_id: "valid-1",
            sender: "Valid",
            kind: "future-kind",
            body_md: "falls back to text",
            dimensions: { width: 320 },
            size_bytes: 0,
          },
        },
        {
          id: "surface-message-artifact",
          type: "signal_message",
          surfacedAt: new Date(2026, 7, 31, 12, 0, 0).getTime(),
          data: {
            thread_id: "valid",
            message_id: "valid-2",
            sender: "我",
            kind: "image",
            dimensions: { width: 320, height: 180 },
            size_bytes: 4096,
          },
        },
        {
          id: "missing-sender-artifact",
          type: "signal_message",
          data: {
            thread_id: "valid",
            message_id: "bad-1",
            body_md: "must be discarded",
          },
        },
        {
          id: "missing-message-id-artifact",
          type: "signal_message",
          data: {
            thread_id: "valid",
            sender: "Valid",
            body_md: "artifact id is not a shipped message-id fallback",
          },
        },
      ];
    },
  };
  const model = new MessengerAppModel(artifacts as never, {} as never);
  const conversations = await model.conversations();
  assert.equal(conversations.length, 1);
  assert.equal(conversations[0].thread.threadId, "valid");
  assert.deepEqual(
    conversations[0].messages.map((message) => message.messageId),
    ["valid-1", "valid-2"],
  );
  assert.equal(conversations[0].messages[0].kind, "text");
  assert.equal(conversations[0].messages[0].dimensions, undefined);
  assert.equal(conversations[0].messages[0].sizeBytes, undefined);
  assert.deepEqual(conversations[0].messages[1].dimensions, {
    width: 320,
    height: 180,
  });
  assert.equal(conversations[0].messages[1].sizeBytes, 4096);
  assert.equal(conversations[0].messages[1].self, true);
  assert.equal(conversations[0].messages[1].sortMs !== undefined, true);
});
