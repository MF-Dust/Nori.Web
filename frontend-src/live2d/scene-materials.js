/** Source-owned scene shaders and material stages recovered from the authorized NormalApp reference. */
import { PlaneGeometry, Vector3, Vector2, ShaderMaterial, Mesh, DoubleSide, BufferGeometry, BufferAttribute, AdditiveBlending, Points, Vector4, DataTexture, LineBasicMaterial, Line, LineSegments, LinearFilter, WebGLRenderTarget, Scene, OrthographicCamera } from 'three';
const $o = {
  cx: 0.5,
  cy: 0.6,
  r: 1.7,
  planeW: 4,
  planeH: 8
};
const $P = 1.4;
const DX = 0.55;
const d2 = 4;
const f4e = `
  uniform sampler2D uField;    // R dist, G arclen, B fill (symbol space)
  uniform sampler2D uNoriSDF;  // her silhouette SDF (plane-uv) — set LIVE each frame (JFA)
  uniform sampler2D uCloverSDF;// the clover's signed-distance field (plane-uv)
  uniform float uSdfRange;     // world units the encoded SD spans (±)
  uniform float uFieldDomain; // FIELD_DOMAIN
  uniform vec3  uPlace;       // cx, cy, r
  uniform vec2  uPlaneSize;   // planeW, planeH
  uniform float uMaxD;        // MAXD
  uniform float uAAworld;     // world units per screen pixel at the glyph plane
  uniform float uAAsym;       // symbol units per screen pixel (= uAAworld / placement.r)

  // plane uv → symbol-space coord (clover stays circular)
  vec2 planeToSymbol(vec2 uv) {
    return vec2((uv.x - uPlace.x) * uPlaneSize.x, (uv.y - uPlace.y) * uPlaneSize.y) / uPlace.z;
  }
  // sample the baked field at a plane-uv. returns (dist[symbol units], arclen, fill)
  vec3 glyphField(vec2 uv) {
    vec2 sc = planeToSymbol(uv);
    vec2 f = sc / (2.0 * uFieldDomain) + 0.5;
    if (any(lessThan(f, vec2(0.0))) || any(greaterThan(f, vec2(1.0)))) return vec3(1.0, 0.0, 0.0);
    vec3 t = texture2D(uField, f).rgb;
    return vec3(t.r * uMaxD, t.g, t.b);
  }
  // ANALYTIC 1px anti-aliased step for WORLD-unit fields (the SDFs) — no fwidth
  // (Three's ShaderMaterial is GLSL1 even on WebGL2, where fwidth() returns 0 → hard
  // jaggy edges). The host feeds world-units-per-screen-pixel from the camera each frame.
  float aaStepW(float edge, float v) { float w = max(uAAworld, 1e-5) * 1.3; return smoothstep(edge + w, edge - w, v); }
  // crisp anti-aliased clover petal fill, from the clover SDF (raw world sd, <0 inside)
  float cloverFillAA(vec2 uv) { return aaStepW(0.0, texture2D(uCloverSDF, uv).r); }
`;
function h4e() {
  return {
    uField: {
      value: null
    },
    uNoriSDF: {
      value: null
    },
    uCloverSDF: {
      value: null
    },
    uSdfRange: {
      value: d2
    },
    uFieldDomain: {
      value: $P
    },
    uPlace: {
      value: new Vector3($o.cx, $o.cy, $o.r)
    },
    uPlaneSize: {
      value: new Vector2($o.planeW, $o.planeH)
    },
    uMaxD: {
      value: DX
    },
    uAAworld: {
      value: 0.02
    },
    uAAsym: {
      value: 0.012
    }
  };
}
const SHADER_COMMON = {
  noise: `
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float hash1(float n) { return fract(sin(n) * 43758.5453); }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                 mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
    }

    float noise1(float x) {
      float i = floor(x), f = fract(x);
      return mix(hash1(i), hash1(i + 1.0), smoothstep(0.0, 1.0, f));
    }
  `,
  ambient: `
    vec3 applyAmbient(vec3 c, float brightness, float contrast, float saturation, vec4 tint) {
      vec3 r = c * brightness;
      r = (r - 0.5) * contrast + 0.5;
      float gray = dot(r, vec3(0.2126, 0.7152, 0.0722));
      r = mix(vec3(gray), r, saturation);
      float i = tint.w;
      return vec3(r.r * (1.0 - i + i * tint.r), r.g * (1.0 - i + i * tint.g), r.b * (1.0 - i + i * tint.b));
    }
  `
};
const BACKGROUND_SHADER = {
  vertex: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `,
  fragment: `
    uniform float time;
    uniform vec3 backgroundColor, fogColor, causticColor, auroraColor1, auroraColor2;
    uniform float causticIntensity, ambientLight, auroraIntensity;
    uniform float uReveal;
    uniform vec2 cameraOffset;
    varying vec2 vUv;

    ${SHADER_COMMON.noise}

    vec2 waterFlow(vec2 uv, float t) {
      vec2 flow = vec2(0.0);
      flow.x += (noise(uv * 2.0 + vec2(t * 0.08, 0.0)) - 0.5) * 0.003;
      flow.y += (noise(uv * 2.0 + vec2(0.0, t * 0.06)) - 0.5) * 0.002;
      flow.x += (noise(uv * 4.0 + vec2(t * 0.12, t * 0.05)) - 0.5) * 0.0016;
      flow.y += (noise(uv * 4.0 + vec2(t * 0.04, t * 0.1)) - 0.5) * 0.0012;
      flow.y += sin(uv.x * 3.0 + t * 0.15) * 0.0006;
      return flow;
    }

    float shimmer(vec2 uv, float t) {
      float s = sin(uv.x * 12.0 + t * 0.4) * sin(uv.x * 6.0 - t * 0.25);
      s += sin(uv.x * 18.0 - t * 0.5) * sin(uv.x * 9.0 + t * 0.3) * 0.6;
      s += sin(uv.x * 25.0 + t * 0.6) * 0.3;
      return s * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = vUv + cameraOffset * vec2(0.02, 0.015);

      // Every aurora term scales SMOOTHLY with intensity: auroraAmt is
      // normalized so the dark theme's base (0.4) is exactly 1.0, keeping the
      // desktop byte-identical. The 0.01 tests are PERF SKIPS only: at that
      // point every term is already scaled to invisibility, so crossing the gate
      // can't pop (the old gated-but-unscaled shimmer flashed at full brightness
      // whenever a fading intensity wobbled across the threshold).
      float auroraAmt = min(auroraIntensity * 2.5, 1.0);

      if (auroraIntensity > 0.01) {
        vec2 flow = waterFlow(uv, time);
        float flowMask = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
        uv += flow * flowMask * auroraAmt;
      }

      float depth = uv.y * uv.y;
      vec3 color = mix(backgroundColor, fogColor, depth);

      if (auroraIntensity > 0.01) {
        // Surface shimmer
        float surfaceMask = smoothstep(0.88, 0.98, uv.y);
        color += vec3(0.1, 0.2, 0.25) * pow(shimmer(uv, time), 4.0) * surfaceMask * 0.4 * auroraAmt;
        color += vec3(0.04, 0.08, 0.12) * smoothstep(0.9, 1.0, uv.y) * auroraAmt;
        color += vec3(0.02, 0.04, 0.05) * smoothstep(0.3, 0.7, noise(uv * 3.0 + vec2(time * 0.1, time * 0.08))) * (1.0 - uv.y) * auroraAmt;

        // God rays
        float rays = 0.0;
        for (float i = 0.0; i < 4.0; i++) {
          float offset = (i - 1.5) * 0.35 + 0.1 + sin(time * 0.15 + i * 2.5) * 0.04 + sin(time * 0.08 + i * 1.2) * 0.02;
          float rayX = uv.x - 0.5 - offset;
          float width = 0.04 + (1.0 - uv.y) * 0.06;
          float ray = exp(-rayX * rayX / (width * width)) * uv.y * uv.y;
          ray *= 0.7 + 0.3 * sin(time * 0.2 + i * 2.0 + uv.y * 2.0);
          rays += ray * 0.5;
        }
        color += auroraColor1 * rays * auroraIntensity;
      }

      float vignette = 1.0 - length((uv - 0.5) * 0.6);
      color *= 0.95 + smoothstep(0.0, 1.0, vignette) * 0.05;
      // Cold-open convergence reveal: 1 = the full deep-sea desktop; < 1 fades the
      // gradient + aurora structure toward a flat base, so the ocean dive can dissolve
      // INTO this exact backdrop as it lands (Scene.tsx drives it from 1 − coldOpen.oceanFade;
      // the dive renders bg.mesh in its own hero pass so the two ends become identical).
      // Always 1 off the cutscene → the desktop is byte-identical.
      color = mix(backgroundColor, color, uReveal);
      gl_FragColor = vec4(color, 1.0);
    }
  `
};
const GRID_SHADER = {
  vertex: `
    varying vec3 vWorldPos;
    varying float vFogDepth;
    uniform vec2 cameraOffset;
    void main() {
      vec3 pos = position + vec3(cameraOffset.x * 3.0, 0.0, cameraOffset.y * 1.5);
      vWorldPos = pos;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vFogDepth = -mvPosition.z; // real view-space distance from camera
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragment: `
    uniform float time, gridOpacity, causticIntensity, uFogNear, uFogFar;
    uniform vec3 gridColor, fogColor, causticColor;
    varying vec3 vWorldPos;
    varying float vFogDepth;

    ${SHADER_COMMON.noise}

    float caustic(vec2 uv, float t) {
      vec2 flow = vec2(noise(uv * 0.3 + vec2(t * 0.05, 0.0)) - 0.5, noise(uv * 0.3 + vec2(0.0, t * 0.04)) - 0.5) * 0.16;
      uv += flow;
      float c = sin(uv.x * 0.8 + uv.y * 0.4 + t) * 0.5 + 0.5;
      c += sin(uv.x * 0.6 - uv.y * 0.9 + t * 1.2) * 0.5 + 0.5;
      c += sin(uv.x * 0.5 + uv.y * 0.7 - t * 0.8) * 0.5 + 0.5;
      c += sin((uv.x + uv.y) * 1.1 + t * 0.9) * 0.5 + 0.5;
      return smoothstep(0.35, 0.65, c / 4.0);
    }

    void main() {
      vec2 gridPos = vWorldPos.xz * 0.3;
      if (causticIntensity > 0.01) {
        gridPos.x += sin(vWorldPos.z * 0.2 + time * 0.15) * 0.03;
        gridPos.y += sin(vWorldPos.x * 0.15 + time * 0.12) * 0.021;
      }

      vec2 grid = abs(fract(gridPos - 0.5) - 0.5);
      float gridLine = max(smoothstep(0.02, 0.0, grid.x), smoothstep(0.02, 0.0, grid.y));
      // Real view-distance fog (game-style): fade by actual camera depth.
      float fog = smoothstep(uFogNear, uFogFar, vFogDepth);

      float causticEffect = 0.0;
      if (causticIntensity > 0.01) {
        float c = (caustic(vWorldPos.xz * 0.15, time * 0.4) + caustic(vWorldPos.xz * 0.2 + 10.0, time * 0.5 + 3.0) * 0.6) / 1.6;
        c *= 0.7 + noise(vWorldPos.xz * 0.1 + vec2(time * 0.08, time * 0.06)) * 0.5;
        causticEffect = c * (1.0 - fog) * causticIntensity;
      }

      vec3 color = gridColor * gridLine + causticColor * causticEffect;
      float alpha = max(gridLine * 0.6, causticEffect * 0.8) * gridOpacity * (1.0 - fog);
      gl_FragColor = vec4(color, alpha);
    }
  `
};
const PARTICLE_SHADER = {
  vertex: `
    attribute float size, phase;
    uniform float time, baseSize;
    uniform vec2 cameraOffset;
    varying float vBrightness, vSize;

    void main() {
      vec3 pos = position;
      pos.x += sin(time * 0.12 + phase) * 0.6 + cameraOffset.x * (1.0 + pos.z * 0.04);
      pos.y += sin(time * 0.08 + phase * 1.3) * 0.4 + cameraOffset.y * 0.4 * (1.0 + pos.z * 0.02);
      pos.z += cos(time * 0.1 + phase * 0.7) * 0.3;
      vBrightness = 0.6 + 0.4 * sin(time * 0.5 + phase * 2.5);
      vSize = size;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * baseSize * 350.0 / -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: `
    uniform vec3 particleColor, particleGlow;
    varying float vBrightness;

    void main() {
      float dist = length(gl_PointCoord - 0.5);
      float core = smoothstep(0.25, 0.0, dist);
      float glow = smoothstep(0.5, 0.1, dist) * 0.6;
      vec3 color = mix(particleGlow, particleColor, core);
      gl_FragColor = vec4(color, (core + glow) * vBrightness * 0.9);
    }
  `
};
const BOKEH_SHADER = {
  vertex: `
    attribute float size, phase;
    uniform float time, baseSize;
    varying float vBrightness, vHue;

    void main() {
      vec3 pos = position;
      pos.x += sin(time * 0.15 + phase * 3.0) * 0.8;
      pos.y += sin(time * 0.1 + phase * 2.0) * 0.5;
      pos.z += cos(time * 0.12 + phase * 2.5) * 0.4;
      vBrightness = 0.5 + 0.5 * sin(time * 0.8 + phase * 4.0);
      vHue = fract(phase * 0.3);
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * baseSize * 400.0 / -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: `
    uniform vec3 bokehColor;
    varying float vBrightness, vHue;

    void main() {
      float dist = length(gl_PointCoord - 0.5);
      float glow = exp(-dist * dist * 12.0);
      float core = exp(-dist * dist * 40.0);
      vec3 color = mix(mix(bokehColor, vec3(0.9, 0.6, 0.3), vHue * 0.4), vec3(0.3, 1.0, 0.8), (1.0 - vHue) * 0.3);
      color += vec3(0.3, 0.3, 0.2) * core;
      gl_FragColor = vec4(color, (glow * 0.6 + core * 0.4) * vBrightness);
    }
  `
};
const SHADOW_SHADER = {
  vertex: `
    uniform vec3 billboardPos, lightDir;
    uniform vec2 billboardSize;
    uniform float groundY;
    varying vec2 vUv;

    void main() {
      vUv = vec2(uv.x, 1.0 - uv.y);
      vec3 q = vec3(billboardPos.x + (uv.x - 0.5) * billboardSize.x, billboardPos.y + (uv.y - 0.5) * billboardSize.y, billboardPos.z);
      vec3 rayDir = -lightDir;
      float ly = abs(rayDir.y) < 1e-6 ? sign(rayDir.y) * 1e-6 : rayDir.y;
      vec3 p = q + rayDir * ((groundY - q.y) / ly);
      p.y = groundY + 0.02;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  fragment: `
    // silhouetteMap is the PRE-BLURRED low-res silhouette from shadowPrepass
    // (the gaussian moved off this full-screen-rate shader — it used to run
    // 81 full-res taps per shadow pixel here). One tap now.
    uniform sampler2D silhouetteMap;
    uniform float opacity;
    varying vec2 vUv;

    void main() {
      if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) discard;

      float alpha = texture2D(silhouetteMap, clamp(vUv, 0.001, 0.999)).a;

      if (alpha <= 0.01) discard;
      gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * opacity);
    }
  `
};
const DF = {
  vertex: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragment: `
    uniform sampler2D live2DMap;
    uniform float ambientBrightness, ambientContrast, ambientSaturation;
    uniform vec4 ambientColor;
    uniform vec3 noriTint;        // multiplicative corruption tint colour
    uniform float noriTintAmount; // 0 = her normal colour → 1 = full tint
    // ── cold-open reveal (drives THIS one billboard's own shader; 0/inert at the desktop) ──
    uniform float uGlyphActive;   // 0 = desktop (clean path, byte-identical) → 1 = cold-open
    uniform float uDraw, uGlow;   // the clover stroke arc-length head / its bloom
    uniform float uMorph;         // SHAPE interpolation: 0 = clover SDF → 1 = her live silhouette
    uniform float uWash;          // FILL interpolation: 1 = full-bright cyan blob → 0 = her colour
    uniform float uNoriDim;       // proto noriDim: 0 = full → higher = darker (exp). pre-wake submerged
    uniform float uNoriReveal;    // proto noriReveal: 0 = submerged → 1 = her full colour (the wake lighten)
    uniform float uTimeS;         // wall-clock seconds (the resolve flow drift)
    uniform float uNoriRim;       // manifold-phase cyan silhouette rim gain (palette noriRim; 0 = off)
    uniform float uNoriRimW;      // rim silhouette-sampling width in billboard UV (default 0.009)
    varying vec2 vUv;

    ${SHADER_COMMON.ambient}
    ${f4e}

    // her normal graded look (ambient grade + corruption tint) — the desktop output.
    vec3 noriGraded(vec3 rgb) {
      vec3 color = applyAmbient(rgb, ambientBrightness, ambientContrast, ambientSaturation, ambientColor);
      if (noriTintAmount > 0.001) color = mix(color, color * noriTint, noriTintAmount);
      return color;
    }

    // value-noise fbm for the wake resolve flow (verbatim from the prototype shroud shader).
    float shHash(vec2 p){ p=fract(p*vec2(127.1,311.7)); p+=dot(p,p+34.5); return fract(p.x*p.y); }
    float shVn(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(shHash(i),shHash(i+vec2(1.0,0.0)),u.x), mix(shHash(i+vec2(0.0,1.0)),shHash(i+vec2(1.0,1.0)),u.x),u.y); }
    float shFbm(vec2 p){ float v=0.0,a=0.5; mat2 m=mat2(0.8,0.6,-0.6,0.8);
      for(int i=0;i<5;i++){ v+=a*shVn(p); p=m*p*2.02+vec2(11.3,7.1); a*=0.5; } return v; }
    float shAlpha(vec2 uv){ return texture2D(live2DMap, vec2(uv.x, 1.0 - uv.y)).a; }

    // 1:1 port of plans/cold-open-cutscene shroudCausticFragment (caustics OFF / causticGain=0):
    // NEUTRAL dim + cyan silhouette RIM (the prototype's EXACT offsets + internal y-flip → the
    // correct rim direction) + the wake flow-field resolve + the col/(1+col*0.3) tonemap (which
    // is why she never over-exposes on the wake). planeUv = vUv. uNoriDim=0 && uNoriReveal=1 →
    // her untouched (desktop). This is the reference math verbatim, NOT an approximation.
    vec3 noriShroud(vec3 her, vec2 planeUv, float a0) {
      if (uNoriDim <= 0.001 && uNoriReveal >= 0.999) return her;
      float dimBright = exp(-uNoriDim * 0.7);
      float ax = shAlpha(planeUv + vec2(0.006, 0.0));
      float ay = shAlpha(planeUv + vec2(0.0, 0.006));
      float rim = clamp((a0 - min(ax, ay)) * 3.0, 0.0, 1.0);
      vec3 rimLight = vec3(0.55, 0.95, 0.92) * rim * 0.25 * 0.35; // proto rimGain 0.35
      vec3 col = her * dimBright + rimLight;
      col = mix(col, her, smoothstep(0.0, 1.0, uNoriReveal) * 0.5);
      float flow = shFbm(planeUv * 2.6 + vec2(uTimeS * 0.05, -uTimeS * 0.03));
      float field = clamp(planeUv.y * 0.6 + flow * 0.4, 0.0, 1.0);
      float edge = 0.16;
      float thr = mix(-edge * 2.0, 1.0 + edge * 2.0, uNoriReveal);
      float shaded = smoothstep(thr - edge, thr + edge, field); // 1 = shroud (dim) → 0 = her (woke)
      float seam = exp(-pow((field - thr) / (edge * 0.8), 2.0));
      col += vec3(0.92, 0.99, 1.0) * seam * (uNoriReveal * (1.0 - uNoriReveal) * 4.0) * 1.4;
      // Tonemap the SHROUD/seam VEIL only (this is what prevents over-exposure on the
      // wake), then composite it OVER her RAW colour by the resolve coverage — exactly the
      // prototype's overlay (alpha = mask*shaded) over a clean base. The revealed (shaded->0)
      // regions are raw her, NEVER tonemapped, so the fully-woken Nori lands on the
      // desktop grade with no end-of-wake brighten/saturation pop.
      vec3 veil = col / (1.0 + col * 0.3);
      return mix(her, veil, shaded);
    }

    // Manifold-phase rim: the 均衡 water backlights her silhouette (sides + top,
    // never from below) in cyan. Same alpha-gradient sampling as the shroud rim;
    // the palette drives uNoriRim (envelope × the breathing water pulse), so at
    // any other phase it is 0 and this returns her untouched — byte-identical.
    vec3 noriManifoldRim(vec3 her, vec2 planeUv, float a0) {
      if (uNoriRim <= 0.001) return her;
      float axp = shAlpha(planeUv + vec2(uNoriRimW, 0.0));
      float axm = shAlpha(planeUv - vec2(uNoriRimW, 0.0));
      float ay  = shAlpha(planeUv + vec2(0.0, uNoriRimW));
      float side = clamp((a0 - min(axp, axm)) * 3.0, 0.0, 1.0);
      float top  = clamp((a0 - ay) * 3.0, 0.0, 1.0);
      float rim = clamp(side * 0.75 + top, 0.0, 1.0);
      // A slow ripple travelling along the rim, so the light reads as living
      // water playing on her — not a static outline sticker.
      rim *= 0.85 + 0.15 * sin(uTimeS * 0.7 + planeUv.y * 7.0 + planeUv.x * 3.0);
      vec3 rimCol = mix(vec3(0.2, 0.75, 0.88), vec3(0.8, 0.99, 1.0), rim);
      return her + rimCol * (rim * 0.65 * uNoriRim);
    }

    void main() {
      vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
      vec4 tex = texture2D(live2DMap, uv);

      // ── DESKTOP / off-cold-open: her normal grade. Byte-identical, zero extra cost
      //    (the whole reveal below is skipped — no SDF/field samples). ──
      if (uGlyphActive < 0.5) {
        if (tex.a < 0.01) discard;
        gl_FragColor = vec4(noriManifoldRim(noriShroud(noriGraded(tex.rgb), vUv, tex.a), vUv, tex.a), tex.a);
        return;
      }

      // ── COLD-OPEN: ONE object, ONE coverage, ONE colour per pixel. The clover is drawn
      //    in light as a thin stroke that GROWS into a solid; the solid's SHAPE is
      //    interpolated by SDF math into her LIVE silhouette; the colour is then graded
      //    from a cyan blob to her real texture. At no point are two masks or two layers
      //    composited — there is a single coverage field and a single colour ramp. ──

      // THE single morphing distance field: clover SDF → her LIVE silhouette SDF (both
      // true SDFs in the same world units, recomputed each frame — see liveSilhouetteSdf.ts).
      float become   = smoothstep(0.0, 1.0, uMorph);
      float cloverSD = texture2D(uCloverSDF, vUv).r;
      float noriSD   = texture2D(uNoriSDF, vUv).r;
      float morphSD  = mix(cloverSD, noriSD, become);
      // AA width floored to ~1.5 SDF texels so the field's own resolution can't alias.
      float aaw      = max(uAAworld * 1.3, 0.013);

      // THE single coverage: a band around the field's zero level-set that GROWS from a
      // thin drawn stroke into the full fill. fillAmt sweeps the band's inner edge to
      // -inf and its outer edge to the true silhouette (0), so one expression carries the
      // whole draw→fill→silhouette — never a second mask. (lineW = stroke half-width.)
      float lineW    = 0.05;
      float fillAmt  = smoothstep(0.0, 0.16, uMorph);          // 0 = thin stroke → 1 = solid fill
      float outerE   = mix(lineW, 0.0, fillAmt);
      float innerE   = mix(-lineW, -9.0, fillAmt);
      float cov      = smoothstep(outerE + aaw, outerE - aaw, morphSD)   // morphSD < outerE
                     * smoothstep(innerE - aaw, innerE + aaw, morphSD);  // morphSD > innerE

      // arc-length DRAW reveal: while the pen is still drawing (uDraw<1) only the stroke up
      // to the pen head is shown. Folds into the SAME coverage (a multiply), and lifts to 1
      // as the shape fills, so it never introduces a separate mask.
      vec3 fld       = glyphField(vUv);
      float arc      = fld.y;
      float drawnGate= smoothstep(uDraw + 0.012, uDraw - 0.004, arc);
      cov           *= mix(drawnGate, 1.0, fillAmt);
      // INNER PETAL GLOW (prototype ribbon.js fillGlow = cloverFillAA*uGlow): the petals
      // fill with light AFTER the stroke is fully drawn — gated by draw-COMPLETION, not by
      // arc-length, so it never bleeds in behind the moving pen head (that left an ugly
      // half-filled wedge). Uniform across all petals; fades as the shape morphs (1-fillAmt).
      float drawDone  = smoothstep(0.96, 1.0, uDraw);
      float petalFill = cloverFillAA(vUv) * uGlow * drawDone * (1.0 - fillAmt);
      cov            = max(cov, petalFill * 0.9);
      if (cov < 0.003) discard;

      // THE single colour ramp, PROTOTYPE cyan (glyphKit.js): cyan pen-light (stroke) →
      // washed cyan→white blob → her real colour. fillAmt: stroke→blob; uWash: blob→her.
      float lum      = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 washCol   = mix(vec3(0.34, 0.95, 0.92), vec3(0.88, 1.0, 0.99), clamp(lum, 0.0, 1.0)) * 1.25;
      vec3 filled    = mix(noriShroud(noriGraded(tex.rgb), vUv, tex.a), washCol, clamp(uWash, 0.0, 1.0));
      vec3 drawCol   = mix(vec3(0.37, 0.92, 0.83), vec3(0.92, 0.99, 1.0), clamp(fillAmt + 0.3, 0.0, 1.0));
      vec3 col       = mix(drawCol, filled, fillAmt);
      // HOT edge-front riding the deforming boundary (the prototype's signature): a bright
      // white-cyan rim peaking mid-morph that BLOOMS, so the shape-change reads as light.
      float front    = exp(-pow(morphSD / 0.085, 2.0)) * become * (1.0 - become) * 4.0;
      col           += front * vec3(0.6, 1.0, 0.95);
      // a soft sparkle at the pen head while drawing (brightness only, within the coverage)
      float head     = smoothstep(0.06, 0.0, abs(arc - uDraw)) * (1.0 - smoothstep(0.96, 1.0, uDraw)) * (1.0 - fillAmt);
      col           += head * vec3(0.35, 0.6, 0.6);
      col           += petalFill * vec3(0.35, 0.6, 0.6); // the filled petals glow cyan (blooms)

      gl_FragColor   = vec4(col, cov);
    }
  `
};
const GROUND_Y = -3;
const SHADOW_DEFAULTS = {
  lightDir: {
    x: 0,
    y: -0.95,
    z: -0.5
  },
  opacity: 0.3,
  blurRadius: 0.025
};
function createBackground() {
  const t = new PlaneGeometry(2, 2),
    e = {
      time: {
        value: 0
      },
      backgroundColor: {
        value: new Vector3()
      },
      fogColor: {
        value: new Vector3()
      },
      causticColor: {
        value: new Vector3()
      },
      causticIntensity: {
        value: 0.4
      },
      ambientLight: {
        value: 0.15
      },
      uReveal: {
        value: 1
      },
      cameraOffset: {
        value: new Vector2()
      },
      auroraIntensity: {
        value: 0
      },
      auroraColor1: {
        value: new Vector3()
      },
      auroraColor2: {
        value: new Vector3()
      }
    },
    n = new ShaderMaterial({
      uniforms: e,
      vertexShader: BACKGROUND_SHADER.vertex,
      fragmentShader: BACKGROUND_SHADER.fragment,
      depthWrite: !1,
      depthTest: !1
    }),
    r = new Mesh(t, n);
  return r.renderOrder = -3, r.frustumCulled = !1, {
    mesh: r,
    uniforms: e,
    dispose: () => {
      t.dispose(), n.dispose();
    }
  };
}
function createGrid() {
  const t = new PlaneGeometry(4e3, 4e3, 1, 1);
  t.rotateX(-Math.PI / 2);
  const e = {
      time: {
        value: 0
      },
      gridColor: {
        value: new Vector3()
      },
      gridOpacity: {
        value: 0.15
      },
      fogColor: {
        value: new Vector3()
      },
      cameraOffset: {
        value: new Vector2()
      },
      causticColor: {
        value: new Vector3()
      },
      causticIntensity: {
        value: 0.5
      },
      uFogNear: {
        value: 20
      },
      uFogFar: {
        value: 220
      }
    },
    n = new ShaderMaterial({
      uniforms: e,
      vertexShader: GRID_SHADER.vertex,
      fragmentShader: GRID_SHADER.fragment,
      transparent: !0,
      depthWrite: !1,
      side: DoubleSide
    }),
    r = new Mesh(t, n);
  return r.position.set(0, GROUND_Y, -30), {
    mesh: r,
    uniforms: e,
    dispose: () => {
      t.dispose(), n.dispose();
    }
  };
}
function createParticles(t) {
  const e = new Float32Array(t * 3),
    n = new Float32Array(t),
    r = new Float32Array(t),
    i = new Float32Array(t * 3);
  for (let c = 0; c < t; c++) e[c * 3] = (Math.random() - 0.5) * 30, e[c * 3 + 1] = (Math.random() - 0.5) * 20, e[c * 3 + 2] = (Math.random() - 0.5) * 40 - 10, n[c] = Math.random() * 0.5 + 0.5, r[c] = Math.random() * Math.PI * 2, i[c * 3 + 1] = Math.random() * 0.005 + 0.002;
  const s = new BufferGeometry();
  s.setAttribute("position", new BufferAttribute(e, 3)), s.setAttribute("size", new BufferAttribute(n, 1)), s.setAttribute("phase", new BufferAttribute(r, 1));
  const o = {
      time: {
        value: 0
      },
      particleColor: {
        value: new Vector3()
      },
      particleGlow: {
        value: new Vector3()
      },
      baseSize: {
        value: 0.15
      },
      cameraOffset: {
        value: new Vector2()
      }
    },
    a = new ShaderMaterial({
      uniforms: o,
      vertexShader: PARTICLE_SHADER.vertex,
      fragmentShader: PARTICLE_SHADER.fragment,
      transparent: !0,
      depthWrite: !1,
      blending: AdditiveBlending
    });
  return {
    points: new Points(s, a),
    uniforms: o,
    geo: s,
    velocities: i,
    dispose: () => {
      s.dispose(), a.dispose();
    }
  };
}
function createBokeh(t) {
  const e = new Float32Array(t * 3),
    n = new Float32Array(t),
    r = new Float32Array(t);
  for (let l = 0; l < t; l++) e[l * 3] = (Math.random() - 0.5) * 40, e[l * 3 + 1] = (Math.random() - 0.5) * 25, e[l * 3 + 2] = -Math.random() * 25 - 8, n[l] = Math.random() * 0.6 + 0.4, r[l] = Math.random() * Math.PI * 2;
  const i = new BufferGeometry();
  i.setAttribute("position", new BufferAttribute(e, 3)), i.setAttribute("size", new BufferAttribute(n, 1)), i.setAttribute("phase", new BufferAttribute(r, 1));
  const s = {
      time: {
        value: 0
      },
      bokehColor: {
        value: new Vector3()
      },
      baseSize: {
        value: 0.25
      }
    },
    o = new ShaderMaterial({
      uniforms: s,
      vertexShader: BOKEH_SHADER.vertex,
      fragmentShader: BOKEH_SHADER.fragment,
      transparent: !0,
      depthWrite: !1,
      blending: AdditiveBlending
    });
  return {
    points: new Points(i, o),
    uniforms: s,
    dispose: () => {
      i.dispose(), o.dispose();
    }
  };
}
function createShadow() {
  const t = new PlaneGeometry(1, 1),
    e = {
      silhouetteMap: {
        value: null
      },
      opacity: {
        value: SHADOW_DEFAULTS.opacity
      },
      blurRadius: {
        value: SHADOW_DEFAULTS.blurRadius
      },
      billboardPos: {
        value: new Vector3()
      },
      billboardSize: {
        value: new Vector2()
      },
      lightDir: {
        value: new Vector3().normalize()
      },
      groundY: {
        value: GROUND_Y
      }
    },
    n = new ShaderMaterial({
      uniforms: e,
      vertexShader: SHADOW_SHADER.vertex,
      fragmentShader: SHADOW_SHADER.fragment,
      transparent: !0,
      depthWrite: !1,
      side: DoubleSide
    }),
    r = new Mesh(t, n);
  return r.renderOrder = -2, r.visible = !1, r.frustumCulled = !1, {
    mesh: r,
    uniforms: e,
    mat: n,
    dispose: () => {
      t.dispose(), n.dispose();
    }
  };
}

function createModelSurface() {
  const Vb = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  Vb.needsUpdate = true;
  const t = new PlaneGeometry(1, 1),
    e = {
      live2DMap: {
        value: null
      },
      ambientBrightness: {
        value: 1
      },
      ambientContrast: {
        value: 1
      },
      ambientSaturation: {
        value: 1
      },
      ambientColor: {
        value: new Vector4(1, 1, 1, 0)
      },
      noriTint: {
        value: new Vector3(1, 0.18, 0.2)
      },
      noriTintAmount: {
        value: 0
      },
      uGlyphActive: {
        value: 0
      },
      uDraw: {
        value: 0
      },
      uGlow: {
        value: 0
      },
      uMorph: {
        value: 0
      },
      uWash: {
        value: 0
      },
      uNoriDim: {
        value: 0
      },
      uNoriReveal: {
        value: 1
      },
      uTimeS: {
        value: 0
      },
      uNoriRim: {
        value: 0
      },
      uNoriRimW: {
        value: 0.0075
      },
      ...h4e()
    };
  e.uField.value = Vb, e.uNoriSDF.value = Vb, e.uCloverSDF.value = Vb;
  const n = new ShaderMaterial({
      uniforms: e,
      vertexShader: DF.vertex,
      fragmentShader: DF.fragment,
      transparent: !0,
      depthWrite: !0,
      side: DoubleSide
    }),
    r = new Mesh(t, n);
  return r.renderOrder = -1, r.visible = !1, {
    mesh: r,
    uniforms: e,
    dispose: () => {
      t.dispose(), n.dispose(), Vb.dispose();
    }
  };
}
function createDebugGeometry() {
  const t = new BufferGeometry();
  t.setAttribute("position", new BufferAttribute(new Float32Array(15), 3));
  const e = new LineBasicMaterial({
      color: 16711935
    }),
    n = new Line(t, e);
  n.visible = !1;
  const r = new BufferGeometry().setFromPoints([new Vector3(-50, GROUND_Y, 0), new Vector3(50, GROUND_Y, 0)]),
    i = new LineBasicMaterial({
      color: 65535,
      transparent: !0,
      opacity: 0.8
    }),
    s = new LineSegments(r, i);
  s.visible = !1;
  const o = 20,
    a = new BufferGeometry();
  a.setAttribute("position", new BufferAttribute(new Float32Array(o * 3), 3)), a.setDrawRange(0, 0);
  const l = new LineBasicMaterial({
      color: 65535
    }),
    c = new LineSegments(a, l);
  c.visible = !1;
  const u = new BufferGeometry();
  u.setAttribute("position", new BufferAttribute(new Float32Array(o * 3), 3)), u.setDrawRange(0, 0);
  const d = new LineBasicMaterial({
      color: 16729156
    }),
    f = new LineSegments(u, d);
  return f.visible = !1, {
    shadowWire: n,
    groundLine: s,
    aboveLine: c,
    belowLine: f,
    dispose: () => {
      t.dispose(), e.dispose(), r.dispose(), i.dispose(), a.dispose(), l.dispose(), u.dispose(), d.dispose();
    }
  };
}
function updateDebugGeometry(t, e, n, r, i) {
  if (!e.mesh.visible) t.shadowWire.visible = !1;else if (t.shadowWire.visible = r, r) {
    const m = e.uniforms.lightDir.value,
      p = -m.x / m.y,
      v = -m.z / m.y,
      y = n.width / 2,
      x = n.height / 2,
      w = [{
        x: n.x - y,
        y: n.y - x
      }, {
        x: n.x + y,
        y: n.y - x
      }, {
        x: n.x + y,
        y: n.y + x
      }, {
        x: n.x - y,
        y: n.y + x
      }],
      S = t.shadowWire.geometry.attributes.position;
    for (let T = 0; T < 4; T++) {
      const R = w[T],
        E = Math.max(R.y, i) - i;
      S.setXYZ(T, R.x + p * E, i + 0.03, n.z + v * E);
    }
    S.setXYZ(4, S.getX(0), i + 0.03, S.getZ(0)), S.needsUpdate = !0;
  }
  const s = n.x - n.width / 2,
    o = n.x + n.width / 2,
    a = n.y + n.height / 2,
    l = n.y - n.height / 2,
    c = t.aboveLine.geometry.attributes.position,
    u = t.belowLine.geometry.attributes.position;
  let d = 0,
    f = 0;
  const h = (m, p, v, y) => {
      y ? c.setXYZ(d++, m, p, v) : u.setXYZ(f++, m, p, v);
    },
    _ = [{
      x: s,
      y: a
    }, {
      x: o,
      y: a
    }, {
      x: o,
      y: l
    }, {
      x: s,
      y: l
    }, {
      x: s,
      y: a
    }];
  for (let m = 0; m < _.length - 1; m++) {
    const p = _[m],
      v = _[m + 1],
      y = p.y > i,
      x = v.y > i;
    if (y === x) h(p.x, p.y, n.z, y), h(v.x, v.y, n.z, x);else {
      const w = (i - p.y) / (v.y - p.y),
        S = p.x + w * (v.x - p.x);
      h(p.x, p.y, n.z, y), h(S, i, n.z, y), h(S, i, n.z, x), h(v.x, v.y, n.z, x);
    }
  }
  c.needsUpdate = !0, u.needsUpdate = !0, t.aboveLine.geometry.setDrawRange(0, d), t.belowLine.geometry.setDrawRange(0, f), t.aboveLine.visible = r && d > 0, t.belowLine.visible = r && f > 0;
}
const LF = 192;
const NF = 288;
const OF = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
const M4e = `
  uniform sampler2D src;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(texture2D(src, vUv).a);
  }
