import type { ReactNode } from "react";
import {
  NORI_PRODUCTION_APPS,
  type ProductionAppDescriptor,
  type ProductionWindowDescriptor,
} from "../apps/production-catalog";
import {
  createWindowAppRegistry,
  type RegisteredWindowAppDefinition,
  type WindowAppRegistry,
} from "./window-app-registry";
import type {
  WindowAppContext,
  WindowComponent,
  WindowLaunchRequest,
  WindowScreenEntryDefinition,
} from "./window-types";

export interface ProductionWindowBinding {
  component?: WindowComponent;
  screens?: Record<string, WindowScreenEntryDefinition>;
}

export type ProductionWindowBindings = Record<
  string,
  Record<string, ProductionWindowBinding | undefined> | undefined
>;

export interface ProductionAppLifecycleBinding {
  onLaunch?: (
    context: WindowAppContext,
    request: WindowLaunchRequest,
  ) => void | Promise<void>;
  onQuit?: (context: WindowAppContext) => void | Promise<void>;
  onRestore?: (
    context: WindowAppContext,
  ) => boolean | void | Promise<boolean | void>;
}

export type ProductionAppLifecycleBindings = Record<
  string,
  ProductionAppLifecycleBinding | undefined
>;

export interface CreateProductionWindowAppsOptions {
  descriptors?: readonly ProductionAppDescriptor[];
  windows?: ProductionWindowBindings;
  lifecycle?: ProductionAppLifecycleBindings;
  warn?: (message: string) => void;
}

function defaultWindowType(app: ProductionAppDescriptor): string | null {
  return app.windows[0]?.type ?? null;
}

function requestWindowType(
  app: ProductionAppDescriptor,
  request: WindowLaunchRequest,
): string | null {
  const args = request.args;
  if (args && typeof args === "object" && !Array.isArray(args)) {
    const candidate = (args as Record<string, unknown>).windowType;
    if (
      typeof candidate === "string" &&
      app.windows.some((window) => window.type === candidate)
    ) {
      return candidate;
    }
  }
  return defaultWindowType(app);
}

function requestWindowProps(request: WindowLaunchRequest): unknown {
  const args = request.args;
  if (!args || typeof args !== "object" || Array.isArray(args)) return args;

  const record = args as Record<string, unknown>;
  if (!("windowType" in record)) return args;

  const { windowType: _windowType, ...props } = record;
  return props;
}

function createWindowDefinition(
  descriptor: ProductionWindowDescriptor,
  binding?: ProductionWindowBinding,
): RegisteredWindowAppDefinition["windows"][string] {
  const screenDefinitions =
    descriptor.screens && binding?.screens
      ? Object.fromEntries(
          descriptor.screens.flatMap((screen) => {
            const bound = binding.screens?.[screen.id];
            return bound
              ? [
                  [
                    screen.id,
                    {
                      ...bound,
                      transition: bound.transition ?? screen.transition,
                    },
                  ] as const,
                ]
              : [];
          }),
        )
      : null;

  return {
    title: descriptor.title ?? "",
    defaultSize: descriptor.defaultSize,
    component: binding?.component,
    resizable: descriptor.resizable,
    closable: descriptor.closable,
    minimizable: descriptor.minimizable,
    maximizable: descriptor.maximizable,
    alwaysOnTop: descriptor.alwaysOnTop,
    ...(descriptor.initialScreen && screenDefinitions
      ? {
          screens: {
            initial: descriptor.initialScreen,
            screens: screenDefinitions,
          },
        }
      : {}),
  };
}

export function createProductionWindowAppDefinition(
  descriptor: ProductionAppDescriptor,
  windows: ProductionWindowBindings = {},
  lifecycle?: ProductionAppLifecycleBinding,
): RegisteredWindowAppDefinition {
  const definitions = Object.fromEntries(
    descriptor.windows.map((window) => [
      window.type,
      createWindowDefinition(window, windows[descriptor.id]?.[window.type]),
    ]),
  );

  return {
    id: descriptor.id,
    pinned: descriptor.pinned,
    exclusive: descriptor.exclusive,
    keepAlive: descriptor.keepAlive,
    runtime: descriptor.runtime
      ? { ownsCartridge: descriptor.runtime.ownsCartridge }
      : undefined,
    windows: definitions,
    async onLaunch(context, request) {
      if (lifecycle?.onLaunch) {
        await lifecycle.onLaunch(context, request);
        return;
      }

      const windowType = requestWindowType(descriptor, request);
      if (!windowType) return;

      const existing = context
        .getWindows()
        .find((window) => window.windowType === windowType);
      if (existing) return;

      context.createWindow(windowType, requestWindowProps(request));
    },
    onQuit: lifecycle?.onQuit,
    onRestore: lifecycle?.onRestore,
  };
}

export function createProductionWindowAppRegistry(
  options: CreateProductionWindowAppsOptions = {},
): WindowAppRegistry {
  const descriptors = options.descriptors ?? NORI_PRODUCTION_APPS;
  const apps = descriptors.map((descriptor) =>
    createProductionWindowAppDefinition(
      descriptor,
      options.windows,
      options.lifecycle?.[descriptor.id],
    ),
  );

  return createWindowAppRegistry(apps, { warn: options.warn });
}

/**
 * Helper shape for renderers that want to explain why a production window is
 * still a migration boundary instead of silently rendering an empty surface.
 */
export interface UnrecoveredProductionWindowNoticeProps {
  appId: string;
  windowType: string;
  fallback?: ReactNode;
}
