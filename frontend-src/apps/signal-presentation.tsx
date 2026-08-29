import { useEffect, useState } from "react";
import type { SignalService } from "../services/signal";
import {
  SignalLoginScreen,
  type SignalDestination,
} from "../screens/signal-login-screen";
import { MessengerScreen, type MessengerScreenRuntime } from "../screens/messenger-screen";
import { SignalResetScreen } from "../screens/signal-reset-screen";
import { SignalTempPasswordScreen } from "../screens/signal-temp-password-screen";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { WindowScreenComponentProps } from "../state/window-types";

export interface SignalPresentationRuntime {
  service: SignalService;
  accountName: string | (() => string);
  authenticated?: boolean;
  authSignalPresent?: boolean | (() => boolean);
  translate: (key: string, variables?: Record<string, string>) => string;
  playSound?: (cue: string) => void;
  onScreenActive?: (
    screen: "signal:login" | "signal:reset" | "signal:tempPassword" | "signal:messenger",
  ) => void;
  onAuthenticatedChange?: (authenticated: boolean) => void;
  messenger?: MessengerScreenRuntime;
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
 * the generic desktop screen router. Messenger's story-specific service
 * conversation remains an explicit runtime hook until its owning state machine
 * is migrated from NormalApp.
 */
export function createSignalProductionWindowBinding(
  runtime: SignalPresentationRuntime,
): ProductionWindowBinding {
  let authenticated = runtime.authenticated ?? false;

  function LoginScreen({ navigate, params }: WindowScreenComponentProps) {
    const [, forceAuthenticated] = useState(authenticated);
    const screenParams = objectParams(params);
    const notice = typeof screenParams.notice === "string" ? screenParams.notice : undefined;

    const setAuthenticated = (next: boolean) => {
      authenticated = next;
      forceAuthenticated(next);
      runtime.onAuthenticatedChange?.(next);
    };

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
        setAuthenticated={setAuthenticated}
        navigate={(destination: SignalDestination) => navigate(destination)}
        translate={(key) => runtime.translate(key)}
        notice={notice}
        playSound={(cue) => runtime.playSound?.(cue)}
        onScreenActive={runtime.onScreenActive}
      />
    );
  }

  function ResetScreen({ navigate, goBack }: WindowScreenComponentProps) {
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
    useEffect(() => {
      runtime.onScreenActive?.("signal:messenger");
      if (!authenticated) navigate("login");
    }, [navigate]);

    if (!authenticated || !runtime.messenger) return null;
    return <MessengerScreen runtime={runtime.messenger} />;
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
