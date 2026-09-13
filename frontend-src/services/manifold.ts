import type { EventRpcClient } from "../runtime/event-rpc";
import type { JsonValue } from "../runtime/protocol";

export interface ChipStatus {
  capacity: number;
  heat: number;
  coolEveryMs: number;
  serverNowMs: number;
  [key: string]: JsonValue;
}

export class ManifoldService {
  constructor(private readonly rpc: EventRpcClient) {}

  chipStatus(): Promise<ChipStatus> {
    return this.rpc.call<ChipStatus>(
      "manifold.chip.status",
      {},
      "manifold.chip.status.result",
    );
  }

  scan(payload: Record<string, JsonValue>): Promise<JsonValue> {
    return this.rpc.call(
      "manifold.chip.scan",
      payload,
      "manifold.chip.scan.result",
    );
  }

  command(
    command: string,
    payload: Record<string, JsonValue> = {},
  ): Promise<JsonValue> {
    return this.rpc.call(
      "manifold.command.request",
      { command, payload },
      "manifold.command.response",
    );
  }

  /** Preserve command()'s envelope for embedded pages; typed clients can request its result. */
  async commandResult<T>(
    command: string,
    payload: Record<string, JsonValue> = {},
  ): Promise<T> {
    const response = await this.command(command, payload);
    if (
      !response ||
      typeof response !== "object" ||
      Array.isArray(response) ||
      response.ok !== true
    ) {
      const error =
        response && typeof response === "object" && !Array.isArray(response)
          ? response.error
          : null;
      throw new Error(
        typeof error === "string" ? error : `Command failed: ${command}`,
      );
    }
    return (response.result ?? {}) as T;
  }

  bookmarks(): Promise<JsonValue> {
    return this.command("browser.bookmarks.list");
  }

  addBookmark(url: string, title?: string): Promise<JsonValue> {
    return this.command("browser.bookmarks.add", { url, title: title ?? url });
  }

  removeBookmark(url: string): Promise<JsonValue> {
    return this.command("browser.bookmarks.remove", { url });
  }

  submitBounty(payload: { url?: string; fileId?: string }): Promise<JsonValue> {
    return this.rpc.call(
      "manifold.bounty.submit",
      payload,
      "manifold.bounty.submit.result",
    );
  }
}
