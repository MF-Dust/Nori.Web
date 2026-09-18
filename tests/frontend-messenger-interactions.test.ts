import assert from "node:assert/strict";
import test from "node:test";
import {
  draftAfterSuccessfulSend,
  isConversationNearBottom,
  isMessageCompositionActive,
  shouldSubmitMessageKey,
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
