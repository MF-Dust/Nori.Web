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

export type WorldListener = (state: WorldState, message: ArcadeServerMessage) => void;

function runtimeKey(cartridgeId: string, visibilityFenceId: string): string {
  return `${cartridgeId}:${visibilityFenceId}`;
}

export class WorldStore {
  private worldId: string | null = null;
  private mediaGrant: string | null = null;
  private readonly runtimes = new Map<string, CartridgeRuntime>();
  private readonly listeners = new Set<WorldListener>();

  snapshot(): WorldState {
    return {
      worldId: this.worldId,
      mediaGrant: this.mediaGrant,
      cartridges: new Map(this.runtimes),
    };
  }

  subscribe(listener: WorldListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private publish(message: ArcadeServerMessage): void {
    const state = this.snapshot();
    for (const listener of this.listeners) listener(state, message);
  }

  private installWorld(world: WorldSnapshot, mediaGrant?: string): void {
    this.worldId = world.worldId;
    this.mediaGrant = mediaGrant ?? null;
    this.runtimes.clear();
    for (const mounted of world.mountedCartridges ?? []) {
      for (const runtime of mounted.runtimes ?? []) {
        this.runtimes.set(runtimeKey(mounted.cartridgeId, runtime.visibilityFenceId), {
          cartridgeId: mounted.cartridgeId,
          visibilityFenceId: runtime.visibilityFenceId,
          headVersion: runtime.headVersion,
          visibleVersion: runtime.visibleVersion,
          state: structuredClone(runtime.state),
        });
      }
    }
  }

  runtime(cartridgeId: string, visibilityFenceId = cartridgeId === "manifold.web" ? "player" : "ui"): CartridgeRuntime | undefined {
    return this.runtimes.get(runtimeKey(cartridgeId, visibilityFenceId));
  }

  consume(message: ArcadeServerMessage): void {
    const raw = message as any;
    if ((message.type === "world_joined" || message.type === "world_created") && raw.world) {
      this.installWorld(raw.world as WorldSnapshot, raw.session?.mediaGrant);
      this.publish(message);
      return;
    }

    if (message.type === "cartridge_mounted" || message.type === "cartridge_mounted_ack") {
      const cartridgeId = String(raw.cartridgeId ?? "");
      for (const runtime of raw.runtimes ?? []) {
        this.runtimes.set(runtimeKey(cartridgeId, runtime.visibilityFenceId), {
          cartridgeId,
          visibilityFenceId: runtime.visibilityFenceId,
          headVersion: runtime.headVersion,
          visibleVersion: runtime.visibleVersion,
          state: structuredClone(runtime.state),
        });
      }
      this.publish(message);
      return;
    }

    if (message.type === "cartridge_unmounted") {
      const prefix = `${String(raw.cartridgeId)}:`;
      for (const key of [...this.runtimes.keys()]) if (key.startsWith(prefix)) this.runtimes.delete(key);
      this.publish(message);
      return;
    }

    if (message.type === "runtime_transition") {
      const cartridgeId = String(raw.cartridgeId);
      const matching = [...this.runtimes.values()].filter((runtime) => runtime.cartridgeId === cartridgeId);
      for (const runtime of matching) {
        const patches = (raw.transition?.patches ?? []) as JsonPatchOperation[];
        runtime.state = applyJsonPatch(runtime.state, patches);
        runtime.headVersion = Number(raw.version ?? runtime.headVersion);
      }
      this.publish(message);
      return;
    }

    if (message.type === "visibility_fence_advanced" || message.type === "visibility_fence_advanced_ack") {
      const key = runtimeKey(String(raw.cartridgeId), String(raw.visibilityFenceId));
      const runtime = this.runtimes.get(key);
      if (runtime) {
        runtime.visibleVersion = Number(raw.visibleVersion ?? runtime.visibleVersion);
        runtime.headVersion = Number(raw.headVersion ?? runtime.headVersion);
      }
      this.publish(message);
      return;
    }

    if (message.type === "world_left") {
      this.worldId = null;
      this.mediaGrant = null;
      this.runtimes.clear();
      this.publish(message);
      return;
    }

    this.publish(message);
  }
}
