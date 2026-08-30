import type { JsonValue } from "../runtime/protocol";
import type { ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import { signalStoryTimestampFromEpoch } from "./signal-story-clock";

const SIGNAL_SELF_SENDER = "我";

export interface SignalThread {
  threadId: string;
  title: string;
  participants: string[];
  avatarPath?: string;
  service: boolean;
  status?: string;
  raw: Readonly<Record<string, JsonValue>>;
}

export interface SignalMessageDimensions {
  width?: number;
  height?: number;
}

export interface SignalMessage {
  threadId: string;
  messageId: string;
  sender: string;
  kind: "text" | "image" | "file" | "deleted" | string;
  body: string;
  timestamp: string;
  readFact?: string;
  self: boolean;
  assetPath?: string;
  alt?: string;
  dimensions?: SignalMessageDimensions;
  fileName?: string;
  sizeBytes?: number;
  downloadFact?: string;
  /** Shipped Messenger uses this clock to order surfaced/local messages. */
  sortMs?: number;
  raw: Readonly<Record<string, JsonValue>>;
}

export interface SignalConversation {
  thread: SignalThread;
  messages: SignalMessage[];
}

function objectValue(value: JsonValue | undefined): Record<string, JsonValue> | undefined {
  if (!value || Array.isArray(value) || typeof value !== "object") return undefined;
  return value;
}

function numberValue(value: JsonValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: JsonValue | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function firstString(
  raw: Readonly<Record<string, JsonValue>>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string") return value;
  }
  return "";
}

function normalizeThread(
  fallbackId: string,
  raw: Record<string, JsonValue>,
): SignalThread {
  const threadId = firstString(raw, "threadId", "thread_id") || fallbackId;
  const avatarPath = firstString(raw, "avatarPath", "avatar_path");
  return {
    threadId,
    title: firstString(raw, "title", "name") || threadId,
    participants: stringArray(raw.participants),
    avatarPath: avatarPath || undefined,
    service: raw.service === true,
    status: firstString(raw, "status") || undefined,
    raw,
  };
}

function normalizeMessage(
  fallbackId: string,
  raw: Record<string, JsonValue>,
  surfacedAt?: number,
): SignalMessage {
  const dimensions = objectValue(raw.dimensions);
  const readFact = firstString(raw, "readFact", "read_fact");
  const assetPath = firstString(raw, "assetPath", "asset_path", "src");
  const downloadFact = firstString(raw, "downloadFact", "download_fact");
  const fileName = firstString(raw, "fileName", "file_name", "filename");
  const sender = firstString(raw, "sender", "from");
  const explicitTimestamp = firstString(raw, "timestamp", "date");
  const hasSurfacedAt = typeof surfacedAt === "number" && Number.isFinite(surfacedAt) && surfacedAt > 0;

  return {
    threadId: firstString(raw, "threadId", "thread_id"),
    messageId: firstString(raw, "messageId", "message_id") || fallbackId,
    sender,
    kind: firstString(raw, "kind", "type") || "text",
    body: firstString(raw, "body", "body_md", "text"),
    timestamp: explicitTimestamp || (hasSurfacedAt ? signalStoryTimestampFromEpoch(surfacedAt) : ""),
    readFact: readFact || undefined,
    self: raw.self === true || sender === SIGNAL_SELF_SENDER,
    assetPath: assetPath || undefined,
    alt: firstString(raw, "alt") || undefined,
    dimensions: dimensions
      ? {
          width: numberValue(dimensions.width),
          height: numberValue(dimensions.height),
        }
      : undefined,
    fileName: fileName || undefined,
    sizeBytes:
      numberValue(raw.sizeBytes) ??
      numberValue(raw.size_bytes) ??
      numberValue(raw.size),
    downloadFact: downloadFact || undefined,
    sortMs: !explicitTimestamp && hasSurfacedAt ? surfacedAt : undefined,
    raw,
  };
}

function parsedTimestamp(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Exact shipped comparator used when static and local Signal messages are merged. */
export function compareSignalMessages(left: SignalMessage, right: SignalMessage): number {
  const leftSurfaced = left.sortMs !== undefined;
  const rightSurfaced = right.sortMs !== undefined;
  if (leftSurfaced !== rightSurfaced) return leftSurfaced ? 1 : -1;

  const leftTime = left.sortMs ?? parsedTimestamp(left.timestamp);
  const rightTime = right.sortMs ?? parsedTimestamp(right.timestamp);
  if (leftTime !== rightTime) return leftTime - rightTime;

  return left.messageId.localeCompare(right.messageId, undefined, { numeric: true });
}

export class MessengerAppModel {
  constructor(
    private readonly artifacts: ArtifactService,
    private readonly manifold: ManifoldService,
  ) {}

  async conversations(): Promise<SignalConversation[]> {
    const [threads, messages] = await Promise.all([
      this.artifacts.signalThreads<Record<string, JsonValue>>(),
      this.artifacts.signalMessages<Record<string, JsonValue>>(),
    ]);

    const normalizedMessages = messages
      .filter((item) => item.type === "signal_message")
      .map((item) => normalizeMessage(item.id, item.data, item.surfacedAt));

    return threads
      .filter((item) => item.type === "signal_thread")
      .map((item) => normalizeThread(item.id, item.data))
      .map((thread) => ({
        thread,
        messages: normalizedMessages
          .filter((message) => message.threadId === thread.threadId)
          .sort(compareSignalMessages),
      }));
  }

  /** Shipped MessengerScreen marks the entire conversation read by threadId. */
  async markThreadRead(threadId: string): Promise<void> {
    await this.manifold.command("signal.read", { threadId });
  }

  async emitDownloadFact(factId: string): Promise<void> {
    await this.manifold.command("client.emitFact", { factId });
  }
}
