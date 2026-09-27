import {
  Application,
  BlurFilter,
  Container,
  type FederatedPointerEvent,
  type FederatedWheelEvent,
} from "pixi.js";
import type { DestroyOptions } from "pixi.js";
import type { MarginalGrowthCache } from "./decode";
import { loadMarginalGrowthCache } from "./loader";
import {
  RibbonMesh,
  RIBBON_LINE_WIDTH_CEILING,
  RIBBON_SWAY_AMPLITUDE_CEILING,
  RIBBON_WARP_AMPLITUDE_CEILING,
} from "./ribbon-mesh";
import {
  PULSE_SLOT_COUNT,
  applyAccentColors,
  applyOwnedEffects,
  createEffectUniforms,
  createRibbonShader,
  swayBakeAmplitude,
  writeRgb,
} from "./shaders";
import type { MarginalGrowthParams, ResolvedCameraClamp } from "../../state/marginal-growth-store";

/** Shipped `zs`. Cache coordinates are centered on this square. */
export const MARGINAL_GROWTH_WORLD_SIZE = 6800;

/** Shipped `St`. */
const CAMERA_ZOOM_STEP = 1.12;
/** Shipped `Wa`. */
const CAMERA_DRAG_THRESHOLD = 3;
/** Shipped `Ra` / `Fa`. */
const CAMERA_DEFAULT_MIN_SCALE = 0.15;
const CAMERA_DEFAULT_MAX_SCALE = 3;
/** Shipped `js`. */
const SIZE_POLL_MS = 500;
/** Shipped `ks` / `Ms`. */
const MIN_RESOLUTION = 1;
const MAX_RESOLUTION = 2;

export const MARGINAL_GROWTH_SHAPES = ["circle", "chubby", "spiky", "nori"] as const;
export type MarginalGrowthShape = (typeof MARGINAL_GROWTH_SHAPES)[number];

export interface RibbonCameraTransform {
  x: number;
  y: number;
  scale: number;
}

export interface MarginalGrowthRibbonOptions {
  debugFilter?: string;
  shape?: MarginalGrowthShape;
}

export interface RibbonDebugMarker {
  x: number;
  y: number;
  id: number;
  kind?: "side" | "root";
  childCount?: number;
}

/** Shipped `Bt`. */
function ribbonResolution(): number {
  return Math.min(MAX_RESOLUTION, Math.max(MIN_RESOLUTION, window.devicePixelRatio || 1));
}

/** Shipped `De`. */
function elementSize(element: HTMLElement): { width: number; height: number } {
  return {
    width: Math.max(1, element.clientWidth),
    height: Math.max(1, element.clientHeight),
  };
}

/**
 * Shipped `Oa`: pan, zoom, and clamp for the ribbon world.
 * `Ta` (line 229) is the separate growth-node overlay, not this camera.
 */
class RibbonCamera {
  app: Application;
  world: Container;
  onTransform?: (transform: RibbonCameraTransform) => void;
  onTap?: () => void;
  dragging = false;
  dragMoved = false;
  lastX = 0;
  lastY = 0;
  clamp: ResolvedCameraClamp = {
    minScale: CAMERA_DEFAULT_MIN_SCALE,
    maxScale: CAMERA_DEFAULT_MAX_SCALE,
    panWorld: Number.POSITIVE_INFINITY,
  };

