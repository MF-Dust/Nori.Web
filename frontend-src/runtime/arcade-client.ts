import { issueArcadeTicket } from "./http";
import {
  ARCADE_MAIN_PATH,
  ARCADE_SUBPROTOCOL,
  type ArcadeClientMessage,
  type ArcadeServerMessage,
  type EventMessage,
  type JsonValue,
} from "./protocol";

export type ArcadeConnectionState = "idle" | "connecting" | "open" | "waiting" | "closed";
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

  async connect(): Promise<void> {
    this.manualClose = false;
    this.clearReconnect();
    this.setState("connecting");
    const { ticket } = await issueArcadeTicket();
    const socket = new WebSocket(websocketUrl(ARCADE_MAIN_PATH), [
      ARCADE_SUBPROTOCOL,
      `ticket.${ticket}`,
    ]);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const fail = () => reject(new Error("Arcade WebSocket failed before opening"));
      socket.addEventListener("error", fail, { once: true });
      socket.addEventListener("open", () => {
        socket.removeEventListener("error", fail);
        this.reconnectAttempt = 0;
        this.setState("open");
        this.installKeepAlive();
        resolve();
      }, { once: true });
    });

    socket.addEventListener("message", (event) => this.handleMessage(event.data));
    socket.addEventListener("close", () => this.handleClose(socket));
    socket.addEventListener("error", () => {
      if (socket.readyState === WebSocket.OPEN) socket.close();
    });
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== "string") return;
    let message: ArcadeServerMessage;
    try {
      message = JSON.parse(data) as ArcadeServerMessage;
    } catch {
      return;
    }
    if (!message || typeof message !== "object" || typeof message.type !== "string") return;
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
    const base = Math.min(this.options.reconnectMaxMs, this.options.reconnectMinMs * 2 ** exponent);
    const delay = Math.round(base * (0.8 + Math.random() * 0.4));
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => this.scheduleReconnect());
    }, delay);
  }

  private installKeepAlive(): void {
    this.clearKeepAlive();
    if (this.options.keepAliveMs <= 0) return;
    this.keepAliveTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) this.send({ type: "ping" });
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

  sendEvent(channel: string, payload: JsonValue = {}, extra: Partial<EventMessage> = {}): string {
    const id = typeof extra.requestId === "string" ? extra.requestId : requestId("event");
    this.send({ type: "event", channel, payload, ...extra, requestId: id } as EventMessage);
    return id;
  }

  dispatch(cartridgeId: string, expectedHeadVersion: number, cmd: { type: string; [key: string]: JsonValue }, actor = "player"): string {
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
    this.clearReconnect();
    this.clearKeepAlive();
    this.socket?.close(1000, "client_close");
    this.socket = null;
    this.setState("closed");
  }
}
