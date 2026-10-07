import { useManagedWindowRuntime } from "../components/window-runtime-context";
import { lazy, useEffect, useSyncExternalStore } from "react";
import { createSignalAuthentication } from "./signal-auth";
import type { SignalDanielConversationRuntime } from "./signal-daniel";
import type { SignalService } from "../services/signal";
import type { SignalDestination } from "../screens/signal-login-screen";
import type { MessengerScreenRuntime } from "../screens/messenger-shipped-surfaces";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { WindowScreenComponentProps } from "../state/window-types";

const SignalLoginScreen = lazy(() => import("../screens/signal-login-screen").then((module) => ({ default: module.SignalLoginScreen })));
const MessengerScreen = lazy(() => import("../screens/messenger-shipped-surfaces").then((module) => ({ default: module.MessengerScreen })));
const SignalResetScreen = lazy(() => import("../screens/signal-reset-screen").then((module) => ({ default: module.SignalResetScreen })));
const SignalTempPasswordScreen = lazy(() => import("../screens/signal-temp-password-screen").then((module) => ({ default: module.SignalTempPasswordScreen })));

export interface SignalPresentationRuntime {
  service: SignalService;
  accountName: string | (() => string);
  authenticated?: boolean;
  authSignalPresent?: boolean | (() => boolean);
  getWorldId?: () => string | null;
  subscribe?: (listener: () => void) => () => void;
  translate: (key: string, variables?: Record<string, string>) => string;
  playSound?: (cue: string) => void;
  onScreenActive?: (
    screen: "signal:login" | "signal:reset" | "signal:tempPassword" | "signal:messenger",
  ) => void;
  onAuthenticatedChange?: (authenticated: boolean) => void;
  messenger?: MessengerScreenRuntime;
  setContentKey?: (instanceId: string, contentKey: string | null) => void;
  /** Optional source-owned Daniel story runtime; facts/cursor remain host inputs. */
  daniel?: SignalDanielConversationRuntime;
}

function valueOf<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

function objectParams(params: unknown): Record<string, unknown> {
  return params !== null && typeof params === "object" && !Array.isArray(params)
    ? (params as Record<string, unknown>)
    : {};
}

/**
 * Binds the recovered Signal authentication flow and source-owned Messenger to
 * the generic desktop screen router. The Daniel service conversation is also
 * source-owned when supplied; its world-fact and story-cursor inputs stay at
 * the host boundary until the production facts provider is migrated.
 */
export function createSignalProductionWindowBinding(
  runtime: SignalPresentationRuntime,
): ProductionWindowBinding {
  const authentication = createSignalAuthentication(runtime);

  function useScreen(screen: Parameters<NonNullable<SignalPresentationRuntime["onScreenActive"]>>[0]) {
    const { instanceId } = useManagedWindowRuntime();
    useEffect(() => {
      runtime.setContentKey?.(instanceId, screen);
      return () => runtime.setContentKey?.(instanceId, null);
    }, [instanceId, screen]);
    return useSyncExternalStore(authentication.subscribe, authentication.snapshot, authentication.snapshot);
  }

  function LoginScreen({ navigate, params }: WindowScreenComponentProps) {
    const authenticated = useScreen("signal:login");
    const screenParams = objectParams(params);
    const notice = typeof screenParams.notice === "string" ? screenParams.notice : undefined;

    return (
      <SignalLoginScreen
        service={runtime.service}
        accountName={valueOf(runtime.accountName)}
        authenticated={authenticated}
        authSignalPresent={
          runtime.authSignalPresent === undefined
            ? false
            : valueOf(runtime.authSignalPresent)
        }
        setAuthenticated={authentication.setAuthenticated}
        navigate={(destination: SignalDestination) => navigate(destination)}
        translate={(key) => runtime.translate(key)}
        notice={notice}
        playSound={(cue) => runtime.playSound?.(cue)}
        onScreenActive={runtime.onScreenActive}
      />
    );
  }

  function ResetScreen({ navigate, goBack }: WindowScreenComponentProps) {
    useScreen("signal:reset");
    return (
      <SignalResetScreen
        service={runtime.service}
        accountName={valueOf(runtime.accountName)}
        navigateToTempPassword={(tempPassword) =>
          navigate("tempPassword", { tempPassword })
        }
        goBack={goBack}
        translate={runtime.translate}
        playSound={(cue) => runtime.playSound?.(cue)}
        onScreenActive={runtime.onScreenActive}
      />
    );
  }

  function TempPasswordScreen({ navigate, params }: WindowScreenComponentProps) {
    useScreen("signal:tempPassword");
    const screenParams = objectParams(params);
    const tempPassword =
      typeof screenParams.tempPassword === "string" ? screenParams.tempPassword : "";

    return (
      <SignalTempPasswordScreen
        tempPassword={tempPassword}
        translate={(key) => runtime.translate(key)}
        navigateToLogin={(notice) => navigate("login", { notice })}
        onScreenActive={runtime.onScreenActive}
      />
    );
  }

  function MessengerRoute({ navigate }: WindowScreenComponentProps) {
    const { instanceId } = useManagedWindowRuntime();
    const authenticated = useScreen("signal:messenger");
    useEffect(() => {
      runtime.onScreenActive?.("signal:messenger");
      if (!authenticated) navigate("login");
    }, [authenticated, navigate]);

    if (!authenticated || !runtime.messenger) return null;
    return (
      <MessengerScreen
        instanceId={instanceId}
        setContentKey={runtime.setContentKey}
        runtime={runtime.daniel
          ? { ...runtime.messenger, serviceConversation: runtime.daniel }
          : runtime.messenger}
      />
    );
  }

  return {
    screens: {
      login: { component: LoginScreen, transition: "fade" },
      reset: { component: ResetScreen, transition: "slide-left" },
      tempPassword: { component: TempPasswordScreen, transition: "slide-left" },
      ...(runtime.messenger
        ? { messenger: { component: MessengerRoute, transition: "fade" as const } }
        : {}),
    },
  };
}
