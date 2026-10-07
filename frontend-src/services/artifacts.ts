import type { EventRpcClient } from "../runtime/event-rpc";
import type { JsonValue } from "../runtime/protocol";

export type ArtifactType = "app" | "mail" | "file" | "signal_thread" | "signal_message" | "browser_page";

export interface Artifact<T = Record<string, JsonValue>> {
  id: string;
  type: ArtifactType | string;
  data: T;
  availableAt?: number;
  surfacedAt?: number;
}

export interface ArtifactListResponse {
  ok: boolean;
  artifacts: Artifact[];
}

export interface ArtifactFetchResponse<T = Record<string, JsonValue>> {
  ok: boolean;
  status?: number;
  body?: string;
  artifact?: Artifact<T>;
}

export class ArtifactService {
  /**
   * Requests still awaiting their reply. An entry lives only until its request
   * settles, so a later call always asks the server again and never sees stale data.
   */
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(private readonly rpc: EventRpcClient) {}

  /** Replies from before an invalidation may finish, but must not be reused by a new load. */
  invalidate(): void {
    this.inflight.clear();
  }

  /** Identical concurrent requests (same channel and payload) share one round trip. */
  private call<T>(channel: string, payload: Record<string, JsonValue>, responseChannel: string): Promise<T> {
    const key = JSON.stringify([channel, payload]);
    const shared = this.inflight.get(key) as Promise<T> | undefined;
    if (shared) return shared;
    const request: Promise<T> = this.rpc.call<T>(channel, payload, responseChannel).finally(() => {
      if (this.inflight.get(key) === request) this.inflight.delete(key);
    });
    this.inflight.set(key, request);
    return request;
  }

  async list<T = Record<string, JsonValue>>(type?: Exclude<ArtifactType, "browser_page">): Promise<Artifact<T>[]> {
    const payload: Record<string, JsonValue> = {};
    if (type) payload.artifactType = type;
    const result = await this.call<ArtifactListResponse>(
      "manifold.artifacts.request",
      payload,
      "manifold.artifacts.response",
    );
    // The reply is shared between concurrent callers; hand each its own array to sort/splice.
    return result.ok && Array.isArray(result.artifacts)
      ? [...result.artifacts] as Artifact<T>[]
      : [];
  }

  fetchBrowserPageResponse<T = Record<string, JsonValue>>(lookupKey: string): Promise<ArtifactFetchResponse<T>> {
    return this.call<ArtifactFetchResponse<T>>(
      "manifold.artifacts.fetch",
      { artifactType: "browser_page", lookup_key: lookupKey },
      "manifold.artifacts.fetch.response",
    );
  }

  async fetchBrowserPage<T = Record<string, JsonValue>>(lookupKey: string): Promise<Artifact<T> | null> {
    const result = await this.fetchBrowserPageResponse<T>(lookupKey);
    return result.ok && result.artifact ? result.artifact : null;
  }

  apps<T = Record<string, JsonValue>>(): Promise<Artifact<T>[]> { return this.list<T>("app"); }
  mail<T = Record<string, JsonValue>>(): Promise<Artifact<T>[]> { return this.list<T>("mail"); }
  files<T = Record<string, JsonValue>>(): Promise<Artifact<T>[]> { return this.list<T>("file"); }
  signalThreads<T = Record<string, JsonValue>>(): Promise<Artifact<T>[]> { return this.list<T>("signal_thread"); }
  signalMessages<T = Record<string, JsonValue>>(): Promise<Artifact<T>[]> { return this.list<T>("signal_message"); }
}
