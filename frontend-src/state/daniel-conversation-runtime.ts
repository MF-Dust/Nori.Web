import type { SignalMessage, SignalThread } from "../apps/messenger";
import type { SignalService } from "../services/signal";

export const DANIEL_THREAD_ID = "daniel";
export const DANIEL_UNLOCK_FACT = "signal_daniel.unlocked";
export const DANIEL_DEADMAN_FACT = "daniel.deadman.delivered";
export const DANIEL_EVIDENCE_FACT = "daniel.evidence_unlocked";
export const DANIEL_SELF_SENDER = "我";
export const DANIEL_ASSISTANT_SENDER = "OpenFlaw 助理";

export interface DanielConversationSnapshot {
  messages: readonly SignalMessage[];
  typing: boolean;
  resumed: boolean;
  seq: number;
}

export interface DanielConversationRuntimeOptions {
  hasFact?: (factId: string) => boolean;
  playCue?: (cue: string) => void;
  now?: () => Date;
  nowMs?: () => number;
  sleep?: (durationMs: number) => Promise<void>;
}

export function danielReplyDelayMs(body: string): number {
  return Math.min(1600, 480 + body.length * 22);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Shipped Signal story clock fixes the calendar date while preserving wall-clock time. */
export function danielStoryNow(source = new Date()): Date {
  return new Date(
    2026,
    7,
    31,
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  );
}

export function formatDanielTimestamp(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function defaultSleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

export class DanielConversationRuntime {
  private snapshotValue: DanielConversationSnapshot = {
    messages: [],
    typing: false,
    resumed: false,
    seq: 0,
  };
  private readonly listeners = new Set<() => void>();
  private readonly hasFact: (factId: string) => boolean;
  private readonly playCue: (cue: string) => void;
  private readonly now: () => Date;
  private readonly nowMs: () => number;
  private readonly sleep: (durationMs: number) => Promise<void>;

  constructor(
    private readonly signal: SignalService,
    options: DanielConversationRuntimeOptions = {},
  ) {
    this.hasFact = options.hasFact ?? (() => false);
    this.playCue = options.playCue ?? (() => undefined);
    this.now = options.now ?? (() => danielStoryNow());
    this.nowMs = options.nowMs ?? (() => Date.now());
    this.sleep = options.sleep ?? defaultSleep;
  }

  snapshot(): DanielConversationSnapshot {
    return this.snapshotValue;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  messages(thread: SignalThread): readonly SignalMessage[] {
    return thread.threadId === DANIEL_THREAD_ID ? this.snapshotValue.messages : [];
  }

  isTyping(thread: SignalThread): boolean {
    return thread.threadId === DANIEL_THREAD_ID && this.snapshotValue.typing;
  }

  isInteractive(thread: SignalThread): boolean {
    return (
      thread.threadId === DANIEL_THREAD_ID &&
      thread.service === true &&
      this.hasFact(DANIEL_DEADMAN_FACT) &&
      !this.hasFact(DANIEL_EVIDENCE_FACT)
    );
  }

  private publish(next: DanielConversationSnapshot): void {
    this.snapshotValue = next;
    for (const listener of this.listeners) listener();
  }

  private patch(patch: Partial<DanielConversationSnapshot>): void {
    this.publish({ ...this.snapshotValue, ...patch });
  }

  private append(sender: string, body: string): void {
    const seq = this.snapshotValue.seq + 1;
    const message: SignalMessage = {
      messageId: `bot-${seq}`,
      threadId: DANIEL_THREAD_ID,
      sender,
      kind: "text",
      body,
      timestamp: formatDanielTimestamp(this.now()),
      sortMs: this.nowMs(),
      self: sender === DANIEL_SELF_SENDER,
      raw: {},
    };
    this.publish({
      ...this.snapshotValue,
      messages: [...this.snapshotValue.messages, message],
      seq,
    });
  }

  async send(thread: SignalThread, input: string): Promise<void> {
    if (thread.threadId !== DANIEL_THREAD_ID) return;
    const body = input.trim();
    if (body.length === 0 || this.snapshotValue.typing) return;

    this.append(DANIEL_SELF_SENDER, body);
    this.patch({ typing: true });
    const replies = await this.signal.verifyDaniel(body);
    for (const reply of replies) {
      await this.sleep(danielReplyDelayMs(reply));
      this.append(DANIEL_ASSISTANT_SENDER, reply);
      this.playCue("comms-signal-bot-reply");
    }
    this.patch({ typing: false });
  }

  async resumeOnce(thread: SignalThread): Promise<void> {
    if (thread.threadId !== DANIEL_THREAD_ID || this.snapshotValue.resumed) return;
    this.patch({ resumed: true });
    const replies = await this.signal.verifyDaniel();
    for (const reply of replies) this.append(DANIEL_ASSISTANT_SENDER, reply);
  }

  reset(): void {
    this.publish({ messages: [], typing: false, resumed: false, seq: 0 });
  }
}
