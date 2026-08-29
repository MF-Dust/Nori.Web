import {
  createBrowserPopupProductionWindowBinding,
  type BrowserPopupPresentationRuntime,
} from "./browser-presentation";
import {
  createMailProductionWindowBinding,
  type MailPresentationRuntime,
} from "./mail-presentation";
import {
  createSignalProductionWindowBinding,
  type SignalPresentationRuntime,
} from "./signal-presentation";
import {
  createTerminalEditBridgeRegistry,
  createTerminalProductionWindowBinding,
  createTerminalTopBarMenuResolver,
  withTerminalEditBridgeRegistry,
  type TerminalEditBridgeRegistry,
  type TerminalPresentationRuntime,
  type TerminalTopBarMenuResolver,
} from "./terminal-presentation";
import {
  createDesktopRuntime,
  type CreateDesktopRuntimeOptions,
  type DesktopRuntime,
} from "../state/desktop-runtime";
import type { ProductionWindowBindings } from "../state/production-window-apps";

export interface RecoveredProductionPresentationOptions {
  signal?: SignalPresentationRuntime;
  terminal?: TerminalPresentationRuntime;
  browserPopup?: BrowserPopupPresentationRuntime;
  mail?: MailPresentationRuntime;
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

  if (options.mail) {
    bindings.mail = {
      main: createMailProductionWindowBinding(options.mail),
    };
  }

  return bindings;
}

export function mergeProductionWindowBindings(
  ...sources: Array<ProductionWindowBindings | undefined>
): ProductionWindowBindings {
  const result: ProductionWindowBindings = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [appId, windows] of Object.entries(source)) {
      if (!windows) continue;
      result[appId] = {
        ...(result[appId] ?? {}),
        ...windows,
      };
    }
  }
  return result;
}

export interface CreateRecoveredDesktopRuntimeOptions
  extends RecoveredProductionPresentationOptions {
  desktop?: CreateDesktopRuntimeOptions;
}

export interface RecoveredDesktopRuntimeBundle {
  runtime: DesktopRuntime;
  windows: ProductionWindowBindings;
  terminalEditBridges?: TerminalEditBridgeRegistry;
  resolveAppMenu?: TerminalTopBarMenuResolver;
}

/**
 * Turnkey migration runtime: recovered presentation bindings, the production
 * registry/window store and Terminal's menu/edit bridge are assembled around a
 * single DesktopRuntime. This is the intended source-side handoff boundary for
 * the later main.tsx cutover.
 */
export function createRecoveredDesktopRuntime(
  options: CreateRecoveredDesktopRuntimeOptions = {},
): RecoveredDesktopRuntimeBundle {
  const terminalEditBridges = options.terminal
    ? createTerminalEditBridgeRegistry()
    : undefined;
  const presentation: RecoveredProductionPresentationOptions = {
    signal: options.signal,
    browserPopup: options.browserPopup,
    mail: options.mail,
    terminal:
      options.terminal && terminalEditBridges
        ? withTerminalEditBridgeRegistry(options.terminal, terminalEditBridges)
        : options.terminal,
  };
  const recoveredWindows = createRecoveredProductionWindowBindings(presentation);
  const windows = mergeProductionWindowBindings(
    options.desktop?.windows,
    recoveredWindows,
  );
  const runtime = createDesktopRuntime({
    ...options.desktop,
    windows,
  });

  return {
    runtime,
    windows,
    terminalEditBridges,
    resolveAppMenu:
      terminalEditBridges
        ? createTerminalTopBarMenuResolver(runtime, terminalEditBridges)
        : undefined,
  };
}
