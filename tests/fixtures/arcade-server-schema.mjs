// Strict Arcade server-message schema, transcribed from the parser the shipped
// NoriOS client used (`Ld` in its i18n chunk, zod 4). The local server must keep
// producing envelopes that client accepted: a strict object silently drops a
// message with an extra or missing key, which surfaces as a frozen screen.
import { z } from "zod/v4";

const worldId = z.string();
const cartridgeId = z.string();
const actor = z.string();
const visibilityFenceId = z.string();
const requestId = z.string();
const version = z.number().int().nonnegative();
const record = z.record(z.string(), z.unknown());

const patch = z.object({ op: z.enum(["add", "remove", "replace"]), path: z.string(), value: z.unknown().optional() });
const event = z
  .object({ type: z.string(), version, index: z.number().int().nonnegative(), timestamp: z.number().optional() })
  .and(record);
const command = z.object({ type: z.string() }).and(record);
const transition = z.object({ actor, cmd: command, patches: z.array(patch), events: z.array(event) });
const runtime = z.object({ visibilityFenceId, visibleVersion: version, headVersion: version, state: z.unknown().optional() });
const mountedCartridge = z.object({ cartridgeId, runtimes: z.array(runtime) });
const world = z.object({ worldId, mountedCartridges: z.array(mountedCartridge) }).strict();
const worldScoped = z.object({ worldId }).strict();
const staleVisibilityFence = z.object({ visibilityFenceId: z.string(), visibleVersion: version, headVersion: version }).strict();
const mountTransition = z.enum(["created", "already_mounted"]);

const direct = z.union([
  z.object({ type: z.literal("world_created"), world, session: z.object({ isAdmin: z.boolean() }).strict() }).strict(),
  z.object({
    type: z.literal("world_joined"),
    world,
    session: z.object({ isAdmin: z.boolean(), mediaGrant: z.string().min(1).optional() }).strict(),
  }).strict(),
  z.object({ type: z.literal("world_left"), worldId }).strict(),
  z.object({ type: z.literal("web_world_reset_ack"), worldId }).strict(),
  z.object({ type: z.literal("cartridge_mounted_ack"), worldId, cartridgeId, requestId, transition: mountTransition, runtimes: z.array(runtime) }).strict(),
  z.object({ type: z.literal("cartridge_unmounted_ack"), worldId, cartridgeId, requestId }).strict(),
  z.union([
    z.object({
      type: z.literal("dispatch_ack"), worldId, cartridgeId, requestId,
      success: z.literal(true), committed: z.literal(true).optional(), committedVersion: version, headVersion: version, result: z.unknown().optional(),
    }).strict(),
    z.object({
      type: z.literal("dispatch_ack"), worldId, cartridgeId, requestId,
      success: z.literal(true), committed: z.literal(false), committedVersion: z.never().optional(), headVersion: version, result: z.unknown().optional(),
    }).strict(),
    z.object({
      type: z.literal("dispatch_ack"), worldId, cartridgeId, requestId,
      success: z.literal(false), headVersion: version, error: z.string(),
      errorCode: z.enum(["version_mismatch", "stale_visibility_fence", "dispatch_error", "command_rejected"]).optional(),
      staleVisibilityFence: staleVisibilityFence.optional(),
    }).strict(),
  ]),
  z.object({ type: z.literal("visibility_fence_advanced_ack"), worldId, cartridgeId, visibilityFenceId, visibleVersion: version, headVersion: version, requestId }).strict(),
  z.object({
    type: z.literal("error"), code: z.string(), message: z.string(),
    worldId: worldId.optional(), cartridgeId: cartridgeId.optional(), requestId: requestId.optional(), details: record.optional(),
  }).strict(),
  z.object({ type: z.literal("pong"), serverId: z.string(), now: z.number().int().optional() }).strict(),
]);
const broadcast = z.union([
  worldScoped.extend({ type: z.literal("cartridge_mounted"), cartridgeId, transition: mountTransition, runtimes: z.array(runtime) }).strict(),
  worldScoped.extend({ type: z.literal("cartridge_unmounted"), cartridgeId }).strict(),
  worldScoped.extend({ type: z.literal("runtime_transition"), cartridgeId, version, transition }).strict(),
  worldScoped.extend({ type: z.literal("visibility_fence_advanced"), cartridgeId, visibilityFenceId, visibleVersion: version, headVersion: version }).strict(),
  worldScoped.extend({
    type: z.literal("event"), channel: z.string(), cartridgeId: cartridgeId.optional(), requestId: requestId.optional(), payload: z.unknown(),
  }).strict(),
]);
const serverMessage = z.union([direct, broadcast]);

/** Like the shipped parser: pick the branch(es) by `type`, else try the full union. */
const byType = new Map();
(function index(schema) {
  if (schema instanceof z.ZodUnion) {
    for (const option of schema.options) index(option);
    return;
  }
  const type = schema.shape.type.value;
  byType.set(type, [...(byType.get(type) ?? []), schema]);
})(serverMessage);
const parsers = new Map([...byType].map(([type, schemas]) => [type, schemas.length === 1 ? schemas[0] : z.union(schemas)]));

export function parseServerMessage(message) {
  const type = typeof message === "object" && message !== null ? message.type : undefined;
  return ((typeof type === "string" && parsers.get(type)) || serverMessage).safeParse(message);
}
