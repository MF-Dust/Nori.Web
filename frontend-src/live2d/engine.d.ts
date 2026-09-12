/** Typed public boundary for the recovered Cubism engine. Core is supplied by /cubism_sdk/Core. */
export interface MotionStep {
  group: string;
  index?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}
export interface Live2DModel {
  setIdleSequence(steps: MotionStep | MotionStep[]): void;
  startMotion(options: {
    steps: MotionStep | MotionStep[];
    onBegin?(): void;
    onFinish?(): void;
  }): void;
  setExpression(name: string): void;
  clearExpressions(): void;
  setTemporaryExpression(name: string, seconds: number): void;
}
export interface ModelSource {
  dir: string;
  modelJson: string;
  textureVariants?: Record<string, Record<number, string>>;
}
export interface Live2DPlugin {
  readonly id: string;
}
export interface Live2DSession {
  readonly model: Live2DModel | null;
  readonly framesRendered: number;
  loadModel(
    source: ModelSource,
    plugins?: Live2DPlugin[],
  ): Promise<Live2DModel>;
  start(): void;
  stop(): void;
  destroy(): void;
  setResolution(resolution: number): void;
  setMaxFps(fps: number): void;
  updateCameraScale(scale: number): void;
  updateCameraOffsets(x: number, y: number): void;
}
export class Live2DEngine {
  static create(options?: {
    baseUrl?: string;
    logging?: "debug" | "info" | "error" | "off";
  }): Live2DEngine;
  createSession(options: {
    canvas: HTMLCanvasElement;
    plugins?: Live2DPlugin[];
    render?: {
      maxResolution?: number;
      maxFps?: number;
      premultipliedAlpha?: boolean;
    };
    camera?: { viewScale?: number; offsetX?: number; offsetY?: number };
    input?: {
      enableDrag?: boolean;
      enableTap?: boolean;
      passThrough?: boolean;
    };
  }): Live2DSession;
  dispose(): void;
}
export function createDragPlugin(options?: { enabled?: boolean }): Live2DPlugin;
export function createBlinkPlugin(options?: {
  enabled?: boolean;
}): Live2DPlugin;
export function createBreathPlugin(options?: {
  enabled?: boolean;
}): Live2DPlugin;
export function createPhysicsPlugin(options?: {
  enabled?: boolean;
}): Live2DPlugin;
export function createLipSyncPlugin(options?: {
  enabled?: boolean;
  getAmplitude?(): number;
  getIntensity?(): number;
}): Live2DPlugin;
