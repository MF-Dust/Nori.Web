import { StoryScenes } from "./story/story-scenes";
import { bindSourceStoryProgression } from "./story/story-progression";
import {
  coalesceListener,
  createArtifactLoader,
  subscribeArtifactTypes,
  subscribeManifoldChanges,
} from "./runtime/manifold-subscription";
import { SignalDanielConversationRuntime } from "./apps/signal-daniel";
import { SIGNAL_ACCOUNT_NAME, SIGNAL_AUTH_FACT } from "./apps/signal-auth";
import { getEffectiveDesktopCompute, type DesktopComputeState } from "./state/compute-runtime";
import { DesktopComputeIndicator, DesktopComputeSummary } from "./components/desktop-indicators";
import {
  createSignalLocalReadFactsStore,
  createSignalPendingFocusStore,
  signalConversationUnreadCount,
} from "./apps/messenger-interactions";
import {
  SignalArrivalTracker,
  signalArrivalPreview,
  type SignalConversation,
} from "./apps/messenger";
import { ChipController } from "./runtime/chip-controller";
import {
  ChipButton,
  ChipReadout,
  ChipOverlay,
  ChipUpgradeNotice,
} from "./components/chip-overlay";
import { BrowserPodcastRuntime } from "./apps/browser-page-runtime";
import { desktopMusicTarget } from "./runtime/audio-mixer";
import { initializeGraphics } from "./runtime/graphics-detection";
import type { SettingsRuntime } from "./screens/settings-screen";
import { SystemService } from "./services/system";
import { useUnlockSettings } from "./state/unlock-store";
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
import { lazy as lazyComponent, useEffect, useState, useSyncExternalStore } from "react";
import { SpeechModeControl } from "./components/speech-mode-control";
import { ConversationPanel } from "./components/conversation-panel";
import { SourceLogin } from "./components/source-login";
import { NoriStage } from "./live2d/nori-stage";
import { NoriSceneEffects } from "./components/nori-scene-effects";
import { DesktopSurface } from "./components/desktop-surface";
import { useAudioSettings } from "./state/audio-store";
import { useGraphicsSettings } from "./state/graphics-store";
import type { AuthState } from "./runtime/auth";
import type { JsonValue } from "./runtime/protocol";
import { createCakeDuelPresentationAssets } from "./apps/cakeduel-assets";
import { CakeDuelRuntimeController } from "./apps/cakeduel-runtime";
import {
  createRecoveredDesktopRuntime,
  type RecoveredDesktopRuntimeBundle,
} from "./apps/recovered-presentation";
import { RecoveredDesktopShell } from "./components/recovered-desktop-shell";
import { SourceAssetBootGate } from "./components/source-asset-boot-gate";
import { SourceConnectionLayer } from "./components/source-connection-layer";
import { NoriFrontendRuntime } from "./runtime/frontend-runtime";
import { createNetworkFaultWebSocketFactory, readNetworkFaultProfile } from "./runtime/debug-tools";
import { createSourceIdleRuntimeEngine } from "./state/idle-runtime-engine";
import {
  DEFAULT_MARGINAL_GROWTH,
  bindMarginalGrowthEconomy,
  createMarginalGrowthStore,
} from "./state/marginal-growth-store";
import { NotificationLayer } from "./components/notification-layer";
import { NORI_PHASE_MOODS } from "./live2d/reaction-director";
import { notificationInputFromMessage } from "./state/notification-store";
import { bindOsNotifications, QFR_DECRYPT_MS, type OsNotificationBinding } from "./runtime/os-notifications";
import { createParadigmRevealStore } from "./state/paradigm-reveal-store";
import {
  hasRecoveredFilePayload,
  isRecoverableFile,
  normalizeFileArtifact,
  type FilesRecoveredFile,
} from "./apps/files";

