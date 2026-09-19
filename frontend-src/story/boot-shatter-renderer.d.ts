export type ShatterParameters = Record<string, number>;
export function shatterDefaults(values: ShatterParameters): ShatterParameters;
export function createFractureGraph(values: ShatterParameters): unknown;
export const SHATTER_PARAMETERS: Record<
  string,
  { default: number; min: number; max: number; step: number; label: string }
>;
export class ShatterRenderer {
  constructor(
    canvas: HTMLCanvasElement,
    params: ShatterParameters,
    graph: unknown,
    backdrop?: HTMLCanvasElement | null,
  );
  render(progress: number, params: ShatterParameters): void;
  resize(width: number, height: number): void;
  ensureBreakStage(): unknown;
  prewarm(params: ShatterParameters): void;
  invalidateScreen(): void;
  drawBackdrop(): void;
  dispose(): void;
}
