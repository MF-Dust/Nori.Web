/** Source-owned cold-open particle and wake stages recovered from the authorized NormalApp reference. */
import {
  BufferGeometry,
  BufferAttribute,
  Vector3,
  ShaderMaterial,
  AdditiveBlending,
  Points,
  DoubleSide,
  Mesh,
  PlaneGeometry,
} from "three";
const PLANKTON_BOUNDS = {
  yLo: -6,
  yHi: 95.6,
  xHalf: 18,
  zLo: -10,
  zHi: 59,
};
function createPlankton(t, e = PLANKTON_BOUNDS) {
  const n = new Float32Array(t * 3),
    r = new Float32Array(t),
    i = new Float32Array(t),
    s = new Float32Array(t);
  for (let u = 0; u < t; u++) {
    const d = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5,
      f = e.yLo + Math.random() * (e.yHi - e.yLo);
    ((n[u * 3] = d * e.xHalf),
      (n[u * 3 + 1] = f),
      (n[u * 3 + 2] = e.zLo + Math.random() * (e.zHi - e.zLo)),
      (r[u] = Math.random() * 0.9 + 0.35),
      (i[u] = Math.random() * Math.PI * 2),
      (s[u] = (f - e.yLo) / (e.yHi - e.yLo)));
  }
  const o = new BufferGeometry();
  (o.setAttribute("position", new BufferAttribute(n, 3)),
    o.setAttribute("size", new BufferAttribute(r, 1)),
    o.setAttribute("phase", new BufferAttribute(i, 1)),
    o.setAttribute("depthN", new BufferAttribute(s, 1)));
  const a = {
      time: {
        value: 0,
      },
      opacity: {
        value: 0,
      },
      uDepth: {
        value: 0,
      },
      planktonColor: {
        value: new Vector3(0.45, 0.95, 1),
      },
      planktonDeep: {
        value: new Vector3(0.28, 0.6, 1),
      },
      uFogNear: {
        value: 16,
      },
      uFogFar: {
        value: 130,
      },
      uRise: {
        value: 0,
      },
      uThin: {
        value: 0,
      },
      uColLo: {
        value: e.yLo,
      },
      uColH: {
        value: e.yHi - e.yLo,
      },
    },
    l = new ShaderMaterial({
      uniforms: a,
      vertexShader: `
      attribute float size, phase, depthN;
      uniform float time, opacity, uFogNear, uFogFar, uDepth, uRise, uThin, uColLo, uColH;
      varying float vB;
      varying float vD;
      void main() {
        vec3 pos = position;
        // upward drift, wrapped within the column (uRise=0 → identity: positions are already
        // inside [uColLo, uColLo+uColH], so this leaves the cold-open look unchanged).
        pos.y = mod((pos.y + uRise * time) - uColLo, uColH) + uColLo;
        pos.x += sin(time * 0.2 + phase) * 0.7;
        pos.y += sin(time * 0.15 + phase * 1.3) * 0.5;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        float fog = smoothstep(uFogNear, uFogFar, -mv.z);
        // depth gauge: the deeper we are (uDepth↑) the brighter + more numerous the
        // bioluminescence reads. steady twinkle floor so it never blinks off.
        float deepGain = mix(0.35, 1.5, uDepth);
        // Per-mote extinction: threshold = phase scaled to [0, 0.92], so uThin=0 keeps
        // every mote (exactly inert) and uThin=1 has extinguished them all.
        float thr = phase * 0.1464;
        float alive = 1.0 - smoothstep(thr, thr + 0.08, uThin);
        vB = (0.55 + 0.45 * sin(time * 0.8 + phase * 3.0)) * opacity * (1.0 - fog) * deepGain * alive;
        vD = depthN;
        gl_PointSize = size * (380.0 + uDepth * 260.0) / max(-mv.z, 0.1);
        gl_Position = projectionMatrix * mv;
      }
    `,
      fragmentShader: `
      uniform vec3 planktonColor, planktonDeep;
      varying float vB;
      varying float vD;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.32, 0.0, d);
        float halo = smoothstep(0.5, 0.04, d) * 0.55;
        vec3 col = mix(planktonDeep, planktonColor, vD);
        gl_FragColor = vec4(col * (1.0 + core), (core * 1.3 + halo) * vB);
      }
    `,
      transparent: !0,
      depthWrite: !1,
      blending: AdditiveBlending,
    }),
    c = new Points(o, l);
  return (
    (c.frustumCulled = !1),
    {
      points: c,
      uniforms: a,
      dispose: () => {
        (o.dispose(), l.dispose());
      },
    }
  );
}
const BURST_DURATION = 3.6;
const BURST_SCALE = 18;
const BRANCH_SEED = 24122;
function branchRandom(t) {
  let e = (t ^ BRANCH_SEED) >>> 0;
  return (
    (e = Math.imul(e ^ (e >>> 16), 2146121005) >>> 0),
    (e = Math.imul(e ^ (e >>> 15), 2221713035) >>> 0),
    (e = (e ^ (e >>> 16)) >>> 0),
    e / 4294967296
  );
}
const WAKE_HAZE_FRAGMENT = `
  precision highp float;
  varying vec2 vUv;
  uniform float uBurst, uBurstAge;

  const vec3 DEEP  = vec3(0.078, 0.722, 0.651);
  const vec3 AQUA  = vec3(0.404, 0.910, 0.976);
  const vec3 TEAL  = vec3(0.369, 0.918, 0.831);
  const vec3 WHITE = vec3(0.92, 0.99, 1.0);

  float sq(float x){ return x * x; }
  float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1,0)), c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.55; mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++){ v += a * noise(p); p = m * p * 2.02; a *= 0.5; } return v; }

  void main(){
    vec2 uv = (vUv - 0.5) * 8.0;
    float burst = uBurst, age = uBurstAge;
    float r = length(uv);
    float th = atan(uv.y, uv.x);

    float appear = smoothstep(0.0, 0.16, age);
    float depart = smoothstep(0.10, 2.7, age);
    float creatureFade = (1.0 - smoothstep(0.55, 0.95, depart)) * appear;
    float flash = burst * exp(-age * 2.6) * (1.0 - exp(-age * 14.0));

    // mistveil-lite haze (the medium it dissolves to)
    float expand = smoothstep(0.0, 2.8, age);
    vec2 q = uv / (0.55 + expand * 1.9);
    float haze = smoothstep(0.95, 0.0, length(q)) * (0.35 + 0.7 * fbm(q * 2.2 + vec2(0.0, age * 0.3)));
    haze *= (1.0 - smoothstep(0.45, 1.0, expand)) * appear * 0.6;

    // the BELL (domed scalloped umbrella at the core)
    float bellR = 0.62 + 0.05 * sin(age * 2.0) + flash * 0.10;
    float dome = smoothstep(bellR + 0.10, bellR - 0.06, r) * smoothstep(-0.6, 0.2, uv.y / max(bellR, 0.01));
    float rim = exp(-sq((r - bellR) * 6.0));
    float lobes = 0.5 + 0.5 * sin(th * 16.0);
    rim *= 0.55 + 0.45 * lobes;
    float bell = (dome * 0.5 + rim * 1.1) * creatureFade;

    // the ALARM PINWHEEL (rotating expanding rings, faded out before the mod wrap)
    float alarm = 0.0;
    for (int k = 0; k < 3; k++){
      float fk = float(k);
      float ringR = mod(age * 1.5 - fk * 0.62, 2.1);
      float ring = exp(-sq((r - ringR) / (0.05 + ringR * 0.06)));
      float spiral = 0.5 + 0.5 * sin(th * 8.0 - age * 9.0 + ringR * 5.0 + fk * 2.1);
      float born = smoothstep(0.0, 0.25, ringR);
      float die = 1.0 - smoothstep(1.45, 2.05, ringR);
      alarm += ring * (0.30 + 0.70 * spiral) * born * die;
    }
    alarm *= creatureFade * (0.7 + 0.5 * lobes);

    // drifting motes (the dissolve)
    float spores = 0.0;
    float swarm = smoothstep(0.0, 0.06, depart) * smoothstep(1.05, 0.45, depart);
    for (int i = 0; i < 30; i++){
      float fi = float(i);
      float h1 = hash21(vec2(fi, 11.3)), h2 = hash21(vec2(fi, 27.9)), h3 = hash21(vec2(fi, 41.7));
      float ang = h1 * 6.2831;
      vec2 birth = vec2(cos(ang), sin(ang)) * (0.4 + h2 * 0.5);
      float onset = mix(0.05, 0.45, h3);
      float life = clamp((depart - onset) / (0.95 - onset), 0.0, 1.0);
      vec2 pos = birth + normalize(birth) * life * (1.0 + h2 * 1.2);
      pos.y += life * (0.2 + h2 * 0.4);
      float twk = 0.45 + 0.55 * sin(age * (3.5 + h1 * 4.0) + fi * 6.0);
      float bright = (1.0 - life) * smoothstep(0.0, 0.07, life) * twk * swarm;
      float d = length(uv - pos);
      spores += (0.0006 / (0.0006 + d * d) * 1.3) * bright;
    }

    float lum = bell + alarm + spores * 1.2;
    vec3 col = mix(DEEP, TEAL, smoothstep(0.05, 0.5, lum));
    col = mix(col, AQUA, smoothstep(0.35, 0.85, lum));
    col = mix(col, WHITE, smoothstep(0.7, 1.3, lum + alarm * 0.4));
    col += TEAL * haze;
    col += mix(AQUA, WHITE, flash) * flash * exp(-r * 1.7) * 1.5;

    float intensity = lum + haze + flash * 0.5;
    col = col / (1.0 + col * 0.35);

    vec2 ef = smoothstep(vec2(0.0), vec2(0.18), vUv) * smoothstep(vec2(1.0), vec2(0.82), vUv);
    float qfade = ef.x * ef.y;
    float a = clamp(intensity, 0.0, 1.0) * qfade;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`;
