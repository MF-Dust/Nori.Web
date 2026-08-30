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
import {
  SignalService,
  type CommandTransport,
} from "../services/signal";

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

  private readonly unsubscribeWorld: () => void;

  constructor(options: ArcadeClientOptions = {}) {
    this.arcade = new ArcadeClient(options);
    this.rpc = new EventRpcClient(this.arcade);
    this.artifacts = new ArtifactService(this.rpc);
    this.manifold = new ManifoldService(this.rpc);
    this.desktop = new DesktopService(this.rpc);
    this.chat = new ChatService(this.arcade, this.world);
    this.games = new GameService(this.arcade, this.world);

    const signalTransport: CommandTransport = {
      execute: async <T = JsonValue>(command: string, payload: Record<string, JsonValue>) => {
        try {
          return {
            ok: true,
            result: (await this.manifold.command(command, payload)) as T,
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
    this.unsubscribeWorld = this.arcade.onMessage((message) => this.world.consume(message));
  }

  async start(locale?: string): Promise<void> {
    await this.auth.refresh();
    await this.arcade.connect();
    this.arcade.openMyWorld(locale);
  }

  async connectMedia(): Promise<void> {
    const grant = this.world.snapshot().mediaGrant;
    if (!grant) throw new Error("World does not have a media grant yet");
    await this.media.connect(grant);
  }

  dispose(): void {
    this.unsubscribeWorld();
    this.rpc.dispose();
    this.media.close();
    this.arcade.close();
  }
}
