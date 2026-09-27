import { create, type StoreApi, type UseBoundStore } from "zustand";
import {
  getIdleMarginalGrowthPhase,
  getIdleMarginalGrowthSteps,
} from "../apps/idle-economy";
import type { IdleGeneratorDefinition } from "../apps/idle";

export type MarginalGrowthParams = Record<string, number> & { steps: number };

export interface MarginalGrowthCameraClamp {
  minScaleNear: number;
  minScaleFar: number;
  maxScale: number;
  panWorldNear: number;
  panWorldFar: number;
}

export interface ResolvedCameraClamp {
  minScale: number;
  maxScale: number;
  panWorld: number;
}

export interface MarginalGrowthDefaults {
  params: MarginalGrowthParams;
  kRef: number;
  exponent: number;
  stepOffset: number;
  cameraClamp?: MarginalGrowthCameraClamp;
}

export interface MarginalGrowthState {
  params: MarginalGrowthParams;
  source: string;
  kRef: number;
  exponent: number;
  stepOffset: number;
  phase: number;
  cameraClamp: MarginalGrowthCameraClamp;
  setParam: (key: string, value: number) => void;
  setParams: (update: (params: MarginalGrowthParams) => MarginalGrowthParams) => void;
  setSource: (source: string) => void;
  setKRef: (value: number) => void;
  setExponent: (value: number) => void;
  setStepOffset: (value: number) => void;
  setPhase: (value: number) => void;
  setCameraClampField: (key: keyof MarginalGrowthCameraClamp, value: number) => void;
  restart: () => void;
  reset: () => void;
}

export const DEFAULT_MARGINAL_GROWTH_CAMERA_CLAMP: MarginalGrowthCameraClamp = {
  minScaleNear: 1,
  minScaleFar: 0.7,
  maxScale: 1.5,
  panWorldNear: 50,
  panWorldFar: 150,
};

/** Shipped autoplay rate (`marginalGrowthStore` export `M`): steps per second. */
export const MARGINAL_GROWTH_AUTOPLAY_STEPS_PER_SECOND = 60;

/**
 * The shipped marginalGrowthStore defaults. NormalApp exports av/aw/ax supply
 * stepOffset 90 / exponent 6 / kRef 410, and every parameter value is
 * byte-for-byte the store chunk's `f` table.
 */
export const DEFAULT_MARGINAL_GROWTH: MarginalGrowthDefaults = {
  kRef: 410,
  exponent: 6,
  stepOffset: 90,
  params: {
    steps: 497,
    maxSteps: 700,
    attractionDistance: 30,
    killDistance: 5,
    segmentLength: 5,
    jitter: 0.1,
    circleScale: 1.5,
    lineWidth: 1.5,
    iconOpacity: 1,
    circleOpacity: 0.5,
    renderScale: 1,
    renderOpacity: 0.25,
    renderTint: 16777215,
    renderBlur: 0,
    seed: 71237,
    fxPulseSpeed: 1620,
    fxPulseBand: 104,
    fxPulseDuration: 1.2,
    fxPulseBrightness: 1.5,
    fxFlowEnabled: 1,
    fxFlowSpeed: 120,
    fxFlowSpacing: 615,
    fxFlowWidth: 18,
    fxFlowBrightness: 0.8,
    fxBreathEnabled: 1,
    fxBreathFrequency: 0.25,
    fxBreathAmplitude: 0.13,
    fxTipGlowEnabled: 1,
    fxTipGlowDecay: 3,
    fxTipGlowBoost: 2.2,
    fxTwinkleEnabled: 0,
    fxTwinkleFrequency: 0.2,
    fxTwinkleAmplitude: 0.07,
    fxLayerSplitEnabled: 1,
    fxCircleColor: 1793874,
    fxIconColor: 8053503,
    fxSwayEnabled: 1,
    fxSwayAmplitude: 2,
    fxSwayFrequency: 0.3,
    fxSwayChainMax: 800,
    fxSwayMinBranchLen: 200,
    fxSwayIconScale: 0.6,
    fxSwayCircleScale: 1,
    fxQuantumPresence: 0,
    fxQuantumCarrierHz: 0,
    fxQuantumCollapsePeriodMs: 0,
    fxQuantumCollapseHalfWidthMs: 1,
    fxQuantumColor: 0,
    fxHivePresence: 0,
    fxHivePulseHz: 0,
    fxHiveInterferenceScale: 0,
    fxHiveDoubleBeat: 0,
    fxHiveRimBoost: 0,
    fxHiveColor: 0,
    fxOrbitalPresence: 0,
    fxOrbitalDashRate: 0,
    fxOrbitalColor: 0,
    fxWarpAmplitude: 0,
    fxWarpColor: 0,
    fxEschatonPresence: 0,
    fxEschatonBeamCount: 0,
    fxEschatonBeamWidth: 0,
    fxEschatonBeamSpeed: 0,
    fxEschatonHalo: 0,
    fxEschatonFlashPeriod: 0,
    fxEschatonFlashStrength: 0,
    fxEschatonColor: 0,
  },
};

