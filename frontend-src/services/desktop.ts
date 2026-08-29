import type { EventRpcClient } from "../runtime/event-rpc";
import type { JsonValue } from "../runtime/protocol";

export class DesktopService {
  constructor(private readonly rpc: EventRpcClient) {}

  openGame(gameId: string): Promise<JsonValue> {
    return this.rpc.call("nori_open_game", { gameId });
  }

  closeGame(gameId: string): Promise<JsonValue> {
    return this.rpc.call("nori_close_game", { gameId });
  }

  requestNoriTalk(payload: Record<string, JsonValue> = {}): Promise<JsonValue> {
    return this.rpc.call("nori_talk.request", payload);
  }

  testNetwork(): Promise<JsonValue> {
    return this.rpc.call("settings.network.test", {});
  }
}
