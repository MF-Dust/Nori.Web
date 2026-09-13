import { subscribeManifoldChanges } from "./runtime/manifold-subscription";
import { SignalDanielConversationRuntime } from "./apps/signal-daniel";
import { ChipController } from "./runtime/chip-controller";
import {
  ChipButton,
  ChipReadout,
  ChipOverlay,
  ChipUpgradeNotice,
} from "./components/chip-overlay";
import { PreviewScreen } from "./screens/preview-screen";
import { BrowserPodcastRuntime } from "./apps/browser-page-runtime";
import { desktopMusicTarget } from "./runtime/audio-mixer";
import { initializeGraphics } from "./runtime/graphics-detection";
import { AboutScreen, SystemAlert } from "./screens/system-screen";
import { CreditsScreen } from "./screens/credits-screen";
import {
  SettingsScreen,
  type SettingsRuntime,
} from "./screens/settings-screen";
import { SystemService } from "./services/system";
import {
  createTerminalLocalFileSystem,
  connectTerminalRemote,
} from "./apps/terminal-filesystem";
import { codenamesStateSchema } from "./apps/codenames-model";
import { sourceLocale, createSourceTranslate } from "./i18n/translate";
import { pictionaryStateSchema } from "./apps/pictionary-model";
import { PictionaryDrawingBridge } from "./apps/pictionary-runtime";
import { GameCartridgeController } from "./apps/game-cartridge-controller";
import { chessStateSchema } from "./apps/chess-model";
import { useEffect, useState } from "react";
import { SpeechModeControl } from "./components/speech-mode-control";
import { ConversationPanel } from "./components/conversation-panel";
import { SourceLogin } from "./components/source-login";
import { NoriStage } from "./live2d/nori-stage";
import { DesktopSurface } from "./components/desktop-surface";
import { useAudioSettings } from "./state/audio-store";
import { useGraphicsSettings } from "./state/graphics-store";
import type { AuthState } from "./runtime/auth";
import { createCakeDuelPresentationAssets } from "./apps/cakeduel-assets";
import { CakeDuelRuntimeController } from "./apps/cakeduel-runtime";
import {
  createRecoveredDesktopRuntime,
  type RecoveredDesktopRuntimeBundle,
} from "./apps/recovered-presentation";
import { RecoveredDesktopShell } from "./components/recovered-desktop-shell";
import { NoriFrontendRuntime } from "./runtime/frontend-runtime";
import { createSourceIdleRuntimeEngine } from "./state/idle-runtime-engine";

/** Recovered NormalApp export aY / local eY used by MailScreen download progress. */
const MAIL_ATTACHMENT_DOWNLOAD_DURATION_MS = 1800;

function preferredLocale(): string {
  try {
    return localStorage.getItem("arcade-language") ?? navigator.language;
  } catch {
    return navigator.language;
  }
}
const locale = sourceLocale(preferredLocale());
const sourceTranslate = createSourceTranslate(locale);

function worldFacts(frontend: NoriFrontendRuntime): Set<string> {
  const result = new Set<string>();
  for (const runtime of frontend.world.snapshot().cartridges.values()) {
    const facts = runtime.state.facts;
    if (!facts || typeof facts !== "object" || Array.isArray(facts)) continue;
    for (const [factId, value] of Object.entries(facts)) {
      if (value === true || value === 1 || (value && typeof value === "object"))
        result.add(factId);
    }
  }
  return result;
}

function hasWorldFact(frontend: NoriFrontendRuntime, factId: string): boolean {
  return worldFacts(frontend).has(factId);
}

