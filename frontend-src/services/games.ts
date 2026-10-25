import type { ArcadeChannel } from "../runtime/arcade-client";
import type { JsonValue } from "../runtime/protocol";
import type { WorldStore } from "../runtime/world-store";

export type BuiltInGame = "cakeduel" | "codenames" | "chess" | "pictionary";
export type GameCommandGuard = (game: BuiltInGame, cmd: { type: string; [key: string]: JsonValue }) => string | null;

export class GameService {
  private guard: GameCommandGuard | null = null;
  constructor(private readonly arcade: ArcadeChannel, private readonly world: WorldStore) {}

  /** Lets an active multiplayer session veto commands that only make sense against Nori. */
  setCommandGuard(guard: GameCommandGuard | null) {
    this.guard = guard;
  }

  dispatch(game: BuiltInGame, cmd: { type: string; [key: string]: JsonValue }): string {
    const runtime = this.world.runtime(game);
    if (!runtime) throw new Error(`${game} cartridge is not mounted`);
    const blocked = this.guard?.(game, cmd);
    if (blocked) throw new Error(blocked);
    return this.arcade.dispatch(game, runtime.headVersion, cmd, "player");
  }

  mount(game: BuiltInGame): string {
    const requestId = `mount-${crypto.randomUUID()}`;
    this.arcade.send({ type: "mount_cartridge", cartridgeId: game, requestId });
    return requestId;
  }

  unmount(game: BuiltInGame): string {
    const requestId = `unmount-${crypto.randomUUID()}`;
    this.arcade.send({ type: "unmount_cartridge", cartridgeId: game, requestId });
    return requestId;
  }
}
