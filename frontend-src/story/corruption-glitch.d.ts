export interface CorruptionGlitchParams {
  maxShiftPx: number;
  sliceCount: number;
  blockiness: number;
  verticalAmount: number;
  rgbSplitPx: number;
  joltPx: number;
  tickMs: number;
  density: number;
  moshCells: number;
  deepFry: number;
  noise: number;
  invertChance: number;
}
export const CORRUPTION_GLITCH_DEFAULTS: Readonly<CorruptionGlitchParams>;
export const CORRUPTION_GLITCH_PARAMETERS: Readonly<
  Record<
    keyof CorruptionGlitchParams,
    { min: number; max: number; step: number }
  >
>;
export function createCorruptionGlitch(target?: HTMLElement): {
  params(): CorruptionGlitchParams;
  setParams(patch: Partial<CorruptionGlitchParams>): void;
  freeze(value?: boolean): void;
  renderOnce(): void;
  update(milliseconds: number, enabled: boolean): void;
  dispose(): void;
};
