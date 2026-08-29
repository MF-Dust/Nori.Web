import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AudioSettingsState {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  isMuted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  voiceMuted: boolean;
  spatialVoice: boolean;
  voiceRate: number;
  setMasterVolume(value: number): void;
  setMusicVolume(value: number): void;
  setSfxVolume(value: number): void;
  setVoiceVolume(value: number): void;
  setMuted(value: boolean): void;
  toggleMute(): void;
  toggleMusicMuted(): void;
  toggleSfxMuted(): void;
  toggleVoiceMuted(): void;
  setSpatialVoice(value: boolean): void;
  setVoiceRate(value: number): void;
}

/**
 * Clean-room reconstruction of NormalApp's persisted `audio-store` (`rl`).
 * The AudioManager bridge lives outside this state boundary; consumers may
 * subscribe and synchronize the values to a WebAudio implementation.
 */
export const useAudioSettings = create<AudioSettingsState>()(
  persist(
    (set) => ({
      masterVolume: 80,
      musicVolume: 10,
      sfxVolume: 80,
      voiceVolume: 100,
      isMuted: false,
      musicMuted: false,
      sfxMuted: false,
      voiceMuted: false,
      spatialVoice: true,
      voiceRate: 1,
      setMasterVolume: (masterVolume) => set({ masterVolume }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      setSfxVolume: (sfxVolume) => set({ sfxVolume }),
      setVoiceVolume: (voiceVolume) => set({ voiceVolume }),
      setMuted: (isMuted) => set({ isMuted }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      toggleMusicMuted: () =>
        set((state) => ({ musicMuted: !state.musicMuted })),
      toggleSfxMuted: () => set((state) => ({ sfxMuted: !state.sfxMuted })),
      toggleVoiceMuted: () =>
        set((state) => ({ voiceMuted: !state.voiceMuted })),
      setSpatialVoice: (spatialVoice) => set({ spatialVoice }),
      setVoiceRate: (voiceRate) =>
        set({ voiceRate: Math.min(2, Math.max(0.5, voiceRate)) }),
    }),
    { name: "audio-store" },
  ),
);
