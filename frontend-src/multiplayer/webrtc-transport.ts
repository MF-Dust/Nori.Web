import { decodeSignal, Emitter, encodeSignal, type PeerLink, type PeerLinkState, type PeerRoute } from "./transport";
import { splitUrls, type MultiplayerSettingsValues } from "../state/multiplayer-settings-store";

export interface WebRtcConfig {
  iceServers: RTCIceServer[];
  /** `relay` restricts ICE to TURN candidates. */
  iceTransportPolicy: RTCIceTransportPolicy;
  hasTurn: boolean;
}

/**
 * One negotiation carries both paths: host/server-reflexive candidates (direct,
 * via STUN hole punching) and TURN relay candidates. ICE checks prefer the
 * direct pairs and only nominates the relay pair when no direct pair works,
 * which is the TURN fallback without a second signaling round trip.
 */
export function webRtcConfig(settings: MultiplayerSettingsValues): WebRtcConfig {
  const iceServers: RTCIceServer[] = [];
  const stun = splitUrls(settings.stunUrls).filter((url) => /^stuns?:/i.test(url));
  if (stun.length && !settings.forceRelay) iceServers.push({ urls: stun });
  const turn = splitUrls(settings.turn.urls).filter((url) => /^turns?:/i.test(url));
  if (turn.length) {
    iceServers.push({
      urls: turn,
      ...(settings.turn.username ? { username: settings.turn.username } : {}),
      ...(settings.turn.credential ? { credential: settings.turn.credential } : {}),
    });
  }
  return {
    iceServers,
    iceTransportPolicy: settings.forceRelay && turn.length ? "relay" : "all",
    hasTurn: turn.length > 0,
  };
}

export interface SignalEnvelope<M> {
  v: 1;
  kind: "offer" | "answer";
  sdp: string;
  meta: M;
}

const GATHER_TIMEOUT_MS = 6_000;
const CONNECT_TIMEOUT_MS = 45_000;
const MAX_MESSAGE_BYTES = 256 * 1024;

function waitForGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    const check = () => { if (pc.iceGatheringState === "complete") done(); };
    // A slow or unreachable TURN server must not hold the code forever: use what we have.
    const timer = setTimeout(done, GATHER_TIMEOUT_MS);
    pc.addEventListener("icegatheringstatechange", check);
  });
}

export class WebRtcLink implements PeerLink {
  readonly transport = "webrtc" as const;
  private currentState: PeerLinkState = "connecting";
  private currentRoute: PeerRoute = "unknown";
  private channel: RTCDataChannel | null = null;
  private readonly messages = new Emitter<string>();
  private readonly states = new Emitter<PeerLinkState>();
  private connectTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(private readonly pc: RTCPeerConnection, readonly config: WebRtcConfig) {
    pc.addEventListener("connectionstatechange", () => {
      if (pc.connectionState === "failed") this.setState("failed");
      else if (pc.connectionState === "closed") this.setState("closed");
    });
    pc.addEventListener("datachannel", (event) => this.attach(event.channel));
  }

  get state() { return this.currentState; }
  get route() { return this.currentRoute; }

  /** Host: create the invite code. */
  static async offer<M>(config: WebRtcConfig, meta: M): Promise<{ link: WebRtcLink; code: string }> {
    const link = new WebRtcLink(new RTCPeerConnection({ iceServers: config.iceServers, iceTransportPolicy: config.iceTransportPolicy }), config);
    link.attach(link.pc.createDataChannel("nori-mp", { ordered: true }));
    try {
      await link.pc.setLocalDescription(await link.pc.createOffer());
      await waitForGathering(link.pc);
      const envelope: SignalEnvelope<M> = { v: 1, kind: "offer", sdp: link.pc.localDescription?.sdp ?? "", meta };
      return { link, code: await encodeSignal(envelope) };
    } catch (error) { link.close(); throw error; }
  }