const DebugScreen = lazyComponent(() => import("./screens/debug-screen").then((module) => ({ default: module.DebugScreen })));
const PreviewScreen = lazyComponent(() => import("./screens/preview-screen").then((module) => ({ default: module.PreviewScreen })));
const AboutScreen = lazyComponent(() => import("./screens/system-screen").then((module) => ({ default: module.AboutScreen })));
const SystemAlert = lazyComponent(() => import("./screens/system-screen").then((module) => ({ default: module.SystemAlert })));
const CreditsScreen = lazyComponent(() => import("./screens/credits-screen").then((module) => ({ default: module.CreditsScreen })));
const SettingsScreen = lazyComponent(() => import("./screens/settings-screen").then((module) => ({ default: module.SettingsScreen })));

/** Recovered NormalApp export aY / local eY used by MailScreen download progress. */
const MAIL_ATTACHMENT_DOWNLOAD_DURATION_MS = 1800;
/** Files recovery progress repaints at most this often (Idle ticks every 100 ms). */
const RECOVERY_REPAINT_MS = 250;

function preferredLocale(): string {
  try {
    return localStorage.getItem("arcade-language") ?? navigator.language;
  } catch {
    return navigator.language;
  }
}
const locale = sourceLocale(preferredLocale());
// Shared compatibility panels and assistive technology read the document locale.
document.documentElement.lang = locale;
const sourceTranslate = createSourceTranslate(locale);
const signalArrivalLabels = {
  recalled: sourceTranslate("signal.message.recalled"),
  image: sourceTranslate("signal.message.imagePreview"),
  file: sourceTranslate("signal.message.filePreview"),
};

function worldFacts(frontend: NoriFrontendRuntime): Set<string> {
  return frontend.world.facts();
}

function hasWorldFact(frontend: NoriFrontendRuntime, factId: string): boolean {
  return worldFacts(frontend).has(factId);
}

