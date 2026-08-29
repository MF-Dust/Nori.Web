import type { ArcadeClient } from "./arcade-client";
import type { ArcadeServerMessage, JsonValue } from "./protocol";

interface PendingRequest {
  channel: string;
  resolve: (value: JsonValue) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class EventRpcClient {
  private readonly pending = new Map<string, PendingRequest>();
  private readonly unsubscribe: () => void;

  constructor(private readonly arcade: ArcadeClient, private readonly timeoutMs = 10_000) {
    this.unsubscribe = arcade.onMessage((message) => this.consume(message));
  }

  private consume(message: ArcadeServerMessage): void {
    if (message.type !== "event") return;
    const raw = message as any;
    const requestId = raw.requestId;
    if (typeof requestId !== "string") return;
    const pending = this.pending.get(requestId);
    if (!pending) return;
    if (typeof raw.channel === "string" && raw.channel !== pending.channel && !raw.channel.endsWith(".result") && !raw.channel.endsWith(".response")) return;
    this.pending.delete(requestId);
    clearTimeout(pending.timer);
    pending.resolve((raw.payload ?? null) as JsonValue);
  }

  call<T = JsonValue>(channel: string, payload: JsonValue = {}, responseChannel?: string): Promise<T> {
    const requestId = crypto.randomUUID();
    const expected = responseChannel ?? `${channel}.result`;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Event RPC timed out: ${channel}`));
      }, this.timeoutMs);
      this.pending.set(requestId, {
        channel: expected,
        resolve: (value) => resolve(value as T),
        reject,
        timer,
      });
      try {
        this.arcade.send({ type: "event", channel, payload, requestId } as any);
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  dispose(): void {
    this.unsubscribe();
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Event RPC client disposed"));
    }
    this.pending.clear();
  }
}
