import type { ArcadeClient } from "../runtime/arcade-client";
import type { JsonValue } from "../runtime/protocol";
import type { WorldStore } from "../runtime/world-store";

export type BuiltInGame = "cakeduel" | "codenames" | "chess" | "pictionary";

export class GameService {
  constructor(private readonly arcade: ArcadeClient, private readonly world: WorldStore) {}

  dispatch(game: BuiltInGame, cmd: { type: string; [key: string]: JsonValue }): string {
    const runtime = this.world.runtime(game);
    if (!runtime) throw new Error(`${game} cartridge is not mounted`);
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