  constructor(
    app: Application,
    world: Container,
    onTransform?: (transform: RibbonCameraTransform) => void,
    onTap?: () => void,
  ) {
    this.app = app;
    this.world = world;
    this.onTransform = onTransform;
    this.onTap = onTap;
    this.recenter();
    const stage = app.stage;
    stage.eventMode = "static";
    stage.hitArea = app.screen;
    stage.on("pointerdown", this.onPointerDown);
    stage.on("globalpointermove", this.onPointerMove);
    stage.on("wheel", this.onWheel);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerCancel);
  }

  destroy(): void {
    const stage = this.app.stage;
    stage.off("pointerdown", this.onPointerDown);
    stage.off("globalpointermove", this.onPointerMove);
    stage.off("wheel", this.onWheel);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerCancel);
  }

  recenter(): void {
    this.world.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    this.world.scale.set(this.clampScale(1));
    this.clampPosition();
    this.emitTransform();
  }

  onResize(): void {
    this.world.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    this.clampPosition();
    this.emitTransform();
  }

  setClamp(clamp: ResolvedCameraClamp): void {
    this.clamp = clamp;
    this.world.scale.set(this.clampScale(this.world.scale.x));
    this.clampPosition();
    this.emitTransform();
  }

  clampScale(scale: number): number {
    return Math.max(this.clamp.minScale, Math.min(this.clamp.maxScale, scale));
  }

  clampPosition(): void {
    const limit = this.clamp.panWorld * this.world.scale.x;
    if (!Number.isFinite(limit)) return;
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    this.world.position.x = Math.max(centerX - limit, Math.min(centerX + limit, this.world.position.x));
    this.world.position.y = Math.max(centerY - limit, Math.min(centerY + limit, this.world.position.y));
  }

  zoomAtClient(clientX: number, clientY: number, deltaY: number): void {
    const rect = this.app.canvas.getBoundingClientRect();
    this.zoomAt(clientX - rect.left, clientY - rect.top, deltaY);
  }

  panBy(dx: number, dy: number): void {
    this.world.position.x += dx;
    this.world.position.y += dy;
    this.clampPosition();
    this.emitTransform();
  }

  private onPointerDown = (event: FederatedPointerEvent): void => {
    this.dragging = true;
    this.dragMoved = false;
    this.lastX = event.globalX;
    this.lastY = event.globalY;
  };

  private onPointerMove = (event: FederatedPointerEvent): void => {
    if (!this.dragging) return;
    const dx = event.globalX - this.lastX;
    const dy = event.globalY - this.lastY;
    if (!this.dragMoved) {
      if (Math.abs(dx) + Math.abs(dy) < CAMERA_DRAG_THRESHOLD) return;
      this.dragMoved = true;
    }
    this.world.position.x += dx;
    this.world.position.y += dy;
    this.clampPosition();
    this.lastX = event.globalX;
    this.lastY = event.globalY;
    this.emitTransform();
  };

  private onPointerUp = (): void => {
    if (this.dragging && !this.dragMoved) this.onTap?.();
    this.dragging = false;
    this.dragMoved = false;
  };

  private onPointerCancel = (): void => {
    this.dragging = false;
    this.dragMoved = false;
  };

  private onWheel = (event: FederatedWheelEvent): void => {
    event.preventDefault?.();
    const rect = this.app.canvas.getBoundingClientRect();
    const x = (event.clientX ?? 0) - rect.left;
    const y = (event.clientY ?? 0) - rect.top;
    this.zoomAt(x, y, event.deltaY);
  };

  private zoomAt(x: number, y: number, deltaY: number): void {
    const factor = deltaY < 0 ? CAMERA_ZOOM_STEP : 1 / CAMERA_ZOOM_STEP;
    const scale = this.clampScale(this.world.scale.x * factor);
    const localX = (x - this.world.position.x) / this.world.scale.x;
    const localY = (y - this.world.position.y) / this.world.scale.y;
    this.world.scale.set(scale);
    this.world.position.x = x - localX * scale;
    this.world.position.y = y - localY * scale;
    this.clampPosition();
    this.emitTransform();
  }

  private emitTransform(): void {
    this.onTransform?.({
      x: this.world.position.x,
      y: this.world.position.y,
      scale: this.world.scale.x,
    });
  }
}

/**
 * Shipped `Ps`. Loads `/marginal-growth-cache-${shape}.bin` through `loader.ts`.
 */