function createSourceSession() {
  initializeGraphics();
  const frontend = new NoriFrontendRuntime();
  const daniel = new SignalDanielConversationRuntime({
    manifold: frontend.manifold,
    hasFact: (factId) => hasWorldFact(frontend, factId),
    playCue: frontend.audio.playCue,
  });
  const chip = new ChipController(frontend.arcade, () =>
    sourceTranslate("chip.scan_failed"),
  );
  const previewRuntime = {
    subscribe: (listener: () => void) =>
      subscribeManifoldChanges(frontend.world, listener),
    hasFact: (factId: string) => hasWorldFact(frontend, factId),
    setContentKey: chip.setContentKey,
  };
  const podcast = new BrowserPodcastRuntime((audio) =>
    frontend.audio.connectMediaElement(audio),
  );
  frontend.audio.installUnlock();
  const codenames = new GameCartridgeController(
    "codenames",
    frontend.games,
    frontend.world,
    frontend.arcade,
    (raw) => codenamesStateSchema.parse(raw),
  );
  const pictionary = new GameCartridgeController(
    "pictionary",
    frontend.games,
    frontend.world,
    frontend.arcade,
    (raw) => pictionaryStateSchema.parse(raw),
  );
  const drawing = new PictionaryDrawingBridge(pictionary, frontend.arcade);
  const chess = new GameCartridgeController(
    "chess",
    frontend.games,
    frontend.world,
    frontend.arcade,
    (raw) => chessStateSchema.parse(raw),
  );
  const cakeduel = new CakeDuelRuntimeController(
    frontend.games,
    frontend.world,
    frontend.arcade,
  );
  const idle = createSourceIdleRuntimeEngine({
    getFacts: () => worldFacts(frontend),
    subscribeFacts: (listener) =>
      subscribeManifoldChanges(frontend.world, listener),
    emitFact: async (factId) => {
      await frontend.manifold.command("client.emitFact", { factId });
    },
    getWorldId: () => frontend.world.snapshot().worldId,
  });
  idle.start();

  const idlePresentation = {
    ...idle,
    claimMemento(onCompleted?: () => void) {
      idle.claimMemento(() => {
        void frontend.manifold.command("idle.complete", {}).catch((error) => {
          console.error("[SourceApp] idle.complete failed", error);
        });
        onCompleted?.();
      });
    },
  };

  let bundle: RecoveredDesktopRuntimeBundle | undefined;

  const launchApp = (request: {
    appId: string;
    mode: string;
    args?: unknown;
  }) => bundle?.runtime.store.getState().launchApp(request);

  const openUrl = (url: string) => {
    if (bundle?.openBrowserIntent) {
      void bundle.openBrowserIntent(url);
      return;
    }
    void launchApp({
      appId: "browser",
      mode: "launch",
      args: { url },
    });
  };

  const terminalFiles = createTerminalLocalFileSystem(frontend.files);
  const system = new SystemService(frontend.arcade);
  const settings: SettingsRuntime = {
    arcade: frontend.arcade,
    system,
    speechControl: <SpeechModeControl frontend={frontend} locale={locale} />,
    translate: sourceTranslate,
    onReset: async () => {
      await system.resetWorld(locale);
      // Stop autosave before deleting progress so the old run cannot reappear.
      idle.dispose();
      try {
        await frontend.auth.signOut();
      } catch (error) {
        console.warn("[Settings] post-reset sign-out failed", error);
      }
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("idle.run:") || key === "os-store-source-preview")
            localStorage.removeItem(key);
        }
      } finally {
        window.location.reload();
      }
    },
  };
  const creditsOpened = () => {
    void frontend.manifold
      .commandResult("client.emitFact", { factId: "credits.opened" })
      .catch((error) => {
        console.warn("[Credits] could not record open", error);
      });
  };
  bundle = createRecoveredDesktopRuntime({
    terminal: {
      translate: sourceTranslate,
      getLocalFileSystem: () =>
        frontend.world.snapshot().worldId ? terminalFiles : null,
      connectRemote: (host) => connectTerminalRemote(frontend.manifold, host),
      launchPreview: (file) => {
        void launchApp({
          appId: "preview",
          mode: "launch",
          args: { fileId: file.id },
        });
      },
    },
    mail: {
      setContentKey: chip.setContentKey,
      subscribe: (listener) =>
        subscribeManifoldChanges(frontend.world, listener),
      translate: sourceTranslate,
      playCue: frontend.audio.playCue,
      model: frontend.mail,
      attachmentDownloadDurationMs: MAIL_ATTACHMENT_DOWNLOAD_DURATION_MS,
    },
    files: {
      model: frontend.files,
      translate: sourceTranslate,
      hasFact: (factId) => hasWorldFact(frontend, factId),
      subscribe: (listener) =>
        subscribeManifoldChanges(frontend.world, listener),
      launchApp,
      reduceMotion: () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    browser: {
      setPageContext: chip.setContentKey,
      playCue: frontend.audio.playCue,
      page: {
        podcast,
        model: frontend.browser,
        locale: () => locale,
        getFacts: () => worldFacts(frontend),
        subscribeFacts: (listener) =>
          subscribeManifoldChanges(frontend.world, listener),
        subscribeEnvelopeChanges: (listener) =>
          frontend.arcade.onMessage((message) => {
            const raw = message as unknown as {
              type?: string;
              channel?: string;
            };
            if (
              raw.type === "event" &&
              raw.channel === "sites.envelopes.changed"
            )
              listener();
          }),
        invokeCommand: (command, payload) =>
          frontend.manifold.command(command, payload),
      },
      translate: sourceTranslate,
    },
    signal: {
      daniel,
      setContentKey: chip.setContentKey,
      playSound: frontend.audio.playCue,
      service: frontend.signal,
      accountName: () => {
        const auth = frontend.auth.snapshot();
        return auth.status === "authenticated" ? auth.session.user.email : "";
      },
      authenticated: false,
      translate: sourceTranslate,
      messenger: {
        model: frontend.messenger,
        hasFact: (factId) => hasWorldFact(frontend, factId),
        subscribe: (listener) =>
          subscribeManifoldChanges(frontend.world, listener),
        playCue: frontend.audio.playCue,
        translate: sourceTranslate,
        openUrl,
      },
    },
    idle: idlePresentation,
    codenames: {
      controller: codenames,
      translate: sourceTranslate,
      locale,
      playSound: frontend.audio.playCue,
    },
    pictionary: { controller: pictionary, drawing, locale, playSound: frontend.audio.playCue, startSoundLoop: frontend.audio.startCueLoop },
    chess: {
      controller: chess,
      translate: sourceTranslate,
      onSound: (sound) => frontend.audio.playCue(`chess.${sound}`),
    },
    cakeduel: {
      controller: cakeduel,
      translate: sourceTranslate,
      assets: createCakeDuelPresentationAssets(locale),
    },
    desktop: {
      playCue: frontend.audio.playCue,
      windows: {
        system: {
          about: { component: AboutScreen },
          alert: {
            component: (props) => (
              <SystemAlert {...props} translate={sourceTranslate} />
            ),
          },
        },
        settings: {
          main: { component: () => <SettingsScreen runtime={settings} /> },
        },
        credits: {
          main: {
            component: () => (
              <CreditsScreen
                translate={sourceTranslate}
                onOpened={creditsOpened}
              />
            ),
          },
        },
        preview: {
          main: {
            component: (props) => (
              <PreviewScreen
                {...props}
                model={frontend.files}
                locale={locale}
                runtime={previewRuntime}
              />
            ),
          },
        },
      },
      enableInstallGuard: true,
      persistName: "os-store-source-preview",
    },
  });
  return {
    frontend,
    chip,
    daniel,
    idle,
    codenames,
    cakeduel,
    chess,
    pictionary,
    drawing,
    podcast,
    bundle,
  };
}

