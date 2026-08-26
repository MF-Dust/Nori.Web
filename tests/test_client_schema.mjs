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
console.log(`[ok] ${samples.length} local message envelopes accepted by shipped parser`);
