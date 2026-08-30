import type { JsonValue } from "../runtime/protocol";
import type { ManifoldService } from "../services/manifold";
import {
  compareSignalMessages,
  type SignalMessage,
  type SignalThread,
} from "./messenger";
import { signalStoryTimestamp } from "./signal-story-clock";

export const SIGNAL_DANIEL_THREAD_ID = "daniel";
export const SIGNAL_DANIEL_UNLOCK_FACT = "signal_daniel.unlocked";
export const SIGNAL_DANIEL_DEADMAN_FACT = "daniel.deadman.delivered";
export const SIGNAL_DANIEL_EVIDENCE_FACT = "daniel.evidence_unlocked";
export const SIGNAL_DANIEL_VERIFY_COMMAND = "signal.daniel.verify";
export const SIGNAL_DANIEL_REPLY_CUE = "comms-signal-bot-reply";
export const SIGNAL_DANIEL_SELF_SENDER = "我";
export const SIGNAL_DANIEL_ASSISTANT_SENDER = "OpenFlaw 助理";

export interface SignalDanielRuntimeVerifyResponse {
  ok: boolean;
  result?: {
    reply?: string[];
  };
}

export interface SignalDanielRuntimeOptions {
  manifold: Pick<ManifoldService, "command">;
  hasFact: (factId: string) => boolean;
  /** Shipped local messages use the Signal story-adjusted calendar clock. */
  timestampNow?: () => Date;
  /** Shipped local merge ordering uses Date.now(). */
  sortNow?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  playCue?: (cue: string) => void;
  initialJumpEpoch?: unknown;
}

export interface SignalDanielSnapshot {
  messages: readonly SignalMessage[];
  typing: boolean;
  resumed: boolean;
  seq: number;
  revision: number;
}

type Listener = () => void;

function isRecord(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value);
}

function parseReplies(value: JsonValue): string[] {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.result)) return [];
  return Array.isArray(value.result.reply)
    ? value.result.reply.filter((item): item is string => typeof item === "string")
    : [];
}

export function signalDanielReplyDelay(body: string): number {
  return Math.min(1600, 480 + body.length * 22);
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function messageSortTime(message: SignalMessage): number {
  if (message.sortMs !== undefined) return message.sortMs;
  const parsed = Date.parse(message.timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Source-owned clean-room recovery of the shipped Daniel Signal service thread.
 * Story facts and the jump epoch remain explicit host inputs until their owning
 * NormalApp state boundary is migrated.
 */
export class SignalDanielConversationRuntime {
  private readonly listeners = new Set<Listener>();
  private readonly localMessages: SignalMessage[] = [];
  private readonly timestampNow: () => Date;
  private readonly sortNow: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private typing = false;
  private resumed = false;
  private seq = 0;
  private revision = 0;
  private jumpEpoch: unknown;
  private jumpEpochInitialized = false;

  constructor(private readonly options: SignalDanielRuntimeOptions) {
    this.timestampNow = options.timestampNow ?? (() => new Date());
    this.sortNow = options.sortNow ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
    if ("initialJumpEpoch" in options) {
      this.jumpEpoch = options.initialJumpEpoch;
      this.jumpEpochInitialized = true;
    }
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
      seq: this.seq,
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

  /** Daniel hides the generic service badge until the deadman fact has surfaced. */
  getServiceBadge = (thread: SignalThread): string | null | undefined => {
    if (!this.isDanielThread(thread)) return undefined;
    return this.options.hasFact(SIGNAL_DANIEL_DEADMAN_FACT) ? undefined : null;
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
    const latestLocal = local.reduce(
      (maximum, message) => Math.max(maximum, messageSortTime(message)),
      0,
    );

    const base = this.typing
      ? staticMessages.filter((message) => message.kind !== "file")
      : latestLocal > 0
        ? staticMessages.map((message) => {
            if (message.kind !== "file" || message.sortMs === undefined) return message;
            return { ...message, sortMs: Math.max(message.sortMs, latestLocal + 0.5) };
          })
        : [...staticMessages];

    return [...base, ...local].sort(compareSignalMessages);
  };

  /** Shipped runtime skips the first epoch observation and resets on later jumps. */
  syncJumpEpoch(epoch: unknown): void {
    if (!this.jumpEpochInitialized) {
      this.jumpEpoch = epoch;
      this.jumpEpochInitialized = true;
      return;
    }
    if (Object.is(epoch, this.jumpEpoch)) return;
    this.jumpEpoch = epoch;
    this.reset();
  }

  send = async (thread: SignalThread, input: string): Promise<void> => {
    if (!this.isDanielThread(thread) || this.typing) return;
    const body = input.trim();
    if (!body) return;

    this.append(SIGNAL_DANIEL_SELF_SENDER, body);
    this.setTyping(true);
    try {
      for (const reply of await this.verify(body)) {
        await this.sleep(signalDanielReplyDelay(reply));
        this.append(SIGNAL_DANIEL_ASSISTANT_SENDER, reply);
        this.options.playCue?.(SIGNAL_DANIEL_REPLY_CUE);
      }
    } finally {
      this.setTyping(false);
    }
  };

  async resumeOnce(): Promise<void> {
    if (this.resumed) return;
    this.resumed = true;
    this.notify();
    for (const reply of await this.verify()) {
      this.append(SIGNAL_DANIEL_ASSISTANT_SENDER, reply);
    }
  }

  reset(): void {
    this.localMessages.length = 0;
    this.typing = false;
    this.resumed = false;
    this.seq = 0;
    this.notify();
  }

  private async verify(answer?: string): Promise<string[]> {
    const payload: Record<string, JsonValue> = {};
    if (answer !== undefined) payload.answer = answer;
    try {
      return parseReplies(
        await this.options.manifold.command(SIGNAL_DANIEL_VERIFY_COMMAND, payload),
      );
    } catch {
      return [];
    }
  }

  private append(sender: string, body: string): void {
    this.seq += 1;
    this.localMessages.push({
      threadId: SIGNAL_DANIEL_THREAD_ID,
      messageId: `bot-${this.seq}`,
      sender,
      kind: "text",
      body,
      timestamp: signalStoryTimestamp(this.timestampNow()),
      sortMs: this.sortNow(),
      self: sender === SIGNAL_DANIEL_SELF_SENDER,
      raw: {},
    });
    this.notify();
  }

  private setTyping(value: boolean): void {
    this.typing = value;
    this.notify();
  }

  private notify(): void {
    this.revision += 1;
    for (const listener of this.listeners) listener();
  }
}
