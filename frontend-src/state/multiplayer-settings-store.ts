import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MultiplayerTransportKind = "webrtc" | "easytier";

export interface TurnServerSettings {
  urls: string;
  username: string;
  credential: string;
}

export interface EasyTierSettings {
  /** ES module URL of a browser EasyTier build exposing `createChannel` (see docs/MULTIPLAYER.md). */
  moduleUrl: string;
  networkName: string;
  networkSecret: string;
  /** Comma/newline separated EasyTier peer URLs, for example `wss://relay.example:11012`. */
  peers: string;
}

export const TURN_TIMEOUT_CHOICES = [0, 60, 120, 300] as const;
export const MAX_NICKNAME_LENGTH = 24;

export interface MultiplayerSettingsValues {
  /** Off by default: the games keep their single-player Nori behavior. */
  enabled: boolean;
  /** Shown to the other player in place of "Nori"; empty uses a generic label. */
  nickname: string;
  /** Host only: after this many idle seconds on the guest's turn Nori plays one move for it (0 = off). */
  turnTimeoutSec: number;
  transport: MultiplayerTransportKind;
  /** Comma/newline separated STUN URLs used for the direct path. */
  stunUrls: string;
  turn: TurnServerSettings;
  /** Relay only (debug/privacy): never expose host or reflexive candidates. */
  forceRelay: boolean;
  /** EasyTier is only selectable once the experimental channel is enabled. */
  easyTierExperimental: boolean;
  easyTier: EasyTierSettings;
}

export interface MultiplayerSettings extends MultiplayerSettingsValues {
  setEnabled(enabled: boolean): void;
  setNickname(nickname: string): void;
  setTurnTimeoutSec(seconds: number): void;
  setTransport(transport: MultiplayerTransportKind): void;
  setStunUrls(value: string): void;
  setTurn(patch: Partial<TurnServerSettings>): void;
  setForceRelay(forceRelay: boolean): void;
  setEasyTierExperimental(enabled: boolean): void;
  setEasyTier(patch: Partial<EasyTierSettings>): void;
}

export const DEFAULT_MULTIPLAYER_SETTINGS: MultiplayerSettingsValues = {
  enabled: false,
  nickname: "",
  turnTimeoutSec: 120,
  transport: "webrtc",
  stunUrls: "stun:stun.cloudflare.com:3478\nstun:stun.l.google.com:19302",
  turn: { urls: "", username: "", credential: "" },
  forceRelay: false,
  easyTierExperimental: false,
  easyTier: { moduleUrl: "", networkName: "", networkSecret: "", peers: "" },
};

function validTimeout(value: unknown): number {
  return (TURN_TIMEOUT_CHOICES as readonly number[]).includes(value as number) ? value as number : DEFAULT_MULTIPLAYER_SETTINGS.turnTimeoutSec;
}

export function splitUrls(value: string): string[] {
  return value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
}

export const useMultiplayerSettings = create<MultiplayerSettings>()(
  persist(
    (set) => ({
      ...DEFAULT_MULTIPLAYER_SETTINGS,
      setEnabled: (enabled) => set({ enabled }),
      setNickname: (nickname) => set({ nickname: nickname.slice(0, MAX_NICKNAME_LENGTH) }),
      setTurnTimeoutSec: (seconds) => set({ turnTimeoutSec: validTimeout(seconds) }),
      setTransport: (transport) => set((state) => ({
        transport: transport === "easytier" && !state.easyTierExperimental ? "webrtc" : transport,
      })),
      setStunUrls: (stunUrls) => set({ stunUrls }),
      setTurn: (patch) => set((state) => ({ turn: { ...state.turn, ...patch } })),
      setForceRelay: (forceRelay) => set({ forceRelay }),
      setEasyTierExperimental: (easyTierExperimental) => set((state) => ({
        easyTierExperimental,
        transport: easyTierExperimental ? state.transport : "webrtc",
      })),
      setEasyTier: (patch) => set((state) => ({ easyTier: { ...state.easyTier, ...patch } })),
    }),
    {
      name: "multiplayer-settings",
      version: 1,
      partialize: (state): MultiplayerSettingsValues => ({
        enabled: state.enabled,
        nickname: state.nickname,
        turnTimeoutSec: state.turnTimeoutSec,
        transport: state.transport,
        stunUrls: state.stunUrls,
        turn: state.turn,
        forceRelay: state.forceRelay,
        easyTierExperimental: state.easyTierExperimental,
        easyTier: state.easyTier,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<MultiplayerSettingsValues>;
        const merged = {
          ...current,
          ...saved,
          turn: { ...current.turn, ...saved.turn },
          easyTier: { ...current.easyTier, ...saved.easyTier },
        };
        if (merged.transport !== "webrtc" && (merged.transport !== "easytier" || !merged.easyTierExperimental))
          merged.transport = "webrtc";
        merged.enabled = merged.enabled === true;
        merged.nickname = typeof merged.nickname === "string" ? merged.nickname.slice(0, MAX_NICKNAME_LENGTH) : "";
        merged.turnTimeoutSec = validTimeout(merged.turnTimeoutSec);
        return merged;
      },
    },
  ),
);

/** Non-React read used by the session layer. */
export function multiplayerSettings(): MultiplayerSettingsValues {
  return useMultiplayerSettings.getState();
}
