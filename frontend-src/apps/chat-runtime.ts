import { z } from "zod";
import type { ArcadeClient } from "../runtime/arcade-client";
import type { WorldStore } from "../runtime/world-store";
import type { JsonValue } from "../runtime/protocol";
import { sanitizeChatText } from "../runtime/chat-media";

const lineSchema = z.object({
  messageId: z.string(),
  content: z.string(),
  sender: z.enum(["player", "agent"]),
  createdAt: z.number().optional(),
  emotion: z.string().optional(),
  blockId: z.number().optional(),
});
export type ChatLine = z.infer<typeof lineSchema>;
export interface ChatSnapshot {
  lines: ChatLine[];
  phase: string;
  mode: "text" | "audio";
  connected: boolean;
  pending: boolean;
  error: string | null;
}
type Command = { type: string; [key: string]: JsonValue };
type Queued = { command: Command; resolve(ok: boolean): void };

/** Chat requests share one head-version queue, including speech lifecycle acknowledgements. */
export class ChatRuntimeController {
  private value: ChatSnapshot = {
    lines: [],
    phase: "idle",
    mode: "text",
    connected: false,
    pending: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private cleanup: Array<() => void> = [];
  private queue: Queued[] = [];
  private request: {
    id: string;
    item: Queued;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;
  private disposed = false;
  private fence = -1;
  private joined = false;
  constructor(
    private world: WorldStore,
    private arcade: ArcadeClient,
  ) {
    this.cleanup.push(
      world.subscribe((_state, message) => {
        const raw = message as unknown as {
          type: string;
          cartridgeId?: string;
          requestId?: string;
          success?: boolean;
          error?: string;
          message?: string;
        };
        if (
          ["world_left", "world_joined", "world_created"].includes(raw.type)
        ) {
          this.cancel();
          this.fence = -1;
          this.joined = raw.type !== "world_left";
        }
        this.refresh();
        if (
          raw.requestId &&
          raw.requestId === this.request?.id &&
          ["dispatch_ack", "error"].includes(raw.type)
        ) {
          const ok = raw.type !== "error" && raw.success !== false;
          this.finish(
            ok,
            ok ? null : (raw.error ?? raw.message ?? "Chat request failed"),
          );
        }
        const runtime = world.runtime("chat");
        if (
          runtime &&
          this.value.connected &&
          runtime.headVersion > Math.max(runtime.visibleVersion, this.fence)
        ) {
          this.fence = runtime.headVersion;
          arcade.send({
            type: "advance_visibility_fence",
            cartridgeId: "chat",
            visibilityFenceId: "ui",
            version: this.fence,
            requestId: "chat-fence-" + crypto.randomUUID(),
          });
        }
      }),
    );
    this.cleanup.push(
      arcade.onState((state) => {
        if (state !== "open") {
          this.joined = false;
          this.cancel();
        }
        this.refresh();
      }),
    );
    this.refresh();
  }
  snapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(patch: Partial<ChatSnapshot>) {
    this.value = { ...this.value, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private refresh() {
    const runtime = this.world.runtime("chat"),
      state = runtime?.state;
    const parsed = z.array(lineSchema).safeParse(state?.lines ?? []);
    this.publish({
      lines: parsed.success ? parsed.data : [],
      connected:
        this.joined && !!runtime && this.arcade.connectionState === "open",
      phase:
        state?.turn &&
        typeof state.turn === "object" &&
        !Array.isArray(state.turn)
          ? String(state.turn.phase ?? "idle")
          : "idle",
      mode: state?.presentationMode === "audio" ? "audio" : "text",
    });
  }
  command = (command: Command): Promise<boolean> => {
    if (this.disposed || !this.value.connected || this.queue.length >= 64)
      return Promise.resolve(false);
    return new Promise((resolve) => {
      this.queue.push({ command, resolve });
      this.drain();
    });
  };
  send = (text: string): Promise<boolean> => {
    const clean = sanitizeChatText(text);
    if (!clean || this.value.pending) return Promise.resolve(false);
    return this.command({ type: "playerMessage", text: clean });
  };
  setMode = (mode: "text" | "audio") =>
    this.command({ type: "setPresentationMode", presentationMode: mode });
  audioStarted = (operationId: string, blockId: number) =>
    this.command({ type: "audioStarted", operationId, blockId });
  audioDone = (operationId: string, blockId: number) =>
    this.command({ type: "audioDone", operationId, blockId });
  private drain() {
    if (this.request || this.disposed || !this.queue.length) return;
    const item = this.queue.shift()!,
      runtime = this.world.runtime("chat");
    if (!runtime || !this.value.connected) {
      item.resolve(false);
      this.cancel();
      return;
    }
    try {
      const id = this.arcade.dispatch(
        "chat",
        runtime.headVersion,
        item.command,
        "player",
      );
      this.request = {
        id,
        item,
        timer: setTimeout(
          () => this.finish(false, "Chat request timed out"),
          15000,
        ),
      };
      this.publish({ pending: true, error: null });
    } catch (error) {
      item.resolve(false);
      this.publish({ error: String(error) });
      this.cancel();
    }
  }
  private finish(ok: boolean, error: string | null) {
    const request = this.request;
    this.request = null;
    if (request) {
      clearTimeout(request.timer);
      request.item.resolve(ok);
    }
    this.publish({ pending: false, error });
    this.drain();
  }
  private cancel() {
    const waiting = this.queue.splice(0);
    waiting.forEach((item) => item.resolve(false));
    this.finish(false, null);
  }
  dispose() {
    this.disposed = true;
    this.cancel();
    this.cleanup.forEach((fn) => fn());
    this.listeners.clear();
  }
}
