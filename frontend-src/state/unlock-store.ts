import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UnlockSettings {
  fullUnlock: boolean;
  setFullUnlock(fullUnlock: boolean): void;
}

export const useUnlockSettings = create<UnlockSettings>()(
  persist(
    (set) => ({
      fullUnlock: false,
      setFullUnlock: (fullUnlock) => set({ fullUnlock }),
    }),
    {
      name: "unlock-settings",
      version: 2,
      migrate: () => ({ fullUnlock: false }),
    },
  ),
);
