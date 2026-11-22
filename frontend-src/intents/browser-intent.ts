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
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
