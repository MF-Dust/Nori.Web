import type { SignalMessage, SignalThread } from "./messenger";
import type { JsonValue } from "../runtime/protocol";
import type { ManifoldService } from "../services/manifold";

export const SIGNAL_DANIEL_THREAD_ID = "daniel";
export const SIGNAL_DANIEL_DEADMAN_FACT = "daniel.deadman.delivered";
export const SIGNAL_DANIEL_EVIDENCE_FACT = "daniel.evidence_unlocked";
export const SIGNAL_DANIEL_VERIFY_COMMAND = "signal.daniel.verify";
export const SIGNAL_DANIEL_REPLY_CUE = "comms-signal-bot-reply";
export const SIGNAL_DANIEL_COMPOSER_PLACEHOLDER = "Ask Daniel...";
export const SIGNAL_DANIEL_SERVICE_BADGE = "System";

export interface SignalDanielStoryCursor {
  seq: string | number | null;
  threadId: string | null;
}

export interface SignalDanielRuntimeVerifyResponse {
  ok: boolean;
  result?: {
    reply?: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SignalDanielRuntimeOptions {
  manifold: Pick<ManifoldService, "command">;
  hasFact: (factId: string) => boolean;
  initialStoryCursor?: Partial<SignalDanielStoryCursor>;
  /** Production uses its story-adjusted clock for the displayed timestamp. */
  timestampNow?: () => number;
  /** Production uses Date.now() for local merge ordering. */
  sortNow?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  playCue?: (cue: string) => void;
}

export interface SignalDanielSnapshot {
  messages: readonly SignalMessage[];
  typing: boolean;
  resumed: boolean;
  lastSeq: string | number | null;
  threadId: string | null;
  revision: number;
}

type Listener = () => void;

function isRecord(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value);
}

function parseVerifyResponse(value: JsonValue): SignalDanielRuntimeVerifyResponse {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return {
      ok: false,
      error: {
        code: "signal_daniel_bad_response",
        message: "Invalid response.",
      },
    };
  }

  const response: SignalDanielRuntimeVerifyResponse = { ok: value.ok };
  if (isRecord(value.result)) {
    response.result = {
      reply: Array.isArray(value.result.reply)
        ? value.result.reply.filter((item): item is string => typeof item === "string")
        : undefined,
    };
  }
  if (isRecord(value.error)) {
    response.error = {
      code: typeof value.error.code === "string" ? value.error.code : "signal_daniel_error",
      message: typeof value.error.message === "string" ? value.error.message : "Request failed.",
    };
  }
  return response;
}

