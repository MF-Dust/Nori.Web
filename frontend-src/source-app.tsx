import { useEffect, useMemo } from "react";
import {
  createRecoveredDesktopRuntime,
  type RecoveredDesktopRuntimeBundle,
} from "./apps/recovered-presentation";
import { RecoveredDesktopShell } from "./components/recovered-desktop-shell";
import { NoriFrontendRuntime } from "./runtime/frontend-runtime";

/** Recovered NormalApp export aY / local eY used by MailScreen download progress. */
const MAIL_ATTACHMENT_DOWNLOAD_DURATION_MS = 1800;

function sourceTranslate(key: string): string {
  return key;
}

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
          locale: () => navigator.language,
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
      desktop: {
        // The source-app smoke build does not yet own the complete production
        // facts provider. Keep install gating out of bootstrap until that
        // boundary is migrated instead of inventing facts.
        enableInstallGuard: false,
        persistName: "os-store-source-preview",
      },
    });
    return { frontend, bundle };
  }, []);

  useEffect(() => {
    let disposed = false;
    void source.frontend.start(navigator.language).catch((error) => {
      if (!disposed) console.warn("[SourceApp] Frontend runtime startup failed", error);
    });

    return () => {
      disposed = true;
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
