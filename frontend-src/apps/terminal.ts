import type { ManifoldService } from "../services/manifold";
import type { JsonValue } from "../runtime/protocol";

export interface TerminalCommandResult {
  command: string;
  output: JsonValue;
}

export class TerminalAppModel {
  constructor(private readonly manifold: ManifoldService) {}

  async run(command: string, payload: Record<string, JsonValue> = {}): Promise<TerminalCommandResult> {
    const normalized = command.trim();
    if (!normalized) return { command: "", output: "" };
    const output = await this.manifold.command(normalized, payload);
    return { command: normalized, output };
  }
}
