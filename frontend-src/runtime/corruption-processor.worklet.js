/** Source-owned FFT, spectral and time-domain voice processor recovered from the authorized shipped worklet. */
const workletGlobal = globalThis,
  SAMPLE_RATE = workletGlobal.sampleRate ?? 32e3,
  FFT_SIZE = 1024,
  HOP_SIZE = 256,
  HISTORY_SIZE = 32768,
  HISTORY_MASK = HISTORY_SIZE - 1,
  FADE_SAMPLES = Math.max(8, Math.round(0.0015 * SAMPLE_RATE)),
  MAX_STUTTER_SECONDS = 0.8,
  OVERLAP_GAIN = HOP_SIZE / (0.5 * FFT_SIZE);
function fft(i, t, o = !1) {
  const e = i.length;
  for (let s = 1, n = 0; s < e; s++) {
    let r = e >> 1;
    for (; n & r; r >>= 1) n ^= r;
    if (((n ^= r), s < n)) {
      const c = i[s];
      ((i[s] = i[n]), (i[n] = c));
      const h = t[s];
      ((t[s] = t[n]), (t[n] = h));
    }
  }
  for (let s = 2; s <= e; s <<= 1) {
    const n = ((2 * Math.PI) / s) * (o ? 1 : -1),
      r = Math.cos(n),
      c = Math.sin(n);
    for (let h = 0; h < e; h += s) {
      let f = 1,
        p = 0;
      for (let u = 0; u < s / 2; u++) {
        const S = i[h + u],
          m = t[h + u],
          b = i[h + u + s / 2] * f - t[h + u + s / 2] * p,
          F = i[h + u + s / 2] * p + t[h + u + s / 2] * f;
        ((i[h + u] = S + b),
          (t[h + u] = m + F),
          (i[h + u + s / 2] = S - b),
          (t[h + u + s / 2] = m - F));
        const A = f * r - p * c;
        ((p = f * c + p * r), (f = A));
      }
    }
  }
  if (o) for (let s = 0; s < e; s++) ((i[s] /= e), (t[s] /= e));
}
function hannWindow(i) {
  const t = new Float32Array(i);
  for (let o = 0; o < i; o++)
    t[o] = 0.5 * (1 - Math.cos((2 * Math.PI * o) / i));
  return t;
}
function robotSpectrum(i, t) {
  fft(i, t);
  for (let o = 0; o < i.length; o++)
    ((i[o] = Math.hypot(i[o], t[o])), (t[o] = 0));
  fft(i, t, !0);
}
function whisperSpectrum(i, t, o = Math.random) {
  fft(i, t);
  const e = i.length;
  for (let s = 1; s < e / 2; s++) {
    const n = Math.hypot(i[s], t[s]),
      r = o() * 2 * Math.PI;
    ((i[s] = n * Math.cos(r)),
      (t[s] = n * Math.sin(r)),
      (i[e - s] = i[s]),
      (t[e - s] = -t[s]));
  }
  ((i[0] = Math.hypot(i[0], t[0])),
    (t[0] = 0),
    (i[e / 2] = Math.hypot(i[e / 2], t[e / 2])),
    (t[e / 2] = 0),
    fft(i, t, !0));
}
const DEFAULT_CONFIG = {
    bypass: !0,
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
  },
  ProcessorBase =
    workletGlobal.AudioWorkletProcessor ??
    class {
      port = {
        onmessage: null,
        postMessage: () => {},
      };
    };
