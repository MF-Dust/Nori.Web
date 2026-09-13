export const CORRUPTION_PRESETS = [
  "unstable",
  "glitch",
  "robot",
  "ghost",
  "demon",
  "haywire",
] as const;
export type CorruptionPreset = (typeof CORRUPTION_PRESETS)[number];

/** Recovered NormalApp corruption parameters. */
function baseConfig() {
  return {
    decimHold: 1,
    stutterRate: 0,
    stutterMinS: 0.03,
    stutterMaxS: 0.12,
    stutterRepsMin: 2,
    stutterRepsMax: 4,
    stutterSpeeds: [1],
    dropoutRate: 0,
    dropoutMinS: 0.02,
    dropoutMaxS: 0.08,
    burstRate: 0,
    burstHold: 8,
    burstMinS: 0.04,
    burstMaxS: 0.15,
    spectral: "off",
    spectralMix: 1,
  };
}
export function corruptionPreset(t: CorruptionPreset, e: number) {
  const n = Number.isFinite(e) ? Math.max(0, Math.min(1, e)) : 0.7;
  switch (t) {
    case "unstable":
      return {
        wet: 1,
        shaper: { drive: 1.5 + 1.5 * n, quantLevels: Math.round(28 - 8 * n) },
        ring: { freqHz: 90 + 70 * n, depth: 0.08 + 0.12 * n },
        band: null,
        warble: { freqHz: 5 + 2 * n, depthS: 2e-4 + 6e-4 * n },
        reverb: { preset: "room", wetness: 0.3 },
        worklet: {
          ...baseConfig(),
          decimHold: Math.round(1.4 + 0.8 * n),
          spectral: "robot",
          spectralMix: 0.3 + 0.25 * n,
          stutterRate: 0.2 + 0.6 * n,
          stutterMinS: 0.03,
          stutterMaxS: 0.11,
          stutterRepsMin: 2,
          stutterRepsMax: 2 + Math.round(2 * n),
          stutterSpeeds: [1, 1, 1, 0.5, 1.6],
          dropoutRate: 0.08 + 0.4 * n,
          dropoutMinS: 0.02,
          dropoutMaxS: 0.07,
          burstRate: 0.12 + 0.35 * n,
          burstHold: 8 + Math.round(6 * n),
          burstMinS: 0.04,
          burstMaxS: 0.12 + 0.06 * n,
        },
      };
    case "glitch":
      return {
        wet: 1,
        shaper: null,
        ring: { freqHz: 100, depth: 0 },
        band: null,
        warble: { freqHz: 4, depthS: 0 },
        reverb: { preset: "room", wetness: 0.3 },
        worklet: {
          ...baseConfig(),
          stutterRate: 0.25 + 0.85 * n,
          stutterMinS: 0.03,
          stutterMaxS: 0.12,
          stutterRepsMin: 2,
          stutterRepsMax: 2 + Math.round(3 * n),
          stutterSpeeds: [1, 1, 1, 0.5, 1.6],
          dropoutRate: 0.1 + 0.5 * n,
          dropoutMinS: 0.02,
          dropoutMaxS: 0.08,
          burstRate: 0.15 + 0.45 * n,
          burstHold: 8 + Math.round(8 * n),
          burstMinS: 0.04,
          burstMaxS: 0.15 + 0.1 * n,
        },
      };
    case "robot":
      return {
        wet: 1,
        shaper: { drive: 2 + 3 * n, quantLevels: Math.round(24 - 12 * n) },
        ring: { freqHz: 160 + 190 * n, depth: 0.12 + 0.2 * n },
        band: null,
        warble: { freqHz: 4, depthS: 0 },
        reverb: { preset: "room", wetness: 0.3 },
        worklet: {
          ...baseConfig(),
          decimHold: Math.round(2 + 2 * n),
          spectral: "robot",
        },
      };
    case "ghost":
      return {
        wet: 0.75 + 0.2 * n,
        shaper: null,
        ring: { freqHz: 100, depth: 0 },
        band: { freqHz: 900 - 200 * n, q: 0.45 },
        warble: { freqHz: 2.5 + 1.5 * n, depthS: 8e-4 + 0.0018 * n },
        reverb: { preset: "room", wetness: 0.3 },
        worklet: { ...baseConfig(), spectral: "whisper" },
      };
    case "demon":
      return {
        wet: 0.5 + 0.5 * n,
        shaper: { drive: 1.5 + 10 * n, quantLevels: Math.round(26 - 18 * n) },
        ring: { freqHz: 38 + 42 * n, depth: 0.25 + 0.6 * n },
        band: { freqHz: 1400 - 350 * n, q: 0.7 + 1.3 * n },
        warble: { freqHz: 3.5 + 3.5 * n, depthS: 8e-4 + 0.003 * n },
        reverb: { preset: "room", wetness: 0.3 },
        worklet: baseConfig(),
      };
    case "haywire":
      return {
        wet: 1,
        shaper: { drive: 2 + 2 * n, quantLevels: Math.round(20 - 8 * n) },
        ring: { freqHz: 90 + 70 * n, depth: 0.18 + 0.22 * n },
        band: null,
        warble: { freqHz: 6 + 3 * n, depthS: 4e-4 + 0.0011 * n },
        reverb: { preset: "room", wetness: 0.3 },
        worklet: {
          ...baseConfig(),
          decimHold: Math.round(2 + 2 * n),
          spectral: "robot",
          stutterRate: 0.12 + 0.4 * n,
          stutterMinS: 0.03,
          stutterMaxS: 0.1,
          stutterRepsMin: 2,
          stutterRepsMax: 2 + Math.round(2 * n),
          stutterSpeeds: [1, 1, 0.5],
          dropoutRate: 0.05 + 0.3 * n,
          dropoutMinS: 0.02,
          dropoutMaxS: 0.06,
          burstRate: 0.1 + 0.3 * n,
          burstHold: 10,
          burstMinS: 0.04,
          burstMaxS: 0.12,
        },
      };
  }
}
export function corruptionCurve(t: number, e: number, n = 4097) {
  const r = new Float32Array(n),
    i = Math.tanh(t);
  for (let s = 0; s < n; s++) {
    const o = (s / (n - 1)) * 2 - 1,
      a = Math.tanh(t * o) / i;
    r[s] = Math.round(a * e) / e;
  }
  return r;
}
