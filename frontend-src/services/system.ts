import type { ArcadeClient } from "../runtime/arcade-client";
import type {
  ArcadeClientMessage,
  ArcadeServerMessage,
} from "../runtime/protocol";

/** Listener installation precedes send; disconnect, timeout and abort always release it. */
export function requestSystemReply(
  arcade: ArcadeClient,
  request: ArcadeClientMessage,
  replyType: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<ArcadeServerMessage> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted || arcade.connectionState !== "open") {
      reject(new Error("Connection unavailable"));
      return;
    }
    let settled = false;
    let offMessage = () => {},
      offState = () => {};
    const finish = (message?: ArcadeServerMessage, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      offMessage();
      offState();
      signal?.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(message!);
    };
    const abort = () => finish(undefined, new Error("Request cancelled"));
    const timer = setTimeout(
      () => finish(undefined, new Error("Request timed out")),
      timeoutMs,
    );
    offMessage = arcade.onMessage((message) => {
      if (message.type === replyType) finish(message);
    });
    offState = arcade.onState((state) => {
      if (state !== "open") finish(undefined, new Error("Connection closed"));
    });
    signal?.addEventListener("abort", abort, { once: true });
    try {
      arcade.send(request);
    } catch (error) {
      finish(
        undefined,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  });
}

export class SystemService {
  private measuring: Promise<number[]> | null = null;
  private resetting: Promise<ArcadeServerMessage> | null = null;
  constructor(private readonly arcade: ArcadeClient) {}

  // The protocol pong has no request ID. Share one measurement across Settings windows.
  measureLatency(): Promise<number[]> {
    if (this.measuring) return this.measuring;
    const measure = async () => {
      const samples: number[] = [];
      for (let index = 0; index < 5; index++) {
        if (index) await new Promise((resolve) => setTimeout(resolve, 100));
        const start = performance.now();
        await requestSystemReply(this.arcade, { type: "ping" }, "pong", 4000);
        samples.push(performance.now() - start);
      }
      return samples;
    };
    const result = measure();
    this.measuring = result;
    void result
      .finally(() => {
        this.measuring = null;
      })
      .catch(() => {});
    return result;
  }

  resetWorld(locale: string): Promise<ArcadeServerMessage> {
    if (this.resetting) return this.resetting;
    const result = requestSystemReply(
      this.arcade,
      { type: "reset_my_web_world", locale },
      "web_world_reset_ack",
      15000,
    );
    this.resetting = result;
    void result
      .finally(() => {
        this.resetting = null;
      })
      .catch(() => {});
    return result;
  }
}
