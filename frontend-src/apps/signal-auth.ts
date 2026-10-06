export const SIGNAL_ACCOUNT_NAME = "+1 (555) 0••-••••";
export const SIGNAL_AUTH_FACT = "signal_daniel.unlocked";

/** Signal login is session-local, but must reset when the active world changes. */
export function createSignalAuthentication(runtime: {
  authenticated?: boolean;
  authSignalPresent?: boolean | (() => boolean);
  getWorldId?: () => string | null;
  subscribe?: (listener: () => void) => () => void;
  onAuthenticatedChange?: (authenticated: boolean) => void;
}) {
  let worldId = runtime.getWorldId?.();
  let authenticated = runtime.authenticated ?? false;
  const listeners = new Set<() => void>();
  const snapshot = () => {
    const nextWorldId = runtime.getWorldId?.();
    if (worldId !== nextWorldId) {
      worldId = nextWorldId;
      authenticated = false;
    }
    const unlocked = typeof runtime.authSignalPresent === "function"
      ? runtime.authSignalPresent() : runtime.authSignalPresent;
    if (unlocked) authenticated = true;
    return authenticated;
  };
  return {
    snapshot,
    setAuthenticated(next: boolean) {
      snapshot();
      authenticated = next;
      runtime.onAuthenticatedChange?.(next);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      const release = runtime.subscribe?.(listener);
      return () => { listeners.delete(listener); release?.(); };
    },
  };
}
