import type { ArcadeClient } from "../runtime/arcade-client";
import type { JsonValue } from "../runtime/protocol";
import type { WorldStore } from "../runtime/world-store";

export class ChatService {
  constructor(private readonly arcade: ArcadeClient, private readonly world: WorldStore) {}

  sendMessage(text: string): string {
    const runtime = this.world.runtime("chat");
    if (!runtime) throw new Error("chat cartridge is not mounted");
    return this.arcade.dispatch("chat", runtime.headVersion, { type: "playerMessage", text }, "player");
  }

  acknowledgeAudioStarted(operationId: string, blockId = 0): string {
    return this.dispatchAudio("audioStarted", operationId, blockId);
  }

  acknowledgeAudioDone(operationId: string, blockId = 0): string {
    return this.dispatchAudio("audioDone", operationId, blockId);
  }

  private dispatchAudio(type: "audioStarted" | "audioDone", operationId: string, blockId: number): string {
    const runtime = this.world.runtime("chat");
    if (!runtime) throw new Error("chat cartridge is not mounted");
    return this.arcade.dispatch("chat", runtime.headVersion, {
      type,
      operationId,
      blockId,
    } as { type: string; [key: string]: JsonValue });
  }
}
