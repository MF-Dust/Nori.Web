import {
  createBrowserPopupProductionWindowBinding,
  createBrowserProductionWindowBindings,
  type BrowserPopupPresentationRuntime,
  type BrowserPresentationRuntime,
} from "./browser-presentation";
import {
  createFilesProductionWindowBinding,
  type FilesPresentationRuntime,
  type OpenFilesIntent,
} from "./files-presentation";
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
import {
  createFilesIntentStore,
  type FilesIntentStore,
} from "../screens/files-screen";
import {
  createBrowserIntentStore,
  type BrowserIntentStore,
} from "../intents/browser-intent";

export interface RecoveredProductionPresentationOptions {
  signal?: SignalPresentationRuntime;
  terminal?: TerminalPresentationRuntime;
  browser?: BrowserPresentationRuntime;
  browserPopup?: BrowserPopupPresentationRuntime;
  mail?: MailPresentationRuntime;
  files?: FilesPresentationRuntime;
}

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

  if (options.browser) {
    bindings.browser = createBrowserProductionWindowBindings(options.browser);
  } else if (options.browserPopup) {
    bindings.browser = {
      popup: createBrowserPopupProductionWindowBinding(options.browserPopup),
    };
  }

  if (options.mail) {
    bindings.mail = {
      main: createMailProductionWindowBinding(options.mail),
    };
  }

  if (options.files) {
    bindings.files = {
      main: createFilesProductionWindowBinding(options.files, options.files.intent),
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
  filesIntent?: FilesIntentStore;
  openFilesIntent?: OpenFilesIntent;
  browserIntent?: BrowserIntentStore;
  openBrowserIntent?: (url: string) => Promise<void>;
}

export function createRecoveredDesktopRuntime(
  options: CreateRecoveredDesktopRuntimeOptions = {},
): RecoveredDesktopRuntimeBundle {
  const terminalEditBridges = options.terminal
    ? createTerminalEditBridgeRegistry()
    : undefined;
  const filesIntent = options.files?.intent ?? (options.files ? createFilesIntentStore() : undefined);
  const browserIntent = options.browser?.intent ?? (options.browser ? createBrowserIntentStore() : undefined);
  const presentation: RecoveredProductionPresentationOptions = {
    signal: options.signal,
    browser: options.browser ? { ...options.browser, intent: browserIntent } : undefined,
    browserPopup: options.browserPopup,
    mail: options.mail,
    files: options.files
      ? { ...options.files, intent: filesIntent }
      : undefined,
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

  const openFilesIntent: OpenFilesIntent | undefined = filesIntent
    ? async (payload) => {
        filesIntent.open(payload);
        let state = runtime.store.getState();
        if (!state.processes.files) {
          await state.launchApp({ appId: "files", mode: "launch", args: payload });
          return;
        }

        const process = state.processes.files;
        const mainId = process.windowIds.find(
          (instanceId) => state.windows[instanceId]?.windowType === "main",
        );
        if (mainId) {
          state.focusWindow(mainId);
          return;
        }
        state = runtime.store.getState();
        state.getAppContext("files").createWindow("main", payload);
      }
    : undefined;

  const openBrowserIntent = browserIntent
    ? async (url: string) => {
        let state = runtime.store.getState();
        if (!state.processes.browser) {
          await state.launchApp({ appId: "browser", mode: "launch", args: { url } });
          return;
        }

        const process = state.processes.browser;
        const mainId = process.windowIds.find(
          (instanceId) => state.windows[instanceId]?.windowType === "main",
        );
        if (mainId) {
          browserIntent.open(url);
          state.focusWindow(mainId);
          return;
        }

        // A Browser process may contain only popup windows. In that case the
        // requested URL becomes the new main window's initial tab directly;
        // do not also publish it to the intent store or the same URL would be
        // consumed a second time after BrowserScreen mounts.
        state = runtime.store.getState();
        state.getAppContext("browser").createWindow("main", { url });
      }
    : undefined;

  return {
    runtime,
    windows,
    terminalEditBridges,
    resolveAppMenu:
      terminalEditBridges
        ? createTerminalTopBarMenuResolver(runtime, terminalEditBridges)
        : undefined,
    filesIntent,
    openFilesIntent,
    browserIntent,
    openBrowserIntent,
  };
}