`;
const T4e = `
  uniform sampler2D src;
  uniform float blurRadius;
  varying vec2 vUv;

  float sampleAlpha(vec2 uv) {
    return texture2D(src, clamp(uv, 0.001, 0.999)).a;
  }

  void main() {
    float alpha = 0.0;
    if (blurRadius <= 0.001) {
      alpha = sampleAlpha(vUv);
    } else {
      float sum = 0.0, wSum = 0.0;
      const int R = 4;
      float stp = blurRadius / float(R);
      for (int x = -R; x <= R; x++) {
        for (int y = -R; y <= R; y++) {
          float w = exp(-float(x*x + y*y) / 8.0);
          sum += sampleAlpha(vUv + vec2(float(x), float(y)) * stp) * w;
          wSum += w;
        }
      }
      alpha = sum / wSum;
    }
    gl_FragColor = vec4(alpha);
  }
`;
function createShadowPrepass(t) {
  const e = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: !1,
      stencilBuffer: !1
    },
    n = new WebGLRenderTarget(LF, NF, e),
    r = new WebGLRenderTarget(LF, NF, e),
    i = new PlaneGeometry(2, 2),
    s = {
      src: {
        value: null
      }
    },
    o = new ShaderMaterial({
      uniforms: s,
      vertexShader: OF,
      fragmentShader: M4e,
      depthTest: !1,
      depthWrite: !1
    }),
    a = {
      src: {
        value: n.texture
      },
      blurRadius: {
        value: 0
      }
    },
    l = new ShaderMaterial({
      uniforms: a,
      vertexShader: OF,
      fragmentShader: T4e,
      depthTest: !1,
      depthWrite: !1
    }),
    c = new Mesh(i, o);
  c.frustumCulled = !1;
  const u = new Scene();
  u.add(c);
  const d = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  function f(_, m) {
    s.src.value = _, a.blurRadius.value = m, c.material = o, t.setRenderTarget(n), t.render(u, d), c.material = l, t.setRenderTarget(r), t.render(u, d), t.setRenderTarget(null);
  }
  function h() {
    i.dispose(), o.dispose(), l.dispose(), n.dispose(), r.dispose();
  }
  return {
    texture: r.texture,
    update: f,
    dispose: h
  };
}
const R4e = new Vector3(0.22, 0, 0.02);
const A4e = new Vector3(0.3, 0.01, 0.03);
const P4e = new Vector3(0.7, 0.06, 0.06);
const FF = new Vector3(0.6, 0, 0.05);
const I4e = new Vector3(0.45, 0, 0);
const k4e = new Vector3(0.9, 0.12, 0.12);
const Ry = 2.5;
const D4e = 0.06;
const BF = 0.55;
const L4e = 1;
const N4e = 0.68;
const O4e = new Vector3(0.34, 0.005, 0.02);
const F4e = new Vector3(0.44, 0.02, 0.03);
const B4e = new Vector3(0.88, 0.05, 0.05);
const U4e = new Vector3(0.62, 0.02, 0.02);
const UF = new Vector3(1, 0.1, 0.1);
const V4e = 4.2;
const G4e = 0.22;
const j4e = new Vector3(0.016, 0.086, 0.114);
const H4e = new Vector3(0.03, 0.2, 0.27);
const z4e = new Vector3(0.13, 0.83, 0.93);
const VF = new Vector3(0.65, 0.95, 0.99);
const W4e = new Vector3(0.13, 0.83, 0.93);
const $4e = new Vector3(0.05, 0.45, 0.55);
const q4e = new Vector3(0.65, 0.95, 0.99);
const X4e = 1.6;
const K4e = 1.35;
const Y4e = 0.7;
const Z4e = 0.08;
const J4e = new Vector3(0.7, 0.76, 0.82);
const Q4e = 0.16;
const eBe = {
  bg: new Vector3(),
  fog: new Vector3(),
  caustic: new Vector3(),
  aurora1: new Vector3(),
  aurora2: new Vector3(),
  grid: new Vector3(),
  particle: new Vector3(),
  particleGlow: new Vector3(),
  bokeh: new Vector3(),
  causticIntensity: 0,
  ambientLight: 0,
  auroraIntensity: 0,
  gridOpacity: 0,
  alertDim: 1,
  phaseLit: 1,
  noriRim: 0
};
function scenePalette(t, e, n, r, i, s, o, a = 0) {
  const l = eBe;
  if (l.bg.set(t.backgroundColor.r, t.backgroundColor.g, t.backgroundColor.b), l.fog.set(t.fogColor.r, t.fogColor.g, t.fogColor.b), l.caustic.set(t.causticColor.r, t.causticColor.g, t.causticColor.b), l.aurora1.set(t.auroraColor1.r, t.auroraColor1.g, t.auroraColor1.b), l.aurora2.set(t.auroraColor2.r, t.auroraColor2.g, t.auroraColor2.b), l.grid.set(t.gridColor.r, t.gridColor.g, t.gridColor.b), l.particle.set(t.particleColor.r, t.particleColor.g, t.particleColor.b), l.particleGlow.set(t.particleGlow.r, t.particleGlow.g, t.particleGlow.b), l.bokeh.set(t.bokehColor.r, t.bokehColor.g, t.bokehColor.b), l.causticIntensity = t.causticIntensity, l.ambientLight = t.ambientLight, l.auroraIntensity = t.auroraIntensity, l.gridOpacity = t.gridOpacity, l.alertDim = 1, l.phaseLit = 1, l.noriRim = 0, s > 0) {
    l.bg.lerp(j4e, s), l.fog.lerp(H4e, s), l.caustic.lerp(z4e, s), l.aurora1.lerp(VF, s), l.aurora2.lerp(W4e, s), l.grid.lerp($4e, s), l.particle.lerp(q4e, s), l.particleGlow.lerp(VF, s);
    const c = 1 + G4e * Math.sin(2 * Math.PI * e / V4e);
    l.auroraIntensity *= 1 + s * (X4e * c - 1), l.causticIntensity *= 1 + s * (K4e * c - 1), l.noriRim = s * Y4e * c;
  }
  if (o > 0) {
    const c = 1 + (Z4e - 1) * o;
    l.bg.multiplyScalar(c), l.fog.multiplyScalar(c), l.caustic.multiplyScalar(c), l.aurora1.multiplyScalar(c), l.aurora2.multiplyScalar(c), l.grid.multiplyScalar(c), l.particle.multiplyScalar(c), l.particleGlow.multiplyScalar(c), l.bokeh.multiplyScalar(c), l.causticIntensity *= c, l.ambientLight *= c, l.auroraIntensity *= c * c, l.gridOpacity *= c, l.phaseLit = c, l.grid.lerp(J4e, o), l.gridOpacity += (Q4e - l.gridOpacity) * o;
  }
  if (l.bg.multiplyScalar(n), l.fog.multiplyScalar(n), l.caustic.multiplyScalar(n), l.aurora1.multiplyScalar(n), l.aurora2.multiplyScalar(n), l.grid.multiplyScalar(n), l.particle.multiplyScalar(n), l.particleGlow.multiplyScalar(n), l.bokeh.multiplyScalar(n), l.causticIntensity *= n, l.ambientLight *= n, l.auroraIntensity *= n * n, l.gridOpacity *= n, l.noriRim *= n, r > 0 && (l.bg.lerp(R4e, r), l.fog.lerp(A4e, r), l.caustic.lerp(P4e, r), l.aurora1.lerp(FF, r), l.aurora2.lerp(FF, r), l.grid.lerp(I4e, r), l.particle.lerp(k4e, r)), i > 0) {
    const c = 0.5 + 0.5 * Math.cos(2 * Math.PI * (a - D4e) / Ry),
      u = i * (BF + (L4e - BF) * c),
      d = 1 - i * N4e * (1 - c);
    l.alertDim = d, l.bg.lerp(O4e, u).multiplyScalar(d), l.fog.lerp(F4e, u).multiplyScalar(d), l.caustic.lerp(B4e, u).multiplyScalar(d), l.grid.lerp(U4e, u).multiplyScalar(d), l.particle.lerp(UF, u).multiplyScalar(d), l.particleGlow.lerp(UF, u).multiplyScalar(d), l.ambientLight *= d, l.auroraIntensity *= 1 - i, l.noriRim *= 1 - i;
  }
  return l;
}
const ENVIRONMENT = {
  backgroundColor: {
    r: 0.01,
    g: 0.05,
    b: 0.1
  },
  fogColor: {
    r: 0.04,
    g: 0.12,
    b: 0.2
  },
  particleColor: {
    r: 1,
    g: 0.85,
    b: 0.6
  },
  particleGlow: {
    r: 0.8,
    g: 0.6,
    b: 0.4
  },
  causticColor: {
    r: 0.3,
    g: 0.7,
    b: 0.8
  },
  gridColor: {
    r: 0.1,
    g: 0.25,
    b: 0.35
  },
  gridOpacity: 0.25,
  particleCount: 80,
  particleSize: 0.08,
  causticIntensity: 0.5,
  ambientLight: 0.92,
  ambientColor: {
    r: 0.4,
    g: 0.7,
    b: 1,
    intensity: 0.12
  },
  auroraIntensity: 0.4,
  auroraColor1: {
    r: 0.25,
    g: 0.5,
    b: 0.6
  },
  auroraColor2: {
    r: 0.3,
    g: 0.55,
    b: 0.65
  },
  bokehCount: 45,
  bokehColor: {
    r: 0.4,
    g: 0.9,
    b: 1
  }
};
function updateSceneMaterials(t, e, n) {
  const {
      bg: r,
      grid: i,
      particles: s,
      bokeh: o,
      shadow: a,
      effect: l,
      debug: c,
      camera: u
    } = t,
    {
      t: d,
      live2DTexture: f,
      glyphActive: h
    } = n,
    _ = ENVIRONMENT,
    m = e.cine,
    p = e.lit,
    v = e.ox,
    y = e.oy,
    {
      debugBillboard: x,
      debugShadow: w,
      showShadow: S,
      shadowDepthTest: T,
      isDebug: R
    } = e.debug,
    E = e.noriZ,
    M = scenePalette(_, d, p, m.redLight, e.alert, e.manifold, e.voidPhase, e.alertT);
  r.uniforms.time.value = d, r.uniforms.backgroundColor.value.copy(M.bg), r.uniforms.fogColor.value.copy(M.fog), r.uniforms.causticColor.value.copy(M.caustic), r.uniforms.causticIntensity.value = M.causticIntensity, r.uniforms.ambientLight.value = M.ambientLight, r.uniforms.cameraOffset.value.set(v, y), r.uniforms.auroraIntensity.value = M.auroraIntensity, r.uniforms.auroraColor1.value.copy(M.aurora1), r.uniforms.auroraColor2.value.copy(M.aurora2), i.uniforms.time.value = d, i.uniforms.gridColor.value.copy(M.grid), i.uniforms.gridOpacity.value = M.gridOpacity, i.uniforms.fogColor.value.copy(M.fog), i.uniforms.cameraOffset.value.set(v, y), i.uniforms.causticColor.value.copy(M.caustic), i.uniforms.causticIntensity.value = M.causticIntensity, i.uniforms.uFogNear.value = m.fogNear, i.uniforms.uFogFar.value = m.fogFar, s.uniforms.time.value = d, s.uniforms.particleColor.value.copy(M.particle), s.uniforms.particleGlow.value.copy(M.particleGlow), s.uniforms.baseSize.value = _.particleSize, s.uniforms.cameraOffset.value.set(v, y);
  const C = s.geo.getAttribute("position");
  for (let A = 0; A < _.particleCount; A++) C.array[A * 3 + 1] += s.velocities[A * 3 + 1], C.array[A * 3 + 1] > 12 && (C.array[A * 3 + 1] = -12, C.array[A * 3] = (Math.random() - 0.5) * 30, C.array[A * 3 + 2] = (Math.random() - 0.5) * 40 - 10);
  if (C.needsUpdate = !0, s.geo.setDrawRange(0, _.particleCount), o.uniforms.time.value = d, o.uniforms.bokehColor.value.copy(M.bokeh), o.points.visible = _.bokehCount > 0, o.points.geometry.setDrawRange(0, _.bokehCount), a.mesh.visible = S && !!f && (m.coldOpen?.noriForm ?? 1) > 1e-4, a.mesh.visible && (a.uniforms.opacity.value = w.opacity, a.uniforms.blurRadius.value = w.blurRadius, a.uniforms.billboardPos.value.set(x.x, x.y, E), a.uniforms.billboardSize.value.set(x.width, x.height), a.uniforms.lightDir.value.set(w.lightDir.x, w.lightDir.y, w.lightDir.z).normalize(), a.mat.depthTest = T), l.uniforms.uGlyphActive.value = h ? 1 : 0, l.mesh.visible = !!f && (h || (m.coldOpen?.noriForm ?? 1) > 1e-4), l.mesh.visible) {
    l.uniforms.live2DMap.value = f;
    const A = Math.min(1, Math.max(0, (40 - u.position.z) / (40 - 7.4))),
      k = Math.max(p * M.phaseLit, 0.05 + 0.3 * A);
    l.uniforms.ambientBrightness.value = _.ambientLight * k * Math.max(M.alertDim, 0.4), l.uniforms.ambientContrast.value = 1.1, l.uniforms.ambientSaturation.value = 0.95, l.uniforms.ambientColor.value.set(_.ambientColor.r, _.ambientColor.g, _.ambientColor.b, _.ambientColor.intensity), l.uniforms.noriTintAmount.value = m.noriTint, l.uniforms.uNoriDim.value = m.noriDim, l.uniforms.uNoriReveal.value = m.noriReveal, l.uniforms.uTimeS.value = d, l.uniforms.uNoriRim.value = M.noriRim, l.mesh.position.set(x.x, x.y, E), l.mesh.scale.set(x.width, x.height, 1);
  }
  c.groundLine.visible = R, updateDebugGeometry(c, a, x, R, GROUND_Y);
}
export { createBackground, createGrid, createParticles, createBokeh, createShadow, createModelSurface, createDebugGeometry, createShadowPrepass, updateSceneMaterials };
