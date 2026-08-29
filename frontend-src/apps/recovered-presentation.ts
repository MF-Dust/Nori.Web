import {
  createBrowserPopupProductionWindowBinding,
  type BrowserPopupPresentationRuntime,
} from "./browser-presentation";
import {
  createSignalProductionWindowBinding,
  type SignalPresentationRuntime,
} from "./signal-presentation";
import {
  createTerminalProductionWindowBinding,
  type TerminalPresentationRuntime,
} from "./terminal-presentation";
import type { ProductionWindowBindings } from "../state/production-window-apps";

export interface RecoveredProductionPresentationOptions {
  signal?: SignalPresentationRuntime;
  terminal?: TerminalPresentationRuntime;
  browserPopup?: BrowserPopupPresentationRuntime;
}

/**
 * Produces the source-owned subset of the production presentation registry.
 * Missing features remain absent on purpose and are rendered by the desktop's
 * explicit recovery fallback until their corresponding chunks are rebuilt.
 */
export function createRecoveredProductionWindowBindings(
  options: RecoveredProductionPresentationOptions,
): ProductionWindowBindings {
  const bindings: ProductionWindowBindings = {};

  if (options.signal) {
    bindings.signal = {
      main: createSignalProductionWindowBinding(options.signal),
    };
  }

  if (options.terminal) {
    bindings.terminal = {
      main: createTerminalProductionWindowBinding(options.terminal),
    };
  }

  if (options.browserPopup) {
    bindings.browser = {
      popup: createBrowserPopupProductionWindowBinding(options.browserPopup),
    };
  }

  return bindings;
}
