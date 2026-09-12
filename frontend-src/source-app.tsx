import { codenamesStateSchema } from "./apps/codenames-model";
import { createSourceTranslate } from "./i18n/translate";
import { pictionaryStateSchema } from "./apps/pictionary-model";
import { PictionaryDrawingBridge } from "./apps/pictionary-runtime";
import { GameCartridgeController } from "./apps/game-cartridge-controller";
import { chessStateSchema } from "./apps/chess-model";
import { useEffect, useMemo } from "react";
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
  try { return localStorage.getItem("arcade-language") ?? navigator.language; }
  catch { return navigator.language; }
}
const locale = preferredLocale();
const sourceTranslate = createSourceTranslate(locale);

function worldFacts(frontend: NoriFrontendRuntime): Set<string> {
  const result = new Set<string>();
  for (const runtime of frontend.world.snapshot().cartridges.values()) {
    const facts = runtime.state.facts;
    if (!facts || typeof facts !== "object" || Array.isArray(facts)) continue;
    for (const [factId, value] of Object.entries(facts)) {
      if (value === true || value === 1 || (value && typeof value === "object")) result.add(factId);
    }
  }
  return result;
}

function hasWorldFact(frontend: NoriFrontendRuntime, factId: string): boolean {
  return worldFacts(frontend).has(factId);
}

export function SourceApp() {
  const source = useMemo(() => {
    const frontend = new NoriFrontendRuntime();
    const codenames = new GameCartridgeController("codenames", frontend.games, frontend.world, frontend.arcade, raw => codenamesStateSchema.parse(raw));
    const pictionary = new GameCartridgeController("pictionary", frontend.games, frontend.world, frontend.arcade, raw => pictionaryStateSchema.parse(raw));
    const drawing = new PictionaryDrawingBridge(pictionary, frontend.arcade);
    const chess = new GameCartridgeController("chess", frontend.games, frontend.world, frontend.arcade, raw => chessStateSchema.parse(raw));
    const cakeduel = new CakeDuelRuntimeController(
      frontend.games,
      frontend.world,
      frontend.arcade,
    );
    const idle = createSourceIdleRuntimeEngine({
      getFacts: () => worldFacts(frontend),
      subscribeFacts: (listener) => frontend.world.subscribe(() => listener()),
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

    const launchApp = (request: { appId: string; mode: string; args?: unknown }) =>
      bundle?.runtime.store.getState().launchApp(request);

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

    bundle = createRecoveredDesktopRuntime({
      mail: {
        model: frontend.mail,
        attachmentDownloadDurationMs: MAIL_ATTACHMENT_DOWNLOAD_DURATION_MS,
      },
      files: {
        model: frontend.files,
        translate: sourceTranslate,
        hasFact: (factId) => hasWorldFact(frontend, factId),
        subscribe: (listener) => frontend.world.subscribe(() => listener()),
        launchApp,
        reduceMotion: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      },
      browser: {
        page: {
          model: frontend.browser,
          locale: () => locale,
          getFacts: () => worldFacts(frontend),
          subscribeFacts: (listener) => frontend.world.subscribe(() => listener()),
          subscribeEnvelopeChanges: (listener) => frontend.arcade.onMessage((message) => {
            const raw = message as unknown as { type?: string; channel?: string };
            if (raw.type === "event" && raw.channel === "sites.envelopes.changed") listener();
          }),
          invokeCommand: (command, payload) => frontend.manifold.command(command, payload),
        },
        translate: sourceTranslate,
      },
      signal: {
        service: frontend.signal,
        accountName: () => {
          const auth = frontend.auth.snapshot();
          return auth.status === "authenticated" ? auth.session.user.email : "";
        },
        authenticated: false,
        translate: sourceTranslate,
        messenger: {
          model: frontend.messenger,
          translate: sourceTranslate,
          openUrl,
        },
      },
      idle: idlePresentation,
      codenames: { controller: codenames, translate: sourceTranslate, locale },
      pictionary: { controller: pictionary, drawing, locale },
      chess: { controller: chess, translate: sourceTranslate },
      cakeduel: {
        controller: cakeduel,
        translate: sourceTranslate,
        assets: createCakeDuelPresentationAssets(locale),
      },
      desktop: {
        // The source-app smoke build does not yet own the complete production
        // facts provider. Keep install gating out of bootstrap until that
        // boundary is migrated instead of inventing facts.
        enableInstallGuard: false,
        persistName: "os-store-source-preview",
      },
    });
    return { frontend, idle, codenames, cakeduel, chess, pictionary, drawing, bundle };
  }, []);

  useEffect(() => {
    let disposed = false;
    void source.frontend.start(locale).catch((error) => {
      if (!disposed) console.warn("[SourceApp] Frontend runtime startup failed", error);
    });

    return () => {
      disposed = true;
      source.cakeduel.dispose();
      source.chess.dispose();
      source.codenames.dispose();
      source.drawing.dispose();
      source.pictionary.dispose();
      source.idle.dispose();
      source.bundle.runtime.dispose();
      source.frontend.dispose();
    };
  }, [source]);

  return (
    <RecoveredDesktopShell
      bundle={source.bundle}
      factsReady={false}
      bootstrapStartupApps
      className="source-frontend-root"
    />
  );
}