import type { JsonValue } from "../runtime/protocol";

export const BROWSER_APP_ID = "browser";

export interface AppIntentTarget {
  appId: string;
  args: { [key: string]: JsonValue };
}

export type OpenAppIntent = (target: AppIntentTarget) => void;

export interface BrowserPendingIntent {
  id: number;
  url: string;
}

export interface BrowserIntentStore {
  snapshot(): BrowserPendingIntent | null;
  open(url: string): void;
  clear(id?: number): void;
  subscribe(listener: () => void): () => void;
}

export function createBrowserIntentStore(): BrowserIntentStore {
  let pending: BrowserPendingIntent | null = null;
  let sequence = 0;
  const listeners = new Set<() => void>();
  const publish = () => {
    for (const listener of listeners) listener();
  };
  return {
    snapshot: () => pending,
    open(url) {
      pending = { id: ++sequence, url };
      publish();
    },
    clear(id) {
      if (!pending || (id !== undefined && pending.id !== id)) return;
      pending = null;
      publish();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Preserves the shipped `{ appId: "browser", args: { url } }` intent contract. */
export class BrowserIntent {
  constructor(private readonly openApp: OpenAppIntent) {}
  open(url: string): void {
    this.openApp({ appId: BROWSER_APP_ID, args: { url } });
  }
  toArgs(url: string): { url: string } {
    return { url };
  }
}

export function openUrlInBrowser(intent: BrowserIntent, url: string): void {
  intent.open(url);
}
