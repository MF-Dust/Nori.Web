// Validates local server envelopes with the actual parser shipped by NoriOS.
import { j as parseServerMessage } from "../public/assets/i18n-DtIC1LRi.js";

const runtime = {
  visibilityFenceId: "ui",
  visibleVersion: 0,
  headVersion: 0,
  state: {},
};
const transition = {
  actor: "player",
  cmd: { type: "playerMessage", text: "hello" },
  patches: [{ op: "add", path: "/lines", value: [] }],
  events: [{ type: "player_message", messageId: "msg_1", content: "hello", createdAt: 1, version: 1, index: 0 }],
};
const samples = [
  { type: "world_created", world: { worldId: "world", mountedCartridges: [{ cartridgeId: "chat", runtimes: [runtime] }] }, session: { isAdmin: true } },
  { type: "world_joined", world: { worldId: "world", mountedCartridges: [{ cartridgeId: "chat", runtimes: [runtime] }] }, session: { isAdmin: true, mediaGrant: "grant" } },
  { type: "world_left", worldId: "world" },
  { type: "web_world_reset_ack", worldId: "world" },
  { type: "cartridge_mounted", worldId: "world", cartridgeId: "chess", transition: "created", runtimes: [runtime] },
  { type: "cartridge_mounted_ack", worldId: "world", cartridgeId: "chess", requestId: "r", transition: "created", runtimes: [runtime] },
  { type: "cartridge_unmounted", worldId: "world", cartridgeId: "chess" },
  { type: "cartridge_unmounted_ack", worldId: "world", cartridgeId: "chess", requestId: "r" },
  { type: "runtime_transition", worldId: "world", cartridgeId: "chat", version: 1, transition },
  { type: "visibility_fence_advanced", worldId: "world", cartridgeId: "chat", visibilityFenceId: "ui", visibleVersion: 1, headVersion: 1 },
  { type: "visibility_fence_advanced_ack", worldId: "world", cartridgeId: "chat", visibilityFenceId: "ui", visibleVersion: 1, headVersion: 1, requestId: "r" },
  { type: "dispatch_ack", worldId: "world", cartridgeId: "chat", requestId: "r", success: true, committed: true, committedVersion: 1, headVersion: 1, result: {} },
  { type: "dispatch_ack", worldId: "world", cartridgeId: "chat", requestId: "r", success: true, committed: false, headVersion: 1, result: {} },
  { type: "dispatch_ack", worldId: "world", cartridgeId: "chat", requestId: "r", success: false, headVersion: 1, error: "Version mismatch", errorCode: "version_mismatch" },
  { type: "event", worldId: "world", channel: "manifold.chip.status.result", cartridgeId: "chat", requestId: "r", payload: {} },
  { type: "error", code: "bad_request", message: "Invalid JSON", requestId: "r" },
  { type: "pong", serverId: "nori-local-arcade", now: 1 },
];

for (const message of samples) {
  const result = parseServerMessage(message);
  if (!result.success) throw new Error(`${message.type}: ${JSON.stringify(result.error.issues)}`);
}

// The samples above only prove that valid envelopes pass. The parser is strict,
// and that strictness is what makes a malformed envelope fail *silently*: the
// message is dropped and nothing reaches the UI, with no error surfaced to the
// player. These cases pin the two ways that happens, so a regression shows up
// here rather than as an unexplained frozen screen.
const rejections = [
  [
    "extra key",
    { type: "pong", serverId: "nori-local-arcade", now: 1, timestamp: 1 },
  ],
  [
    "missing required key",
    { type: "pong", now: 1 },
  ],
  [
    "extra key on a discriminated variant",
    { type: "dispatch_ack", worldId: "world", cartridgeId: "chat", requestId: "r", success: true, committed: true, committedVersion: 1, headVersion: 1, result: {}, serverId: "x" },
  ],
  [
    "unknown message type",
    { type: "definitely_not_a_message", worldId: "world" },
  ],
];

for (const [label, message] of rejections) {
  if (parseServerMessage(message).success) {
    throw new Error(`expected rejection (${label}): ${JSON.stringify(message)}`);
  }
}

// Optional fields must stay optional, so omitting one is not mistaken for a bug.
const optional = [
  ["pong without now", { type: "pong", serverId: "nori-local-arcade" }],
  ["event without payload", { type: "event", worldId: "world", channel: "manifold.chip.status.result", cartridgeId: "chat", requestId: "r" }],
];

for (const [label, message] of optional) {
  const result = parseServerMessage(message);
  if (!result.success) {
    throw new Error(`expected acceptance (${label}): ${JSON.stringify(result.error.issues)}`);
  }
}

console.log(
  `[ok] ${samples.length} local message envelopes accepted, ` +
    `${rejections.length} malformed rejected, ${optional.length} optional-field shapes accepted`,
);
