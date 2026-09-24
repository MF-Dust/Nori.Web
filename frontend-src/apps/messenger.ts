import type { JsonValue } from "../runtime/protocol";
import type { ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import { parseSignalTimestamp, signalStoryTimestampFromEpoch } from "./signal-story-clock";

const SIGNAL_SELF_SENDER = "我";
const SIGNAL_MESSAGE_KINDS = new Set(["text", "image", "deleted", "file"]);

export interface SignalThreadReread {
  when: string;
  readFact: string;
  unreadFrom?: string;
}

export interface SignalThread {
  threadId: string;
  title: string;
  participants: string[];
  avatarPath?: string;
  service: boolean;
  status?: string;
  unreadFrom?: string;
  readFact?: string;
  reread?: SignalThreadReread;
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

function normalizeThreadReread(
  value: JsonValue | undefined,
): SignalThreadReread | undefined {
  const raw = objectValue(value);
  if (!raw) return undefined;
  const when = firstString(raw, "when");
  const readFact = firstString(raw, "readFact", "read_fact");
  if (!when || !readFact) return undefined;
  const unreadFrom = firstString(raw, "unreadFrom", "unread_from");
  return {
    when,
    readFact,
    unreadFrom: unreadFrom || undefined,
  };
}

function normalizeThread(
  raw: Record<string, JsonValue>,
): SignalThread | undefined {
  const threadId = firstString(raw, "threadId", "thread_id");
  const title = firstString(raw, "title", "name");
  if (!threadId || !title) return undefined;
  const avatarPath = firstString(raw, "avatarPath", "avatar_path");
  const unreadFrom = firstString(raw, "unreadFrom", "unread_from");
  const readFact = firstString(raw, "readFact", "read_fact");
  return {
    threadId,
    title,
    participants: stringArray(raw.participants),
    avatarPath: avatarPath || undefined,
    service: raw.service === true,
    status: firstString(raw, "status") || undefined,
    unreadFrom: unreadFrom || undefined,
    readFact: readFact || undefined,
    reread: normalizeThreadReread(raw.reread),
    raw,
  };
}

function normalizeMessage(
  raw: Record<string, JsonValue>,
  surfacedAt?: number,
): SignalMessage | undefined {
  const threadId = firstString(raw, "threadId", "thread_id");
  const messageId = firstString(raw, "messageId", "message_id");
  const sender = firstString(raw, "sender", "from");
  if (!threadId || !messageId || !sender) return undefined;

  const rawKind = firstString(raw, "kind", "type");
  const kind = SIGNAL_MESSAGE_KINDS.has(rawKind) ? rawKind : "text";
  const rawDimensions = objectValue(raw.dimensions);
  const width = rawDimensions ? numberValue(rawDimensions.width) : undefined;
  const height = rawDimensions ? numberValue(rawDimensions.height) : undefined;
  const dimensions =
    width !== undefined && height !== undefined ? { width, height } : undefined;
  const readFact = firstString(raw, "readFact", "read_fact");
  const assetPath = firstString(raw, "assetPath", "asset_path", "src");
  const downloadFact = firstString(raw, "downloadFact", "download_fact");
  const fileName = firstString(raw, "fileName", "file_name", "filename");
  const explicitTimestamp = firstString(raw, "timestamp", "date");
  const hasSurfacedAt =
    typeof surfacedAt === "number" &&
    Number.isFinite(surfacedAt) &&
    surfacedAt > 0;
  const rawSize =
    numberValue(raw.sizeBytes) ??
    numberValue(raw.size_bytes) ??
    numberValue(raw.size);

  return {
    threadId,
    messageId,
    sender,
    kind,
    body: firstString(raw, "body", "body_md", "text"),
    timestamp:
      explicitTimestamp ||
      (hasSurfacedAt ? signalStoryTimestampFromEpoch(surfacedAt) : ""),
    readFact: readFact || undefined,
    self: raw.self === true || sender === SIGNAL_SELF_SENDER,
    assetPath: assetPath || undefined,
    alt: firstString(raw, "alt") || undefined,
    dimensions,
    fileName: fileName || undefined,
    sizeBytes: rawSize !== undefined && rawSize > 0 ? rawSize : undefined,
    downloadFact: downloadFact || undefined,
    sortMs: !explicitTimestamp && hasSurfacedAt ? surfacedAt : undefined,
    raw,
  };
}

function parsedTimestamp(timestamp: string): number {
  const parsed = parseSignalTimestamp(timestamp).getTime();
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
      .map((item) => normalizeMessage(item.data, item.surfacedAt))
      .filter((message): message is SignalMessage => message !== undefined);

    return threads
      .filter((item) => item.type === "signal_thread")
      .map((item) => normalizeThread(item.data))
      .filter((thread): thread is SignalThread => thread !== undefined)
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
