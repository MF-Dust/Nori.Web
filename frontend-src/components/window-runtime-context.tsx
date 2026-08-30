import {
  createContext,
  useContext,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import type { WindowAppContext, WindowRuntimeProps } from "../state/window-store";

const WindowAppRuntimeContext = createContext<WindowAppContext | null>(null);
const ManagedWindowRuntimeContext = createContext<WindowRuntimeProps | null>(null);

export interface WindowTitleBarContentValue {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export interface WindowPresentationRuntime {
  setTitleBarContent(content: WindowTitleBarContentValue | null): void;
}

const WindowPresentationRuntimeContext = createContext<WindowPresentationRuntime | null>(null);

export function WindowAppRuntimeProvider({
  value,
  children,
}: PropsWithChildren<{ value: WindowAppContext }>) {
  return (
    <WindowAppRuntimeContext.Provider value={value}>
      {children}
    </WindowAppRuntimeContext.Provider>
  );
}

export function ManagedWindowRuntimeProvider({
  value,
  children,
}: PropsWithChildren<{ value: WindowRuntimeProps }>) {
  return (
    <ManagedWindowRuntimeContext.Provider value={value}>
      {children}
    </ManagedWindowRuntimeContext.Provider>
  );
}

export function WindowPresentationRuntimeProvider({
  value,
  children,
}: PropsWithChildren<{ value: WindowPresentationRuntime }>) {
  return (
    <WindowPresentationRuntimeContext.Provider value={value}>
      {children}
    </WindowPresentationRuntimeContext.Provider>
  );
}

export function useWindowAppRuntime(): WindowAppContext {
  const context = useContext(WindowAppRuntimeContext);
  if (!context) throw new Error("useWindowAppRuntime must be used inside WindowAppRuntimeProvider");
  return context;
}

export function useManagedWindowRuntime(): WindowRuntimeProps {
  const context = useContext(ManagedWindowRuntimeContext);
  if (!context) {
    throw new Error("useManagedWindowRuntime must be used inside ManagedWindowRuntimeProvider");
  }
  return context;
}

export function useWindowPresentationRuntime(): WindowPresentationRuntime | null {
  return useContext(WindowPresentationRuntimeContext);
}
