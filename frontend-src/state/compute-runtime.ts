export interface DesktopComputeState {
  compute: number;
  cap: number;
  computeDrain?: number;
}

export interface EffectiveDesktopCompute {
  compute: number;
  cap: number;
  draining: boolean;
}

/** Exact `hY` behavior recovered from NormalApp. */
export function getEffectiveDesktopCompute({
  compute,
  cap,
  computeDrain = 0,
}: DesktopComputeState): EffectiveDesktopCompute {
  const reference = Number.isFinite(cap)
    ? Math.max(cap, 10)
    : Math.max(compute, 1e30);
  const effectiveCap =
    computeDrain >= 1
      ? 0
      : computeDrain > 0
        ? 10 ** (Math.log10(reference) * (1 - computeDrain))
        : cap;

  return {
    compute: computeDrain > 0 ? Math.min(compute, effectiveCap) : compute,
    cap: effectiveCap,
    draining: computeDrain > 0,
  };
}

/** Recovered `uY`: scientific notation with two decimal places by default. */
export function formatScientific(value: number, digits = 2): string {
  return value
    .toExponential(digits)
    .replace("e+", "e")
    .replace("e-0", "e-");
}

/** Recovered `Fy` formatter used in qGe/XGe. */
export function formatDesktopCompute(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  return value < 1_000 ? `${Math.round(value)}` : formatScientific(value);
}
