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
  constructor(private readonly rpc: EventRpcClient) {}

  async list<T = Record<string, JsonValue>>(type?: Exclude<ArtifactType, "browser_page">): Promise<Artifact<T>[]> {
    const payload: Record<string, JsonValue> = {};
    if (type) payload.artifactType = type;
    const result = await this.rpc.call<ArtifactListResponse>(
      "manifold.artifacts.request",
      payload,
      "manifold.artifacts.response",
    );
    return result.ok && Array.isArray(result.artifacts)
      ? result.artifacts as Artifact<T>[]
      : [];
  }

  fetchBrowserPageResponse<T = Record<string, JsonValue>>(lookupKey: string): Promise<ArtifactFetchResponse<T>> {
    return this.rpc.call<ArtifactFetchResponse<T>>(
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
