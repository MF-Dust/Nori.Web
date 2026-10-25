import { Emitter, type PeerLink, type PeerLinkState } from "./transport";
import { splitUrls, type EasyTierSettings } from "../state/multiplayer-settings-store";

/**
 * EXPERIMENTAL. EasyTier does not ship an official browser data-plane build, so
 * this channel loads a user-supplied ES module (a WASM build of EasyTier plus a
 * small JS shim) that implements the contract below. Nothing is bundled: with no
 * module configured the channel is unavailable and WebRTC stays in use.
 *
 * ```ts
 * export async function createChannel(options: EasyTierChannelOptions): Promise<EasyTierChannel>
 * ```
 *
 * The shim joins the virtual network, then opens one reliable, ordered stream
 * to the peer that uses the same `room` (for example a TCP/KCP stream to the
 * peer's virtual IP, discovered with EasyTier's peer list).
 */
export interface EasyTierChannelOptions {
  networkName: string;
  networkSecret: string;
  peers: string[];
  /** Shared by host and guest; derived from the invite code. */
  room: string;
  role: "host" | "guest";
}

export interface EasyTierChannel {
  send(message: string): void;
  onMessage(listener: (message: string) => void): void | (() => void);
  /** Resolves once the stream to the other peer is open. */
  ready: Promise<void>;
  onClose?(listener: (reason?: string) => void): void | (() => void);
  close(): void;
}

interface EasyTierModule {
  createChannel(options: EasyTierChannelOptions): Promise<EasyTierChannel>;
}

const READY_TIMEOUT_MS = 60_000;

export function easyTierAvailable(settings: EasyTierSettings, experimental: boolean): boolean {
  return experimental && /^(https?:|\/|\.\/)/.test(settings.moduleUrl.trim()) && !!settings.networkName.trim();
}

async function loadModule(url: string): Promise<EasyTierModule> {
  const resolved = new URL(url, window.location.href);
  if (resolved.protocol !== "https:" && resolved.origin !== window.location.origin && resolved.hostname !== "localhost")
    throw new Error("EasyTier module must be same-origin or HTTPS");
  const module = await import(/* @vite-ignore */ resolved.href) as Partial<EasyTierModule>;
  if (typeof module.createChannel !== "function") throw new Error("EasyTier module does not export createChannel()");
  return module as EasyTierModule;
}

export class EasyTierLink implements PeerLink {
  readonly transport = "easytier" as const;
  readonly route = "easytier" as const;
  private currentState: PeerLinkState = "connecting";
  private channel: EasyTierChannel | null = null;
  private readonly messages = new Emitter<string>();
  private readonly states = new Emitter<PeerLinkState>();
  private closed = false;

  get state() { return this.currentState; }

  static open(settings: EasyTierSettings, room: string, role: "host" | "guest"): EasyTierLink {
    const link = new EasyTierLink();
    void link.start(settings, room, role);
    return link;
  }

  private async start(settings: EasyTierSettings, room: string, role: "host" | "guest") {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const module = await loadModule(settings.moduleUrl.trim());
      const channel = await module.createChannel({
        networkName: settings.networkName.trim(),
        networkSecret: settings.networkSecret,
        peers: splitUrls(settings.peers),
        room, role,
      });
      if (this.closed) { channel.close(); return; }
      this.channel = channel;
      channel.onMessage((message) => { if (typeof message === "string") this.messages.emit(message); });
      channel.onClose?.(() => this.setState("closed"));
      await Promise.race([
        channel.ready,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("EasyTier peer did not connect")), READY_TIMEOUT_MS); }),
      ]);
      if (!this.closed) this.setState("open");
    } catch (error) {
      console.warn("[multiplayer] EasyTier channel failed", error);
      this.setState("failed");
      this.close();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  send(message: string) {
    if (this.currentState !== "open" || !this.channel) throw new Error("peer link is not open");
    this.channel.send(message);
  }

  onMessage(listener: (message: string) => void) { return this.messages.on(listener); }
  onState(listener: (state: PeerLinkState) => void) { return this.states.on(listener); }

  close() {
    if (this.closed) return;
    this.closed = true;
    try { this.channel?.close(); } catch { /* Shim already closed. */ }
    this.setState(this.currentState === "failed" ? "failed" : "closed");
    this.messages.clear();
    this.states.clear();
  }

  private setState(state: PeerLinkState) {
    if (this.currentState === state) return;
    if ((this.currentState === "closed" || this.currentState === "failed") && state !== "closed") return;
    this.currentState = state;
    this.states.emit(state);
  }
}
