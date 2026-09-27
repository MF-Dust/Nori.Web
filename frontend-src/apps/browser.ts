import type { Artifact, ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import type { JsonValue } from "../runtime/protocol";
import {
  FilesAppModel,
  type FilesPresentationSnapshot,
} from "./files";
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

export interface BrowserBountySubmitResult {
  ok: boolean;
  fact?: string;
}

export interface BrowserBountyFile {
  id: string;
  name: string;
  path: string;
  locked: boolean;
}

function stringValue(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function bountyFileFromArtifact(
  artifact: Artifact<Record<string, JsonValue>>,
): BrowserBountyFile | null {
  const data = artifact.data;
  const path = stringValue(data.display_path);
  if (!path) return null;
  const name = path.split("/").filter(Boolean).at(-1) ?? path;
  const recoverable =
    typeof data.threshold === "number" ||
    typeof data.recover_when === "string";
  const hasPayload =
    typeof data.body_md === "string" ||
    typeof data.asset_path === "string" ||
    typeof data.binary_asset_path === "string" ||
    (data.trainlog !== null &&
      typeof data.trainlog === "object" &&
      !Array.isArray(data.trainlog));
  return {
    id: artifact.id,
    name,
    path,
    locked: recoverable && !hasPayload,
  };
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

  async submitBounty(payload: {
    url?: string;
    fileId?: string;
  }): Promise<BrowserBountySubmitResult> {
    const result = await this.manifold.submitBounty(payload);
    if (!result || typeof result !== "object" || Array.isArray(result))
      return { ok: false };
    return {
      ok: result.ok === true,
      ...(typeof result.fact === "string" ? { fact: result.fact } : {}),
    };
  }

  bountyPresentation(): Promise<FilesPresentationSnapshot> {
    return new FilesAppModel(this.artifacts, this.manifold).presentation();
  }

  async bountyFiles(): Promise<BrowserBountyFile[]> {
    const artifacts =
      await this.artifacts.files<Record<string, JsonValue>>();
    return artifacts
      .map(bountyFileFromArtifact)
      .filter((file): file is BrowserBountyFile => file !== null)
      .sort((left, right) => left.path.localeCompare(right.path));
  }
}

export type { BrowserBookmark, BrowserPageData } from "./browser-page-runtime";