export class MarginalGrowthRibbon extends Container {
  params: MarginalGrowthParams;
  owned: Record<string, number> | null = null;
  accents: Record<string, number> = {};
  loadId = 0;
  cache: MarginalGrowthCache | null = null;
  readonly effectUniforms = createEffectUniforms();
  readonly ribbonShader = createRibbonShader(this.effectUniforms);
  debugFilter: string;
  readonly ribbonMesh: RibbonMesh;
  readonly branchBlurFilter = new BlurFilter({ strength: 0, quality: 3, kernelSize: 7 });
  readonly blurFilters = [this.branchBlurFilter];
  blurFiltersActive = false;
  pulseSlotInUse = new Uint8Array(PULSE_SLOT_COUNT);
  nextPulseSlot = 0;
  pulseHighWater = 0;
  lastPulseSweepMs = 0;
  worldSize: number;
  cameraScale = 1;
  currentStep = -1;
  shape: MarginalGrowthShape;

  constructor(worldSize: number, params: MarginalGrowthParams, options: MarginalGrowthRibbonOptions = {}) {
    super();
    this.params = params;
    this.worldSize = worldSize;
    this.debugFilter = options.debugFilter ?? "all";
    this.shape = options.shape ?? "circle";
    this.ribbonMesh = new RibbonMesh(this.ribbonShader);
    this.pivot.set(worldSize / 2, worldSize / 2);
    this.addChild(this.ribbonMesh);
    const center = this.effectUniforms.uniforms.uWorldCenter;
    center[0] = worldSize / 2;
    center[1] = worldSize / 2;
    this.pushEffectParams();
    this.pushDebugFilter();
    this.applyScale();
    this.applyRenderStyle();
    void this.loadCache();
  }

  setDebugFilter(filter: string): void {
    if (this.debugFilter !== filter) {
      this.debugFilter = filter;
      this.pushDebugFilter();
    }
  }

  debugStats() {
    return {
      ...this.ribbonMesh.debugStats(this.currentStep),
      chunkCount: this.cache ? 1 : 0,
      currentStep: this.currentStep,
      cacheLoaded: this.cache != null,
    };
  }

  getMaxSteps(): number {
    return this.cache?.maxSteps ?? 0;
  }

