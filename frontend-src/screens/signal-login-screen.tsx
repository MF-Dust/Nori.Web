import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import type { SignalService } from "../services/signal";

export type SignalLoginStatus = "idle" | "submitting" | "wrong" | "error";
export type SignalDestination = "messenger" | "reset";

export interface SignalLoginScreenProps {
  service: SignalService;
  accountName: string;
  authenticated: boolean;
  authSignalPresent?: boolean;
  setAuthenticated: (value: boolean) => void;
  navigate: (destination: SignalDestination) => void;
  translate: (key: string) => string;
  notice?: string;
  icon?: ReactNode;
  playSound?: (cue: "comms-signal-login-success" | "comms-signal-auth-error") => void;
  onScreenActive?: (screen: "signal:login") => void;
}

const inputClassName =
  "w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50";

const concealedTextStyle = { WebkitTextSecurity: "disc" } as CSSProperties;

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Maintainable reconstruction of the shipped Signal LoginScreen.
 *
 * Authentication state, navigation, translations, sound effects and command
 * transport are deliberately injected. Those concerns are owned by the larger
 * desktop shell and can be wired back as its recovery progresses.
 */
export function SignalLoginScreen({
  service,
  accountName,
  authenticated,
  authSignalPresent = false,
  setAuthenticated,
  navigate,
  translate,
  notice,
  icon,
  playSound,
  onScreenActive,
}: SignalLoginScreenProps) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<SignalLoginStatus>("idle");

  useEffect(() => {
    onScreenActive?.("signal:login");
  }, [onScreenActive]);

  useEffect(() => {
    if (authenticated) {
      navigate("messenger");
      return;
    }
    if (authSignalPresent) {
      setAuthenticated(true);
      navigate("messenger");
    }
  }, [authenticated, authSignalPresent, navigate, setAuthenticated]);

  const submitting = status === "submitting";
  const failed = status === "wrong" || status === "error";
  const message =
    status === "wrong"
      ? translate("signal.login.passwordError")
      : status === "error"
        ? translate("signal.login.loginFailed")
        : (notice ?? "");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || password.trim().length === 0) return;

    setStatus("submitting");
    try {
      const result = await service.login(accountName, password);
      if (result?.ok) {
        playSound?.("comms-signal-login-success");
        setAuthenticated(true);
        navigate("messenger");
        return;
      }

      await delay(1_100);
      playSound?.("comms-signal-auth-error");
      setStatus("wrong");
    } catch (error) {
      console.warn("[Signal] Login failed:", error);
      playSound?.("comms-signal-auth-error");
      setStatus("error");
    }
  };

  return (
    <div
      className="flex h-full items-center justify-center p-8 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(360px 280px at 50% 30%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)",
      }}
    >
      <form onSubmit={submit} className="w-full max-w-xs space-y-5">
        <div className="flex flex-col items-center gap-3">
          {icon ? <div className="size-12">{icon}</div> : null}
          <div className="text-center">
            <div className="text-base font-medium">{translate("apps.signal")}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {translate("signal.login.expired")}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {translate("signal.login.accountLabel")}
            </label>
            <input
              value={accountName}
              readOnly
              tabIndex={-1}
              aria-label={translate("signal.login.accountLabel")}
              className={classes(inputClassName, "cursor-default text-muted-foreground")}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {translate("signal.login.passwordLabel")}
            </label>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              data-1p-ignore=""
              data-lpignore="true"
              data-bwignore=""
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              disabled={submitting}
              placeholder={translate("signal.login.passwordPlaceholder")}
              autoFocus
              className={classes(
                inputClassName,
                "placeholder:text-muted-foreground disabled:opacity-50",
              )}
              style={concealedTextStyle}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || password.trim().length === 0}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {translate(submitting ? "signal.login.submitting" : "signal.login.submit")}
        </button>

        <div className="flex items-center justify-between gap-3">
          <p
            className={classes(
              "min-h-5 text-sm",
              failed ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {message}
          </p>
          <button
            type="button"
            onClick={() => navigate("reset")}
            className="shrink-0 text-sm text-primary hover:underline"
          >
            {translate("signal.login.troubleSigningIn")}
          </button>
        </div>
      </form>
    </div>
  );
}
