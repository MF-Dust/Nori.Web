import { ChatRuntimeController } from "../apps/chat-runtime";
import { decodeChatAudioFrame } from "./chat-media";
import { SpeechPlayer } from "./speech-player";
import { ArcadeClient, type ArcadeClientOptions } from "./arcade-client";
import { LocalAuthController } from "./auth";
import { EventRpcClient } from "./event-rpc";
import { ArcadeMediaClient } from "./media-client";
import type { JsonValue } from "./protocol";
import { WorldStore } from "./world-store";
import { BrowserAppModel } from "../apps/browser";
import { FilesAppModel } from "../apps/files";
import { MailAppModel } from "../apps/mail";
import { MessengerAppModel } from "../apps/messenger";
import { TerminalAppModel } from "../apps/terminal";
import { ArtifactService } from "../services/artifacts";
import { ChatService } from "../services/chat";
import { DesktopService } from "../services/desktop";
import { GameService } from "../services/games";
import { ManifoldService } from "../services/manifold";
import { SignalService, type CommandTransport } from "../services/signal";

export class NoriFrontendRuntime {
  readonly auth = new LocalAuthController();
  readonly arcade: ArcadeClient;
  readonly media = new ArcadeMediaClient();
  readonly world = new WorldStore();
  readonly rpc: EventRpcClient;
  readonly artifacts: ArtifactService;
  readonly manifold: ManifoldService;
  readonly desktop: DesktopService;
  readonly chat: ChatService;
  readonly games: GameService;
  readonly signal: SignalService;
  readonly browser: BrowserAppModel;
  readonly files: FilesAppModel;
  readonly mail: MailAppModel;
  readonly messenger: MessengerAppModel;
  readonly terminal: TerminalAppModel;

  readonly conversation: ChatRuntimeController;
  readonly speech: SpeechPlayer;
  private cleanup: Array<() => void> = [];
  private disposed = false;
  private started = false;
  private locale?: string;
  private audioEnabled = false;
  private ignoredSpeechOperations = new Set<string>();
  private mediaError: string | null = null;
  get speechError() {
    return this.mediaError;
  }

  async enableSpeech(enabled: boolean): Promise<boolean> {
    this.mediaError = null;
    if (enabled) {
      try {
        await this.speech.unlock();
        if (this.disposed) return false;
        if (this.media.connectionState !== "open") await this.connectMedia();
      } catch (error) {
        this.failSpeech(String(error));
        return false;
      }
    }
    if (this.disposed) return false;
    // Enabling during a text reply must not queue its remaining chunks without chunk zero.
    const operations = this.world.runtime("chat")?.state.operations;
    this.ignoredSpeechOperations = new Set(
      operations && typeof operations === "object" && !Array.isArray(operations)
        ? Object.keys(operations)
        : [],
    );
    this.audioEnabled = enabled;
    if (!enabled) this.speech.reset();
    const accepted = await this.conversation.setMode(
      enabled ? "audio" : "text",
    );
    if (!accepted) {
      this.audioEnabled = false;
      this.speech.reset();
    }
    return accepted;
  }
  private failSpeech(message: string) {
    this.mediaError = message;
    this.audioEnabled = false;
    this.speech.reset();
    void this.conversation.setMode("text");
  }

  constructor(options: ArcadeClientOptions = {}) {
    this.arcade = new ArcadeClient(options);
    this.rpc = new EventRpcClient(this.arcade);
    this.artifacts = new ArtifactService(this.rpc);
    this.manifold = new ManifoldService(this.rpc);
    this.desktop = new DesktopService(this.rpc);
    this.chat = new ChatService(this.arcade, this.world);
    this.games = new GameService(this.arcade, this.world);

    const signalTransport: CommandTransport = {
      execute: async <T = JsonValue>(
        command: string,
        payload: Record<string, JsonValue>,
      ) => {
        try {
          return {
            ok: true,
            result: await this.manifold.commandResult<T>(command, payload),
          };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    };
    this.signal = new SignalService(signalTransport);

    this.browser = new BrowserAppModel(this.artifacts, this.manifold);
    this.files = new FilesAppModel(this.artifacts, this.manifold);
    this.mail = new MailAppModel(this.artifacts, this.manifold);
    this.messenger = new MessengerAppModel(this.artifacts, this.manifold);
    this.terminal = new TerminalAppModel(this.manifold);
    this.conversation = new ChatRuntimeController(this.world, this.arcade);
    this.speech = new SpeechPlayer({
      started: (operationId, blockId) => {
        void this.conversation.audioStarted(operationId, blockId);
      },
      done: (operationId, blockId) => {
        void this.conversation.audioDone(operationId, blockId);
      },
      error: (message) => this.failSpeech(message),
    });
    this.cleanup.push(
      this.arcade.onMessage((message) => this.world.consume(message)),
    );
    this.cleanup.push(
      this.arcade.onState((state) => {
        if (this.disposed) return;
        if (state === "open" && this.started)
          this.arcade.openMyWorld(this.locale);
        if (state !== "open") {
          this.speech.reset();
          this.media.close();
        }
      }),
    );
    this.cleanup.push(
      this.media.onFrame((bytes) => {
        const frame = decodeChatAudioFrame(bytes);
        if (
          frame &&
          this.audioEnabled &&
          !this.ignoredSpeechOperations.has(frame.operationId)
        )
          this.speech.receive(frame);
      }),
    );
    this.cleanup.push(
      this.media.onState((state) => {
        if (state === "closed" && this.audioEnabled && !this.disposed)
          this.failSpeech("Speech connection closed");
      }),
    );
    this.cleanup.push(
      this.world.subscribe((_state, message) => {
        if (
          message.type === "world_joined" ||
          message.type === "world_created"
        ) {
          this.speech.reset();
          // Browser audio needs a gesture. Text mode also releases pending speech after reconnect.
          this.audioEnabled = false;
          void this.conversation.setMode("text");
          if (this.world.snapshot().mediaGrant)
            void this.connectMedia().catch((error) =>
              this.failSpeech(String(error)),
            );
        } else if (message.type === "world_left") {
          this.speech.reset();
          this.media.close();
        }
        const raw = message as unknown as {
          type: string;
          channel?: string;
          payload?: Record<string, unknown>;
        };
        const payload = raw.payload;
        if (
          this.audioEnabled &&
          raw.type === "event" &&
          raw.channel === "nori.tts.audio" &&
          payload?.purpose === "chat" &&
          typeof payload.audio === "string" &&
          typeof payload.operationId === "string" &&
          !this.ignoredSpeechOperations.has(payload.operationId)
        ) {
          void this.speech.receiveEncoded(
            payload.operationId,
            Number(payload.blockId ?? 0),
            payload.audio,
          );
        }
      }),
    );
  }

  async start(locale?: string): Promise<void> {
    this.locale = locale;
    const auth = await this.auth.refresh();
    if (this.disposed || auth.status !== "authenticated") return;
    await this.connectWorld(locale);
  }

  async connectWorld(locale = this.locale): Promise<void> {
    if (this.disposed) return;
    this.locale = locale;
    this.started = true;
    await this.arcade.connect();
  }

  async connectMedia(): Promise<void> {
    if (this.disposed) return;
    const grant = this.world.snapshot().mediaGrant;
    if (!grant) throw new Error("World does not have a media grant yet");
    await this.media.connect(grant);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cleanup.forEach((fn) => fn());
    this.conversation.dispose();
    this.speech.dispose();
    this.rpc.dispose();
    this.media.close();
    this.arcade.close();
  }
}
