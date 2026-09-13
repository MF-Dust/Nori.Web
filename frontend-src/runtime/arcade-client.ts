import { issueArcadeTicket } from "./http";
import {
  ARCADE_MAIN_PATH,
  ARCADE_SUBPROTOCOL,
  type ArcadeClientMessage,
  type ArcadeServerMessage,
  type EventMessage,
  type JsonValue,
} from "./protocol";

export type ArcadeConnectionState =
  "idle" | "connecting" | "open" | "waiting" | "closed";
export type ArcadeMessageListener = (message: ArcadeServerMessage) => void;
export type ArcadeStateListener = (state: ArcadeConnectionState) => void;

export interface ArcadeClientOptions {
  locale?: string;
  reconnect?: boolean;
  reconnectMinMs?: number;
  reconnectMaxMs?: number;
  keepAliveMs?: number;
}

function websocketUrl(path: string): string {
  const url = new URL(path, window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

function requestId(prefix = "req"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export class ArcadeClient {
  private socket: WebSocket | null = null;
  private state: ArcadeConnectionState = "idle";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private manualClose = false;
  private epoch = 0;
  private opening: Promise<void> | null = null;
  private cancelOpening: (() => void) | null = null;
  private readonly listeners = new Set<ArcadeMessageListener>();
  private readonly stateListeners = new Set<ArcadeStateListener>();
  private readonly options: Required<ArcadeClientOptions>;

  constructor(options: ArcadeClientOptions = {}) {
    this.options = {
      locale: options.locale ?? navigator.language ?? "en",
      reconnect: options.reconnect ?? true,
      reconnectMinMs: options.reconnectMinMs ?? 500,
      reconnectMaxMs: options.reconnectMaxMs ?? 10_000,
      // Protocol-level pings wake hibernating Durable Objects. Keep them off by
      // default and only enable them when a deployment actually needs them.
      keepAliveMs: options.keepAliveMs ?? 0,
    };
  }

  get connectionState(): ArcadeConnectionState {
    return this.state;
  }

  onMessage(listener: ArcadeMessageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onState(listener: ArcadeStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  private setState(state: ArcadeConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    for (const listener of this.stateListeners) listener(state);
  }

  connect(): Promise<void> {
    if (this.opening) return this.opening;
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    this.manualClose = false;
    this.clearReconnect();
    const epoch = ++this.epoch;
    this.setState("connecting");
    const attempt = this.openSocket(epoch);
    this.opening = attempt;
    void attempt
      .finally(() => {
        if (this.opening === attempt) this.opening = null;
      })
      .catch(() => {});
    return attempt;
  }

  private async openSocket(epoch: number): Promise<void> {
    try {
      const { ticket } = await issueArcadeTicket();
      if (epoch !== this.epoch || this.manualClose) return;
      const socket = new WebSocket(websocketUrl(ARCADE_MAIN_PATH), [
        ARCADE_SUBPROTOCOL,
        `ticket.${ticket}`,
      ]);
      this.socket = socket;
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          this.cancelOpening = null;
          if (error) reject(error);
          else resolve();
        };
        const timeout = setTimeout(() => {
          finish(new Error("Arcade connection timed out"));
          socket.close();
        }, 15000);
        this.cancelOpening = () => finish();
        socket.addEventListener("message", (event) => {
          if (epoch === this.epoch) this.handleMessage(event.data);
        });
        socket.addEventListener(
          "open",
          () => {
            if (epoch !== this.epoch || this.manualClose) {
              socket.close();
              finish();
              return;
            }
            this.reconnectAttempt = 0;
            this.setState("open");
            this.installKeepAlive();
            finish();
          },
          { once: true },
        );
        socket.addEventListener("close", () => {
          finish(new Error("Arcade connection closed before opening"));
          if (epoch === this.epoch) this.handleClose(socket);
        });
        socket.addEventListener("error", () => {
          finish(new Error("Arcade connection failed"));
          socket.close();
        });
      });
    } catch (error) {
      if (epoch !== this.epoch || this.manualClose) return;
      if (this.options.reconnect && this.state !== "waiting")
        this.scheduleReconnect();
      else if (!this.options.reconnect) this.setState("closed");
      throw error;
    }
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== "string") return;
    let message: ArcadeServerMessage;
    try {
      message = JSON.parse(data) as ArcadeServerMessage;
    } catch {
      return;
    }
    if (
      !message ||
      typeof message !== "object" ||
      typeof message.type !== "string"
    )
      return;
    for (const listener of this.listeners) listener(message);
  }

  private handleClose(socket: WebSocket): void {
    if (this.socket !== socket) return;
    this.socket = null;
    this.clearKeepAlive();
    if (this.manualClose || !this.options.reconnect) {
      this.setState("closed");
      return;
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    this.clearReconnect();
    this.setState("waiting");
    const exponent = Math.min(this.reconnectAttempt++, 8);
    const base = Math.min(
      this.options.reconnectMaxMs,
      this.options.reconnectMinMs * 2 ** exponent,
    );
    const delay = Math.round(base * (0.8 + Math.random() * 0.4));
    this.reconnectTimer = setTimeout(() => {
      void this.connect().catch(() => {});
    }, delay);
  }

  private installKeepAlive(): void {
    this.clearKeepAlive();
    if (this.options.keepAliveMs <= 0) return;
    this.keepAliveTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN)
        this.send({ type: "ping" });
    }, this.options.keepAliveMs);
  }

  private clearKeepAlive(): void {
    if (this.keepAliveTimer !== null) clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = null;
  }

  private clearReconnect(): void {
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  send(message: ArcadeClientMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Arcade WebSocket is not open");
    }
    this.socket.send(JSON.stringify(message));
  }

  openMyWorld(locale = this.options.locale): void {
    this.send({ type: "open_my_web_world", locale });
  }

  sendEvent(
    channel: string,
    payload: JsonValue = {},
    extra: Partial<EventMessage> = {},
  ): string {
    const id =
      typeof extra.requestId === "string"
        ? extra.requestId
        : requestId("event");
    this.send({
      type: "event",
      channel,
      payload,
      ...extra,
      requestId: id,
    } as EventMessage);
    return id;
  }

  dispatch(
    cartridgeId: string,
    expectedHeadVersion: number,
    cmd: { type: string; [key: string]: JsonValue },
    actor = "player",
  ): string {
    const id = requestId("dispatch");
    this.send({
      type: "dispatch",
      actor,
      cartridgeId,
      requestId: id,
      expectedHeadVersion,
      cmd,
    });
    return id;
  }

  close(): void {
    this.manualClose = true;
    this.epoch++;
    this.cancelOpening?.();
    this.cancelOpening = null;
    this.opening = null;
    this.clearReconnect();
    this.clearKeepAlive();
    this.socket?.close(1000, "client_close");
    this.socket = null;
    this.setState("closed");
  }
}