type SourceSession = ReturnType<typeof createSourceSession>;

/** Own external subscriptions inside the effect lifetime, including StrictMode remounts. */
export function SourceApp() {
  const [source, setSource] = useState<SourceSession | null>(null);
  useEffect(() => {
    const session = createSourceSession();
    setSource(session);
    return () => {
      session.chip.dispose();
      session.daniel.dispose();
      session.cakeduel.dispose();
      session.chess.dispose();
      session.codenames.dispose();
      session.drawing.dispose();
      session.pictionary.dispose();
      session.idle.dispose();
      session.podcast.dispose();
      session.bundle.runtime.dispose();
      session.frontend.dispose();
    };
  }, []);
  return source ? <SourceSessionView source={source} /> : null;
}

function SourceSessionView({ source }: { source: SourceSession }) {
  const graphicsMode = useGraphicsSettings((state) => state.mode);
  const [auth, setAuth] = useState<AuthState>(source.frontend.auth.snapshot());
  const [facts, setFacts] = useState(() => worldFacts(source.frontend));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "gfx-performance",
      graphicsMode !== "quality",
    );
    return () => document.documentElement.classList.remove("gfx-performance");
  }, [graphicsMode]);
  useEffect(() => {
    let disposed = false;
    const globalWindow = window as Window & {
      NoriAPI?: { openUrlInBrowser?: (url: string) => void };
    };
    const previousApi = globalWindow.NoriAPI;
    const api = {
      ...previousApi,
      openUrlInBrowser: (url: string) => {
        void source.bundle.openBrowserIntent?.(url);
      },
    };
    globalWindow.NoriAPI = api;
    const unsubscribeAuth = source.frontend.auth.subscribe(setAuth);
    const unsubscribeWorld = source.frontend.world.subscribe((state) => {
      source.daniel.syncJumpEpoch(state.worldId);
      const nextFacts = worldFacts(source.frontend);
      setFacts((previous) =>
        previous.size === nextFacts.size &&
        [...nextFacts].every((fact) => previous.has(fact))
          ? previous
          : nextFacts,
      );
      setReady(!!state.worldId);
    });
    const unsubscribeConnection = source.frontend.arcade.onState((state) => {
      if (state === "open") setError(null);
    });
    const syncAudio = () => {
      const audio = useAudioSettings.getState();
      source.frontend.audio.sync(audio);
      source.frontend.speech.setVolume(1, audio.voiceRate);
    };
    syncAudio();
    const unsubscribeAudio = useAudioSettings.subscribe(syncAudio);
    void source.frontend.start(locale).catch((error) => {
      if (!disposed) setError(String(error));
    });
    return () => {
      disposed = true;
      if (globalWindow.NoriAPI === api) globalWindow.NoriAPI = previousApi;
      unsubscribeAuth();
      unsubscribeWorld();
      unsubscribeConnection();
      unsubscribeAudio();
    };
  }, [source]);
  useEffect(() => {
    const target = desktopMusicTarget(facts);
    source.frontend.audio.setDesktopMusic(
      auth.status === "authenticated" && ready ? target.track : null,
      target.fade,
    );
  }, [source, auth.status, ready, facts]);
  const chipOffline =
    facts.has("arg.memory.shown") && !facts.has("arg.ending.shown");
  useEffect(() => {
    source.chip.configure(
      source.frontend.world.snapshot().worldId,
      auth.status === "authenticated" &&
        ready &&
        facts.has("system.repaired") &&
        !chipOffline,
    );
  }, [source, facts, ready, auth.status, chipOffline]);
  if (auth.status !== "authenticated")
    return (
      <SourceLogin
        auth={source.frontend.auth}
        status={auth.status}
        error={error}
        locale={locale}
        onAuthenticated={() => source.frontend.connectWorld(locale)}
      />
    );
  return (
    <RecoveredDesktopShell
      playCue={source.frontend.audio.playCue}
      bundle={source.bundle}
      facts={facts}
      factsReady={ready}
      bootstrapStartupApps
      translate={sourceTranslate}
      locale={locale}
      className="source-frontend-root"
      onSignOut={() => {
        void source.frontend.auth
          .signOut()
          .then(() => {
            source.frontend.arcade.close();
            source.frontend.media.close();
          })
          .catch((error) => setError(String(error)));
      }}
      background={
        <>
          <DesktopSurface />
          <NoriStage speech={source.frontend.speech} />
        </>
      }
      overlay={
        <>
          <ConversationPanel
            frontend={source.frontend}
            locale={locale}
            chipButton={
              facts.has("system.repaired") && (
                <ChipButton
                  controller={source.chip}
                  locale={locale}
                  offline={chipOffline}
                  playCue={source.frontend.audio.playCue}
                />
              )
            }
            chipNotice={
              facts.has("system.repaired") &&
              facts.has("virus.cleared") &&
              !chipOffline
                ? (lastNoriAt) => (
                    <ChipUpgradeNotice
                      controller={source.chip}
                      locale={locale}
                      lastNoriAt={lastNoriAt}
                    />
                  )
                : undefined
            }
            chipReadout={
              <ChipReadout controller={source.chip} locale={locale} />
            }
          />
          <ChipOverlay
            controller={source.chip}
            locale={locale}
            store={source.bundle.runtime.store}
            upgraded={facts.has("virus.cleared")}
            playCue={source.frontend.audio.playCue}
          />
          {error && (
            <div className="source-connection-error" role="alert">
              {error}
            </div>
          )}
        </>
      }
    />
  );
}