function createSourceSession() {
  initializeGraphics();
  const frontend = new NoriFrontendRuntime({
    createWebSocket: createNetworkFaultWebSocketFactory(readNetworkFaultProfile(localStorage)),
  });
  const signalLocalReadFacts = createSignalLocalReadFactsStore();
  // The dock badge and the Messenger window share one conversations load per change.
  const signalConversations = createArtifactLoader(
    frontend.world,
    ["signal_thread", "signal_message"],
    () => frontend.messenger.conversations(),
  );
  const messengerModel = {
    conversations: signalConversations.load,
    markThreadRead: (threadId: string) => frontend.messenger.markThreadRead(threadId),
    emitDownloadFact: (factId: string) => frontend.messenger.emitDownloadFact(factId),
  };
  const signalPendingFocus = createSignalPendingFocusStore();
  // Shipped `Xje.pendingFocusEmailId`: a mail arrival toast focuses its message.
  const mailPendingFocus = createSignalPendingFocusStore();
  const paradigmReveal = createParadigmRevealStore();
  const qfrDecrypt = createQfrDecryptState();
  let osNotifications: OsNotificationBinding | undefined;
  const signalArrivalTracker = new SignalArrivalTracker();
  const daniel = new SignalDanielConversationRuntime({
    manifold: frontend.manifold,
    hasFact: (factId) => hasWorldFact(frontend, factId),
    playCue: frontend.audio.playCue,
  });
  const chip = new ChipController(
    frontend.arcade,
    () => sourceTranslate("chip.scan_failed"),
    frontend.scene,
  );
  const previewRuntime = {
    subscribe: (listener: () => void) =>
      subscribeArtifactTypes(frontend.world, ["file"], listener),
    hasFact: (factId: string) => hasWorldFact(frontend, factId),
    setContentKey: chip.setContentKey,
  };
  const podcast = new BrowserPodcastRuntime((audio) =>
    frontend.audio.connectMediaElement(audio),
  );
  frontend.audio.installUnlock();
  // The game windows (and debug scenarios) are the only consumers, and none of
  // these emit or wait for story facts, so a controller is not created (and does
  // not listen to every world message) until its game is first opened.
  const codenames = lazy(() => new GameCartridgeController(
    "codenames",
    frontend.games,
    frontend.world,
    frontend.arcade,
    (raw) => codenamesStateSchema.parse(raw),
  ));
  const pictionary = lazy(() => new GameCartridgeController(
    "pictionary",
    frontend.games,
    frontend.world,
    frontend.arcade,
    (raw) => pictionaryStateSchema.parse(raw),
  ));
  const drawing = lazy(() => new PictionaryDrawingBridge(pictionary.get(), frontend.arcade));
  const chess = lazy(() => new GameCartridgeController(
    "chess",
    frontend.games,
    frontend.world,
    frontend.arcade,
    (raw) => chessStateSchema.parse(raw),
  ));
  const cakeduel = lazy(() => new CakeDuelRuntimeController(
    frontend.games,
    frontend.world,
    frontend.arcade,
    frontend.reactions,
  ));
  const idle = createSourceIdleRuntimeEngine({
    getFacts: () => worldFacts(frontend),
    subscribeFacts: (listener) =>
      subscribeManifoldChanges(frontend.world, listener),
    emitFact: async (factId) => {
      await frontend.manifold.command("client.emitFact", { factId });
    },
    getWorldId: () => frontend.world.snapshot().worldId,
    onComputeSync: (state) => {
      if (frontend.arcade.connectionState !== "open" || !frontend.world.snapshot().worldId) return;
      void frontend.manifold.command("idle.sync", {
        ...state, cap: Number.isFinite(state.cap) ? state.cap : null,
      }).catch((error) => {
        // Periodic: a sync cut off by a disconnect is simply re-sent after reconnect.
        if (frontend.arcade.connectionState === "open") console.error("[SourceApp] idle.sync failed", error);
      });
      const facts = worldFacts(frontend);
      if (state.currentAlignment === "equilibrium" && facts.has("arg.memory.shown") && !facts.has("arg.manifold_unlocked")) {
        void idle.emitFact("arg.manifold_unlocked").catch((error) => console.error("[SourceApp] manifold unlock failed", error));
      }
    },
  });
  idle.start();

  // The shipped Idle screen owns one marginal-growth store and drives its steps
  // from the live generator economy.
  const marginalGrowth = createMarginalGrowthStore(DEFAULT_MARGINAL_GROWTH);
  const releaseMarginalGrowth = bindMarginalGrowthEconomy(marginalGrowth, idle);

  const idlePresentation = {
    ...idle,
    playCue: frontend.audio.playCue,
    paradigmReveal,
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
    debugContent: <DebugScreen frontend={frontend} actions={{
      compute: idle.debug,
      marginalGrowth,
      loadScenario: async (game, scenarioId) => {
        const ok = game === "chess"
          ? await chess.get().dispatch({ type: "debugLoadScenario", scenarioId })
          : game === "cakeduel"
            ? await cakeduel.get().loadDebugScenario(scenarioId)
            : await codenames.get().dispatch({ type: "debugLoadScenario", scenarioId });
        if (!ok) throw new Error(
          (game === "chess" ? chess.get().snapshot().error : game === "cakeduel" ? cakeduel.get().snapshot().error : codenames.get().snapshot().error)
            ?? `Unable to load ${game} scenario.`,
        );
      },
    }} />,
    translate: sourceTranslate,
    onReset: async () => {
      await system.resetWorld(locale, useUnlockSettings.getState().fullUnlock);
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
      playCue: frontend.audio.playCue,
      getLocalFileSystem: () =>
        frontend.world.snapshot().worldId && hasWorldFact(frontend, "system.repaired") ? terminalFiles : null,
      connectRemote: (host) => connectTerminalRemote(frontend.manifold, host),
      launchPreview: (file) => {
        void launchApp({
          appId: "preview",
          mode: "launch",
          args: { fileId: file.id },
        });
      },
      registerDownload: (downloadFact, already) => osNotifications?.download(downloadFact, already),
    },
    mail: {
      setContentKey: chip.setContentKey,
      hasFact: (factId) => hasWorldFact(frontend, factId),
      locale: () => locale,
      subscribe: (listener) => subscribeArtifactTypes(frontend.world, ["mail"], listener),
      translate: sourceTranslate,
      playCue: frontend.audio.playCue,
      model: frontend.mail,
      attachmentDownloadDurationMs: MAIL_ATTACHMENT_DOWNLOAD_DURATION_MS,
      getPendingFocusEmailId: () => mailPendingFocus.get(),
      consumePendingFocusEmailId: () => {
        mailPendingFocus.consume();
      },
      subscribePendingFocus: mailPendingFocus.subscribe,
      onMailRead: (mailId) => osNotifications?.mailRead(mailId),
      onDownloaded: (factId, already) => osNotifications?.download(factId, already),
    },
    qfr: {
      computeState: () => ({ ...idle.snapshot().computeState, computeDrain: frontend.scene.snapshot().memoryComputeDrain }),
      facts: () => worldFacts(frontend),
      maxComputeThisRun: () => idle.snapshot().state.maxComputeThisRun,
      reduceMotion: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      subscribe: (listener) => {
        const releaseIdle = idle.subscribe(listener);
        const releaseFacts = subscribeManifoldChanges(frontend.world, listener);
        const releaseScene = frontend.scene.subscribe(listener);
        return () => { releaseIdle(); releaseFacts(); releaseScene(); };
      },
      suspended: () => frontend.scene.snapshot().active,
    },
    files: {
      model: frontend.files,
      playCue: frontend.audio.playCue,
      notify: (input) => { frontend.notifications.push(input); },
      recoveryState: () => {
        const snapshot = idle.snapshot();
        const effective = getEffectiveDesktopCompute({ ...snapshot.computeState, computeDrain: frontend.scene.snapshot().memoryComputeDrain });
        return { maxComputeThisRun: snapshot.state.maxComputeThisRun, computeCap: effective.cap, currentCompute: effective.compute };
      },
      // Idle ticks every 100 ms and the scene store can publish every frame; Files
      // only needs a few repaints per second.
      subscribeRecovery: (listener) => {
        const repaint = coalesceListener(listener, RECOVERY_REPAINT_MS);
        const releaseIdle = idle.subscribe(repaint);
        const releaseScene = frontend.scene.subscribe(repaint);
        return () => { releaseIdle(); releaseScene(); repaint.cancel(); };
      },
      translate: sourceTranslate,
      hasFact: (factId) => hasWorldFact(frontend, factId),
      decrypting: qfrDecrypt.active,
      subscribeDecrypting: qfrDecrypt.subscribe,
      subscribe: (listener) => subscribeArtifactTypes(frontend.world, ["file", "app"], listener),
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
        invokeCommand: async (command, payload) => {
          const factId = command === "client.emitFact" ? payload.factId : undefined;
          const known = typeof factId === "string" && hasWorldFact(frontend, factId);
          const result = await frontend.manifold.command(command, payload);
          osNotifications?.commandCompleted(command, payload, result, known);
          return result;
        },
      },
      translate: sourceTranslate,
    },
    signal: {
      daniel,
      setContentKey: chip.setContentKey,
      playSound: frontend.audio.playCue,
      service: frontend.signal,
      accountName: SIGNAL_ACCOUNT_NAME,
      authSignalPresent: () => hasWorldFact(frontend, SIGNAL_AUTH_FACT),
      getWorldId: () => frontend.world.snapshot().worldId,
      subscribe: (listener) => subscribeManifoldChanges(frontend.world, listener),
      authenticated: false,
      translate: sourceTranslate,
      messenger: {
        model: messengerModel,
        hasFact: (factId) => hasWorldFact(frontend, factId),
        subscribe: signalConversations.subscribe,
        playCue: frontend.audio.playCue,
        translate: sourceTranslate,
        openUrl,
        localReadFacts: signalLocalReadFacts,
        getPendingFocusThreadId: () => signalPendingFocus.get(),
        consumePendingFocusThreadId: () => {
          signalPendingFocus.consume();
        },
        subscribePendingFocus: signalPendingFocus.subscribe,
        onDownloaded: (factId, already) => osNotifications?.download(factId, already),
      },
    },
    idle: idlePresentation,
    marginalGrowth,
    codenames: {
      get controller() { return codenames.get(); },
      onNoriReaction: (reaction) => { frontend.reactions.play("codenames", reaction); },
      onNoriPhaseMood: (active) => {
        const mood = NORI_PHASE_MOODS[0].expression;
        if (active) frontend.reactions.setMood(mood);
        else if (frontend.reactions.mood() === mood) frontend.reactions.clearMood();
      },
      translate: sourceTranslate,
      locale,
      playSound: frontend.audio.playCue,
    },
    pictionary: {
      get controller() { return pictionary.get(); },
      get drawing() { return drawing.get(); },
      locale,
      playSound: frontend.audio.playCue,
      startSoundLoop: frontend.audio.startCueLoop,
      onNoriReaction: (reaction) => { frontend.reactions.play("pictionary", reaction); },
    },
    chess: {
      get controller() { return chess.get(); },
      onNoriReaction: (reaction) => { frontend.reactions.play("chess", reaction); },
      translate: sourceTranslate,
      onSound: (sound) => frontend.audio.playCue(sound === "response" ? "boardgames-chess-response-toast" : `chess.${sound}`),
    },
    cakeduel: {
      get controller() { return cakeduel.get(); },
      translate: sourceTranslate,
      assets: createCakeDuelPresentationAssets(locale),
    },
    desktop: {
      playCue: frontend.audio.playCue,
      translate: sourceTranslate,
      windows: {
        debug: { main: { component: () => settings.debugContent } },
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
  const releaseStoryProgression = bindSourceStoryProgression({
    getWorldId: () => frontend.world.snapshot().worldId,
    getFacts: () => worldFacts(frontend),
    getDesktop: () => bundle.runtime.store.getState(),
    subscribeFacts: (listener) => subscribeManifoldChanges(frontend.world, listener),
    subscribeWindows: (listener) => bundle.runtime.store.subscribe(listener),
    emitFact: (factId) => frontend.manifold.command("client.emitFact", { factId }),
    warn: (error) => console.error("[SourceApp] story progression failed", error),
  });
  const desktopStore = bundle.runtime.store;
  const openFilesTarget = (target: { folderPath: string; selectKey?: string }) => {
    void (bundle?.openFilesIntent?.(target) ?? launchApp({ appId: "files", mode: "launch", args: { ...target } }));
  };
  osNotifications = bindOsNotifications({
    translate: sourceTranslate,
    push: (input) => frontend.notifications.push(input),
    dismissByKey: (key) => frontend.notifications.dismissByKey(key),
    getWorldId: () => frontend.world.snapshot().worldId,
    getFacts: () => worldFacts(frontend),
    subscribeFacts: (listener) => subscribeManifoldChanges(frontend.world, listener),
    subscribeArtifactTypes: (types, listener) => subscribeArtifactTypes(frontend.world, types, listener),
    isExclusive: () => desktopStore.getState().exclusiveAppId !== null,
    subscribeExclusive: (listener) => {
      let exclusive = desktopStore.getState().exclusiveAppId;
      return desktopStore.subscribe((state) => {
        if (state.exclusiveAppId === exclusive) return;
        exclusive = state.exclusiveAppId;
        listener();
      });
    },
    isStoryActive: () => frontend.story.snapshot() !== null,
    isIdleVisible: () =>
      Object.values(desktopStore.getState().windows).some(
        (window) => window.appId === "idle" && !window.minimized,
      ),
    activateApp: (appId) => void launchApp({ appId, mode: "activate" }),
    openFiles: openFilesTarget,
    focusMail: (mailId) => {
      mailPendingFocus.set(mailId);
      void launchApp({ appId: "mail", mode: "activate" });
    },
    showParadigmToast: (options) => paradigmReveal.show(options),
    startQfrDecrypt: () => qfrDecrypt.start(),
    loadMail: async () =>
      (await frontend.mail.messages()).map((mail) => ({ id: mail.id, data: mail.raw })),
    // File artifacts only: the vault (app) half of `presentation()` is irrelevant here.
    loadRecoveredFiles: async () =>
      (await frontend.files.list())
        .map(normalizeFileArtifact)
        .filter((file): file is FilesRecoveredFile => file !== null && isRecoverableFile(file) && hasRecoveredFilePayload(file))
        .map((file) => ({ id: file.id, name: file.name, folderPath: file.folderPath })),
    warn: (error) => console.warn("[SourceApp] OS notifications failed", error),
  });
  const releaseOsNotifications = () => {
    osNotifications?.dispose();
    qfrDecrypt.dispose();
    mailPendingFocus.clear();
  };
  return {
    frontend,
    releaseStoryProgression,
    releaseOsNotifications,
    signalLocalReadFacts,
    signalConversations,
    signalPendingFocus,
    signalArrivalTracker,
    chip,
    daniel,
    idle,
    marginalGrowth,
    releaseMarginalGrowth,
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

/** Creates the value on first `get()`; `dispose()` only reaches a value that was created. */
function lazy<T extends { dispose(): void }>(create: () => T) {
  let value: T | undefined;
  return {
    get: () => (value ??= create()),
    dispose: () => value?.dispose(),
  };
}

/** Shipped `pje`: Files shows its decrypting state for two seconds after QFR installs. */
function createQfrDecryptState() {
  let decrypting = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const publish = () => {
    for (const listener of listeners) listener();
  };
  return {
    active: () => decrypting,
    start() {
      clearTimeout(timer);
      decrypting = true;
      publish();
      timer = setTimeout(() => {
        timer = undefined;
        decrypting = false;
        publish();
      }, QFR_DECRYPT_MS);
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      clearTimeout(timer);
      timer = undefined;
      decrypting = false;
      listeners.clear();
    },
  };
}

/** Own external subscriptions inside the effect lifetime, including StrictMode remounts. */
export function SourceApp() {
  const [source, setSource] = useState<SourceSession | null>(null);
  useEffect(() => {
    const session = createSourceSession();
    setSource(session);
    return () => {
      session.releaseStoryProgression();
      session.releaseOsNotifications();
      session.signalArrivalTracker.reset();
      session.signalPendingFocus.clear();
      session.chip.dispose();
      session.daniel.dispose();
      session.cakeduel.dispose();
      session.chess.dispose();
      session.codenames.dispose();
      session.drawing.dispose();
      session.pictionary.dispose();
      session.idle.dispose();
      session.releaseMarginalGrowth();
      session.podcast.dispose();
      session.bundle.runtime.dispose();
      session.frontend.dispose();
    };
  }, []);
  return source ? <SourceSessionView source={source} /> : null;
}

function readDesktopCompute(source: SourceSession): DesktopComputeState {
  return {
    ...source.idle.snapshot().computeState,
    computeDrain: source.frontend.scene.snapshot().memoryComputeDrain,
  };
}

/**
 * Idle ticks every 100 ms and the memory scene drains compute every frame. Only
 * these readouts subscribe, so the desktop shell above them is not re-rendered.
 */
function ComputeReadout({ source, summary = false }: { source: SourceSession; summary?: boolean }) {
  const [state, setState] = useState(() => readDesktopCompute(source));
  useEffect(() => {
    const sync = () =>
      setState((previous) => {
        const next = readDesktopCompute(source);
        return next.compute === previous.compute &&
          next.cap === previous.cap &&
          next.computeDrain === previous.computeDrain
          ? previous
          : next;
      });
    sync();
    const releaseIdle = source.idle.subscribe(sync);
    const releaseScene = source.frontend.scene.subscribe(sync);
    return () => {
      releaseIdle();
      releaseScene();
    };
  }, [source]);
  return summary ? <DesktopComputeSummary state={state} /> : <DesktopComputeIndicator state={state} />;
}

function SourceSessionView({ source }: { source: SourceSession }) {
  const sceneMusic = useSyncExternalStore(
    source.frontend.scene.subscribe,
    () => source.frontend.scene.snapshot().bgm,
  );
  const graphicsMode = useGraphicsSettings((state) => state.mode);
  const [auth, setAuth] = useState<AuthState>(source.frontend.auth.snapshot());
  const [facts, setFacts] = useState(() => worldFacts(source.frontend));
  const [signalUnreadCount, setSignalUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkReason, setLinkReason] = useState(source.frontend.arcade.lastClose?.reason ?? "");
  useEffect(() => source.frontend.arcade.onState(() => {
    setLinkReason(source.frontend.arcade.lastClose?.reason ?? "");
  }), [source]);
  const linkBlocked = linkReason === "session_replaced" || linkReason === "world_reset" || linkReason === "session_invalid" || linkReason === "overloaded" || linkReason === "soft_closed" || linkReason === "closed";
  useEffect(() => {
    let disposed = false;
    let revision = 0;
    let emptyBaselineTimer: ReturnType<typeof setTimeout> | undefined;
    let loaded: { worldId: string; conversations: SignalConversation[] } | null = null;
    const unreadCount = (conversations: readonly SignalConversation[]) => {
      const currentFacts = worldFacts(source.frontend);
      return signalConversationUnreadCount(
        conversations,
        (factId) => currentFacts.has(factId),
        source.signalLocalReadFacts.snapshot(),
      );
    };
    const scheduleEmptyBaseline = (worldId: string) => {
      if (emptyBaselineTimer !== undefined) clearTimeout(emptyBaselineTimer);
      emptyBaselineTimer = setTimeout(() => {
        emptyBaselineTimer = undefined;
        if (disposed || source.frontend.world.snapshot().worldId !== worldId) return;
        void source.signalConversations.load()
          .then((latest) => {
            if (!disposed && source.frontend.world.snapshot().worldId === worldId)
              source.signalArrivalTracker.seed(worldId, latest);
          })
          .catch((error) => console.warn("[Signal] Failed to settle empty artifact snapshot", error));
      }, 400);
    };
    const syncSignal = async () => {
      const currentRevision = ++revision;
      const requestWorldId = source.frontend.world.snapshot().worldId;
      if (!requestWorldId) {
        if (emptyBaselineTimer !== undefined) clearTimeout(emptyBaselineTimer);
        emptyBaselineTimer = undefined;
        loaded = null;
        source.signalArrivalTracker.reset();
        if (!disposed) setSignalUnreadCount(0);
        return;
      }
      try {
        const conversations = await source.signalConversations.load();
        if (
          disposed ||
          currentRevision !== revision ||
          source.frontend.world.snapshot().worldId !== requestWorldId
        )
          return;
        loaded = { worldId: requestWorldId, conversations };
        setSignalUnreadCount(unreadCount(conversations));
        if (conversations.length) {
          if (emptyBaselineTimer !== undefined) clearTimeout(emptyBaselineTimer);
          emptyBaselineTimer = undefined;
        } else {
          scheduleEmptyBaseline(requestWorldId);
        }
        for (const arrival of source.signalArrivalTracker.update(
          requestWorldId,
          conversations,
        )) {
          const threadId = arrival.conversation.thread.threadId;
          source.frontend.notifications.push({
            appId: "signal",
            title: arrival.conversation.thread.title,
            body: signalArrivalPreview(arrival.message, signalArrivalLabels),
            sfx: "comms-signal-arrival",
            onClick: () => {
              source.signalPendingFocus.set(threadId);
              void source.bundle.runtime.store.getState().launchApp({
                appId: "signal",
                mode: "activate",
              });
            },
          });
        }
      } catch (error) {
        if (!disposed && currentRevision === revision)
          console.warn("[Signal] Failed to refresh Messenger state", error);
      }
    };
    void syncSignal();
    // One coalesced subscription (shared with the Messenger window) covers world
    // changes, signal artifact hints and `manifold.artifacts.invalidated`.
    const unsubscribeConversations = source.signalConversations.subscribe(
      () => void syncSignal(),
    );
    // Reading a thread only changes local read facts: recount the loaded
    // conversations instead of requesting them again.
    const unsubscribeLocalReads = source.signalLocalReadFacts.subscribe(() => {
      if (disposed || !loaded || loaded.worldId !== source.frontend.world.snapshot().worldId) return;
      setSignalUnreadCount(unreadCount(loaded.conversations));
    });
    return () => {
      disposed = true;
      revision++;
      if (emptyBaselineTimer !== undefined) clearTimeout(emptyBaselineTimer);
      unsubscribeConversations();
      unsubscribeLocalReads();
    };
  }, [source]);
  useEffect(() => {
    const unsubscribe = source.frontend.arcade.onMessage((message) => {
      const parsed = notificationInputFromMessage(message);
      if (parsed) source.frontend.notifications.push(parsed.input);
    });
    return unsubscribe;
  }, [source]);
  useEffect(() => {
    const sync = () =>
      source.frontend.notifications.setSuppressed(
        source.frontend.story.snapshot() !== null,
      );
    sync();
    return source.frontend.story.subscribe(sync);
  }, [source]);
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
    if (sceneMusic !== "auto")
      target.track = sceneMusic === "silent" ? null : sceneMusic;
    source.frontend.audio.setDesktopMusic(
      auth.status === "authenticated" && ready ? target.track : null,
      target.fade,
    );
  }, [source, auth.status, ready, facts, sceneMusic]);
  const chipOffline =
    facts.has("arg.memory.shown") && !facts.has("arg.ending.shown");
  const openNotificationApp = (
    appId: string,
    args?: Record<string, JsonValue>,
  ) => {
    if (!source.bundle.runtime.registry.lookupApp(appId)) {
      console.warn(`[Notify] server-push onClick references unknown appId: ${appId}`);
      return;
    }
    void source.bundle.runtime.store.getState().launchApp({
      appId,
      mode: "launch",
      args,
    });
  };
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
    <SourceAssetBootGate firstBoot={!facts.has("boot.completed")} locale={locale} booting={!ready && !error && !linkBlocked}>
    <RecoveredDesktopShell
      playCue={source.frontend.audio.playCue}
      bundle={source.bundle}
      computeIndicator={<ComputeReadout source={source} />}
      computeSummary={<ComputeReadout source={source} summary />}
      facts={facts}
      factsReady={ready}
      bootstrapStartupApps
      translate={sourceTranslate}
      locale={locale}
      getDockBadgeCount={(appId) =>
        appId === "signal" ? signalUnreadCount : 0
      }
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
          <NoriStage
            frontend={source.frontend}
            facts={facts}
            windows={source.bundle.runtime.store}
            exclusive={() =>
              source.bundle.runtime.store.getState().exclusiveAppId !== null
            }
          />
        </>
      }
      overlay={
        <>
          <NotificationLayer
            store={source.frontend.notifications}
            translate={sourceTranslate}
            onOpenApp={openNotificationApp}
          />
          <div style={{ pointerEvents: "auto" }}>
            <StoryScenes frontend={source.frontend} minimizeWindows={source.bundle.runtime.store.getState().minimizeAllWindows} />
          </div>
          <NoriSceneEffects scene={source.frontend.scene} />
          <ConversationPanel
            frontend={source.frontend}
            locale={locale}
            chip={source.chip}
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
          <SourceConnectionLayer arcade={source.frontend.arcade} locale={locale} />
          {error && (
            <div className="source-connection-error" role="alert">
              {error}
            </div>
          )}
        </>
      }
    />
    </SourceAssetBootGate>
  );
}
