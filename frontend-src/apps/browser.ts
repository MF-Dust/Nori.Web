import type { Artifact, ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import type { JsonValue } from "../runtime/protocol";
import type {
  BrowserBookmark,
  BrowserPageData,
} from "./browser-page-runtime";

export interface BrowserPageFetchResult {
  ok: boolean;
  status?: number;
  body?: string;
  artifact?: Artifact<BrowserPageData>;
}

export class BrowserAppModel {
  constructor(
    private readonly artifacts: ArtifactService,
    private readonly manifold: ManifoldService,
  ) {}

  async fetchPage(url: string): Promise<BrowserPageFetchResult> {
    return this.artifacts.fetchBrowserPageResponse<BrowserPageData>(url);
  }

  /** Compatibility adapter retained for protocol-only callers. */
  async navigate(url: string): Promise<BrowserPageData | null> {
    const result = await this.fetchPage(url);
    return result.ok && result.artifact ? result.artifact.data : null;
  }

  /**
   * The shipped Browser presentation persists bookmarks locally. These command
   * helpers remain available for pages/backend features that use the protocol.
   */
  async bookmarks(): Promise<BrowserBookmark[]> {
    const result = await this.manifold.bookmarks() as any;
    const marks = result?.result?.bookmarks ?? result?.bookmarks ?? [];
    return Array.isArray(marks)
      ? marks.filter(
          (item): item is BrowserBookmark =>
            Boolean(item && typeof item.url === "string" && typeof item.title === "string"),
        )
      : [];
  }

  addBookmark(url: string, title?: string): Promise<JsonValue> {
    return this.manifold.addBookmark(url, title);
  }

  removeBookmark(url: string): Promise<JsonValue> {
    return this.manifold.removeBookmark(url);
  }

  invokeCommand(command: string, payload: Record<string, JsonValue> = {}): Promise<JsonValue> {
    return this.manifold.command(command, payload);
  }

  emitFact(factId: string): Promise<JsonValue> {
    return this.invokeCommand("client.emitFact", { factId });
  }
}

export type { BrowserBookmark, BrowserPageData } from "./browser-page-runtime";
