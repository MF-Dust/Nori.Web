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

function hasWorldFact(frontend: NoriFrontendRuntime, factId: string): boolean {
  for (const runtime of frontend.world.snapshot().cartridges.values()) {
    const facts = runtime.state.facts;
    if (!facts || typeof facts !== "object" || Array.isArray(facts)) continue;
    if (Object.prototype.hasOwnProperty.call(facts, factId)) return true;
  }
  return false;
}

/**
 * Source-driven application root used by the migration build.
 *
 * Feature-specific runtime providers are added here as their cutover boundaries
 * become source-owned. Unrecovered windows continue through the explicit
 * presentation fallback rather than importing historical JavaScript.
 */
export function SourceApp() {
  const source = useMemo(() => {
    const frontend = new NoriFrontendRuntime();
    let bundle: RecoveredDesktopRuntimeBundle | undefined;

    const launchApp = (request: { appId: string; mode: string; args?: unknown }) =>
      bundle?.runtime.store.getState().launchApp(request);

    const openUrl = (url: string) => {
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
