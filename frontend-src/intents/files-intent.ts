export interface FilesIntentPayload {
  folderPath: string;
  selectKey?: string;
}

export interface FilesIntentStore {
  open(payload: FilesIntentPayload): void;
  pending(): FilesIntentPayload | null;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

export function createFilesIntentStore(): FilesIntentStore {
  let value: FilesIntentPayload | null = null;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  return {
    open(payload) {
      value = payload;
      publish();
    },
    pending: () => value,
    clear() {
      if (!value) return;
      value = null;
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

