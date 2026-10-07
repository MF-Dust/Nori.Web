import type { ManagedWindow } from "../state/window-types";
import { IDLE_MEMENTO_COUNT } from "../apps/idle-faction-progression";

const CORRUPT_DOCUMENTS: Record<string, number> = {
  "1z9Kq7AfR2xMcL0d": 1,
  "1m4Pb8wYtC3zRnQe": 2,
  "1n5Dc2KsHqE6vJf7": 3,
};

export function corruptionDocument(window: Pick<ManagedWindow, "appId" | "windowType" | "props" | "minimized"> | undefined): number | null {
  if (!window || window.minimized || window.appId !== "browser" || window.windowType !== "popup") return null;
  const props = window.props as { url?: unknown } | undefined;
  if (typeof props?.url !== "string") return null;
  try {
    const match = /^\/file\/d\/([^/]+)\/view\/?$/.exec(new URL(props.url).pathname);
    return match ? CORRUPT_DOCUMENTS[match[1]] ?? null : null;
  } catch { return null; }
}

interface ProgressionOptions {
  getWorldId(): string | null;
  getFacts(): ReadonlySet<string>;
  getDesktop(): { windows: Record<string, ManagedWindow>; focusedWindowId: string | null };
  subscribeFacts(listener: () => void): () => void;
  subscribeWindows(listener: () => void): () => void;
  emitFact(factId: string): Promise<unknown>;
  getIdleMementoCount?(): number;
  completeIdle?(): Promise<unknown>;
  warn?(error: unknown): void;
  repairDelayMs?: number;
  installDelayMs?: number;
}

/** Restore the shipped repair and document-reveal producers, not scene completion. */
export function bindSourceStoryProgression(options: ProgressionOptions): () => void {
  let world: string | null = null;
  let disposed = false;
  let repairTimer: ReturnType<typeof setTimeout> | undefined;
  let installTimer: ReturnType<typeof setTimeout> | undefined;
  const emitted = new Set<string>();
  const pending = new Set<string>();
  const clearTimers = () => {
    clearTimeout(repairTimer); clearTimeout(installTimer);
    repairTimer = installTimer = undefined;
  };
  const emit = (factId: string) => {
    if (disposed || !world || emitted.has(factId) || pending.has(factId) || options.getFacts().has(factId)) return;
    const owner = world;
    pending.add(factId);
    const request = factId === "idle.manifold_complete" && options.completeIdle
      ? options.completeIdle() : options.emitFact(factId);
    void request.then(() => {
      if (disposed || world !== owner) return;
      pending.delete(factId);
      emitted.add(factId);
      update();
    }).catch((error) => {
      if (world === owner) pending.delete(factId);
      options.warn?.(error);
    });
  };
  const update = () => {
    if (disposed) return;
    const next = options.getWorldId();
    if (next !== world) { clearTimers(); emitted.clear(); pending.clear(); world = next; }
    if (!world) return;
    const facts = options.getFacts();
    // The final claim cannot be repeated. Resume its acknowledged-server
    // completion after a lost request or reload, without bypassing idle.complete.
    if (options.completeIdle && (options.getIdleMementoCount?.() ?? 0) >= IDLE_MEMENTO_COUNT &&
        facts.has("arg.memory.shown") && facts.has("arg.manifold_unlocked")) {
      emit("idle.manifold_complete");
    }
    if (facts.has("mail.help.read") && !facts.has("system.repaired") && repairTimer === undefined && !emitted.has("system.repaired")) {
      repairTimer = setTimeout(() => {
        repairTimer = undefined;
        if (options.getWorldId() === world && options.getFacts().has("mail.help.read")) emit("system.repaired");
      }, options.repairDelayMs ?? 2200);
    }
    // The archived installation takes about ten seconds between installing and installed.
    if (facts.has("qfr.installing") && !facts.has("qfr.installed") && installTimer === undefined && !emitted.has("qfr.installed")) {
      installTimer = setTimeout(() => {
        installTimer = undefined;
        if (options.getWorldId() === world && options.getFacts().has("qfr.installing")) emit("qfr.installed");
      }, options.installDelayMs ?? 10_000);
    }
    if (facts.has("virus.cleared")) return;
    const desktop = options.getDesktop();
    const doc = corruptionDocument(desktop.windows[desktop.focusedWindowId ?? ""]);
    if (doc !== null) emit(`corrupt.doc${doc}.read`);
    // As in the shipped monitor, let the reader leave the third document first.
    if (doc === null && [1, 2, 3].every((n) => facts.has(`corrupt.doc${n}.read`) || emitted.has(`corrupt.doc${n}.read`))) {
      emit("corrupt.climax_pending");
    }
  };
  const unsubFacts = options.subscribeFacts(update);
  const unsubWindows = options.subscribeWindows(update);
  update();
  return () => { disposed = true; clearTimers(); unsubFacts(); unsubWindows(); };
}
