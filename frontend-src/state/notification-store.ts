import type { ReactNode } from "react";
import type { ArcadeServerMessage, JsonValue } from "../runtime/protocol";

export type NotificationAction =
  | { type: "open-app"; appId: string; args?: Record<string, JsonValue> }
  | { type: "noop" };

export interface NotificationInput {
  appId?: string;
  title: string;
  subtitle?: string;
  body?: string;
  durationMs?: number;
  icon?: ReactNode;
  accentColor?: string;
  sfx?: string;
  dismissKey?: string;
  action?: NotificationAction;
  onClick?: () => void;
}

export interface NotificationRecord extends NotificationInput {
  id: string;
  timestamp: number;
}

export interface NotificationSnapshot {
  queue: readonly NotificationRecord[];
  deferred: readonly NotificationRecord[];
  suppressed: boolean;
}

export interface NotificationStore {
  snapshot(): NotificationSnapshot;
  push(input: NotificationInput): string;
  dismiss(id: string): void;
  dismissByKey(key: string): void;
  dismissAll(): void;
  flushDeferred(): void;
  setSuppressed(suppressed: boolean): void;
  playCue(cue: string): void;
  subscribe(listener: () => void): () => void;
  dispose(): void;
}

export interface NotificationStoreOptions {
  maxItems?: number;
  now?: () => number;
  createId?: () => string;
  playCue?: (cue: string) => void;
}

const DEFAULT_MAX_ITEMS = 50;
const CUE_DEBOUNCE_MS = 350;

function defaultCreateId(): string {
  const uuid = globalThis.crypto?.randomUUID;
  if (uuid) return uuid.call(globalThis.crypto);
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function jsonObject(value: unknown): Record<string, JsonValue> | undefined {
  const object = record(value);
  return object ? (object as Record<string, JsonValue>) : undefined;
}

/** Decode the existing notification.pushed contract without trusting unknown fields. */
export function notificationInputFromMessage(
  message: ArcadeServerMessage,
): { id: string; input: NotificationInput } | null {
  const raw = message as unknown as Record<string, unknown>;
  if (raw.type !== "event" || raw.channel !== "notification.pushed") return null;
  const payload = record(raw.payload);
  if (!payload || typeof payload.id !== "string" || !payload.id) return null;
  if (typeof payload.title !== "string" || !payload.title) return null;

  const click = record(payload.onClick);
  let action: NotificationAction | undefined;
  if (click?.type === "open-app" && typeof click.appId === "string" && click.appId) {
    const args = jsonObject(click.args);
    action = { type: "open-app", appId: click.appId, ...(args ? { args } : {}) };
  } else if (click?.type === "noop") {
    action = { type: "noop" };
  }

  return {
    id: payload.id,
    input: {
      ...(typeof payload.appId === "string" ? { appId: payload.appId } : {}),
      title: payload.title,
      ...(typeof payload.subtitle === "string" ? { subtitle: payload.subtitle } : {}),
      ...(typeof payload.body === "string" ? { body: payload.body } : {}),
      ...(typeof payload.durationMs === "number" &&
      Number.isFinite(payload.durationMs) &&
      payload.durationMs >= 0
        ? { durationMs: payload.durationMs }
        : {}),
      ...(action ? { action } : {}),
    },
  };
}

export function createNotificationStore(
  options: NotificationStoreOptions = {},
): NotificationStore {
  const maxItems = Math.max(1, options.maxItems ?? DEFAULT_MAX_ITEMS);
  const now = options.now ?? Date.now;
  const createId = options.createId ?? defaultCreateId;
  const play = options.playCue;
  const listeners = new Set<() => void>();
  const lastCueAt = new Map<string, number>();
  let queue: NotificationRecord[] = [];
  let deferred: NotificationRecord[] = [];
  let suppressed = false;
  let disposed = false;
  let snapshot: NotificationSnapshot = { queue, deferred, suppressed };

  const publish = () => {
    snapshot = { queue, deferred, suppressed };
    for (const listener of listeners) listener();
  };
  const cue = (name: string) => {
    if (!play) return;
    const at = now();
    const previous = lastCueAt.get(name);
    if (previous !== undefined && at - previous < CUE_DEBOUNCE_MS) return;
    lastCueAt.set(name, at);
    play(name);
  };
  const remove = (id: string) => {
    const before = queue.length + deferred.length;
    queue = queue.filter((item) => item.id !== id);
    deferred = deferred.filter((item) => item.id !== id);
    return before !== queue.length + deferred.length;
  };

  return {
    snapshot: () => snapshot,
    push(input) {
      if (disposed) return "";
      const record: NotificationRecord = {
        ...input,
        id: createId(),
        timestamp: now(),
      };
      if (suppressed) deferred = [record, ...deferred].slice(0, maxItems);
      else {
        queue = [record, ...queue].slice(0, maxItems);
        cue(input.sfx ?? "comms-notify-toast-in");
      }
      publish();
      return record.id;
    },
    dismiss(id) {
      if (!remove(id)) return;
      cue("comms-notify-dismiss");
      publish();
    },
    dismissByKey(key) {
      const before = queue.length + deferred.length;
      queue = queue.filter((item) => item.dismissKey !== key);
      deferred = deferred.filter((item) => item.dismissKey !== key);
      if (before === queue.length + deferred.length) return;
      cue("comms-notify-dismiss");
      publish();
    },
    dismissAll() {
      if (!queue.length && !deferred.length) return;
      queue = [];
      deferred = [];
      cue("comms-notify-dismiss");
      publish();
    },
    flushDeferred() {
      if (!deferred.length) return;
      queue = [...deferred, ...queue].slice(0, maxItems);
      deferred = [];
      cue("comms-notify-deferred-flush");
      publish();
    },
    setSuppressed(next) {
      if (disposed || next === suppressed) return;
      suppressed = next;
      if (!suppressed && deferred.length) {
        queue = [...deferred, ...queue].slice(0, maxItems);
        deferred = [];
        cue("comms-notify-deferred-flush");
      }
      publish();
    },
    playCue: cue,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      queue = [];
      deferred = [];
      listeners.clear();
      lastCueAt.clear();
      publish();
    },
  };
}
