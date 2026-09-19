import { NoriReactionDirector } from "../live2d/reaction-director";
import { StoryDirector, STORY_ORDER } from "../story/story-director";
import { ChatRuntimeController } from "../apps/chat-runtime";
import { decodeChatAudioFrame } from "./chat-media";
import { SpeechPlayer } from "./speech-player";
import { AudioMixer } from "./audio-mixer";
import { NoriSceneStore } from "../state/nori-scene";
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

import { HeadPat } from "../live2d/head-pat";
import { Live2DDebugRuntime } from "../live2d/debug-runtime";

export class NoriFrontendRuntime {
  readonly headPat = new HeadPat();
  readonly live2dDebug = new Live2DDebugRuntime();
  readonly reactions = new NoriReactionDirector();
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
  readonly audio = new AudioMixer();
  readonly scene = new NoriSceneStore();
  readonly story: StoryDirector;
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
  /** The agent owns the reply; a local gesture only submits the shipped request event. */
  requestPatReaction(): boolean {
    if (
      this.disposed ||
      !this.headPat.enabled ||
      this.scene.snapshot().active ||
      this.scene.snapshot().chatMode !== "normal" ||
      this.scene.snapshot().noriSleep ||
      !this.conversation.snapshot().connected ||
      !this.world.snapshot().worldId ||
      this.arcade.connectionState !== "open"
    )
      return false;
    try {
      this.arcade.sendEvent(
        "nori_talk.request",
        { talkId: "pat" },
        { cartridgeId: "manifold.web" },
      );
      return true;
    } catch {
      return false;
    }
  }

  private failSpeech(message: string) {
    this.mediaError = message;
    this.audioEnabled = false;
    this.speech.reset();
    void this.conversation.setMode("text");
  }
  private syncSpeechCuts() {
    const operations = this.world.runtime("chat")?.state.operations;
    if (
      !operations ||
      typeof operations !== "object" ||
      Array.isArray(operations)
    )
      return;
    for (const [id, operation] of Object.entries(operations)) {
      if (
        operation &&
        typeof operation === "object" &&
        !Array.isArray(operation) &&
        typeof operation.cutBlockId === "number"
      )
        this.speech.cut(id, operation.cutBlockId);
    }
  }

  constructor(options: ArcadeClientOptions = {}) {
    this.arcade = new ArcadeClient(options);
    this.rpc = new EventRpcClient(this.arcade);
    this.artifacts = new ArtifactService(this.rpc);
    this.manifold = new ManifoldService(this.rpc);
    this.story = new StoryDirector(new Set(STORY_ORDER.map((story) => story.id)), (factId) =>
      this.manifold.commandResult("client.emitFact", { factId }),
    );
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
    this.conversation = new ChatRuntimeController(
      this.world,
      this.arcade,
      this.scene.snapshot,
    );
    this.speech = new SpeechPlayer(
      {
        started: (operationId, blockId) => {
          void this.conversation.audioStarted(operationId, blockId);
        },
        done: (operationId, blockId) => {
          void this.conversation.audioDone(operationId, blockId);
        },
        error: (message) => this.failSpeech(message),
      },
      () => this.audio.speechRoute(),
    );
    this.cleanup.push(
      this.speech.subscribe((event) => {
        if (event.type === "reset") this.audio.resetSpeechEffects();
      }),
    );
    this.cleanup.push(
      this.scene.subscribe(() =>
        this.audio.setCorruptVoice(this.scene.snapshot().corruptVoice),
      ),
    );
    this.cleanup.push(
      this.arcade.onMessage((message) => this.world.consume(message)),
    );
    this.cleanup.push(
      this.arcade.onState((state) => {
        if (this.disposed) return;
        if (state === "open" && this.started)
          this.arcade.openMyWorld(this.locale);
        if (state !== "open") {
          this.story.sync(null, new Set());
          this.scene.reset();
          this.reactions.reset();
          this.speech.reset();
          this.media.close();
        }
      }),
    );
    this.cleanup.push(
      this.media.onFrame((bytes) => {
        this.syncSpeechCuts();
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
          this.scene.reset();
          this.reactions.reset();
          this.speech.reset();
          // Browser audio needs a gesture. Text mode also releases pending speech after reconnect.
          this.audioEnabled = false;
          void this.conversation.setMode("text");
          if (this.world.snapshot().mediaGrant)
            void this.connectMedia().catch((error) =>
              this.failSpeech(String(error)),
            );
        } else if (message.type === "world_left") {
          this.scene.reset();
          this.reactions.reset();
          this.speech.reset();
          this.media.close();
        }
        this.story.sync(
          this.world.snapshot().worldId,
          this.world.facts(),
          message.type === "world_joined" || message.type === "world_created",
        );
        const raw = message as unknown as {
          type: string;
          channel?: string;
          payload?: Record<string, unknown>;
        };
        const payload = raw.payload;
        this.syncSpeechCuts();
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
    this.story.dispose();
    this.scene.reset();
    this.reactions.dispose();
    this.conversation.dispose();
    this.speech.dispose();
    this.audio.dispose();
    this.rpc.dispose();
    this.media.close();
    this.arcade.close();
  }
}
