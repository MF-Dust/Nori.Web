import { requestJson } from "./http";

export const PRESENCE_PATH = "/api/presence";

export interface PresenceSnapshot {
  /** Users online on this server (each counted once across tabs); `null` before the first reply. */
  online: number | null;
  status: "idle" | "ok" | "failed";
  updatedAt: number | null;
}

interface PresenceReply { online: number; intervalMs?: number }

const DEFAULT_INTERVAL_MS = 30_000;
const MIN_INTERVAL_MS = 10_000;

/**
 * Anonymous online counter. Every open client sends a heartbeat; the server keeps
 * a digest of the session's user id with a short expiry and returns the count.
 */
export class PresenceClient {
  private value: PresenceSnapshot = { online: null, status: "idle", updatedAt: null };
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private interval = DEFAULT_INTERVAL_MS;
  private inFlight: Promise<void> | null = null;
  private running = false;
  private readonly onPageHide = () => this.leave();
  private readonly onPageShow = (event: PageTransitionEvent) => { if (event.persisted) void this.refresh(); };

  constructor(private readonly request: typeof requestJson = requestJson) {}

  snapshot = (): PresenceSnapshot => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  start() {
    if (this.running) return;
    this.running = true;
    globalThis.addEventListener?.("pagehide", this.onPageHide);
    globalThis.addEventListener?.("pageshow", this.onPageShow as EventListener);
    void this.refresh();
  }

  /** Heartbeat now (the Settings window calls this when it opens). */
  refresh(): Promise<void> {
    if (!this.running) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.inFlight = this.request<PresenceReply>(PRESENCE_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      credentials: "same-origin",
    }).then((reply) => {
      if (typeof reply?.online === "number" && Number.isFinite(reply.online)) {
        this.publish({ online: Math.max(0, Math.floor(reply.online)), status: "ok", updatedAt: Date.now() });
      }
      if (typeof reply?.intervalMs === "number") this.interval = Math.max(MIN_INTERVAL_MS, reply.intervalMs);
    }, () => {
      this.publish({ ...this.value, status: "failed" });
    }).finally(() => {
      this.inFlight = null;
      if (this.running) this.timer = setTimeout(() => void this.refresh(), this.interval);
    });
    return this.inFlight;
  }

  /** Best-effort goodbye so a closed tab leaves the count right away. */
  private leave() {
    try {
      globalThis.navigator?.sendBeacon?.(PRESENCE_PATH, new Blob(['{"leave":true}'], { type: "application/json" }));
    } catch { /* The entry expires on its own. */ }
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    globalThis.removeEventListener?.("pagehide", this.onPageHide);
    globalThis.removeEventListener?.("pageshow", this.onPageShow as EventListener);
    this.leave();
  }

  dispose() {
    this.stop();
    this.listeners.clear();
  }

  private publish(next: PresenceSnapshot) {
    this.value = next;
    for (const listener of [...this.listeners]) listener();
  }
}
