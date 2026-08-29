import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

export interface SignalTempPasswordScreenProps {
  tempPassword?: string;
  translate: (key: string) => string;
  navigateToLogin: (notice: string) => void;
  onScreenActive?: (screen: "signal:tempPassword") => void;
}

/** Reconstructed from the shipped Signal temporary-password screen. */
export function SignalTempPasswordScreen({
  tempPassword = "",
  translate,
  navigateToLogin,
  onScreenActive,
}: SignalTempPasswordScreenProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onScreenActive?.("signal:tempPassword");
  }, [onScreenActive]);

  const copy = () => {
    if (!tempPassword) return;
    navigator.clipboard
      ?.writeText(tempPassword)
      .then(() => setCopied(true))
      .catch(() => undefined);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center text-foreground">
      <div>
        <h1 className="text-base font-medium">{translate("signal.tempPassword.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {translate("signal.tempPassword.subtitle")}
        </p>
      </div>

      <button
        type="button"
        onClick={copy}
        className="group inline-flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 font-mono text-lg tracking-wide transition-colors hover:bg-muted/60"
        title={translate("signal.tempPassword.copy")}
      >
        <span>{tempPassword || "••••"}</span>
        {copied ? (
          <Check className="size-4 text-primary" />
        ) : (
          <Copy className="size-4 text-muted-foreground" />
        )}
      </button>

      <button
        type="button"
        onClick={() => navigateToLogin(translate("signal.tempPassword.loginNotice"))}
        className="w-full max-w-xs rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {translate("signal.tempPassword.backToLogin")}
      </button>
    </div>
  );
}
