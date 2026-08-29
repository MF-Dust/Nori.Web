import { getSession, requestJson, type LocalSession } from "./http";

export type AuthState =
  | { status: "loading"; session: null }
  | { status: "anonymous"; session: null }
  | { status: "authenticated"; session: LocalSession };

export class LocalAuthController {
  private state: AuthState = { status: "loading", session: null };
  private readonly listeners = new Set<(state: AuthState) => void>();

  snapshot(): AuthState {
    return this.state;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private setState(state: AuthState): void {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }

  async refresh(): Promise<AuthState> {
    this.setState({ status: "loading", session: null });
    const session = await getSession();
    const next: AuthState = session
      ? { status: "authenticated", session }
      : { status: "anonymous", session: null };
    this.setState(next);
    return next;
  }

  async sendEmailOtp(email: string): Promise<void> {
    await requestJson("/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "sign-in" }),
    });
  }

  async signInWithEmailOtp(email: string, otp: string): Promise<AuthState> {
    await requestJson("/api/auth/sign-in/email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return this.refresh();
  }

  async signOut(): Promise<AuthState> {
    await requestJson("/api/auth/sign-out", { method: "POST" });
    return this.refresh();
  }
}
