import type { EventRpcClient } from "../runtime/event-rpc";
import type { JsonValue } from "../runtime/protocol";

export type ArtifactType = "mail" | "file" | "signal_thread" | "signal_message" | "browser_page";

export interface Artifact<T extends Record<string, JsonValue> = Record<string, JsonValue>> {
  id: string;
  type: ArtifactType | string;
  data: T;
  availableAt?: number;
}

export interface ArtifactListResponse {
  ok: boolean;
  artifacts: Artifact[];
}

export interface ArtifactFetchResponse {
  ok: boolean;
  status?: number;
  artifact?: Artifact;
}

export class ArtifactService {
  constructor(private readonly rpc: EventRpcClient) {}

  async list(type?: Exclude<ArtifactType, "browser_page">): Promise<Artifact[]> {
    const payload = type ? { artifactType: type } : {};
    const result = await this.rpc.call<ArtifactListResponse>(
      "manifold.artifacts.request",
      payload,
      "manifold.artifacts.response",
    );
    return result.ok && Array.isArray(result.artifacts) ? result.artifacts : [];
  }

  async fetchBrowserPage(lookupKey: string): Promise<Artifact | null> {
    const result = await this.rpc.call<ArtifactFetchResponse>(
      "manifold.artifacts.fetch",
      { artifactType: "browser_page", lookup_key: lookupKey },
      "manifold.artifacts.fetch.response",
    );
    return result.ok && result.artifact ? result.artifact : null;
  }

  mail(): Promise<Artifact[]> { return this.list("mail"); }
  files(): Promise<Artifact[]> { return this.list("file"); }
  signalThreads(): Promise<Artifact[]> { return this.list("signal_thread"); }
  signalMessages(): Promise<Artifact[]> { return this.list("signal_message"); }
}
