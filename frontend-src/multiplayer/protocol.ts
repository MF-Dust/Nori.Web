import type { JsonValue } from "../runtime/protocol";
import type { JsonPatchOperation } from "../runtime/json-patch";
import type { CartridgeSnapshot } from "../runtime/world-store";
import type { BuiltInGame } from "../services/games";

export const PEER_PROTOCOL_VERSION = 1;
export const MULTIPLAYER_GAMES: readonly BuiltInGame[] = ["chess", "codenames", "cakeduel", "pictionary"];

export type GameCommand = { type: string; [key: string]: JsonValue };

/** Messages on the peer link. The host is authoritative; the guest never talks to a backend. */
export type PeerMessage =
  | { t: "hello"; v: number; game: BuiltInGame; role: "host" | "guest"; room: string; name?: string }
  /** Host -> guest: time left on the guest's turn, or `null` when no clock runs. */
  | { t: "clock"; remainingMs: number | null }
  | { t: "view"; runtime: CartridgeSnapshot | null }
  | { t: "transition"; version: number; runtime: CartridgeSnapshot; transition: Record<string, JsonValue> }
  | { t: "dispatch"; requestId: string; expectedHeadVersion: number; cmd: GameCommand }
  | { t: "ack"; requestId: string; success: boolean; headVersion: number; error?: string; errorCode?: string }
  | { t: "strokes"; roundId: string; strokes: JsonValue[] }
  | { t: "ping"; at: number }
  | { t: "pong"; at: number }
  | { t: "bye" };

/**
 * Commands the remote seat may send. Starting, resetting, tutorials and debug
 * fixtures stay with the host: they reseed or rewrite the authoritative game.
 */
export const GUEST_COMMANDS: Readonly<Record<BuiltInGame, ReadonlySet<string>>> = {
  chess: new Set(["move", "offerDraw", "cancelDrawOffer", "respondDraw", "requestTakeback", "cancelTakebackRequest", "respondTakeback", "resign"]),
  codenames: new Set(["submitClue", "submitGuess", "endTurn"]),
  cakeduel: new Set(["play"]),
  pictionary: new Set(["submitGuess", "skipRound", "startNextRound", "forceEndSession", "submitStrokeBatch"]),
};

/** Host commands that only make sense against Nori and would stall a human seat. */
export function hostCommandBlocked(game: BuiltInGame, cmd: GameCommand): boolean {
  if (cmd.type === "debugLoadScenario" || cmd.type === "debugSetDealtCardGuarantee" || cmd.type === "tutorialLoadStage") return true;
  return cmd.type === "startGame" && cmd.mode === "tutorial" && game !== "pictionary";
}

const MAX_COMMAND_BYTES = 64 * 1024;

export function parsePeerMessage(raw: string): PeerMessage | null {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const message = value as Record<string, unknown>;
  switch (message.t) {
    case "hello":
      if (typeof message.game !== "string" || (message.role !== "host" && message.role !== "guest") || typeof message.room !== "string") return null;
      return { ...message, name: cleanName(message.name) } as PeerMessage;
    case "clock":
      return message.remainingMs === null || (typeof message.remainingMs === "number" && message.remainingMs >= 0 && message.remainingMs <= 3_600_000)
        ? message as PeerMessage : null;
    case "view":
      return message.runtime === null || isRuntime(message.runtime) ? message as PeerMessage : null;
    case "transition":
      return typeof message.version === "number" && isRuntime(message.runtime) && isRecord(message.transition) ? message as PeerMessage : null;
    case "dispatch": {
      const cmd = message.cmd as Record<string, unknown> | undefined;
      return typeof message.requestId === "string" && message.requestId.length <= 100
        && Number.isInteger(message.expectedHeadVersion) && (message.expectedHeadVersion as number) >= 0
        && isRecord(cmd) && typeof cmd.type === "string" && cmd.type.length > 0
        && raw.length <= MAX_COMMAND_BYTES ? message as PeerMessage : null;
    }
    case "ack":
      return typeof message.requestId === "string" && typeof message.success === "boolean" && typeof message.headVersion === "number"
        ? message as PeerMessage : null;
    case "strokes":
      return typeof message.roundId === "string" && Array.isArray(message.strokes) && message.strokes.length <= 512 ? message as PeerMessage : null;
    case "ping":
    case "pong":
      return typeof message.at === "number" ? message as PeerMessage : null;
    case "bye":
      return { t: "bye" };
    default:
      return null;
  }
}

/** Peer names are display text only: trimmed, single line, bounded. */
export function cleanName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const name = value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
  return name || undefined;
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRuntime(value: unknown): value is CartridgeSnapshot {
  if (!isRecord(value)) return false;
  return typeof value.headVersion === "number" && typeof value.visibleVersion === "number"
    && typeof value.visibilityFenceId === "string" && isRecord(value.state);
}

function escapeToken(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** Top-level patches (the Arcade patch contract forbids root replacement). */
export function topLevelPatch(before: Record<string, JsonValue>, after: Record<string, JsonValue>): JsonPatchOperation[] {
  const patches: JsonPatchOperation[] = [];
  for (const key of Object.keys(before)) if (!(key in after)) patches.push({ op: "remove", path: `/${escapeToken(key)}` });
  for (const [key, value] of Object.entries(after)) {
    if (!(key in before)) patches.push({ op: "add", path: `/${escapeToken(key)}`, value });
    else if (JSON.stringify(before[key]) !== JSON.stringify(value)) patches.push({ op: "replace", path: `/${escapeToken(key)}`, value });
  }
  return patches;
}
