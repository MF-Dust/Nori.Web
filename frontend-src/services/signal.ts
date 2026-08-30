import type { JsonValue } from "../runtime/protocol";

export interface CommandEnvelope<T = JsonValue> {
  ok: boolean;
  result?: T;
  error?: JsonValue;
}

/**
 * Narrow adapter for the command executor still owned by the large NormalApp
 * bundle. The adapter keeps recovered Signal behavior usable without guessing
 * how that executor is internally wired.
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

export interface SignalDanielVerifyResult {
  reply?: unknown;
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

  async verifyDaniel(answer?: string): Promise<string[]> {
    const result = await resultOrNull<SignalDanielVerifyResult>(
      this.transport,
      "signal.daniel.verify",
      answer === undefined ? {} : { answer },
    );
    return Array.isArray(result?.reply)
      ? result.reply.filter((item): item is string => typeof item === "string")
      : [];
  }
}