function formatTimestamp(milliseconds: number): string {
  const date = new Date(milliseconds);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function signalDanielReplyDelay(body: string): number {
  return Math.min(1600, 480 + body.trim().length * 22);
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function sortTime(message: SignalMessage): number {
  if (typeof message.sortMs === "number" && Number.isFinite(message.sortMs)) return message.sortMs;
  if (typeof message.createdAtMs === "number" && Number.isFinite(message.createdAtMs)) return message.createdAtMs;
  const parsed = Date.parse(message.timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Source-owned clean-room recovery of the shipped Daniel Signal service thread.
 * The story fact provider and story cursor remain explicit host boundaries.
 */
export class SignalDanielConversationRuntime {
  private readonly listeners = new Set<Listener>();
  private readonly localMessages: SignalMessage[] = [];
  private readonly timestampNow: () => number;
  private readonly sortNow: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private typing = false;
  private resumed = false;
  private lastSeq: string | number | null;
  private storyThreadId: string | null;
  private revision = 0;
  private messageSequence = 0;

  constructor(private readonly options: SignalDanielRuntimeOptions) {
    this.timestampNow = options.timestampNow ?? Date.now;
    this.sortNow = options.sortNow ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.lastSeq = options.initialStoryCursor?.seq ?? null;
    this.storyThreadId = options.initialStoryCursor?.threadId ?? null;
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getRevision = (): number => this.revision;

  snapshot(): SignalDanielSnapshot {
    return {
      messages: [...this.localMessages],
      typing: this.typing,
      resumed: this.resumed,
      lastSeq: this.lastSeq,
      threadId: this.storyThreadId,
      revision: this.revision,
    };
  }

  isDanielThread(thread: SignalThread): boolean {
    return thread.threadId === SIGNAL_DANIEL_THREAD_ID && thread.service;
  }

  isInteractive = (thread: SignalThread): boolean =>
    this.isDanielThread(thread)
    && this.options.hasFact(SIGNAL_DANIEL_DEADMAN_FACT)
    && !this.options.hasFact(SIGNAL_DANIEL_EVIDENCE_FACT);

  isTyping = (thread: SignalThread): boolean => this.isDanielThread(thread) && this.typing;

  getComposerPlaceholder = (thread: SignalThread): string | undefined =>
    this.isDanielThread(thread) ? SIGNAL_DANIEL_COMPOSER_PLACEHOLDER : undefined;

  getServiceBadge = (thread: SignalThread): string | null | undefined => {
    if (!this.isDanielThread(thread)) return undefined;
    return this.options.hasFact(SIGNAL_DANIEL_DEADMAN_FACT)
      ? SIGNAL_DANIEL_SERVICE_BADGE
      : null;
  };

  onOpen = (thread: SignalThread): void => {
    if (this.isInteractive(thread)) void this.resumeOnce();
  };

  resolveMessages = (
    thread: SignalThread,
    staticMessages: readonly SignalMessage[],
  ): SignalMessage[] => {
    if (!this.isDanielThread(thread)) return [...staticMessages];

    const local = [...this.localMessages];
    const latestLocal = local.reduce((maximum, message) => Math.max(maximum, sortTime(message)), 0);
    const fileThreshold = latestLocal + 0.5;
    const base = this.typing
      ? staticMessages.filter((message) => message.kind !== "file")
      : staticMessages.map((message) => {
          if (message.kind !== "file" || typeof message.sortMs !== "number") return message;
          return { ...message, sortMs: Math.max(message.sortMs, fileThreshold) };
        });

    return [...base, ...local].sort((left, right) => sortTime(left) - sortTime(right));
  };

  syncStoryCursor(cursor: Partial<SignalDanielStoryCursor>): void {
    const seq = cursor.seq ?? null;
    const threadId = cursor.threadId ?? null;

    if (this.lastSeq === null) {
      this.lastSeq = seq;
      this.storyThreadId = threadId;
      this.notify();
      return;
    }

    if ((seq !== null && seq !== this.lastSeq) || (threadId !== null && threadId !== this.storyThreadId)) {
      this.localMessages.length = 0;
      this.typing = false;
      this.resumed = false;
      this.lastSeq = seq;
      this.storyThreadId = threadId;
      this.notify();
    }
  }

  send = async (thread: SignalThread, body: string): Promise<void> => {
    if (!this.isDanielThread(thread) || !body.trim()) return;

    this.localMessages.push(this.createMessage("user", body));
    this.notify();
    this.typing = true;
    this.notify();

    const response = await this.verify(body);
    if (response.ok && response.result) {
      for (const reply of response.result.reply ?? []) {
        await this.sleep(signalDanielReplyDelay(reply));
        this.localMessages.push(this.createMessage("assistant", reply));
        this.notify();
        this.options.playCue?.(SIGNAL_DANIEL_REPLY_CUE);
      }
    }

    this.typing = false;
    this.notify();
  };

  async resumeOnce(): Promise<void> {
    if (this.resumed) return;
    this.resumed = true;
    this.notify();
    if (this.localMessages.length > 0) return;

    const response = await this.verify();
    if (!response.ok || !response.result) return;
    for (const reply of response.result.reply ?? []) {
      this.localMessages.push(this.createMessage("assistant", reply));
      this.notify();
    }
  }

  async verify(answer?: string): Promise<SignalDanielRuntimeVerifyResponse> {
    const payload: Record<string, JsonValue> = {};
    if (answer !== undefined) payload.answer = answer;
    try {
      return parseVerifyResponse(
        await this.options.manifold.command(SIGNAL_DANIEL_VERIFY_COMMAND, payload),
      );
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "signal_daniel_event_failed",
          message: error instanceof Error ? error.message : "Request failed.",
        },
      };
    }
  }

  private createMessage(sender: "user" | "assistant", body: string): SignalMessage {
    const sortMs = this.sortNow();
    return {
      threadId: SIGNAL_DANIEL_THREAD_ID,
      messageId: `bot-${++this.messageSequence}`,
      sender: sender === "user" ? "我" : "OpenFlaw 助理",
      kind: "text",
      body,
      timestamp: formatTimestamp(this.timestampNow()),
      self: sender === "user",
      createdAtMs: sortMs,
      sortMs,
      raw: {},
    };
  }

  private notify(): void {
    this.revision += 1;
    for (const listener of this.listeners) listener();
  }
}
