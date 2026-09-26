import type { JsonValue } from "../runtime/protocol";

export interface CommandEnvelope<T = JsonValue> {
  ok: boolean;
  result?: T;
  error?: JsonValue;
}

/**
 * Narrow adapter over the source-owned command executor. `NoriFrontendRuntime`
 * builds the one implementation (runtime/frontend-runtime.ts), which forwards to
 * the source `ManifoldService`; keeping it behind this interface leaves Signal's
 * call shape independent of how commands reach the host.
 */
export interface CommandTransport {
  execute<T = JsonValue>(
    command: string,
    payload: { [key: string]: JsonValue },
  ): Promise<CommandEnvelope<T>>;
}

export interface SignalLoginResult {
  ok?: boolean;
  [key: string]: unknown;
}

export interface SignalRecoveryResult {
  ok?: boolean;
  [key: string]: unknown;
}

async function resultOrNull<T>(
  transport: CommandTransport,
  command: string,
  payload: { [key: string]: JsonValue },
): Promise<T | null> {
  const response = await transport.execute<T>(command, payload);
  return response.ok ? (response.result ?? ({} as T)) : null;
}

export class SignalService {
  constructor(private readonly transport: CommandTransport) {}

  login(username: string, password: string): Promise<SignalLoginResult | null> {
    return resultOrNull<SignalLoginResult>(this.transport, "signal.login", { username, password });
  }

  recover(recoveryCode: string): Promise<SignalRecoveryResult | null> {
    return resultOrNull<SignalRecoveryResult>(this.transport, "signal.recover", { recoveryCode });
  }
}
