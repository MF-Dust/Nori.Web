import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import type { SignalService } from "../services/signal";

const RECOVERY_CODE_LENGTH = 16;

export type SignalResetStatus = "idle" | "submitting" | "invalid" | "error";

export interface SignalResetScreenProps {
  service: SignalService;
  accountName: string;
  navigateToTempPassword: (tempPassword: string) => void;
  goBack: () => void;
  translate: (key: string, variables?: Record<string, string>) => string;
  playSound?: (cue: "comms-signal-recovery-accepted" | "comms-signal-auth-error") => void;
  onScreenActive?: (screen: "signal:reset") => void;
}

export function formatSignalRecoveryCode(value: string): string {
  return value
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, RECOVERY_CODE_LENGTH)
    .replace(/(.{4})(?=.)/g, "$1-");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reconstructed from the shipped Signal ResetScreen chunk. */
export function SignalResetScreen({
  service,
  accountName,
  navigateToTempPassword,
  goBack,
  translate,
  playSound,
  onScreenActive,
}: SignalResetScreenProps) {
  const [recoveryCode, setRecoveryCode] = useState("");
  const [status, setStatus] = useState<SignalResetStatus>("idle");

  useEffect(() => {
    onScreenActive?.("signal:reset");
  }, [onScreenActive]);

  const submitting = status === "submitting";
  const complete = recoveryCode.replace(/-/g, "").length === RECOVERY_CODE_LENGTH;
  const message =
    status === "invalid"
      ? translate("signal.reset.invalidCode")
      : status === "error"
        ? translate("signal.reset.submitFailed")
        : "";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !complete) return;

    setStatus("submitting");
    try {
      const result = await service.recover(recoveryCode);
      if (result?.ok && typeof result.tempPassword === "string") {
        playSound?.("comms-signal-recovery-accepted");
        navigateToTempPassword(result.tempPassword);
        return;
      }

      await delay(1_100);
      playSound?.("comms-signal-auth-error");
      setStatus("invalid");
    } catch (error) {
      console.warn("[Signal] Recovery failed:", error);
      playSound?.("comms-signal-auth-error");
      setStatus("error");
    }
  };

  return (
    <div className="flex h-full flex-col p-6 text-foreground">
      <button
        type="button"
        onClick={goBack}
        className="mb-6 inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {translate("signal.reset.back")}
      </button>

      <form onSubmit={submit} className="m-auto w-full max-w-xs space-y-5">
        <div>
          <h1 className="text-base font-medium">{translate("signal.reset.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {translate("signal.reset.subtitle", { account: accountName })}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">
            {translate("signal.reset.hint")}
          </p>
        </div>

        <input
          value={recoveryCode}
          onChange={(event) => setRecoveryCode(formatSignalRecoveryCode(event.currentTarget.value))}
          disabled={submitting}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-center font-mono text-sm tracking-widest text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={submitting || !complete}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {translate(submitting ? "signal.reset.submitting" : "signal.reset.submit")}
        </button>

        {message ? <p className="min-h-5 text-sm text-destructive">{message}</p> : null}
      </form>
    </div>
  );
}
