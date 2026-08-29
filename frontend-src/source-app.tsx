import { useEffect, useMemo } from "react";
import { createRecoveredDesktopRuntime } from "./apps/recovered-presentation";
import { RecoveredDesktopShell } from "./components/recovered-desktop-shell";

/**
 * Source-driven application root used by the migration build.
 *
 * Feature-specific runtime providers are intentionally added as their cutover
 * boundaries are recovered. Until then, unrecovered windows continue through
 * the explicit presentation fallback rather than importing historical JS.
 */
export function SourceApp() {
  const bundle = useMemo(
    () =>
      createRecoveredDesktopRuntime({
        desktop: {
          // The source-app smoke build has no world-fact provider yet. Keep the
          // install guard out of the bootstrap path until that provider is
          // migrated instead of inventing production facts.
          enableInstallGuard: false,
          persistName: "os-store-source-preview",
        },
      }),
    [],
  );

  useEffect(() => () => bundle.runtime.dispose(), [bundle]);

  return (
    <RecoveredDesktopShell
      bundle={bundle}
      factsReady={false}
      bootstrapStartupApps
      className="source-frontend-root"
    />
  );
}
