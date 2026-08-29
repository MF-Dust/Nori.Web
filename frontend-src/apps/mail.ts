import type { Artifact, ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import type { JsonValue } from "../runtime/protocol";

export interface MailData {
  from: string;
  to: string;
  subject: string;
  body_md: string;
  folder: string;
  date: string;
  read_fact?: string;
  [key: string]: JsonValue | undefined;
}

export type MailArtifact = Artifact<MailData>;

export class MailAppModel {
  constructor(private readonly artifacts: ArtifactService, private readonly manifold: ManifoldService) {}

  async inbox(): Promise<MailArtifact[]> {
    const items = await this.artifacts.mail<MailData>();
    return items
      .filter((item) => item.type === "mail")
      .filter((item) => item.data.folder !== "sent")
      .sort((a, b) => String(b.data.date ?? "").localeCompare(String(a.data.date ?? "")));
  }

  async markRead(mail: MailArtifact): Promise<void> {
    const factId = typeof mail.data.read_fact === "string" ? mail.data.read_fact : mail.id;
    await this.manifold.command("mail.markRead", { artifactId: mail.id, factId });
  }
}
