import type { JsonValue } from "../runtime/protocol";
import type { ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";

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
  /** Shipped Messenger uses this for cross-source message ordering. */
  sortMs?: number;
  /** Older/static records may expose the same ordering clock under this key. */
  createdAtMs?: number;
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

function stringValue(value: JsonValue | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
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
): SignalMessage {
  const dimensions = objectValue(raw.dimensions);
  const readFact = firstString(raw, "readFact", "read_fact");
  const assetPath = firstString(raw, "assetPath", "asset_path", "src");
  const downloadFact = firstString(raw, "downloadFact", "download_fact");
  const fileName = firstString(raw, "fileName", "file_name", "filename");
  return {
    threadId: firstString(raw, "threadId", "thread_id"),
    messageId: firstString(raw, "messageId", "message_id") || fallbackId,
    sender: firstString(raw, "sender", "from"),
    kind: firstString(raw, "kind", "type") || "text",
    body: firstString(raw, "body", "body_md", "text"),
    timestamp: firstString(raw, "timestamp", "date"),
    readFact: readFact || undefined,
    self: raw.self === true,
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
    sortMs: numberValue(raw.sortMs) ?? numberValue(raw.sort_ms),
    createdAtMs: numberValue(raw.createdAtMs) ?? numberValue(raw.created_at_ms),
    raw,
  };
}

function messageSortTime(message: SignalMessage): number {
  if (message.sortMs !== undefined) return message.sortMs;
  if (message.createdAtMs !== undefined) return message.createdAtMs;
  const parsed = Date.parse(message.timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
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
      .map((item) => normalizeMessage(item.id, item.data));

    return threads
      .filter((item) => item.type === "signal_thread")
      .map((item) => normalizeThread(item.id, item.data))
      .map((thread) => ({
        thread,
        messages: normalizedMessages
          .filter((message) => message.threadId === thread.threadId)
          .sort((a, b) => messageSortTime(a) - messageSortTime(b)),
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
