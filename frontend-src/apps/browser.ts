import type { ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import type { JsonValue } from "../runtime/protocol";

export interface BrowserPageData extends Record<string, JsonValue> {
  url?: string;
  title?: string;
  body_html?: string;
  supported_locales?: string[];
  favicon?: string | null;
}

export interface BrowserBookmark {
  url: string;
  title: string;
}

export class BrowserAppModel {
  constructor(private readonly artifacts: ArtifactService, private readonly manifold: ManifoldService) {}

  async navigate(url: string): Promise<BrowserPageData | null> {
    const artifact = await this.artifacts.fetchBrowserPage(url);
    return artifact ? artifact.data as BrowserPageData : null;
  }

  async bookmarks(): Promise<BrowserBookmark[]> {
    const result = await this.manifold.bookmarks() as any;
    const marks = result?.result?.bookmarks ?? result?.bookmarks ?? [];
    return Array.isArray(marks) ? marks.filter((item): item is BrowserBookmark => Boolean(item && typeof item.url === "string")) : [];
  }

  addBookmark(url: string, title?: string): Promise<JsonValue> {
    return this.manifold.addBookmark(url, title);
  }

  removeBookmark(url: string): Promise<JsonValue> {
    return this.manifold.removeBookmark(url);
  }
}