  debugMarkers(): {
    chainStarts: RibbonDebugMarker[];
    chainEnds: RibbonDebugMarker[];
    forks: RibbonDebugMarker[];
  } {
    const markers = {
      chainStarts: [] as RibbonDebugMarker[],
      chainEnds: [] as RibbonDebugMarker[],
      forks: [] as RibbonDebugMarker[],
    };
    if (!this.cache) return markers;
    const topology = this.ribbonMesh.getTopology();
    if (!topology) return markers;
    const step = this.currentStep;
    const nodes = this.cache.nodes;
    const childCounts = new Map<number, number>();
    for (const node of nodes) {
      if (node.birthStep > step) continue;
      if (node.parentId != null) {
        childCounts.set(node.parentId, (childCounts.get(node.parentId) ?? 0) + 1);
      }
    }
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      if (node.birthStep > step || node.parentId == null) continue;
      if (topology.idToIndex.has(node.parentId)) {
        if (!topology.isMainChildOfParent(index, node.parentId)) {
          markers.chainStarts.push({ x: node.x, y: node.y, id: node.id, kind: "side" });
        }
      } else {
        markers.chainStarts.push({ x: node.x, y: node.y, id: node.id, kind: "root" });
      }
      const mainChild = topology.mainChildIdx[index];
      if (mainChild < 0 || topology.birthStep[mainChild] > step) {
        markers.chainEnds.push({ x: node.x, y: node.y, id: node.id });
      }
      const childCount = childCounts.get(node.id) ?? 0;
      if (childCount > 1) {
        markers.forks.push({ x: node.x, y: node.y, id: node.id, childCount });
      }
    }
    return markers;
  }

  setParams(params: MarginalGrowthParams): void {
    this.params = params;
    this.applyScale();
    this.applyRenderStyle();
    this.pushEffectParams();
    this.rebakeIfPastCeiling();
  }

  setOwned(owned: Record<string, number> | null): void {
    this.owned = owned;
    this.pushEffectParams();
    this.rebakeIfPastCeiling();
  }

  setAccents(accents: Record<string, number>): void {
    this.accents = accents;
    this.pushEffectParams();
  }

  rebakeIfPastCeiling(): void {
    if (!this.cache) return;
    const params = this.effectiveParams();
    const sway = swayBakeAmplitude(params);
    if (this.ribbonMesh.isWithinBakeBounds(params.lineWidth, sway, params.fxWarpAmplitude)) return;
    console.warn(
      "[marginalGrowth] rebaking mesh: lineWidth, sway, or warp exceeded bake ceiling",
    );
    this.ribbonMesh.setCache(this.cache, {
      lineWidthCeiling: Math.max(RIBBON_LINE_WIDTH_CEILING, params.lineWidth * 1.5),
      swayAmplitudeCeiling: Math.max(RIBBON_SWAY_AMPLITUDE_CEILING, sway * 1.5),
      warpAmplitudeCeiling: Math.max(RIBBON_WARP_AMPLITUDE_CEILING, params.fxWarpAmplitude * 1.5),
    });
    this.ribbonMesh.updateStep(this.currentStep, true);
  }

  tick(): void {
    const now = performance.now();
    const uniforms = this.effectUniforms.uniforms;
    uniforms.uTimeMs = now;
    if (uniforms.uQuantumPresence > 0) {
      const period = Math.max(uniforms.uQuantumCollapsePeriodMs, 1);
      const phase = now % period;
      const distance = Math.min(phase, period - phase);
      const halfWidth = Math.max(uniforms.uQuantumCollapseHalfWidthMs, 1);
      uniforms.uQuantumCollapse = Math.exp(-(distance * distance) / (halfWidth * halfWidth));
    } else {
      uniforms.uQuantumCollapse = 0;
    }
    if (uniforms.uEschatonPresence > 0 && uniforms.uEschatonFlashPeriod > 0.5) {
      const flash =
        ((((now * 0.001) / uniforms.uEschatonFlashPeriod) % 1) * uniforms.uEschatonFlashPeriod) /
        0.6;
      uniforms.uEschatonFlash = Math.exp(-flash * flash) * uniforms.uEschatonFlashStrength;
    } else {
      uniforms.uEschatonFlash = 0;
    }
    if (now - this.lastPulseSweepMs > 50 && this.pulseHighWater > 0) {
      this.decayPulses(now);
      this.lastPulseSweepMs = now;
    }
    if (this.cache) {
      const step = Math.max(0, Math.min(this.cache.maxSteps, Math.round(this.params.steps)));
      if (step !== this.currentStep) {
        this.currentStep = step;
        uniforms.uCurrentStep = step;
        this.ribbonMesh.updateStep(step);
      }
    }
    this.effectUniforms.update();
  }

  setCameraScale(scale: number): void {
    const next = Math.max(0.01, scale);
    if (next !== this.cameraScale) {
      this.cameraScale = next;
      this.applyRenderStyle();
    }
  }

  pulse(x?: number, y?: number, amount = 1, color = 0): void {
    const px = x ?? this.worldSize / 2;
    const py = y ?? this.worldSize / 2;
    const slot = this.nextPulseSlot;
    this.nextPulseSlot = (this.nextPulseSlot + 1) % PULSE_SLOT_COUNT;
    const offset = slot * 4;
    const pulses = this.effectUniforms.uniforms.uPulses;
    const tints = this.effectUniforms.uniforms.uPulseTints;
    pulses[offset] = px;
    pulses[offset + 1] = py;
    pulses[offset + 2] = performance.now();
    pulses[offset + 3] = amount <= 0 ? 0 : amount;
    if (color > 0) {
      tints[offset] = ((color >> 16) & 255) / 255;
      tints[offset + 1] = ((color >> 8) & 255) / 255;
      tints[offset + 2] = (color & 255) / 255;
    } else {
      tints[offset] = 0;
      tints[offset + 1] = 0;
      tints[offset + 2] = 0;
    }
    tints[offset + 3] = 0;
    this.pulseSlotInUse[slot] = 1;
    if (slot + 1 > this.pulseHighWater) {
      this.pulseHighWater = slot + 1;
      this.effectUniforms.uniforms.uActivePulseCount = this.pulseHighWater;
    }
  }

  playFirstPurchase(_generatorId: string, color = 0): void {
    this.pulse(this.worldSize / 2, this.worldSize / 2, 2.4, color);
  }

  destroy(options?: DestroyOptions): void {
    this.loadId += 1;
    const resolved: DestroyOptions =
      typeof options === "object" && options !== null
        ? { ...options, children: true }
        : { children: true, ...(options ? { texture: true } : {}) };
    super.destroy(resolved);
    this.ribbonShader.destroy(false);
  }

  setShape(shape: MarginalGrowthShape): void {
    if (this.shape !== shape) {
      this.shape = shape;
      void this.loadCache();
    }
  }

  async loadCache(): Promise<void> {
    const loadId = ++this.loadId;
    const shape = this.shape;
    try {
      const cache = await loadMarginalGrowthCache(shape);
      if (loadId !== this.loadId || this.destroyed) return;
      this.cache = cache;
      this.currentStep = -1;
      const params = this.effectiveParams();
      this.ribbonMesh.setCache(cache, {
        lineWidthCeiling: Math.max(RIBBON_LINE_WIDTH_CEILING, params.lineWidth),
        swayAmplitudeCeiling: Math.max(RIBBON_SWAY_AMPLITUDE_CEILING, swayBakeAmplitude(params)),
        warpAmplitudeCeiling: Math.max(RIBBON_WARP_AMPLITUDE_CEILING, params.fxWarpAmplitude),
      });
    } catch (error) {
      console.error("Failed to load marginal growth cache", error);
    }
  }

  private applyScale(): void {
    this.scale.set(this.params.renderScale);
  }

  private applyRenderStyle(): void {
    this.alpha = 1;
    this.tint = this.params.renderTint;
    this.branchBlurFilter.strength = this.params.renderBlur * this.cameraScale;
    const blur = this.params.renderBlur > 0;
    if (blur !== this.blurFiltersActive) {
      this.ribbonMesh.filters = (blur ? this.blurFilters : null) as unknown as BlurFilter[];
      this.blurFiltersActive = blur;
    }
  }

  private decayPulses(now: number): void {
    const pulses = this.effectUniforms.uniforms.uPulses;
    const duration = this.params.fxPulseDuration * 1000;
    let highWater = 0;
    for (let slot = 0; slot < PULSE_SLOT_COUNT; slot++) {
      if (!this.pulseSlotInUse[slot]) continue;
      const started = pulses[slot * 4 + 2];
      if (now - started > duration) this.pulseSlotInUse[slot] = 0;
      else highWater = slot + 1;
    }
    if (highWater !== this.pulseHighWater) {
      this.pulseHighWater = highWater;
      this.effectUniforms.uniforms.uActivePulseCount = highWater;
    }
  }

  private effectiveParams(): MarginalGrowthParams {
    let params = this.owned ? applyOwnedEffects(this.params, this.owned) : this.params;
    if (Object.keys(this.accents).length > 0) params = applyAccentColors(params, this.accents);
    return params;
  }

  private pushEffectParams(): void {
    const uniforms = this.effectUniforms.uniforms;
    const params = this.effectiveParams();
    uniforms.uRenderOpacity = params.renderOpacity;
    uniforms.uLineWidth = params.lineWidth;
    uniforms.uIconOpacity = params.iconOpacity;
    uniforms.uCircleOpacity = params.circleOpacity;
    uniforms.uPulseSpeed = params.fxPulseSpeed;
    uniforms.uPulseBand = params.fxPulseBand;
    uniforms.uPulseDuration = params.fxPulseDuration;
    uniforms.uPulseBrightness = params.fxPulseBrightness;
    uniforms.uFlowEnabled = params.fxFlowEnabled;
    uniforms.uFlowSpeed = params.fxFlowSpeed;
    uniforms.uFlowSpacing = params.fxFlowSpacing;
    uniforms.uFlowWidth = params.fxFlowWidth;
    uniforms.uFlowBrightness = params.fxFlowBrightness;
    uniforms.uBreathEnabled = params.fxBreathEnabled;
    uniforms.uBreathFrequency = params.fxBreathFrequency;
    uniforms.uBreathAmplitude = params.fxBreathAmplitude;
    uniforms.uTipGlowEnabled = params.fxTipGlowEnabled;
    uniforms.uTipGlowDecay = params.fxTipGlowDecay;
    uniforms.uTipGlowBoost = params.fxTipGlowBoost;
    uniforms.uTwinkleEnabled = params.fxTwinkleEnabled;
    uniforms.uTwinkleFrequency = params.fxTwinkleFrequency;
    uniforms.uTwinkleAmplitude = params.fxTwinkleAmplitude;
    uniforms.uLayerSplitEnabled = params.fxLayerSplitEnabled;
    uniforms.uSwayEnabled = params.fxSwayEnabled;
    uniforms.uSwayAmplitude = params.fxSwayAmplitude;
    uniforms.uSwayFrequency = params.fxSwayFrequency;
    uniforms.uSwayChainMax = params.fxSwayChainMax;
    uniforms.uSwayMinBranchLen = params.fxSwayMinBranchLen;
    uniforms.uSwayIconScale = params.fxSwayIconScale;
    uniforms.uSwayCircleScale = params.fxSwayCircleScale;
    writeRgb(uniforms.uCircleColor, params.fxCircleColor);
    writeRgb(uniforms.uIconColor, params.fxIconColor);
    uniforms.uQuantumPresence = params.fxQuantumPresence;
    uniforms.uQuantumCarrierHz = params.fxQuantumCarrierHz;
    uniforms.uQuantumCollapsePeriodMs = params.fxQuantumCollapsePeriodMs;
    uniforms.uQuantumCollapseHalfWidthMs = params.fxQuantumCollapseHalfWidthMs;
    writeRgb(uniforms.uQuantumColor, params.fxQuantumColor);
    uniforms.uHivePresence = params.fxHivePresence;
    uniforms.uHivePulseHz = params.fxHivePulseHz;
    uniforms.uHiveInterferenceScale = params.fxHiveInterferenceScale;
    uniforms.uHiveDoubleBeat = params.fxHiveDoubleBeat;
    uniforms.uHiveRimBoost = params.fxHiveRimBoost;
    writeRgb(uniforms.uHiveColor, params.fxHiveColor);
    uniforms.uOrbitalPresence = params.fxOrbitalPresence;
    uniforms.uOrbitalDashRate = params.fxOrbitalDashRate;
    writeRgb(uniforms.uOrbitalColor, params.fxOrbitalColor);
    uniforms.uWarpAmplitude = params.fxWarpAmplitude;
    writeRgb(uniforms.uWarpColor, params.fxWarpColor);
    uniforms.uEschatonPresence = params.fxEschatonPresence;
    uniforms.uEschatonBeamCount = params.fxEschatonBeamCount;
    uniforms.uEschatonBeamWidth = params.fxEschatonBeamWidth;
    uniforms.uEschatonBeamSpeed = params.fxEschatonBeamSpeed;
    uniforms.uEschatonHalo = params.fxEschatonHalo;
    uniforms.uEschatonFlashPeriod = params.fxEschatonFlashPeriod;
    uniforms.uEschatonFlashStrength = params.fxEschatonFlashStrength;
    writeRgb(uniforms.uEschatonColor, params.fxEschatonColor);
  }

  private pushDebugFilter(): void {
    const uniforms = this.effectUniforms.uniforms;
    uniforms.uDebugMainOnly = this.debugFilter === "main" ? 1 : 0;
    uniforms.uDebugSideOnly = this.debugFilter === "side" ? 1 : 0;
  }
}

