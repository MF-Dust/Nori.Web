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

/**
 * The shipped marginalGrowthStore defaults: NormalApp exports av/aw/ax supply
 * stepOffset 90 / exponent 6 / kRef 410, and every parameter value below is
 * byte-for-byte the store chunk's. Only the keys the source reads today are
 * listed; the remaining render keys arrive with the render path.
 */
export const DEFAULT_MARGINAL_GROWTH: MarginalGrowthDefaults = {
  kRef: 410,
  exponent: 6,
  stepOffset: 90,
  params: {
    steps: 497,
    maxSteps: 700,
    lineWidth: 1.5,
    renderScale: 1,
    renderOpacity: 0.25,
    renderBlur: 0,
    renderTint: 16777215,
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
 * ponytail: `autoplay` still does not advance steps; that requestAnimationFrame
 * loop lived in the unported IdleScreen component. Add it with the render path.
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
