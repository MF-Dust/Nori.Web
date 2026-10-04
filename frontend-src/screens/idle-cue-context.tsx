import { createContext, useContext } from "react";

export type IdleCue = (cue: string, options?: { volume?: number; pitch?: number }) => void;

const noop: IdleCue = () => {};

/** Shared UI cue bus (shipped `D`) for Idle screen controls. */
export const IdleCueContext = createContext<IdleCue>(noop);

export function useIdleCue(): IdleCue {
  return useContext(IdleCueContext);
}
