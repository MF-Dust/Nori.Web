import type { Artifact, ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import type { JsonValue } from "../runtime/protocol";

export interface SignalThreadData {
  thread_id: string;
  title: string;
  participants: string[];
  avatar_path?: string;
  status?: string;
  [key: string]: JsonValue | undefined;
}

export interface SignalMessageData {
  thread_id: string;
  message_id: string;
  sender: string;
  kind: string;
  body_md: string;
  timestamp: string;
  read_fact?: string;
  [key: string]: JsonValue | undefined;
}

export type SignalThreadArtifact = Artifact<SignalThreadData>;
export type SignalMessageArtifact = Artifact<SignalMessageData>;

export interface SignalConversation {
  thread: SignalThreadArtifact;
  messages: SignalMessageArtifact[];
}

export class MessengerAppModel {
  constructor(private readonly artifacts: ArtifactService, private readonly manifold: ManifoldService) {}

  async conversations(): Promise<SignalConversation[]> {
    const [threads, messages] = await Promise.all([
      this.artifacts.signalThreads(),
      this.artifacts.signalMessages(),
    ]);
    const typedThreads = threads.filter((item): item is SignalThreadArtifact => item.type === "signal_thread");
    const typedMessages = messages.filter((item): item is SignalMessageArtifact => item.type === "signal_message");
    return typedThreads.map((thread) => ({
      thread,
      messages: typedMessages
        .filter((message) => message.data.thread_id === thread.data.thread_id)
        .sort((a, b) => String(a.data.timestamp ?? "").localeCompare(String(b.data.timestamp ?? ""))),
    }));
  }

  async markRead(message: SignalMessageArtifact): Promise<void> {
    const factId = typeof message.data.read_fact === "string" ? message.data.read_fact : message.id;
    await this.manifold.command("signal.markRead", { artifactId: message.id, factId });
  }
}