export function resolveMarginalGrowthCameraClamp(
  clamp: MarginalGrowthCameraClamp,
  progress: number,
): ResolvedCameraClamp {
  const t = Math.min(1, Math.max(0, progress));
  const interpolate = (near: number, far: number) => near + (far - near) * t;
  const maxScale = Math.max(clamp.maxScale, 0.05);

  return {
    minScale: Math.min(
      Math.max(interpolate(clamp.minScaleNear, clamp.minScaleFar), 0.01),
      maxScale,
    ),
    maxScale,
    panWorld: Math.max(interpolate(clamp.panWorldNear, clamp.panWorldFar), 0),
  };
}

/**
 * Reconstructed Zustand state behavior from the shipped marginalGrowthStore
 * chunk. Three initial scalar values and the large visual-parameter table are
 * supplied explicitly because their owning defaults still live in NormalApp.
 * This keeps the recovered state exact without inventing hidden constants.
 */
export function createMarginalGrowthStore(
  defaults: MarginalGrowthDefaults,
): UseBoundStore<StoreApi<MarginalGrowthState>> {
  const initialParams = { ...defaults.params };
  const initialCameraClamp = {
    ...(defaults.cameraClamp ?? DEFAULT_MARGINAL_GROWTH_CAMERA_CLAMP),
  };

  return create<MarginalGrowthState>()((set) => ({
    params: { ...initialParams },
    source: "owned",
    kRef: defaults.kRef,
    exponent: defaults.exponent,
    stepOffset: defaults.stepOffset,
    phase: 0,
    cameraClamp: { ...initialCameraClamp },

    setParam: (key, value) =>
      set((state) => ({ params: { ...state.params, [key]: value } })),
    setParams: (update) => set((state) => ({ params: update(state.params) })),
    setSource: (source) => set({ source }),
    setKRef: (kRef) => set({ kRef }),
    setExponent: (exponent) => set({ exponent }),
    setStepOffset: (stepOffset) => set({ stepOffset }),
    setPhase: (phase) => set({ phase }),
    setCameraClampField: (key, value) =>
      set((state) => ({ cameraClamp: { ...state.cameraClamp, [key]: value } })),
    restart: () => set((state) => ({ params: { ...state.params, steps: 0 } })),
    reset: () =>
      set({
        params: { ...initialParams },
        kRef: defaults.kRef,
        exponent: defaults.exponent,
        stepOffset: defaults.stepOffset,
        cameraClamp: { ...initialCameraClamp },
      }),
  }));
}

/** The live generator economy the ribbon reads; the Idle runtime engine. */
export interface MarginalGrowthEconomy {
  snapshot(): {
    state: { owned: Readonly<Record<string, number>> };
    generators: readonly IdleGeneratorDefinition[];
  };
  subscribe(listener: () => void): () => void;
}

/**
 * Shipped owned-mode effect (`IdleScreen-DCDB640k.js:3193`): the ribbon follows
 * the generator economy, so phase and steps are recomputed from owned counts.
 * Rebinds on the same inputs the shipped `useEffect` depends on, which is why
 * `restart()` (a bare `params.steps` write) is not undone here.
 *
 * `autoplay` advances `steps` from IdleScreen at
 * MARGINAL_GROWTH_AUTOPLAY_STEPS_PER_SECOND, matching the shipped loop.
 */
export function bindMarginalGrowthEconomy(
  store: UseBoundStore<StoreApi<MarginalGrowthState>>,
  economy: MarginalGrowthEconomy,
): () => void {
  const sync = () => {
    const { kRef, exponent, stepOffset, source } = store.getState();
    if (source !== "owned") return;
    const { state, generators } = economy.snapshot();
    const phase = getIdleMarginalGrowthPhase({
      generators,
      owned: state.owned,
      kRef,
      exponent,
    });
    const steps = getIdleMarginalGrowthSteps({
      phase,
      stepOffset,
      maxSteps: store.getState().params.maxSteps,
    });
    store.setState((current) =>
      current.phase === phase && current.params.steps === steps
        ? current
        : { phase, params: { ...current.params, steps } },
    );
  };
  const unsubscribeEconomy = economy.subscribe(sync);
  const unsubscribeStore = store.subscribe((state, previous) =>
    state.source !== previous.source ||
    state.kRef !== previous.kRef ||
    state.exponent !== previous.exponent ||
    state.stepOffset !== previous.stepOffset ||
    state.params.maxSteps !== previous.params.maxSteps
      ? sync()
      : undefined,
  );
  sync();
  return () => {
    unsubscribeEconomy();
    unsubscribeStore();
  };
}
