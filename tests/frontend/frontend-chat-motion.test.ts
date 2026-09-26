import assert from "node:assert/strict";
import test from "node:test";
import { retainExiting } from "../../frontend-src/components/chat-motion";
import {
  conversationStackOffset,
  isChipReadoutVisible,
} from "../../frontend-src/components/conversation-motion";

test("conversationStackOffset is 94 while the chip readout is on screen and 12 at rest", () => {
  assert.equal(conversationStackOffset(true), 94);
  assert.equal(conversationStackOffset(false), 12);
});

test("chip readout visibility follows the 30s ChipReadout deadline", () => {
  const readout = { receivedAt: 1_000 };
  assert.equal(isChipReadoutVisible(null, 1_000), false);
  assert.equal(isChipReadoutVisible(readout, 1_000 + 30_000 - 1), true);
  assert.equal(isChipReadoutVisible(readout, 1_000 + 30_000), false);
});

test("retainExiting keeps removed ids until the deadline, appends new ids, and drops expired ones", () => {
  const previous = [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
    { id: "c", text: "C", exiting: 100 },
    { id: "e", text: "E", exiting: 450 },
  ];
  const next = [
    { id: "a", text: "A2" },
    { id: "d", text: "D" },
  ];
  const retained = retainExiting(previous, next, 100, 300);
  assert.deepEqual(
    retained.map((item) => [item.id, item.text, item.exiting ?? null]),
    [
      ["a", "A2", null],
      ["b", "B", 400],
      ["e", "E", 450],
      ["d", "D", null],
    ],
  );
});

test("retainExiting drops the deadline when a removed id returns", () => {
  const retained = retainExiting(
    [{ id: "a", text: "A", exiting: 500 }],
    [{ id: "a", text: "A" }],
    100,
    300,
  );
  assert.equal(retained.length, 1);
  assert.equal(retained[0].exiting, undefined);
});
