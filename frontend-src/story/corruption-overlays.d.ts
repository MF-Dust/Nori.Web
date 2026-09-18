import type { ReactElement } from "react";
export function CorruptionEntry(props: {
  progress: number;
  active: boolean;
}): ReactElement | null;
export function CorruptionHeal(props: {
  onError?(): void;
  progress: number;
  active: boolean;
}): ReactElement | null;
