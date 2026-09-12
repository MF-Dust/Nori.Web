import type { ArcadeClient } from "../runtime/arcade-client";
import type { JsonValue } from "../runtime/protocol";
import type { WorldStore } from "../runtime/world-store";
import type { BuiltInGame, GameService } from "../services/games";

export interface GameSnapshot<T> {
  state: T | null;
  mounted: boolean;
  pending: boolean;
  error: string | null;
}
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
        this.finish(false);
        this.fencedVersion = -1;
      }
      if (raw.cartridgeId === game && raw.type === "cartridge_unmounted") this.fencedVersion = -1;
      if (raw.requestId === this.request?.id) {
        if (raw.type === "error" || raw.success === false) {
          this.finish(false, String(raw.error ?? raw.message ?? "Game request failed"));
        } else if (raw.type === "dispatch_ack" || raw.type === "cartridge_mounted" || raw.type === "cartridge_mounted_ack") {
          this.finish(true);
        }
      }
      if (raw.cartridgeId === game || String(raw.type).startsWith("world_")) {
        this.refresh();
        if (this.users && (raw.type === "world_joined" || raw.type === "world_created")) void this.ensureMounted();
        this.advanceFence();
      }
    }));
    this.cleanup.push(arcade.onState(state => {
      if (state !== "open") this.finish(false, this.request ? "Connection interrupted" : undefined);
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
  private refresh() {
    const runtime = this.world.runtime(this.game);
    if (!runtime) { this.publish({ state: null, mounted: false }); return; }
    try { this.publish({ state: this.parse(runtime.state), mounted: true }); }
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
          this.finish(false);
          if (this.world.runtime(this.game) && this.arcade.connectionState === "open") {
            try { this.games.unmount(this.game); } catch { /* Connection may have closed. */ }
          }
        }
      });
    };
  };
  dispatch = (command: Command): Promise<boolean> => {
    if (!this.value.mounted) return Promise.resolve(false);
    return this.send(() => this.games.dispatch(this.game, command));
  };
  private advanceFence() {
    const runtime = this.world.runtime(this.game);
    if (!this.users || !runtime || this.arcade.connectionState !== "open") return;
    if (runtime.headVersion <= runtime.visibleVersion || runtime.headVersion <= this.fencedVersion) return;
    try {
      this.arcade.send({
        type: "advance_visibility_fence", cartridgeId: this.game,
        visibilityFenceId: "ui", version: runtime.headVersion,
        requestId: "fence-" + crypto.randomUUID(),
      });
      this.fencedVersion = runtime.headVersion;
    } catch { /* A new world snapshot resets the fence after reconnect. */ }
  }
  dispose() {
    this.disposed = true;
    this.finish(false);
    this.cleanup.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
