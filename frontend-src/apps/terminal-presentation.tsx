import {
  TerminalWindow,
  type TerminalEditBridge,
  type TerminalWindowProps,
} from "../screens/terminal-window";
import type { DesktopTopBarMenuGroup } from "../components/desktop-topbar";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { DesktopRuntime } from "../state/desktop-runtime";
import type { RegisteredWindowAppDefinition } from "../state/window-app-registry";
import type { WindowComponentProps } from "../state/window-types";

export type TerminalPresentationRuntime = Omit<
  TerminalWindowProps,
  "instanceId" | "focused"
>;

export interface TerminalEditBridgeRegistry {
  register(instanceId: string, bridge: TerminalEditBridge | null): void;
  get(instanceId: string): TerminalEditBridge | undefined;
  clear(): void;
}

/** Maintainable counterpart of the shipped per-terminal-window XN map. */
export function createTerminalEditBridgeRegistry(): TerminalEditBridgeRegistry {
  const bridges = new Map<string, TerminalEditBridge>();
  return {
    register(instanceId, bridge) {
      if (bridge) bridges.set(instanceId, bridge);
      else bridges.delete(instanceId);
    },
    get(instanceId) {
      return bridges.get(instanceId);
    },
    clear() {
      bridges.clear();
    },
  };
}

export function withTerminalEditBridgeRegistry(
  runtime: TerminalPresentationRuntime,
  registry: TerminalEditBridgeRegistry,
): TerminalPresentationRuntime {
  const downstream = runtime.registerEditBridge;
  return {
    ...runtime,
    registerEditBridge(instanceId, bridge) {
      registry.register(instanceId, bridge);
      downstream?.(instanceId, bridge);
    },
  };
}

/** Creates the production `terminal/main` presentation binding. */
export function createTerminalProductionWindowBinding(
  runtime: TerminalPresentationRuntime,
): ProductionWindowBinding {
  function BoundTerminalWindow(props: WindowComponentProps) {
    return (
      <TerminalWindow
        {...runtime}
        instanceId={props.instanceId}
        focused={props.focused}
      />
    );
  }

  return { component: BoundTerminalWindow };
}

export interface TerminalMenuActions {
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
}

/** Exact production Terminal menu schema with the recovered edit bridge. */
export function createTerminalTopBarMenuGroups(
  runtime: DesktopRuntime,
  bridges: TerminalEditBridgeRegistry,
  actions: TerminalMenuActions = {},
): readonly DesktopTopBarMenuGroup[] {
  const context = runtime.store.getState().getAppMenuContext("terminal");
  const focusedBridge = () =>
    context.focusedWindowId ? bridges.get(context.focusedWindowId) : undefined;

  return [
    {
      label: "Shell",
      items: [
        {
          label: "New Window",
          shortcut: "⌘N",
          onSelect: () => context.createWindow("main"),
        },
        { label: "", separator: true },
        {
          label: "Close Window",
          shortcut: "⌘W",
          onSelect: () => {
            if (context.focusedWindowId) context.closeWindow(context.focusedWindowId);
          },
        },
      ],
    },
    {
      label: "Edit",
      items: [
        {
          label: "Copy",
          shortcut: "⌘C",
          onSelect: () => focusedBridge()?.copyOrInterrupt(),
        },
        {
          label: "Paste",
          shortcut: "⌘V",
          onSelect: () => focusedBridge()?.paste(),
        },
      ],
    },
    {
      label: "View",
      items: [
        {
          label: "Zoom In",
          shortcut: "⌘=",
          onSelect: actions.zoomIn ?? (() => console.log("Zoom in")),
        },
        {
          label: "Zoom Out",
          shortcut: "⌘-",
          onSelect: actions.zoomOut ?? (() => console.log("Zoom out")),
        },
        {
          label: "Reset Zoom",
          shortcut: "⌘0",
          onSelect: actions.resetZoom ?? (() => console.log("Reset zoom")),
        },
      ],
    },
  ];
}

export type TerminalTopBarMenuResolver = (
  app: RegisteredWindowAppDefinition,
  appId: string,
) => readonly DesktopTopBarMenuGroup[];

export function createTerminalTopBarMenuResolver(
  runtime: DesktopRuntime,
  bridges: TerminalEditBridgeRegistry,
  actions: TerminalMenuActions = {},
): TerminalTopBarMenuResolver {
  return (_app, appId) =>
    appId === "terminal"
      ? createTerminalTopBarMenuGroups(runtime, bridges, actions)
      : [];
}