  /** Guest: answer an invite code. */
  static async answer<M>(config: WebRtcConfig, offer: SignalEnvelope<unknown>, meta: M): Promise<{ link: WebRtcLink; code: string }> {
    if (offer.v !== 1 || offer.kind !== "offer" || typeof offer.sdp !== "string") throw new Error("invalid invite code");
    const link = new WebRtcLink(new RTCPeerConnection({ iceServers: config.iceServers, iceTransportPolicy: config.iceTransportPolicy }), config);
    try {
      await link.pc.setRemoteDescription({ type: "offer", sdp: offer.sdp });
      await link.pc.setLocalDescription(await link.pc.createAnswer());
      await waitForGathering(link.pc);
      link.armConnectTimeout();
      const envelope: SignalEnvelope<M> = { v: 1, kind: "answer", sdp: link.pc.localDescription?.sdp ?? "", meta };
      return { link, code: await encodeSignal(envelope) };
    } catch (error) { link.close(); throw error; }
  }

  static decode<M>(code: string): Promise<SignalEnvelope<M>> {
    return decodeSignal<SignalEnvelope<M>>(code);
  }

  /** Host: apply the guest's reply code. */
  async accept(answer: SignalEnvelope<unknown>): Promise<void> {
    if (answer.v !== 1 || answer.kind !== "answer" || typeof answer.sdp !== "string") throw new Error("invalid reply code");
    if (this.pc.signalingState !== "have-local-offer") throw new Error("this invite was already used");
    await this.pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
    this.armConnectTimeout();
  }

  send(message: string) {
    if (this.channel?.readyState !== "open") throw new Error("peer link is not open");
    if (message.length > MAX_MESSAGE_BYTES) throw new Error("peer message is too large");
    this.channel.send(message);
  }

  onMessage(listener: (message: string) => void) { return this.messages.on(listener); }
  onState(listener: (state: PeerLinkState) => void) { return this.states.on(listener); }

  close() {
    if (this.connectTimer) clearTimeout(this.connectTimer);
    this.connectTimer = null;
    try { this.channel?.close(); } catch { /* Already closed. */ }
    try { this.pc.close(); } catch { /* Already closed. */ }
    this.setState("closed");
    this.messages.clear();
    this.states.clear();
  }

  private armConnectTimeout() {
    if (this.connectTimer) clearTimeout(this.connectTimer);
    this.connectTimer = setTimeout(() => {
      if (this.currentState === "connecting") { this.setState("failed"); this.close(); }
    }, CONNECT_TIMEOUT_MS);
  }

  private attach(channel: RTCDataChannel) {
    this.channel = channel;
    channel.addEventListener("open", () => {
      if (this.connectTimer) clearTimeout(this.connectTimer);
      this.connectTimer = null;
      void this.detectRoute().finally(() => this.setState("open"));
    });
    channel.addEventListener("close", () => this.setState(this.currentState === "failed" ? "failed" : "closed"));
    channel.addEventListener("message", (event) => {
      if (typeof event.data === "string" && event.data.length <= MAX_MESSAGE_BYTES) this.messages.emit(event.data);
    });
  }

  private async detectRoute() {
    try {
      const stats = await this.pc.getStats();
      let pair: Record<string, unknown> | undefined;
      stats.forEach((report: Record<string, unknown>) => {
        if (report.type === "transport" && typeof report.selectedCandidatePairId === "string")
          pair = stats.get(report.selectedCandidatePairId) as Record<string, unknown> | undefined;
      });
      if (!pair) stats.forEach((report: Record<string, unknown>) => {
        if (!pair && report.type === "candidate-pair" && report.nominated && report.state === "succeeded") pair = report;
      });
      const local = pair && stats.get(String(pair.localCandidateId)) as Record<string, unknown> | undefined;
      const remote = pair && stats.get(String(pair.remoteCandidateId)) as Record<string, unknown> | undefined;
      if (local || remote)
        this.currentRoute = local?.candidateType === "relay" || remote?.candidateType === "relay" ? "relay" : "direct";
    } catch { this.currentRoute = "unknown"; }
  }

  private setState(state: PeerLinkState) {
    if (this.currentState === state || this.currentState === "closed") return;
    if (this.currentState === "failed" && state !== "closed") return;
    this.currentState = state;
    this.states.emit(state);
  }
}
