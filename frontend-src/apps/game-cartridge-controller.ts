import type { ArcadeClient } from "../runtime/arcade-client";
import type { JsonValue } from "../runtime/protocol";
import type { WorldStore } from "../runtime/world-store";
import type { BuiltInGame, GameService } from "../services/games";

export interface GameSnapshot<T> {
  state: T | null;
  mounted: boolean;
  pending: boolean;
  error: string | null;
  presenting?: boolean;
  connected?: boolean;
}
export type GameTransitionPresenter<T> = (previous: T, next: T, signal: AbortSignal) => Promise<void>;
type Command = { type: string; [key: string]: JsonValue };

/** Shared request lifecycle for games whose UI follows the replicated head. */
export class GameCartridgeController<T> {
  private value: GameSnapshot<T> = { state: null, mounted: false, pending: false, error: null };
  private listeners = new Set<() => void>();
  private cleanup: Array<() => void> = [];
  private request: { id: string; resolve: (value: boolean) => void } | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private users = 0;
  private disposed = false;
  private fencedVersion = -1;
  private head: T | null = null;
  private presenter: GameTransitionPresenter<T> | null = null;
  private presentationAbort = new AbortController();
  private presentationQueue = Promise.resolve();
  private presentationCount = 0;

  constructor(
    readonly game: BuiltInGame,
    private games: GameService,
    private world: WorldStore,
    private arcade: ArcadeClient,
    private parse: (raw: unknown) => T,
  ) {
    this.cleanup.push(world.subscribe((_state, message) => {
      const raw = message as unknown as Record<string, unknown>;
      if (raw.type === "world_left" || raw.type === "world_joined" || raw.type === "world_created") {
        this.resetPresentation();
        this.finish(false);
        this.fencedVersion = -1;
      }
      if (raw.cartridgeId === game && (raw.type === "cartridge_unmounted" || raw.type === "cartridge_mounted" || raw.type === "cartridge_mounted_ack")) {
        this.resetPresentation(); this.fencedVersion = -1;
      }
      if (raw.requestId === this.request?.id) {
        if (raw.type === "error" || raw.success === false) {
          this.finish(false, String(raw.error ?? raw.message ?? "Game request failed"));
        } else if (raw.type === "dispatch_ack" || raw.type === "cartridge_mounted" || raw.type === "cartridge_mounted_ack") {
          this.finish(true);
        }
      }
      if (raw.cartridgeId === game || String(raw.type).startsWith("world_")) {
        this.refresh(raw.type === "runtime_transition");
        if (this.users && (raw.type === "world_joined" || raw.type === "world_created")) void this.ensureMounted();
        this.advanceFence();
      }
    }));
    this.cleanup.push(arcade.onState(state => {
      this.publish({ connected: state === "open" });
      if (state !== "open") {
        this.resetPresentation(); this.refresh();
        this.finish(false, this.request ? "Connection interrupted" : undefined);
      }
    }));
    this.refresh();
  }

  snapshot = (): GameSnapshot<T> => this.value;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(patch: Partial<GameSnapshot<T>>) {
    this.value = { ...this.value, ...patch };
    for (const listener of this.listeners) listener();
  }
  private resetPresentation() {
    this.presentationAbort.abort(); this.presentationAbort = new AbortController();
    this.presentationQueue = Promise.resolve(); this.presentationCount = 0;
    this.head = null;
    this.publish({ presenting: false });
  }
  /** Presentation owners may pace replicated transitions before acknowledging visibility. */
  setTransitionPresenter = (presenter: GameTransitionPresenter<T>): (() => void) => {
    this.presenter = presenter;
    return () => {
      if (this.presenter !== presenter) return;
      this.presenter = null; this.resetPresentation(); this.refresh(); this.advanceFence();
    };
  };
  private refresh(transition = false) {
    const runtime = this.world.runtime(this.game);
    if (!runtime) { this.head = null; this.publish({ state: null, mounted: false }); return; }
    try {
      const next = this.parse(runtime.state), previous = this.head;
      this.head = next;
      if (transition && previous && this.presenter && this.users) {
        const presenter = this.presenter, signal = this.presentationAbort.signal, version = runtime.headVersion;
        this.presentationCount++; this.publish({ presenting: true });
        this.presentationQueue = this.presentationQueue.then(async () => {
          if (signal.aborted) return;
          try { await presenter(previous, next, signal); }
          catch { /* An unavailable visual must not leave the cartridge permanently blocked. */ }
          if (signal.aborted) return;
          this.presentationCount--;
          this.publish({ state: next, mounted: true, presenting: this.presentationCount > 0 });
          this.advanceFence(version);
        });
      } else if (!this.presentationCount) this.publish({ state: next, mounted: true });
    }
    catch (error) { this.publish({ state: null, mounted: true, error: String(error) }); }
  }
  private finish(success: boolean, error?: string) {
    if (this.timeout !== null) clearTimeout(this.timeout);
    this.timeout = null;
    const request = this.request;
    this.request = null;
    if (request || error) this.publish({ pending: false, ...(error ? { error } : {}) });
    request?.resolve(success);
  }
  private send(send: () => string): Promise<boolean> {
    if (this.disposed || this.request) return Promise.resolve(false);
    try {
      const id = send();
      this.publish({ pending: true, error: null });
      return new Promise(resolve => {
        this.request = { id, resolve };
        // A lost ack must not disable the UI forever; never replay a move automatically.
        this.timeout = setTimeout(() => this.finish(false, "Game request timed out"), 15_000);
      });
    } catch (error) {
      this.publish({ error: error instanceof Error ? error.message : String(error) });
      return Promise.resolve(false);
    }
  }
  ensureMounted = (): Promise<boolean> => {
    if (this.world.runtime(this.game)) return Promise.resolve(true);
    if (!this.world.snapshot().worldId || this.arcade.connectionState !== "open") return Promise.resolve(false);
    return this.send(() => this.games.mount(this.game));
  };
  retain = (): (() => void) => {
    this.users++;
    void this.ensureMounted();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.users = Math.max(0, this.users - 1);
      // Route transitions may unmount/remount synchronously.
      queueMicrotask(() => {
        if (!this.users && !this.disposed) {
          this.resetPresentation();
          this.finish(false);
          if (this.world.runtime(this.game) && this.arcade.connectionState === "open") {
            try { this.games.unmount(this.game); } catch { /* Connection may have closed. */ }
          }
        }
      });
    };
  };
  dispatch = (command: Command): Promise<boolean> => {
    if (!this.value.mounted || this.presentationCount || this.arcade.connectionState !== "open") return Promise.resolve(false);
    return this.send(() => this.games.dispatch(this.game, command));
  };
  private advanceFence(version?: number) {
    const runtime = this.world.runtime(this.game);
    if (!this.users || !runtime || this.arcade.connectionState !== "open") return;
    if (version === undefined && this.presentationCount) return;
    const target = Math.min(version ?? runtime.headVersion, runtime.headVersion);
    if (target <= runtime.visibleVersion || target <= this.fencedVersion) return;
    try {
      this.arcade.send({
        type: "advance_visibility_fence", cartridgeId: this.game,
        visibilityFenceId: "ui", version: target,
        requestId: "fence-" + crypto.randomUUID(),
      });
      this.fencedVersion = target;
    } catch { /* A new world snapshot resets the fence after reconnect. */ }
  }
  dispose() {
    this.disposed = true;
    this.resetPresentation();
    this.finish(false);
    this.cleanup.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