export interface MarginalGrowthAppOptions {
  params: MarginalGrowthParams;
  shape?: MarginalGrowthShape;
  worldSize?: number;
  cameraClamp?: ResolvedCameraClamp;
  backgroundColor?: number;
  onCameraTransform?: (transform: RibbonCameraTransform) => void;
  onTap?: () => void;
}

export interface MarginalGrowthApp {
  app: Application;
  ribbon: MarginalGrowthRibbon;
  destroy: () => void;
  setCameraClamp: (clamp: ResolvedCameraClamp) => void;
  setBackgroundColor: (color: number) => void;
  zoomAtClient: (clientX: number, clientY: number, deltaY: number) => void;
  panBy: (dx: number, dy: number) => void;
  recenter: () => void;
  setSuspended: (suspended: boolean) => void;
}

/**
 * Shipped `rt`, limited to the ribbon world and its camera.
 * Pass a host element (the canvas is appended) or an existing canvas.
 */
export async function createMarginalGrowthApp(
  target: HTMLCanvasElement | HTMLElement,
  options: MarginalGrowthAppOptions,
): Promise<MarginalGrowthApp> {
  const providedCanvas = target instanceof HTMLCanvasElement;
  const size = elementSize(target);
  const app = new Application();
  await app.init({
    ...(providedCanvas ? { canvas: target } : {}),
    width: size.width,
    height: size.height,
    preference: "webgl",
    antialias: false,
    background: 0,
    backgroundAlpha: 0.9,
    resolution: ribbonResolution(),
    autoDensity: true,
  });
  if (!providedCanvas) target.append(app.canvas);
  app.canvas.style.display = "block";
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";

  const world = new Container();
  world.eventMode = "none";
  world.interactiveChildren = false;
  app.stage.addChild(world);
  const ribbon = new MarginalGrowthRibbon(options.worldSize ?? MARGINAL_GROWTH_WORLD_SIZE, options.params, {
    shape: options.shape,
  });
  world.addChild(ribbon);
  const camera = new RibbonCamera(app, world, options.onCameraTransform, options.onTap);
  if (options.cameraClamp) camera.setClamp(options.cameraClamp);
  if (options.backgroundColor !== undefined) app.renderer.background.color = options.backgroundColor;

  let destroyed = false;
  let appliedWidth = size.width;
  let appliedHeight = size.height;
  let sizeDirty = false;
  let lastSizePollMs = 0;

  const syncSize = () => {
    if (destroyed) return;
    sizeDirty = false;
    const next = elementSize(target);
    if (next.width === appliedWidth && next.height === appliedHeight) return;
    appliedWidth = next.width;
    appliedHeight = next.height;
    app.renderer.resize(next.width, next.height, ribbonResolution());
    camera.onResize();
  };
  const onResizeSignal = () => {
    sizeDirty = true;
    syncSize();
  };
  const tick = () => {
    if (destroyed) return;
    const now = performance.now();
    if (sizeDirty || now - lastSizePollMs >= SIZE_POLL_MS) {
      lastSizePollMs = now;
      syncSize();
    }
    ribbon.setCameraScale(world.scale.x);
    ribbon.tick();
  };
  const resizeObserver = new ResizeObserver(onResizeSignal);
  resizeObserver.observe(target);
  window.addEventListener("resize", onResizeSignal);
  app.ticker.add(tick);

  return {
    app,
    ribbon,
    setCameraClamp(clamp) {
      camera.setClamp(clamp);
    },
    setBackgroundColor(color) {
      app.renderer.background.color = color;
    },
    zoomAtClient(clientX, clientY, deltaY) {
      camera.zoomAtClient(clientX, clientY, deltaY);
    },
    panBy(dx, dy) {
      camera.panBy(dx, dy);
    },
    recenter() {
      camera.recenter();
    },
    setSuspended(suspended) {
      if (destroyed) return;
      if (suspended) app.ticker.stop();
      else {
        syncSize();
        app.ticker.start();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResizeSignal);
      app.ticker.remove(tick);
      camera.destroy();
      app.destroy(!providedCanvas, { children: true, texture: true });
    },
  };
}
