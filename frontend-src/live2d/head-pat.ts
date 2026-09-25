export interface HeadPatTuning {
  requiredMs: number;
  horizontalDominance: number;
  minSpeedX: number;
  maxSampleGapMs: number;
  skullTopBand: number;
  leashHeadWidths: number;
  vxToYawDeg: number;
  maxYawDeg: number;
  rollPerYaw: number;
  pressPitchDeg: number;
  springStiffness: number;
  springDamping: number;
  strokeSmoothTau: number;
  strokeReleaseTau: number;
  soundLevel: number;
  soundFreqScale: number;
  soundBodyGain: number;
}

export const HEAD_PAT_DEFAULT_TUNING: Readonly<HeadPatTuning> = Object.freeze({
  requiredMs: 1_000, horizontalDominance: 1, minSpeedX: 0.05,
  maxSampleGapMs: 250, skullTopBand: 0.6, leashHeadWidths: 0.75,
  vxToYawDeg: 7, maxYawDeg: 14, rollPerYaw: 0.6, pressPitchDeg: -12.5,
  springStiffness: 70, springDamping: 9, strokeSmoothTau: 0.08,
  strokeReleaseTau: 0.3, soundLevel: 0.05, soundFreqScale: 0.4,
  soundBodyGain: 0.5,
});

export type HeadPatPointerPhase =
  | ""
  | "start"
  | "move"
  | "end"
  | "cancel"
  | "lost";

export const HEAD_PAT_TUNING_RANGES: Readonly<Record<keyof HeadPatTuning, { min: number; max: number; step: number }>> = Object.freeze({
  requiredMs: { min: 500, max: 8_000, step: 100 },
  horizontalDominance: { min: 0, max: 3, step: 0.1 },
  minSpeedX: { min: 0, max: 1, step: 0.01 },
  maxSampleGapMs: { min: 50, max: 1_000, step: 10 },
  skullTopBand: { min: 0.1, max: 1, step: 0.05 },
  leashHeadWidths: { min: 0, max: 3, step: 0.05 },
  vxToYawDeg: { min: 0, max: 30, step: 0.5 },
  maxYawDeg: { min: 0, max: 30, step: 0.5 },
  rollPerYaw: { min: -2, max: 2, step: 0.05 },
  pressPitchDeg: { min: -15, max: 0, step: 0.5 },
  springStiffness: { min: 5, max: 300, step: 5 },
  springDamping: { min: 1, max: 40, step: 0.5 },
  strokeSmoothTau: { min: 0.01, max: 0.5, step: 0.01 },
  strokeReleaseTau: { min: 0.05, max: 2, step: 0.05 },
  soundLevel: { min: 0, max: 1, step: 0.05 },
  soundFreqScale: { min: 0.3, max: 1.5, step: 0.05 },
  soundBodyGain: { min: 0, max: 1, step: 0.05 },
});

/** Head-width normalized gesture sampling, independent of the renderer. */
export class HeadPat {
  private sample: { time: number; x: number; y: number } | null = null;
  private fired = false;
  progress = 0;
  velocity = 0;
  pressing = false;
  completions = 0;
  enabled = true;
  armed = false;
  lastPhase: HeadPatPointerPhase = "";
  lastPattable = false;
  lastOnSurface = false;
  lastInZone = false;
  lastModelX = 0;
  lastModelY = 0;
  private tuningValue: HeadPatTuning = { ...HEAD_PAT_DEFAULT_TUNING };
  tuning() { return { ...this.tuningValue }; }
  setTuning(patch: Partial<HeadPatTuning>) {
    for (const key of Object.keys(patch) as Array<keyof HeadPatTuning>) {
      const value = patch[key], range = HEAD_PAT_TUNING_RANGES[key];
      if (typeof value === "number" && Number.isFinite(value))
        this.tuningValue[key] = Math.min(range.max, Math.max(range.min, value));
    }
  }
  resetTuning() { this.tuningValue = { ...HEAD_PAT_DEFAULT_TUNING }; }
  observePointer(
    phase: HeadPatPointerPhase,
    pattable: boolean,
    onSurface: boolean,
    inZone: boolean,
    modelX: number,
    modelY: number,
  ) {
    this.lastPhase = phase;
    this.lastPattable = pattable;
    if (phase === "start") this.lastOnSurface = onSurface;
    this.lastInZone = inZone;
    if (Number.isFinite(modelX)) this.lastModelX = modelX;
    if (Number.isFinite(modelY)) this.lastModelY = modelY;
    if (
      pattable &&
      inZone &&
      (phase === "start" || phase === "move")
    )
      this.armed = true;
  }
  start(time: number, x: number, y: number) {
    this.end();
    if (!this.enabled || ![time, x, y].every(Number.isFinite)) return;
    this.sample = { time, x, y };
  }
  move(time: number, x: number, y: number) {
    const previous = this.sample;
    if (!this.enabled || !previous || ![time, x, y].every(Number.isFinite)) return false;
    const dt = time - previous.time, dx = x - previous.x, dy = y - previous.y;
    if (dt <= 0) return false;
    this.sample = { time, x, y };
    const tuning = this.tuningValue;
    this.pressing = dt > 0 && dt <= tuning.maxSampleGapMs && Math.abs(dx) >= tuning.horizontalDominance * Math.abs(dy) && Math.abs(dx * 1000 / dt) >= tuning.minSpeedX;
    if (!this.pressing) { this.velocity = 0; return false; }
    const weight = Math.max(.05, 1 - Math.exp(-dt / (tuning.strokeSmoothTau * 1_000)));
    this.velocity += (dx * 1000 / dt - this.velocity) * weight;
    this.progress = Math.min(tuning.requiredMs, this.progress + dt);
    if (this.progress < tuning.requiredMs || this.fired) return false;
    this.fired = true;
    this.completions += 1;
    return true;
  }
  end() {
    this.sample = null;
    this.pressing = false;
    this.progress = 0;
    this.fired = false;
    this.velocity = 0;
    this.armed = false;
  }
}
