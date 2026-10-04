/**
 * Shipped `Att`: token store behind the Idle "高维范式 已解锁" in-screen toast.
 * `show` bumps the token; the first show may ask the toast to stay silent when
 * the desktop notification already carries the sound.
 */
export interface ParadigmRevealState {
  token: number;
  muteNextSound: boolean;
}

export interface ParadigmRevealStore {
  snapshot(): ParadigmRevealState;
  subscribe(listener: () => void): () => void;
  show(options?: { muteSound?: boolean }): void;
  consumeSoundMute(): boolean;
  clear(token: number): void;
}

export function createParadigmRevealStore(): ParadigmRevealStore {
  let state: ParadigmRevealState = { token: 0, muteNextSound: false };
  const listeners = new Set<() => void>();
  const set = (next: ParadigmRevealState) => {
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener();
  };
  return {
    snapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    show(options) {
      set({
        token: state.token + 1,
        muteNextSound: state.muteNextSound || !!options?.muteSound,
      });
    },
    consumeSoundMute() {
      const muted = state.muteNextSound;
      if (muted) set({ ...state, muteNextSound: false });
      return muted;
    },
    clear(token) {
      if (state.token === token) set({ ...state, token: 0 });
    },
  };
}