function randomBetween(i, t, o) {
  return t + i() * (o - t);
}
class CorruptionProcessor extends ProcessorBase {
  cfg = {
    ...DEFAULT_CONFIG,
  };
  rand = Math.random;
  hist = new Float32Array(HISTORY_SIZE);
  histW = 0;
  mode = "normal";
  countdown = 1 / 0;
  stutAnchor = 0;
  stutLen = 0;
  stutReps = 0;
  stutRep = 0;
  stutSpeed = 1;
  stutPos = 0;
  dropTotal = 0;
  dropElapsed = 0;
  burstLeft = 0;
  decimCount = 0;
  held = 0;
  win = hannWindow(FFT_SIZE);
  inWin = new Float32Array(FFT_SIZE);
  hopBuf = new Float32Array(HOP_SIZE);
  hopFill = 0;
  warm = 0;
  outRing = new Float32Array(2 * FFT_SIZE);
  outPos = 0;
  re = new Float32Array(FFT_SIZE);
  im = new Float32Array(FFT_SIZE);
  dryDelay = new Float32Array(FFT_SIZE);
  dryPos = 0;
  constructor() {
    (super(),
      (this.port.onmessage = (t) => {
        const o = t.data;
        o?.type === "config" && o.config && this.applyConfig(o.config);
      }));
  }
  applyConfig(t) {
    if (
      ((this.cfg = {
        ...this.cfg,
        ...t,
      }),
      this.cfg.bypass)
    ) {
      this.resetTransientState();
      return;
    }
    this.countdown = this.drawCountdown();
  }
  resetTransientState() {
    ((this.mode = "normal"),
      this.hist.fill(0),
      (this.histW = 0),
      (this.countdown = 1 / 0),
      (this.burstLeft = 0),
      (this.decimCount = 0),
      (this.hopFill = 0),
      (this.warm = 0),
      this.inWin.fill(0),
      this.outRing.fill(0),
      (this.outPos = 0),
      this.dryDelay.fill(0),
      (this.dryPos = 0));
  }
  totalEventRate() {
    return this.cfg.stutterRate + this.cfg.dropoutRate + this.cfg.burstRate;
  }
  drawCountdown() {
    const t = this.totalEventRate();
    return t <= 0
      ? 1 / 0
      : Math.max(1, Math.round((-Math.log(1 - this.rand()) / t) * SAMPLE_RATE));
  }
  startEvent() {
    const t = this.cfg,
      o = this.rand() * this.totalEventRate();
    if (o < t.stutterRate) {
      if (
        ((this.stutLen = Math.min(
          Math.round(
            randomBetween(this.rand, t.stutterMinS, t.stutterMaxS) *
              SAMPLE_RATE,
          ),
          HISTORY_SIZE / 2,
        )),
        this.stutLen < 16)
      )
        return;
      for (
        this.stutSpeed =
          t.stutterSpeeds[Math.floor(this.rand() * t.stutterSpeeds.length)] ||
          1,
          this.stutReps =
            t.stutterRepsMin +
            Math.floor(this.rand() * (t.stutterRepsMax - t.stutterRepsMin + 1));
        this.stutReps > 2 &&
        (this.stutLen * this.stutReps) / this.stutSpeed >
          MAX_STUTTER_SECONDS * SAMPLE_RATE;
      )
        this.stutReps--;
      ((this.stutAnchor = this.histW),
        (this.stutPos = 0),
        (this.stutRep = 0),
        (this.mode = "stutter"));
      return;
    }
    if (o < t.stutterRate + t.dropoutRate) {
      ((this.dropTotal =
        Math.round(
          randomBetween(this.rand, t.dropoutMinS, t.dropoutMaxS) * SAMPLE_RATE,
        ) +
        2 * FADE_SAMPLES),
        (this.dropElapsed = 0),
        (this.mode = "dropout"));
      return;
    }
    this.burstLeft = Math.round(
      randomBetween(this.rand, t.burstMinS, t.burstMaxS) * SAMPLE_RATE,
    );
  }
  readStutter() {
    const t = this.stutAnchor - this.stutLen + this.stutPos,
      o = Math.floor(t),
      e = t - o,
      s = this.hist[o & HISTORY_MASK],
      n = this.hist[(o + 1) & HISTORY_MASK],
      r = s + (n - s) * e;
    return (
      (this.stutPos += this.stutSpeed),
      this.stutPos >= this.stutLen &&
        ((this.stutPos -= this.stutLen),
        this.stutRep++,
        this.stutRep >= this.stutReps &&
          ((this.mode = "normal"), (this.countdown = this.drawCountdown()))),
      r
    );
  }
  dropoutGain() {
    const t = this.dropElapsed++;
    if (
      (this.dropElapsed >= this.dropTotal &&
        ((this.mode = "normal"), (this.countdown = this.drawCountdown())),
      t < FADE_SAMPLES)
    )
      return 1 - t / FADE_SAMPLES;
    const o = this.dropTotal - t;
    return o < FADE_SAMPLES ? 1 - o / FADE_SAMPLES : 0;
  }
  timeDomain(t) {
    ((this.hist[this.histW & HISTORY_MASK] = t), this.histW++);
    let o;
    this.mode === "stutter"
      ? (o = this.readStutter())
      : this.mode === "dropout"
        ? (o = t * this.dropoutGain())
        : ((o = t),
          --this.countdown <= 0 &&
            (this.startEvent(),
            this.mode === "normal" && (this.countdown = this.drawCountdown())));
    const e = this.burstLeft > 0 ? this.cfg.burstHold : this.cfg.decimHold;
    return (
      this.burstLeft > 0 && this.burstLeft--,
      e > 1 &&
        (this.decimCount <= 0 && ((this.held = o), (this.decimCount = e)),
        (o = this.held),
        this.decimCount--),
      o
    );
  }
  processFrame() {
    for (let t = 0; t < FFT_SIZE; t++)
      ((this.re[t] = this.inWin[t] * this.win[t]), (this.im[t] = 0));
    this.cfg.spectral === "robot"
      ? robotSpectrum(this.re, this.im)
      : whisperSpectrum(this.re, this.im, this.rand);
    for (let t = 0; t < FFT_SIZE; t++)
      this.outRing[(this.outPos + t) % (2 * FFT_SIZE)] +=
        this.re[t] * OVERLAP_GAIN;
  }
  spectralPush(t) {
    const o = this.dryDelay[this.dryPos];
    ((this.dryDelay[this.dryPos] = t),
      (this.dryPos = (this.dryPos + 1) % FFT_SIZE),
      (this.hopBuf[this.hopFill++] = t),
      this.hopFill === HOP_SIZE &&
        ((this.hopFill = 0),
        this.inWin.copyWithin(0, HOP_SIZE),
        this.inWin.set(this.hopBuf, FFT_SIZE - HOP_SIZE),
        (this.warm += HOP_SIZE),
        this.warm >= FFT_SIZE && this.processFrame()));
    const e = this.outRing[this.outPos];
    ((this.outRing[this.outPos] = 0),
      (this.outPos = (this.outPos + 1) % (2 * FFT_SIZE)));
    const s = this.cfg.spectralMix;
    return e * s + o * (1 - s);
  }
  process(t, o) {
    const e = t[0]?.[0],
      s = o[0]?.[0];
    if (!s) return !0;
    if (this.cfg.bypass) return (e ? s.set(e) : s.fill(0), !0);
    const n = this.cfg.spectral !== "off";
    for (let r = 0; r < s.length; r++) {
      let c = this.timeDomain(e ? e[r] : 0);
      (n && (c = this.spectralPush(c)), (s[r] = c));
    }
    return !0;
  }
}
workletGlobal.registerProcessor?.("corruption-processor", CorruptionProcessor);
