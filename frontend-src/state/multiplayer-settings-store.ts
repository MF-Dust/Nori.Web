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

export interface MultiplayerSettingsValues {
  /** Off by default: the games keep their single-player Nori behavior. */
  enabled: boolean;
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
  setTransport(transport: MultiplayerTransportKind): void;
  setStunUrls(value: string): void;
  setTurn(patch: Partial<TurnServerSettings>): void;
  setForceRelay(forceRelay: boolean): void;
  setEasyTierExperimental(enabled: boolean): void;
  setEasyTier(patch: Partial<EasyTierSettings>): void;
}

export const DEFAULT_MULTIPLAYER_SETTINGS: MultiplayerSettingsValues = {
  enabled: false,
  transport: "webrtc",
  stunUrls: "stun:stun.cloudflare.com:3478\nstun:stun.l.google.com:19302",
  turn: { urls: "", username: "", credential: "" },
  forceRelay: false,
  easyTierExperimental: false,
  easyTier: { moduleUrl: "", networkName: "", networkSecret: "", peers: "" },
};

export function splitUrls(value: string): string[] {
  return value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
}

export const useMultiplayerSettings = create<MultiplayerSettings>()(
  persist(
    (set) => ({
      ...DEFAULT_MULTIPLAYER_SETTINGS,
      setEnabled: (enabled) => set({ enabled }),
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
        return merged;
      },
    },
  ),
);

/** Non-React read used by the session layer. */
export function multiplayerSettings(): MultiplayerSettingsValues {
  return useMultiplayerSettings.getState();
}
