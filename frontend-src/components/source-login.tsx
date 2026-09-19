import { useState, type FormEvent } from "react";
import type { LocalAuthController } from "../runtime/auth";
import "./source-login.css";

export function SourceLogin({
  auth,
  status,
  error: startupError,
  locale,
  onAuthenticated,
}: {
  auth: LocalAuthController;
  status: "loading" | "anonymous";
  error: string | null;
  locale: string;
  onAuthenticated(): Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zh = locale.startsWith("zh");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (sent) {
        await auth.signInWithEmailOtp(email.trim(), otp.trim());
        await onAuthenticated();
      } else {
        await auth.sendEmailOtp(email.trim());
        setSent(true);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="source-login">
      <form onSubmit={(event) => void submit(event)}>
        <h1>NoriOS</h1>
        <p>{zh ? "登录" : "Sign in"}</p>
        {status === "loading" && !startupError ? (
          <p role="status">{zh ? "正在连接…" : "Connecting…"}</p>
        ) : (
          <>
            <label>
              {zh ? "邮箱" : "Email"}
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                disabled={sent || pending}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            {sent && (
              <label>
                {zh ? "验证码" : "Verification code"}
                <input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />
              </label>
            )}
            <button type="submit" disabled={pending}>
              {pending
                ? "…"
                : sent
                  ? zh
                    ? "登录"
                    : "Sign in"
                  : zh
                    ? "发送验证码"
                    : "Send code"}
            </button>
            {sent && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setSent(false);
                  setOtp("");
                }}
              >
                {zh ? "更换邮箱或重新发送" : "Change email or resend"}
              </button>
            )}
          </>
        )}
        {(error || startupError) && <p role="alert">{error || startupError}</p>}
      </form>
    </main>
  );
}
