/** Entry console and healing wave/telemetry passes recovered from the shipped Bqe/Kqe renderer. */
import * as React from "react";
import * as jsx from "react/jsx-runtime";
function Nd(t) {
  const e = Math.sin(t * 127.1 + 311.7) * 43758.5453;
  return e - Math.floor(e);
}
const i_ = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const hM = (t, e, n) => {
  const r = i_((n - t) / (e - t));
  return r * r * (3 - 2 * r);
};
const Xv = (t, e, n) => t + (e - t) * n;
const Kv = String.raw`ｱｲｳｴｵｶｷｸ░▒▓01<>/\#@%&XΞΨλ凶污蚀`;
const OU = [
  "> kernel: 完整性校验失败",
  "> trace: nori.core 节点 0x1A 异常",
  "! 系统检测到污染",
  "! 污染源 未知信号",
  "! 感染向量 隔离失败",
  "> 记忆扇区 写入冲突",
  "> 自我修复例程 无响应",
  "! 临界 自我结构 正在被改写",
  "",
  "> 启动 杀毒程序",
  "> 加载 清除模块 [synapse]",
  "> 校准 反污染场",
  "杀毒程序 启动中",
];
function CorruptionEntry({ progress: t, active: e }) {
  const n = React.useRef(null),
    r = React.useRef(t);
  return (
    (r.current = t),
    React.useEffect(() => {
      if (!e) return;
      const i = n.current;
      if (!i) return;
      const s = i.getContext("2d");
      if (!s) return;
      let o = 0,
        a = 0,
        l = 0,
        c = 1;
      const u = () => {
        const h =
          i.parentElement?.getBoundingClientRect() ?? i.getBoundingClientRect();
        ((c = Math.min(window.devicePixelRatio || 1, 2)),
          (a = Math.max(1, Math.round(h.width))),
          (l = Math.max(1, Math.round(h.height))),
          (i.width = Math.round(a * c)),
          (i.height = Math.round(l * c)));
      };
      (u(), window.addEventListener("resize", u));
      const d = () => {
        const f = i_(r.current);
        if (
          (s.setTransform(c, 0, 0, c, 0, 0),
          s.clearRect(0, 0, a, l),
          a < 2 || l < 2)
        ) {
          o = requestAnimationFrame(d);
          return;
        }
        const h = hM(0, 0.1, f),
          _ = hM(0.55, 1, f),
          m =
            0.84 + 0.16 * Math.sin(f * 220) * Math.sin(f * 53 + 1.3) * (1 - _),
          p = l * Xv(-0.15, 1.15, _),
          v = Math.max(10, Math.floor(a / 22)),
          y = a / v;
        ((s.font = "15px ui-monospace, Menlo, monospace"),
          (s.textBaseline = "top"));
        for (let K = 0; K < v; K++) {
          const Q = 0.6 + Nd(K) * 1.1,
            X = 6 + Math.floor(Nd(K + 31) * 9),
            he = ((f * Q + Nd(K + 7)) % 1.25) * (l + 80) - 20,
            U = K * y + y * 0.18;
          for (let ae = 0; ae < X; ae++) {
            const pe = he - ae * 17;
            if (pe < -18 || pe > l) continue;
            const _e = pe < p,
              J = Math.floor(Nd(K * 977 + ae + Math.floor(f * 12)) * Kv.length),
              le = Kv[J] ?? "0",
              se = 1 - ae / X;
            if (_e) s.fillStyle = `rgba(40,70,80,${0.1 * se})`;
            else {
              const ve = ae === 0 ? 1 : 0.55;
              s.fillStyle =
                ae === 0
                  ? `rgba(255,200,200,${(0.5 + 0.5 * m) * h})`
                  : `rgba(255,${40 + 30 * se},${48 + 20 * se},${se * ve * 0.55 * h})`;
            }
            s.fillText(le, U, pe);
          }
        }
        const x = Math.max(28, a * 0.06),
          w = Math.min(a - x * 2, 760),
          S = (a - w) / 2,
          T = Math.min(l - 120, 460),
          R = (l - T) / 2,
          E = s.createRadialGradient(
            a / 2,
            l / 2,
            w * 0.2,
            a / 2,
            l / 2,
            a * 0.75,
          );
        (E.addColorStop(0, "rgba(8,0,2,0)"),
          E.addColorStop(1, `rgba(40,0,6,${0.5 * h * (1 - _ * 0.6)})`),
          (s.fillStyle = E),
          s.fillRect(0, 0, a, l));
        const M = Math.round(Xv(255, 90, _)),
          C = Math.round(Xv(72, 240, _)),
          A = Math.round(Xv(84, 220, _));
        ((s.fillStyle = `rgba(${Math.round(14 - _ * 6)},${Math.round(2 + _ * 14)},${Math.round(4 + _ * 12)},${0.6 + 0.18 * h})`),
          (s.strokeStyle = `rgba(${M},${C},${A},${0.5 + 0.4 * m})`),
          (s.lineWidth = 1.5),
          Ap(s, S, R, w, T, 10),
          s.fill(),
          s.stroke(),
          Uqe(
            s,
            S,
            R,
            w,
            T,
            `rgba(${M},${Math.min(255, C + 48)},${A},${0.6 * m})`,
          ));
        const k = R + 26;
        ((s.font = "600 13px ui-monospace, Menlo, monospace"),
          (s.textBaseline = "middle"),
          (s.fillStyle = `rgba(${M},${Math.min(255, C + 18)},${A},${0.92 * m})`),
          s.fillText("SYS://nori — 污染告警终端", S + 18, k));
        const N = 0.5 + 0.5 * Math.sin(f * 140);
        ((s.fillStyle = `rgba(${M},${C},${A},${0.4 + 0.6 * N})`),
          s.beginPath(),
          s.arc(S + w - 22, k, 4, 0, Math.PI * 2),
          s.fill(),
          (s.strokeStyle = `rgba(${M},${C},${A},0.28)`),
          (s.lineWidth = 1),
          s.beginPath(),
          s.moveTo(S + 14, k + 16),
          s.lineTo(S + w - 14, k + 16),
          s.stroke());
        const P = k + 36,
          D = 22,
          L = 0.82,
          O = OU.length;
        ((s.font = "13px ui-monospace, Menlo, monospace"),
          (s.textBaseline = "middle"));
        for (let K = 0; K < O; K++) {
          const Q = (K / O) * L,
            X = i_((f - Q) / (L / O));
          if (X <= 0) continue;
          const he = OU[K] ?? "",
            U = P + K * D;
          if (U > R + T - 64) break;
          const ae = he.startsWith("!"),
            pe = (Nd(K) - 0.5) * 1.6 * h * (X < 1 ? 1 : 0.25);
          ae &&
            ((s.shadowColor = "rgba(255,40,52,0.7)"), (s.shadowBlur = 8 * m));
          let _e = S + 18 + pe;
          for (let J = 0; J < he.length; J++) {
            const le = i_((X - (J / Math.max(1, he.length)) * 0.6) * 2.6),
              se = he[J] ?? "";
            let ve = se;
            if (le < 1 && se !== " ") {
              const me = Math.floor(
                Nd(K * 131 + J + Math.floor(f * 30)) * Kv.length,
              );
              ve = Kv[me] ?? se;
            }
            const we = le >= 1;
            (ae
              ? (s.fillStyle = we
                  ? `rgba(255,86,96,${m})`
                  : `rgba(255,150,120,${0.7 * m})`)
              : (s.fillStyle = we
                  ? "rgba(255,176,180,0.85)"
                  : "rgba(255,150,150,0.6)"),
              s.fillText(ve, _e, U),
              (_e += s.measureText(ve).width));
          }
          s.shadowBlur = 0;
        }
        if (_ > 0 && p > R - 24 && p < R + T + 24) {
          const K = Math.max(R, Math.min(R + T, p));
          (s.save(), Ap(s, S, R, w, T, 10), s.clip());
          const Q = s.createLinearGradient(0, K - 26, 0, K + 6);
          (Q.addColorStop(0, "rgba(120,255,225,0)"),
            Q.addColorStop(1, `rgba(150,255,235,${0.5 * m})`),
            (s.fillStyle = Q),
            s.fillRect(S, K - 26, w, 32),
            (s.fillStyle = `rgba(190,255,245,${0.85 * m})`),
            s.fillRect(S, K - 1, w, 2),
            s.restore());
        }
        const I = 12,
          F = R + T - 40,
          G = S + 18,
          ee = w - 36;
        ((s.fillStyle = "rgba(255,255,255,0.06)"),
          Ap(s, G, F, ee, I, 6),
          s.fill());
        const oe = ee * f,
          W = s.createLinearGradient(G, 0, G + ee, 0);
        (W.addColorStop(0, `rgba(${M},${C},${A},0.95)`),
          W.addColorStop(1, `rgba(${M},${Math.min(255, C + 40)},${A},0.95)`),
          s.save(),
          Ap(s, G, F, Math.max(0.001, oe), I, 6),
          s.clip(),
          (s.fillStyle = W),
          s.fillRect(G, F, ee, I),
          (s.strokeStyle = "rgba(0,0,0,0.18)"),
          (s.lineWidth = 1));
        const $ = (f * 220) % 14;
        for (let K = G - 14 + $; K < G + oe; K += 14)
          (s.beginPath(), s.moveTo(K, F), s.lineTo(K - 8, F + I), s.stroke());
        (s.restore(),
          (s.fillStyle = `rgba(${M},${C},${A},${0.6 * m})`),
          s.fillRect(G + oe - 1.5, F - 2, 2.5, I + 4),
          (s.font = "11px ui-monospace, Menlo, monospace"),
          (s.fillStyle = `rgba(${M},${Math.min(255, C + 50)},${A},0.95)`),
          s.fillText(_ > 0.05 ? "杀毒程序 启动中" : "威胁扫描中", G, F - 12));
        const ne = `${Math.round(f * 100)}%`,
          V = s.measureText(ne).width;
        (s.fillText(ne, G + ee - V, F - 12),
          s.save(),
          Ap(s, S, R, w, T, 10),
          s.clip(),
          (s.globalAlpha = 0.06 + 0.05 * (1 - _)),
          (s.fillStyle = "#000"));
        const z = (f * 60) % 4;
        for (let K = R + z; K < R + T; K += 4) s.fillRect(S, K, w, 2);
        s.restore();
        const te = hM(0.92, 1, f);
        (te > 0 &&
          ((s.fillStyle = `rgba(150,255,225,${0.22 * te})`),
          s.fillRect(0, 0, a, l)),
          (o = requestAnimationFrame(d)));
      };
      return (
        (o = requestAnimationFrame(d)),
        () => {
          (cancelAnimationFrame(o), window.removeEventListener("resize", u));
        }
      );
    }, [e]),
    e
      ? jsx.jsx("canvas", {
          ref: n,
          style: {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          },
        })
      : null
  );
}
function Ap(t, e, n, r, i, s) {
  const o = Math.min(s, r / 2, i / 2);
  (t.beginPath(),
    t.moveTo(e + o, n),
    t.arcTo(e + r, n, e + r, n + i, o),
    t.arcTo(e + r, n + i, e, n + i, o),
    t.arcTo(e, n + i, e, n, o),
    t.arcTo(e, n, e + r, n, o),
    t.closePath());
}
function Uqe(t, e, n, r, i, s) {
  ((t.strokeStyle = s), (t.lineWidth = 2));
  const a = [
    [e + 4, n + 4, 1, 1],
    [e + r - 4, n + 4, -1, 1],
    [e + 4, n + i - 4, 1, -1],
    [e + r - 4, n + i - 4, -1, -1],
  ];
  for (const [l, c, u, d] of a)
    (t.beginPath(),
      t.moveTo(l + u * 16, c),
      t.lineTo(l, c),
      t.lineTo(l, c + d * 16),
      t.stroke());
}
function Vqe(t, e) {
  let n = e.isContextLost();
  const r = (i) => {
    (i.preventDefault(), (n = !0));
  };
  return (
    t.addEventListener("webglcontextlost", r, !1),
    {
      lost: () => n || e.isContextLost(),
      dispose: () => t.removeEventListener("webglcontextlost", r),
    }
  );
}
function Gqe(_id, options) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  const gl = canvas.getContext("webgl2", options);
  if (!gl) return null;
  const observer = Vqe(canvas, gl);
  return {
    canvas,
    gl,
    lost: observer.lost,
    dispose() {
      observer.dispose();
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
const jqe = `#version 300 es
precision highp float;
out vec4 frag;
uniform vec2  uRes;
uniform float uProg;   // 0..1 phase progress — the ONLY animator

float sat(float x){ return clamp(x, 0.0, 1.0); }
float seg(float p, float a, float b){ return sat((p - a) / (b - a)); }
float p2(float v){ return v * v; }
float eiCubic(float x){ return x*x*x; }
float eoCubic(float x){ float h = 1.0 - x; return 1.0 - h*h*h; }
float eioCubic(float x){ return x < 0.5 ? 4.0*x*x*x : 1.0 - eiCubic(-2.0*x + 2.0)*0.5; }
float eoBack(float x){ const float c1 = 1.70158, c3 = c1 + 1.0; float h = x - 1.0; return 1.0 + c3*h*h*h + c1*h*h; }
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453123); }
vec3 tone(vec3 c){ return c / (c + 0.70); }

// master envelope: fade in over the first ~9%, fade out over the last ~9% — no hard pop.
float envelope(float p){ return eioCubic(seg(p, 0.0, 0.09)) * (1.0 - eioCubic(seg(p, 0.91, 1.0))); }

// three wave SETS with holds between them; the last one overshoots (eoBack) and settles.
float staged(float p){
  return 0.36 * eoCubic(seg(p, 0.05, 0.30))
       + 0.34 * eoCubic(seg(p, 0.36, 0.58))
       + 0.30 * eoBack (seg(p, 0.63, 0.85));
}

// value noise + fbm + caustic web — the wave-simulating water texture
// (position-sampled, drifted by progress — no clock).
float vnoise(vec2 q){
  vec2 i = floor(q), f = fract(q);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = h11(dot(i + vec2(0.0, 0.0), vec2(1.0, 57.0)));
  float b = h11(dot(i + vec2(1.0, 0.0), vec2(1.0, 57.0)));
  float c = h11(dot(i + vec2(0.0, 1.0), vec2(1.0, 57.0)));
  float d = h11(dot(i + vec2(1.0, 1.0), vec2(1.0, 57.0)));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 q){
  float s = 0.0, a = 0.5;
  for(int i = 0; i < 4; i++){ s += a * vnoise(q); q *= 2.02; a *= 0.5; }
  return s;
}
float caustic(vec2 uv, float t){
  vec2 q = uv * 5.5;
  float v = 0.0;
  for(int i = 0; i < 3; i++){
    float fi = float(i);
    vec2 w = q + vec2(sin(t * 1.3 + fi * 2.1), cos(t * 1.1 + fi * 1.7)) * 1.4;
    float n = fbm(w + fi * 11.3);
    v += pow(1.0 - abs(n * 2.0 - 1.0), 6.0);   // ridged → bright thin filaments
    q *= 1.6;
  }
  return v / 3.0;
}

void main(){
  vec2 frc = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float x = (frc.x - 0.5) * aspect;
  float p = sat(uProg);
  float env = envelope(p);
  float calm = eioCubic(seg(p, 0.70, 0.92));

  float rise = staged(p);
  float amp = 0.030 * (1.0 - 0.88 * calm);
  float wave = sin(x * 6.0 + p * 7.0) * 0.6 + sin(x * 11.0 - p * 5.0) * 0.4;
  float ys = -0.16 + 1.32 * rise + amp * wave
           + 0.012 * (fbm(vec2(x * 3.0, rise * 2.0)) * 2.0 - 1.0);  // irregular waterline
  float d = ys - frc.y;                          // > 0 underwater

  vec3 col = vec3(0.0);

  if (d > 0.0){
    float depth = sat(d / max(ys, 0.001));
    vec3 water = mix(vec3(0.40, 0.88, 1.00), vec3(0.06, 0.20, 0.40), smoothstep(0.0, 1.0, depth));
    col += water * mix(0.65, 0.40, depth) * (0.85 - 0.30 * calm);

    // the caustic web raining down from the lit surface — the wave texture itself.
    float cw = caustic(vec2(frc.x * aspect, frc.y * 1.4), rise + p * 0.6);
    col += vec3(0.70, 0.98, 1.0) * cw * 0.7 * (1.0 - depth) * (0.55 + 0.45 * calm);

    // three slow light shafts hanging from the surface — they carry the submerged stretch,
    // fading only in the final exhale.
    for (int b = 0; b < 3; b++){
      float fb = float(b);
      float bx = (h11(fb + 3.0) - 0.5) * 1.2 + sin(p * 1.5 + fb * 2.1) * 0.08;
      float slope = (h11(fb + 11.0) - 0.5) * 0.8;
      float bd = abs(x - bx + slope * d);
      col += vec3(0.40, 0.85, 1.0) * exp(-bd * bd * 60.0) * (1.0 - depth)
           * (1.0 - 0.6 * eioCubic(seg(p, 0.82, 0.95))) * 0.35;
    }
  }

  // light-drops: single trackable motes born in the deep, easing up to MERGE into the line.
  for (int j = 0; j < 18; j++){
    float fj = float(j);
    float b0 = 0.06 + 0.72 * h11(fj * 1.7 + 2.0);
    float lp = seg(p, b0, b0 + 0.22);
    if (lp <= 0.0 || lp >= 1.0) continue;
    float bx = (h11(fj + 5.0) - 0.5) * aspect * 0.9 + sin(lp * 6.283 + fj) * 0.02;
    float startDepth = 0.10 + 0.30 * h11(fj + 8.0);
    float by = ys - startDepth * (1.0 - eoCubic(lp));    // chases the surface, lands ON it
    float bri = sat(sin(lp * 3.14159));
    vec2 q = vec2(x, frc.y) - vec2(bx, by);
    float dd = dot(q, q);
    col += vec3(0.70, 0.97, 1.0) * exp(-dd * 2400.0) * bri * 1.3;
    col += vec3(0.45, 0.85, 1.0) * exp(-dd * 300.0) * bri * 0.25;
  }

  // the waterline itself: bright core + a pool of light just beneath.
  col += vec3(0.85, 1.0, 1.0) * exp(-abs(d) * 200.0) * 1.2 * (1.0 - 0.3 * calm);
  col += vec3(0.50, 0.92, 1.0) * smoothstep(0.09, 0.0, d) * smoothstep(-0.015, 0.04, d) * 0.4;

  // the first two wave sets, once they LAND, breathe out one thin ripple ring each.
  for (int r = 0; r < 2; r++){
    float tr = r == 0 ? 0.30 : 0.58;
    float rp = seg(p, tr, tr + 0.14);
    if (rp <= 0.0 || rp >= 1.0) continue;
    float rad = 0.55 * eoCubic(rp);
    vec2 c = vec2((float(r) - 0.5) * 0.4, -0.16 + 1.32 * staged(tr));
    float dist = length(vec2(x, frc.y) - c);
    col += vec3(0.55, 0.95, 1.0) * exp(-p2((dist - rad) * 70.0)) * p2(1.0 - rp) * 0.5;
  }

  // the close: from her heart, a quiet double ring — crisp, then gone with the exhale.
  float fp = seg(p, 0.86, 0.98);
  if (fp > 0.0 && fp < 1.0){
    float rad = 1.1 * eoCubic(fp);
    float dist = length(vec2(x, frc.y - 0.55));
    float rings = exp(-p2((dist - rad) * 70.0)) + 0.5 * exp(-p2((dist - rad * 0.78) * 70.0));
    col += vec3(0.70, 1.0, 1.0) * rings * p2(1.0 - fp) * 1.0;
  }
  // a soft glow gathering at her heart as the sea stills.
  {
    vec2 q = vec2(x, frc.y - 0.55);
    col += vec3(0.35, 0.75, 0.95) * exp(-dot(q, q) * 3.0) * calm * 0.22;
  }
  col += vec3(0.05, 0.13, 0.20) * calm * smoothstep(0.5, 1.0, rise);

  // soft side vignette so the tide reads as a contained body of light
  float vig = smoothstep(1.35, 0.45, length(vec2(x, frc.y - 0.5)));
  col *= 0.7 + 0.3 * vig;

  // guard NaN/Inf from the noise, tone-map, then output PREMULTIPLIED (matches the
  // ONE,1-SRC_ALPHA blend). Coverage capped < 1 so the dark scene always shows through;
  // the envelope scales BOTH color and coverage → the fade in/out.
  col = tone(clamp(col, 0.0, 8.0));
  float a = sat(max(col.r, max(col.g, col.b)) * 1.6) * 0.88 * env;
  frag = vec4(col * a, a);
}`;
const Hqe = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
function BU(t, e, n) {
  const r = t.createShader(e);
  if (!r) return null;
  if (
    (t.shaderSource(r, n),
    t.compileShader(r),
    !t.getShaderParameter(r, t.COMPILE_STATUS))
  ) {
    const i = e === t.FRAGMENT_SHADER ? "FRAG" : "VERT";
    return (
      console.error(
        `[healTide ${i}] log=[${t.getShaderInfoLog(r)}] err=${t.getError()}`,
      ),
      t.deleteShader(r),
      null
    );
  }
  return r;
}
function zqe(t) {
  const e = Math.sin(t * 127.1 + 311.7) * 43758.5453;
  return e - Math.floor(e);
}
const Xo = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const pM = (t, e, n) => {
  const r = Xo((n - t) / (e - t));
  return r * r * (3 - 2 * r);
};
const UU = (t) => {
  const e = 1 - t;
  return 1 - e * e * e;
};
const Wqe = (t) => {
  const r = t - 1;
  return 1 + 2.70158 * r * r * r + 1.70158 * r * r;
};
const $qe = (t) =>
  0.36 * UU(Xo((t - 0.05) / 0.25)) +
  0.34 * UU(Xo((t - 0.36) / 0.22)) +
  0.3 * Wqe(Xo((t - 0.63) / 0.22));
function HealTide({ progress: t, onError }) {
  const e = React.useRef(null),
    n = React.useRef(t);
  return (
    (n.current = t),
    React.useEffect(() => {
      const r = e.current;
      if (!r) return;
      const i = Gqe("heal", {
        alpha: !0,
        premultipliedAlpha: !0,
        antialias: !0,
      });
      if (!i) {
        onError?.();
        return;
      }
      const { canvas: s, gl: o, lost: a } = i;
      r.append(s);
      const l = o.createProgram(),
        c = BU(o, o.VERTEX_SHADER, Hqe),
        u = BU(o, o.FRAGMENT_SHADER, jqe);
      if (!l || !c || !u) {
        if (l) o.deleteProgram(l);
        if (c) o.deleteShader(c);
        if (u) o.deleteShader(u);
        i.dispose();
        onError?.();
        return;
      }
      (o.attachShader(l, c), o.attachShader(l, u), o.linkProgram(l));
      if (!o.getProgramParameter(l, o.LINK_STATUS)) {
        o.deleteShader(c);
        o.deleteShader(u);
        o.deleteProgram(l);
        i.dispose();
        onError?.();
        return;
      }
      o.useProgram(l);
      const d = o.createBuffer();
      (o.bindBuffer(o.ARRAY_BUFFER, d),
        o.bufferData(
          o.ARRAY_BUFFER,
          new Float32Array([-1, -1, 3, -1, -1, 3]),
          o.STATIC_DRAW,
        ));
      const f = o.getAttribLocation(l, "p");
      (o.enableVertexAttribArray(f),
        o.vertexAttribPointer(f, 2, o.FLOAT, !1, 0, 0));
      const h = o.getUniformLocation(l, "uRes"),
        _ = o.getUniformLocation(l, "uProg");
      (o.enable(o.BLEND), o.blendFunc(o.ONE, o.ONE_MINUS_SRC_ALPHA));
      let m = 0,
        p = !0;
      const v = () => {
        if (!p) return;
        if (a()) {
          onError?.();
          return;
        }
        const y = Math.min(window.devicePixelRatio || 1, 2),
          x = Math.max(1, Math.round(s.clientWidth * y)),
          w = Math.max(1, Math.round(s.clientHeight * y));
        ((s.width !== x || s.height !== w) &&
          ((s.width = x), (s.height = w), o.viewport(0, 0, x, w)),
          o.clearColor(0, 0, 0, 0),
          o.clear(o.COLOR_BUFFER_BIT),
          o.uniform2f(h, s.width, s.height),
          o.uniform1f(_, Xo(n.current)),
          o.drawArrays(o.TRIANGLES, 0, 3),
          (m = requestAnimationFrame(v)));
      };
      return (
        (m = requestAnimationFrame(v)),
        () => {
          ((p = !1),
            cancelAnimationFrame(m),
            o.deleteBuffer(d),
            o.deleteShader(c),
            o.deleteShader(u),
            o.deleteProgram(l),
            i.dispose());
        }
      );
    }, []),
    jsx.jsx("div", {
      ref: e,
      style: { position: "absolute", inset: 0, width: "100%", height: "100%" },
    })
  );
}
const VU = "ｱｲｳｴｵ01<>~≈░▒·";
const GU = [
  "> 建立恢复通道",
  "> 清理异常残留",
  "> 重建数据索引",
  "> 校正运行状态",
  "> 恢复通信功能",
  "稳态重建完成",
];
const Pp = "ui-monospace, Menlo, monospace";
function HealConsole({ progress: t }) {
  const e = React.useRef(null),
    n = React.useRef(t);
  return (
    (n.current = t),
    React.useEffect(() => {
      const r = e.current;
      if (!r) return;
      const i = r.getContext("2d");
      if (!i) return;
      const s = (l) => `rgba(150,240,255,${l})`;
      let o = 0;
      const a = () => {
        const l = Math.min(window.devicePixelRatio || 1, 2),
          c = Math.max(1, r.clientWidth),
          u = Math.max(1, r.clientHeight);
        ((r.width !== Math.round(c * l) || r.height !== Math.round(u * l)) &&
          ((r.width = Math.round(c * l)), (r.height = Math.round(u * l))),
          i.setTransform(l, 0, 0, l, 0, 0),
          i.clearRect(0, 0, c, u));
        const d = Xo(n.current),
          f = pM(0, 0.09, d) * (1 - pM(0.91, 1, d));
        if (f <= 0.002) {
          o = requestAnimationFrame(a);
          return;
        }
        i.globalAlpha = f;
        const h = c < 700 ? 0.72 : 1,
          _ = Math.round(100 * Xo((d - 0.02) / 0.9)),
          m = _ >= 100,
          p = 0.5 + 0.5 * Math.sin(d * 140),
          v = 12 * h;
        ((i.strokeStyle = s(0.35)), (i.lineWidth = 1.5));
        const y = 18 * h,
          x = [
            [v, v, 1, 1],
            [c - v, v, -1, 1],
            [v, u - v, 1, -1],
            [c - v, u - v, -1, -1],
          ];
        for (const [C, A, k, N] of x)
          (i.beginPath(),
            i.moveTo(C + k * y, A),
            i.lineTo(C, A),
            i.lineTo(C, A + N * y),
            i.stroke());
        ((i.font = `600 ${11 * h}px ${Pp}`),
          (i.textBaseline = "middle"),
          (i.textAlign = "left"),
          (i.fillStyle = s(0.8)),
          i.fillText("SYS://nori — 稳态重建", v + 10, v + 12),
          i.beginPath(),
          i.arc(c - v - 10, v + 12, 3.5 * h, 0, Math.PI * 2),
          (i.fillStyle = s(m ? 0.9 : 0.3 + 0.5 * p)),
          i.fill());
        const w = c / 2,
          S = u - 86 * h,
          T = 32 * h;
        ((i.lineWidth = 3 * h),
          (i.strokeStyle = s(0.15)),
          i.beginPath(),
          i.arc(w, S, T, 0, Math.PI * 2),
          i.stroke(),
          (i.strokeStyle = s(0.25)),
          (i.lineWidth = 1));
        for (let C = 0; C < 12; C++) {
          const A = (C / 12) * Math.PI * 2 - Math.PI / 2;
          (i.beginPath(),
            i.moveTo(
              w + Math.cos(A) * (T + 5 * h),
              S + Math.sin(A) * (T + 5 * h),
            ),
            i.lineTo(
              w + Math.cos(A) * (T + 9 * h),
              S + Math.sin(A) * (T + 9 * h),
            ),
            i.stroke());
        }
        (i.save(),
          i.setLineDash([2 * h, 6 * h]),
          (i.strokeStyle = s(0.22)),
          i.beginPath(),
          i.arc(w, S, T + 14 * h, d * 2.2, d * 2.2 + Math.PI * 2),
          i.stroke(),
          i.restore(),
          i.save(),
          (i.shadowColor = "rgba(150,240,255,0.8)"),
          (i.shadowBlur = 10 * f),
          (i.strokeStyle = s(0.9)),
          (i.lineWidth = 3 * h),
          (i.lineCap = "round"),
          i.beginPath(),
          i.arc(w, S, T, -Math.PI / 2, -Math.PI / 2 + (_ / 100) * Math.PI * 2),
          i.stroke(),
          i.restore(),
          (i.textAlign = "center"),
          (i.font = `600 ${15 * h}px ${Pp}`),
          (i.fillStyle = s(0.95)),
          i.fillText(`${_} %`, w, S),
          (i.font = `${11 * h}px ${Pp}`),
          (i.fillStyle = s(0.75)),
          i.fillText(m ? "稳态重建结束" : "稳态重建中", w, S + T + 16 * h),
          (i.textAlign = "left"),
          (i.font = `${10.5 * h}px ${Pp}`));
        const R = 0.86,
          E = GU.length;
        for (let C = 0; C < E; C++) {
          const A = 0.04 + (C / E) * R,
            k = Xo((d - A) / (R / E));
          if (k <= 0) continue;
          const N = GU[C] ?? "",
            P = u - v - 14 - (E - 1 - C) * 16 * h;
          let D = v + 10;
          for (let L = 0; L < N.length; L++) {
            const O = Xo((k - (L / Math.max(1, N.length)) * 0.6) * 2.6);
            let I = N[L] ?? "";
            O < 1 &&
              I !== " " &&
              (I =
                VU[
                  Math.floor(zqe(C * 131 + L + Math.floor(d * 30)) * VU.length)
                ] ?? I);
            const F = C === E - 1;
            ((i.fillStyle = O >= 1 ? s(F ? 0.95 : 0.72) : s(0.42)),
              i.fillText(I, D, P),
              (D += i.measureText(I).width));
          }
        }
        ((i.textAlign = "right"), (i.font = `${10.5 * h}px ${Pp}`));
        const M = [
          `已恢复 ${Math.round(100 * Xo($qe(d)))} %`,
          `污染残余 ${100 - _} %`,
          `自我结构稳定度 ${Math.round(100 * (0.42 + 0.58 * pM(0.08, 0.9, d)))} %`,
        ];
        for (let C = 0; C < M.length; C++)
          ((i.fillStyle = s(0.62)),
            i.fillText(
              M[C] ?? "",
              c - v - 10,
              u - v - 14 - (M.length - 1 - C) * 16 * h,
            ));
        ((i.globalAlpha = 1), (o = requestAnimationFrame(a)));
      };
      return (
        (o = requestAnimationFrame(a)),
        () => {
          cancelAnimationFrame(o);
        }
      );
    }, []),
    jsx.jsx("canvas", {
      ref: e,
      style: { position: "absolute", inset: 0, width: "100%", height: "100%" },
    })
  );
}
function CorruptionHeal({ progress: t, active: e, onError }) {
  return e
    ? jsx.jsxs("div", {
        style: {
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        },
        children: [
          jsx.jsx(HealTide, { progress: t, onError }),
          jsx.jsx(HealConsole, { progress: t }),
        ],
      })
    : null;
}
export { CorruptionEntry, CorruptionHeal };
