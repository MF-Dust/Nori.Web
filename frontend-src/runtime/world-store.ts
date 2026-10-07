import { applyJsonPatch, type JsonPatchOperation } from "./json-patch";
import type { ArcadeServerMessage, JsonValue } from "./protocol";

export interface CartridgeSnapshot {
  visibilityFenceId: string;
  headVersion: number;
  visibleVersion: number;
  state: Record<string, JsonValue>;
}

export interface MountedCartridge {
  cartridgeId: string;
  runtimes: CartridgeSnapshot[];
}

export interface WorldSnapshot {
  worldId: string;
  mountedCartridges: MountedCartridge[];
}

export interface CartridgeRuntime {
  cartridgeId: string;
  visibilityFenceId: string;
  headVersion: number;
  visibleVersion: number;
  state: Record<string, JsonValue>;
}

export interface WorldState {
  worldId: string | null;
  mediaGrant: string | null;
  cartridges: ReadonlyMap<string, CartridgeRuntime>;
}

export type WorldListener = (
  state: WorldState,
  message: ArcadeServerMessage,
) => void;

function runtimeKey(cartridgeId: string, visibilityFenceId: string): string {
  return `${cartridgeId}:${visibilityFenceId}`;
}

export class WorldStore {
  private worldId: string | null = null;
  private mediaGrant: string | null = null;
  private readonly runtimes = new Map<string, CartridgeRuntime>();
  // A head advertised by a fence is not necessarily an applied state yet.
  private readonly appliedVersions = new Map<string, number>();
  private readonly listeners = new Set<WorldListener>();

  facts(): Set<string> {
    const result = new Set<string>();
    for (const runtime of this.runtimes.values()) {
      const facts = runtime.state.facts;
      if (!facts || typeof facts !== "object" || Array.isArray(facts)) continue;
      for (const [id, value] of Object.entries(facts))
        if (
          value === true ||
          value === 1 ||
          (value && typeof value === "object")
        )
          result.add(id);
    }
    return result;
  }

  snapshot(): WorldState {
    return {
      worldId: this.worldId,
      mediaGrant: this.mediaGrant,
      cartridges: new Map(this.runtimes),
    };
  }

  subscribe(listener: WorldListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private publish(message: ArcadeServerMessage): void {
    const state = this.snapshot();
    for (const listener of this.listeners) listener(state, message);
  }

  private installWorld(world: WorldSnapshot, mediaGrant?: string): void {
    this.worldId = world.worldId;
    this.mediaGrant = mediaGrant ?? null;
    this.runtimes.clear();
    this.appliedVersions.clear();
    for (const mounted of world.mountedCartridges ?? []) {
      for (const runtime of mounted.runtimes ?? []) {
        this.installRuntime(mounted.cartridgeId, runtime);
      }
    }
  }

  private installRuntime(cartridgeId: string, snapshot: CartridgeSnapshot): void {
    const key = runtimeKey(cartridgeId, snapshot.visibilityFenceId);
    if (snapshot.headVersion < (this.appliedVersions.get(key) ?? -1)) return;
    const previous = this.runtimes.get(key);
    this.runtimes.set(key, {
      cartridgeId, visibilityFenceId: snapshot.visibilityFenceId,
      headVersion: Math.max(previous?.headVersion ?? 0, snapshot.headVersion),
      visibleVersion: Math.max(previous?.visibleVersion ?? 0, snapshot.visibleVersion),
      state: structuredClone(snapshot.state),
    });
    this.appliedVersions.set(key, snapshot.headVersion);
  }

  runtime(
    cartridgeId: string,
    visibilityFenceId = cartridgeId === "manifold.web" ? "player" : "ui",
  ): CartridgeRuntime | undefined {
    return this.runtimes.get(runtimeKey(cartridgeId, visibilityFenceId));
  }

  consume(message: ArcadeServerMessage): void {
    const raw = message as any;
    if (
      (message.type === "world_joined" || message.type === "world_created") &&
      raw.world
    ) {
      this.installWorld(raw.world as WorldSnapshot, raw.session?.mediaGrant);
      this.publish(message);
      return;
    }

    if (typeof raw.worldId === "string" && this.worldId && raw.worldId !== this.worldId) return;

    if (
      message.type === "cartridge_mounted" ||
      message.type === "cartridge_mounted_ack" ||
      (message.type === "dispatch_ack" && raw.errorCode === "version_mismatch" && Array.isArray(raw.runtimes))
    ) {
      const cartridgeId = String(raw.cartridgeId ?? "");
      for (const runtime of raw.runtimes ?? []) {
        this.installRuntime(cartridgeId, runtime);
      }
      this.publish(message);
      return;
    }

    if (message.type === "cartridge_unmounted") {
      const prefix = `${String(raw.cartridgeId)}:`;
      for (const key of [...this.runtimes.keys()])
        if (key.startsWith(prefix)) { this.runtimes.delete(key); this.appliedVersions.delete(key); }
      this.publish(message);
      return;
    }

    if (message.type === "runtime_transition") {
      const cartridgeId = String(raw.cartridgeId);
      const matching = [...this.runtimes.values()].filter(
        (runtime) => runtime.cartridgeId === cartridgeId,
      );
      let applied = false;
      for (const runtime of matching) {
        const key = runtimeKey(cartridgeId, runtime.visibilityFenceId);
        if (typeof raw.version === "number" && raw.version <= (this.appliedVersions.get(key) ?? -1)) continue;
        const patches = (raw.transition?.patches ?? []) as JsonPatchOperation[];
        runtime.state = applyJsonPatch(runtime.state, patches);
        runtime.headVersion = Math.max(runtime.headVersion, Number(raw.version ?? runtime.headVersion));
        this.appliedVersions.set(key, Number(raw.version ?? runtime.headVersion));
        applied = true;
      }
      if (applied) this.publish(message);
      return;
    }

    if (
      message.type === "visibility_fence_advanced" ||
      message.type === "visibility_fence_advanced_ack"
    ) {
      const key = runtimeKey(
        String(raw.cartridgeId),
        String(raw.visibilityFenceId),
      );
      const runtime = this.runtimes.get(key);
      if (runtime) {
        runtime.visibleVersion = Math.max(runtime.visibleVersion, Number(raw.visibleVersion ?? runtime.visibleVersion));
        runtime.headVersion = Math.max(runtime.headVersion, Number(raw.headVersion ?? runtime.headVersion));
      }
      this.publish(message);
      return;
    }

    if (message.type === "dispatch_ack" && typeof raw.headVersion === "number") {
      for (const runtime of this.runtimes.values()) {
        if (runtime.cartridgeId === raw.cartridgeId) runtime.headVersion = Math.max(runtime.headVersion, raw.headVersion);
      }
      this.publish(message);
      return;
    }

    if (message.type === "world_left") {
      this.worldId = null;
      this.mediaGrant = null;
      this.runtimes.clear();
      this.appliedVersions.clear();
      this.publish(message);
      return;
    }

    this.publish(message);
  }
}
