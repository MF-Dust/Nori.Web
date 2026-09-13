/** Typed public boundary for the recovered Cubism engine. Core is supplied by /cubism_sdk/Core. */
export interface MotionStep {
  group: string;
  index?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}
export interface Live2DModel {
  readonly model: {
    getParameterCount(): number;
    getParameterId(index: number): { getString(): { s: string } };
    getParameterValueByIndex(index: number): number;
    setParameterValueByIndex(
      index: number,
      value: number,
      weight?: number,
    ): void;
  } | null;
  getPartsBounds(
    parts: string[],
  ): { left: number; right: number; top: number; bottom: number } | null;
  modelToCanvasUV(x: number, y: number): { u: number; v: number } | null;
  setIdleSequence(steps: MotionStep | MotionStep[]): void;
  startMotion(options: {
    steps: MotionStep | MotionStep[];
    onBegin?(): void;
    onFinish?(): void;
  }): void;
  setExpression(name: string): void;
  addExpression(name: string): void;
  removeExpression(name: string): void;
  getActiveExpressions(): string[];
  setTextureVariant(name: string | null): void;
  setRestPose(enabled: boolean): void;
  setPluginEnabled(id: string, enabled: boolean): void;
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
  install?(model: Live2DModel): {
    readonly enabled?: boolean;
    setEnabled?(enabled: boolean): void;
    update(context: {
      model: Live2DModel;
      deltaTimeSeconds: number;
      motionUpdated: boolean;
    }): void;
    dispose(): void;
  };
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
  getFormIntensity?(): number;
  getFormConstant?(): number | null;
  getExpressionBlend?(expressions: string[]): number;
}): Live2DPlugin;