const WAKE_PARTICLE_VERTEX = `
  attribute float aArc;
  attribute float aSeed;
  attribute vec2  aTan;
  attribute float aWidth;
  uniform float uAge;
  varying float vBright;
  varying float vWarm;
  varying float vSeed;

  float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    float a=h21(i),b=h21(i+vec2(1,0)),c=h21(i+vec2(0,1)),d=h21(i+vec2(1,1));
    return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
  float fbm(vec2 p){ float v=0.0,a=0.55; mat2 m=mat2(0.8,0.6,-0.6,0.8);
    for(int i=0;i<3;i++){ v+=a*vn(p); p=m*p*2.02; a*=0.5; } return v; }

  void main(){
    vSeed = aSeed;
    float age = uAge;

    float front = smoothstep(0.0, 1.7, age) * 1.05;
    float lead  = front - aArc;
    float lit   = smoothstep(-0.02, 0.10, lead);
    float flash = exp(-pow(lead * 11.0, 2.0)) * step(0.0, front);

    float diss = smoothstep(0.85, 3.0, age);
    float grain = fbm(vec2(aArc * 9.0, aSeed * 17.0) + vec2(0.0, age * 0.4));
    float dThresh = clamp(mix(0.05, 0.85, grain) - aArc * 0.22, 0.0, 0.9);
    float matter  = 1.0 - smoothstep(dThresh, dThresh + 0.22, diss);
    float afterglow = 0.45 + 0.55 * exp(-max(lead - 0.05, 0.0) * 1.1);

    vec2 base = position.xy;
    vec2 nrm = vec2(-aTan.y, aTan.x);
    float wob = (fbm(base * 4.5 + vec2(0.0, age * 0.7) + aSeed * 7.0) - 0.5);
    float wob2 = (fbm(base * 9.0 - age * 0.5 + aSeed * 3.0) - 0.5);
    float writhe = (wob * 0.05 + wob2 * 0.022) * (0.25 + aArc * 1.1);
    vec2 pos = base + nrm * writhe + aTan * lit * 0.012 * (0.5 + aSeed);
    vec2 outDir = normalize(base + vec2(0.0001, 0.0));
    pos += outDir * (1.0 - matter) * 0.05 * (0.4 + aSeed * 0.6);
    pos.y += (1.0 - matter) * 0.03;

    vec4 mv = modelViewMatrix * vec4(vec3(pos, 0.0), 1.0);

    float tw = 0.78 + 0.22 * sin(age * (3.0 + aSeed * 4.0) + aSeed * 31.4);
    float body = lit * afterglow * matter * tw;
    vBright = (body * 1.15 + flash * 1.7) * (0.6 + 0.4 * aWidth);
    vWarm = clamp(flash * 0.65, 0.0, 0.55);

    float sz = mix(1.7, 3.6, aWidth) * (1.0 + flash * 1.6);
    sz *= mix(1.0, 0.5, 1.0 - matter);
    gl_PointSize = sz * 52.0 / max(-mv.z, 0.1);
    gl_Position = projectionMatrix * mv;
  }
`;
const WAKE_PARTICLE_FRAGMENT = `
  precision highp float;
  uniform vec3 uCore, uEdge, uWarm;
  varying float vBright, vWarm, vSeed;
  void main(){
    if (vBright < 0.003) discard;
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float glow = exp(-r * r * 6.5);
    float core = smoothstep(0.16, 0.0, r);
    vec3 col = mix(uEdge, uCore, core * 0.55);
    col = mix(col, uWarm, vWarm * 0.5);
    float a = (glow * 0.85 + core * 0.25) * vBright;
    gl_FragColor = vec4(col * a, a);
  }
`;
function buildWakeBranches() {
  const t = [];
  let n = 0;
  function r(s, o, a, l, c, u, d) {
    if (c > 4) return;
    const f = 4,
      h = l / f;
    let _ = s,
      m = o,
      p = a,
      v = u;
    const y = Math.max(0.12, 1 - c * 0.22);
    for (let w = 0; w < f; w++) {
      const S = branchRandom(d * 97 + w * 7 + c * 13);
      p += (S - 0.5) * 0.9 * (0.4 + c * 0.18);
      const T = _ + Math.cos(p) * h,
        R = m + Math.sin(p) * h,
        E = v + h;
      let M = T - _,
        C = R - m;
      const A = Math.hypot(M, C) || 1;
      ((M /= A),
        (C /= A),
        t.push({
          ax: _,
          ay: m,
          bx: T,
          by: R,
          arcA: v,
          arcB: E,
          width: y,
          tx: M,
          ty: C,
        }),
        E > n && (n = E),
        (_ = T),
        (m = R),
        (v = E));
    }
    const x = 2 + (branchRandom(d * 31 + c) > 0.55 ? 1 : 0);
    for (let w = 0; w < x; w++) {
      const S = branchRandom(d * 53 + w * 17 + c * 29),
        T = branchRandom(d * 71 + w * 23 + c * 5),
        R = (0.45 + S * 0.8) * (w % 2 === 0 ? 1 : -1);
      r(_, m, p + R, l * (0.62 + T * 0.22), c + 1, v, d * 7 + w + c * 101);
    }
  }
  const i = 8;
  for (let s = 0; s < i; s++) {
    const o = branchRandom(s * 211 + 3),
      a = (s / i) * Math.PI * 2 + (o - 0.5) * 0.5;
    r(0, 0, a, 0.3 + o * 0.1, 1, 0, s * 100 + 1);
  }
  return {
    segs: t,
    maxArc: n,
  };
}
function createWakeBurst(t) {
  const e = {
      uBurst: {
        value: 0,
      },
      uBurstAge: {
        value: 0,
      },
    },
    n = new ShaderMaterial({
      uniforms: e,
      vertexShader:
        "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: WAKE_HAZE_FRAGMENT,
      transparent: !0,
      blending: AdditiveBlending,
      depthTest: !1,
      depthWrite: !1,
      side: DoubleSide,
    }),
    r = new Mesh(new PlaneGeometry(1, 1), n);
  ((r.renderOrder = 6), (r.frustumCulled = !1), (r.visible = !1), t.add(r));
  const { segs: i, maxArc: s } = buildWakeBranches(),
    o = 150,
    a = [],
    l = [],
    c = [],
    u = [],
    d = [];
  let f = 0;
  for (const x of i) {
    const w = Math.hypot(x.bx - x.ax, x.by - x.ay),
      S = Math.max(2, Math.round(w * o));
    for (let T = 0; T < S; T++) {
      const R = T / (S - 1),
        E = x.ax + (x.bx - x.ax) * R,
        M = x.ay + (x.by - x.ay) * R,
        C = (x.arcA + (x.arcB - x.arcA) * R) / s,
        A = (branchRandom(f * 3 + 1) - 0.5) * 0.012;
      (a.push(E - x.ty * A, M + x.tx * A, 0),
        l.push(C),
        c.push(branchRandom(f * 5 + 2)),
        u.push(x.tx, x.ty),
        d.push(x.width),
        f++);
    }
  }
  const h = new BufferGeometry();
  (h.setAttribute("position", new BufferAttribute(new Float32Array(a), 3)),
    h.setAttribute("aArc", new BufferAttribute(new Float32Array(l), 1)),
    h.setAttribute("aSeed", new BufferAttribute(new Float32Array(c), 1)),
    h.setAttribute("aTan", new BufferAttribute(new Float32Array(u), 2)),
    h.setAttribute("aWidth", new BufferAttribute(new Float32Array(d), 1)));
  const _ = {
      uAge: {
        value: 0,
      },
      uCore: {
        value: new Vector3(0.93, 0.99, 1),
      },
      uEdge: {
        value: new Vector3(0.36, 0.92, 0.86),
      },
      uWarm: {
        value: new Vector3(1, 0.86, 0.6),
      },
    },
    m = new ShaderMaterial({
      uniforms: _,
      vertexShader: WAKE_PARTICLE_VERTEX,
      fragmentShader: WAKE_PARTICLE_FRAGMENT,
      transparent: !0,
      blending: AdditiveBlending,
      depthTest: !1,
      depthWrite: !1,
    }),
    p = new Points(h, m);
  return (
    (p.renderOrder = 7),
    (p.frustumCulled = !1),
    (p.visible = !1),
    t.add(p),
    {
      update: ({ cine: x, billboard: w }) => {
        const S = x.burstAge,
          T = x.burst > 1e-4 || (S > 1e-4 && S < BURST_DURATION);
        if (!T) {
          r.visible && ((r.visible = !1), (p.visible = !1));
          return;
        }
        const R = w.y + 0.6;
        (r.position.set(w.x, R, w.z - 0.5),
          r.scale.set(BURST_SCALE, BURST_SCALE, 1),
          p.position.set(w.x, R, w.z - 0.25),
          p.scale.set(w.width * 3, w.width * 3, 1),
          (e.uBurst.value = x.burst),
          (e.uBurstAge.value = S),
          (_.uAge.value = S),
          (r.visible = T),
          (p.visible = T));
      },
      dispose: () => {
        (t.remove(r),
          r.geometry.dispose(),
          n.dispose(),
          t.remove(p),
          h.dispose(),
          m.dispose());
      },
    }
  );
}
export { createPlankton, createWakeBurst };
