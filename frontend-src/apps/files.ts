import type { Artifact, ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import type { JsonValue } from "../runtime/protocol";

export interface FileData extends Record<string, JsonValue> {
  display_path: string;
  mime: string;
  folder?: string;
  content?: string;
  open_emits_fact?: string;
  open_sentinel_fact?: string;
  read_fact?: string;
}

export type FileArtifact = Artifact<FileData>;

export class FilesAppModel {
  constructor(private readonly artifacts: ArtifactService, private readonly manifold: ManifoldService) {}

  async list(): Promise<FileArtifact[]> {
    return (await this.artifacts.files())
      .filter((item): item is FileArtifact => item.type === "file")
      .sort((a, b) => String(a.data.display_path ?? a.id).localeCompare(String(b.data.display_path ?? b.id)));
  }

  async open(file: FileArtifact): Promise<FileArtifact> {
    const factId = file.data.open_emits_fact ?? file.data.open_sentinel_fact ?? file.data.read_fact;
    if (typeof factId === "string" && factId) {
      await this.manifold.command("client.emitFact", { artifactId: file.id, fileId: file.id, factId });
    }
    return file;
  }

  async unlockVolume(volumeId: string, factId?: string): Promise<JsonValue> {
    return this.manifold.command("vault.unlock", {
      volumeId,
      ...(factId ? { factId } : {}),
    });
  }
}
