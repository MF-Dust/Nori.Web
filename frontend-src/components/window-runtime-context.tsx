import { createContext, useContext, type PropsWithChildren } from "react";
import type { WindowAppContext, WindowRuntimeProps } from "../state/window-store";

const WindowAppRuntimeContext = createContext<WindowAppContext | null>(null);
const ManagedWindowRuntimeContext = createContext<WindowRuntimeProps | null>(null);

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
