import type { HeadPat } from "../live2d/head-pat";

export const FLAKY_WEBSOCKET_STORAGE_KEY = "arcade.flakyWs";

export interface NetworkFaultProfile {
  enabled: boolean;
  log: boolean;
  minLatencyMs: number;
  maxLatencyMs: number;
  dropIncomingRate: number;
  dropOutgoingRate: number;
  randomDisconnectChance: number;
  randomDisconnectIntervalMs: number;
}

export type NetworkFaultPreset = "off" | "mild" | "moderate" | "severe";

export type WebSocketFactory = (
  url: string | URL,
  protocols?: string | string[],
) => WebSocket;

export interface NetworkFaultWebSocketOptions {
  createWebSocket?: WebSocketFactory;
  random?: () => number;
  log?: (message: string) => void;
  setTimeout?: typeof globalThis.setTimeout;
  clearTimeout?: typeof globalThis.clearTimeout;
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
}

export const NETWORK_FAULT_PRESETS: Record<
  Exclude<NetworkFaultPreset, "off">,
  NetworkFaultProfile
> = {
  mild: {
    enabled: true,
    log: true,
    minLatencyMs: 50,
    maxLatencyMs: 200,
    dropIncomingRate: 0.02,
    dropOutgoingRate: 0.02,
    randomDisconnectChance: 0.05,
    randomDisconnectIntervalMs: 10_000,
  },
  moderate: {
    enabled: true,
    log: true,
    minLatencyMs: 100,
    maxLatencyMs: 500,
    dropIncomingRate: 0.05,
    dropOutgoingRate: 0.05,
    randomDisconnectChance: 0.15,
    randomDisconnectIntervalMs: 8_000,
  },
  severe: {
    enabled: true,
    log: true,
    minLatencyMs: 200,
    maxLatencyMs: 1_000,
    dropIncomingRate: 0.1,
    dropOutgoingRate: 0.1,
    randomDisconnectChance: 0.3,
    randomDisconnectIntervalMs: 5_000,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function normalizeNetworkFaultProfile(
  value: Partial<NetworkFaultProfile>,
): NetworkFaultProfile {
  const minLatencyMs = clamp(Number(value.minLatencyMs), 0, 1_000);
  const maxLatencyMs = Math.max(
    minLatencyMs,
    clamp(Number(value.maxLatencyMs), 0, 2_000),
  );
  return {
    enabled: value.enabled !== false,
    log: value.log !== false,
    minLatencyMs,
    maxLatencyMs,
    dropIncomingRate: clamp(Number(value.dropIncomingRate), 0, 0.5),
    dropOutgoingRate: clamp(Number(value.dropOutgoingRate), 0, 0.5),
    randomDisconnectChance: clamp(Number(value.randomDisconnectChance), 0, 0.5),
    randomDisconnectIntervalMs: clamp(
      Number(value.randomDisconnectIntervalMs),
      1_000,
      30_000,
    ),
  };
}

export function readNetworkFaultProfile(
  storage: Pick<Storage, "getItem">,
): NetworkFaultProfile | null {
  try {
    const raw = storage.getItem(FLAKY_WEBSOCKET_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<NetworkFaultProfile>;
    if (!value || typeof value !== "object" || value.enabled !== true)
      return null;
    return normalizeNetworkFaultProfile(value);
  } catch {
    return null;
  }
}

export function writeNetworkFaultProfile(
  storage: Pick<Storage, "setItem" | "removeItem">,
  value: NetworkFaultProfile | null,
) {
  if (!value) storage.removeItem(FLAKY_WEBSOCKET_STORAGE_KEY);
  else
    storage.setItem(
      FLAKY_WEBSOCKET_STORAGE_KEY,
      JSON.stringify(normalizeNetworkFaultProfile(value)),
    );
}

export function identifyNetworkFaultPreset(
  value: NetworkFaultProfile | null,
): NetworkFaultPreset | "custom" {
  if (!value?.enabled) return "off";
  for (const [name, preset] of Object.entries(NETWORK_FAULT_PRESETS)) {
    if (
      preset.minLatencyMs === value.minLatencyMs &&
      preset.maxLatencyMs === value.maxLatencyMs &&
      preset.dropIncomingRate === value.dropIncomingRate &&
      preset.dropOutgoingRate === value.dropOutgoingRate &&
      preset.randomDisconnectChance === value.randomDisconnectChance &&
      preset.randomDisconnectIntervalMs === value.randomDisconnectIntervalMs
    )
      return name as Exclude<NetworkFaultPreset, "off">;
  }
  return "custom";
}

function nativeWebSocketFactory(
  url: string | URL,
  protocols?: string | string[],
): WebSocket {
  return protocols === undefined
    ? new WebSocket(url)
    : new WebSocket(url, protocols);
}

function cloneSocketEvent(event: Event): Event {
  if (event.type === "message") {
    const message = event as MessageEvent;
    return new MessageEvent("message", {
      data: message.data,
      origin: message.origin,
      lastEventId: message.lastEventId,
      ports: [...message.ports],
    });
  }
  const clone = new Event(event.type);
  if (event.type === "close") {
    const close = event as CloseEvent;
    Object.defineProperties(clone, {
      code: { value: close.code },
      reason: { value: close.reason },
      wasClean: { value: close.wasClean },
    });
  }
  return clone;
}

/** Apply the shipped debug profile to both directions of a real WebSocket. */
export function createNetworkFaultWebSocketFactory(
  value: NetworkFaultProfile | null,
  options: NetworkFaultWebSocketOptions = {},
): WebSocketFactory {
  const createWebSocket = options.createWebSocket ?? nativeWebSocketFactory;
  if (!value?.enabled) return createWebSocket;

  const profile = normalizeNetworkFaultProfile(value);
  const random = options.random ?? Math.random;
  const log = options.log ?? (() => {});
  const scheduleTimeout = options.setTimeout ?? globalThis.setTimeout;
  const cancelTimeout = options.clearTimeout ?? globalThis.clearTimeout;
  const scheduleInterval = options.setInterval ?? globalThis.setInterval;
  const cancelInterval = options.clearInterval ?? globalThis.clearInterval;

  return (url, protocols) => {
    const socket = createWebSocket(url, protocols);
    const target = new EventTarget();
    const pending = new Set<ReturnType<typeof globalThis.setTimeout>>();
    let disconnectTimer: ReturnType<typeof globalThis.setInterval> | undefined;

    const delay = () =>
      Math.round(
        profile.minLatencyMs +
          (profile.maxLatencyMs - profile.minLatencyMs) * random(),
      );
    const schedule = (callback: () => void) => {
      const timer = scheduleTimeout(() => {
        pending.delete(timer);
        callback();
      }, delay());
      pending.add(timer);
    };
    const clearTimers = () => {
      for (const timer of pending) cancelTimeout(timer);
      pending.clear();
      if (disconnectTimer !== undefined) cancelInterval(disconnectTimer);
      disconnectTimer = undefined;
    };
    const dispatch = (event: Event) =>
      target.dispatchEvent(cloneSocketEvent(event));

    socket.addEventListener("open", (event) => {
      if (profile.randomDisconnectChance > 0) {
        disconnectTimer = scheduleInterval(() => {
          if (random() < profile.randomDisconnectChance) {
            log("[DebugWebSocket] random disconnect");
            socket.close(1001, "debug_random_disconnect");
          }
        }, profile.randomDisconnectIntervalMs);
      }
      dispatch(event);
    });
    socket.addEventListener("error", dispatch);
    socket.addEventListener("close", (event) => {
      clearTimers();
      dispatch(event);
    });
    socket.addEventListener("message", (event) => {
      if (random() < profile.dropIncomingRate) {
        log("[DebugWebSocket] dropped incoming message");
        return;
      }
      schedule(() => dispatch(event));
    });

    const handlers = new Map<string, EventListener>();
    const setHandler = (type: string, listener: EventListener | null) => {
      const previous = handlers.get(type);
      if (previous) target.removeEventListener(type, previous);
      handlers.delete(type);
      if (listener) {
        handlers.set(type, listener);
        target.addEventListener(type, listener);
      }
    };

    const wrapped = {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
      get binaryType() {
        return socket.binaryType;
      },
      set binaryType(value: BinaryType) {
        socket.binaryType = value;
      },
      get bufferedAmount() {
        return socket.bufferedAmount;
      },
      get extensions() {
        return socket.extensions;
      },
      get protocol() {
        return socket.protocol;
      },
      get readyState() {
        return socket.readyState;
      },
      get url() {
        return socket.url;
      },
      get onopen() {
        return handlers.get("open") ?? null;
      },
      set onopen(listener: EventListener | null) {
        setHandler("open", listener);
      },
      get onclose() {
        return handlers.get("close") ?? null;
      },
      set onclose(listener: EventListener | null) {
        setHandler("close", listener);
      },
      get onerror() {
        return handlers.get("error") ?? null;
      },
      set onerror(listener: EventListener | null) {
        setHandler("error", listener);
      },
      get onmessage() {
        return handlers.get("message") ?? null;
      },
      set onmessage(listener: EventListener | null) {
        setHandler("message", listener);
      },
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        if (random() < profile.dropOutgoingRate) {
          log("[DebugWebSocket] dropped outgoing message");
          return;
        }
        schedule(() => {
          if (socket.readyState === socket.OPEN) socket.send(data);
        });
      },
      close(code?: number, reason?: string) {
        clearTimers();
        socket.close(code, reason);
      },
    };
    return wrapped as unknown as WebSocket;
  };
}

export const COMPUTE_TARGETS = [
  1e6, 1e8, 1e10, 1e14, 1e15, 1e20, 1e25, 1e31, 1e35,
] as const;
export const COMPUTE_TIME_STEPS = [
  60, 600, 3_600, 21_600, 43_200, 86_400,
] as const;
export const FACTION_COIN_GRANTS = [100, 1_000, 10_000] as const;

export function computeGrantToTarget(current: number, target: number): number {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(target) ||
    target <= current
  )
    return 0;
  return target - current;
}

export const DEBUG_GAME_SCENARIOS = [
  {
    game: "chess",
    id: "acting-forked-counterpart",
    label: "Acting forks Counterpart",
  },
  {
    game: "chess",
    id: "counterpart-forked-acting",
    label: "Counterpart forks the acting side",
  },
  {
    game: "chess",
    id: "acting-trapped-in-opening",
    label: "Acting trapped in the opening",
  },
  {
    game: "chess",
    id: "counterpart-trapped-in-opening",
    label: "Counterpart trapped in the opening",
  },
  {
    game: "chess",
    id: "acting-blundered-repeatedly",
    label: "Acting blundered repeatedly",
  },
  {
    game: "chess",
    id: "counterpart-blundered-repeatedly",
    label: "Counterpart blundered repeatedly",
  },
  { game: "chess", id: "draw-stalemate", label: "Draw by stalemate" },
  {
    game: "chess",
    id: "acting-offers-draw",
    label: "Acting offers a draw",
  },
  {
    game: "chess",
    id: "acting-checked-counterpart-repeatedly",
    label: "Acting checks Counterpart repeatedly",
  },
  {
    game: "chess",
    id: "counterpart-checked-acting-repeatedly",
    label: "Counterpart checks the acting side repeatedly",
  },
  {
    game: "chess",
    id: "acting-checked-counterpart",
    label: "Acting checks Counterpart",
  },
  {
    game: "chess",
    id: "counterpart-checked-acting",
    label: "Counterpart checks the acting side",
  },
  {
    game: "chess",
    id: "counterpart-offered-sacrifice",
    label: "Counterpart offered a sacrifice",
  },
  {
    game: "chess",
    id: "acting-offered-sacrifice",
    label: "Acting offered a sacrifice",
  },
  {
    game: "chess",
    id: "acting-accepted-counterpart-sacrifice",
    label: "Acting accepted Counterpart sacrifice",
  },
  {
    game: "chess",
    id: "acting-declined-counterpart-sacrifice",
    label: "Acting declined Counterpart sacrifice",
  },
  {
    game: "chess",
    id: "counterpart-accepted-acting-sacrifice",
    label: "Counterpart accepted acting sacrifice",
  },
  {
    game: "chess",
    id: "counterpart-declined-acting-sacrifice",
    label: "Counterpart declined acting sacrifice",
  },
  {
    game: "chess",
    id: "counterpart-skewered-acting",
    label: "Counterpart skewers the acting side",
  },
  {
    game: "chess",
    id: "acting-skewered-counterpart",
    label: "Acting skewers Counterpart",
  },
  {
    game: "chess",
    id: "counterpart-pinned-acting",
    label: "Counterpart pins a piece",
  },
  {
    game: "chess",
    id: "acting-pinned-counterpart",
    label: "Acting pins Counterpart",
  },
  {
    game: "chess",
    id: "acting-captured-repeatedly",
    label: "Acting captured repeatedly",
  },
  {
    game: "chess",
    id: "counterpart-captured-repeatedly",
    label: "Counterpart captured repeatedly",
  },
  { game: "chess", id: "position-reversed", label: "Position reversed" },
  { game: "chess", id: "endgame-entered", label: "Endgame entered" },
  { game: "chess", id: "king-hunt-endgame", label: "King hunt endgame" },
  { game: "chess", id: "race-endgame", label: "Race endgame" },
  {
    game: "chess",
    id: "acting-used-opening",
    label: "Acting used an opening move",
  },
  {
    game: "chess",
    id: "counterpart-used-opening",
    label: "Counterpart used an opening move",
  },
  {
    game: "chess",
    id: "counterpart-moved-quickly",
    label: "Counterpart moved quickly",
  },
  {
    game: "chess",
    id: "counterpart-thought-long",
    label: "Counterpart thought long",
  },
  { game: "chess", id: "critical-move", label: "Critical move for Acting" },
  {
    game: "codenames",
    id: "sudden_death_both",
    label: "Sudden death (both guessers)",
  },
  {
    game: "codenames",
    id: "sudden_death_counterpart_only",
    label: "Sudden death (counterpart only)",
  },
  {
    game: "codenames",
    id: "sudden_death_agent_only",
    label: "Sudden death (agent only)",
  },
  { game: "cakeduel", id: "attack-phase", label: "Attack phase" },
  { game: "cakeduel", id: "block-phase", label: "Block phase" },
  { game: "cakeduel", id: "stacked", label: "Stacked piles" },
  { game: "cakeduel", id: "empty", label: "Empty board" },
] as const;

export type DebugGame = (typeof DEBUG_GAME_SCENARIOS)[number]["game"];

export const DEBUG_REACTIONS = [
  "happy",
  "serious",
  "surprised",
  "angry",
  "sad",
] as const;

/** Exercise the production gesture recognizer without inventing a world fact. */
export function simulateQualifyingHeadPat(gesture: HeadPat): boolean {
  gesture.start(0, 0.2, 0.2);
  let completed = false;
  for (let time = 100; time <= 1_100; time += 100) {
    const x = time % 200 === 0 ? 0.25 : 0.75;
    completed = gesture.move(time, x, 0.2) || completed;
  }
  gesture.end();
  return completed;
}
