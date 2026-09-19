/** Source-owned boot screen, fracture graph, baked shard physics and optical passes.
 * Reconstructed from authorized NormalApp reference X7e/t7e; no historic JS imports. */
import {
  WebGLRenderer,
  NoToneMapping,
  Scene,
  PerspectiveCamera,
  PMREMGenerator,
  DataTexture,
  RGBAFormat,
  FloatType,
  EquirectangularReflectionMapping,
  LinearSRGBColorSpace,
  LinearFilter,
  DirectionalLight,
  AmbientLight,
  Group,
  CanvasTexture,
  SRGBColorSpace,
  WebGLRenderTarget,
  ShaderMaterial,
  Vector2,
  Mesh,
  PlaneGeometry,
  OrthographicCamera,
  AdditiveBlending,
  Color,
  MeshPhysicalMaterial,
  RepeatWrapping,
  DoubleSide,
  MeshBasicMaterial,
  Shape,
  ExtrudeGeometry,
  HalfFloatType,
  FrontSide,
  Float32BufferAttribute,
  LineSegments,
  BufferGeometry,
  InstancedMesh,
  TetrahedronGeometry,
  InstancedBufferAttribute,
  Vector3,
  Quaternion,
  Matrix4,
} from "three";
const SHATTER_MARKERS = {
  CRACK_START: 0.628,
  CRACK_FULL: 0.847,
  BREAK: 0.85,
  OUT_END: 0.983,
};
const BOOT_DROPS = {
  DROP1: 0.2375,
  RETRY1: 0.3125,
  DROP2: 0.4125,
  RETRY2: 0.4625,
  DROP3: 0.5625,
  RETRY3: 0.6125,
  DEAD: 0.7,
};
const MZ = [
  { c: 0.4875, w: 0.006, kind: "line" },
  { c: 0.65, w: 0.006, kind: "line" },
  { c: 0.719, w: 0.007, kind: "n0r1" },
  { c: 0.7875, w: 0.009, kind: "n0r1" },
];
const oWe = [
  [BOOT_DROPS.DROP1, BOOT_DROPS.RETRY1],
  [BOOT_DROPS.DROP2, BOOT_DROPS.RETRY2],
  [BOOT_DROPS.DROP3, BOOT_DROPS.RETRY3],
];
const li = { PW: 4.7, PH: 2.95, OVERSCAN: 1.02, SEED: 1337, SCALE: 8.5 };
const TZ = Math.hypot(li.PW * 0.5, li.PH * 0.5);
const dn = {
  SHEET: "#070809",
  INK: "#e8eef2",
  STATUS: "rgba(232,238,242,0.34)",
  CALIBRATE: "rgba(232,238,242,0.30)",
  HAIRLINE: "rgba(232,238,242,0.13)",
  COLD: "#9fd8e6",
  TEAL: "#5eead4",
  SEAM_MAGENTA: "#ff2d6b",
  SEAM_CYAN: "#00e0ff",
};
const nm =
  "M85.29 40.03q0 1.7 -0.47 4.09t-1.02 4.06t-0.79 1.67q-0.53 0 -1.2 -1.14t-1.64 -2.34t-2.19 -1.32q-6.49 8.48 -6.49 15.09q0 3.04 1.52 5.79l7.83 8.48q4.56 5.26 4.56 10.76q0 3.22 -1.49 6.02t-4.12 2.81q-0.35 -4.39 -3.16 -7.54l-30.93 -34.15q-2.46 1.7 -3.6 5.03t-1.14 6.37q0 1.99 1.23 4.3t2.98 4.47l3.51 4.21q1.7 2.16 2.92 4.5t1.23 4.33q0 2.87 -1.87 5.15t-4.03 2.28h-12.04q-0.29 -0.58 -0.29 -0.7q0 -0.88 0.88 -1.11q1.46 -0.18 2.69 -1.29t1.23 -2.51q0 -1.58 -2.19 -7.63t-2.19 -8.8q0 -5.38 2.28 -11.11t7.07 -8.95l-3.63 -3.98q-4.56 -5.26 -4.56 -10.82q0 -5.03 4.09 -9.47h1.52q0.18 5.09 3.04 8.3l22.22 24.67l0.18 0.12q2.05 -9.18 6.9 -15.32q-8.6 -2.16 -8.6 -9.12q0 -2.28 0.41 -4.09t0.99 -2.75t1.14 -1.52t0.96 -0.7l0.41 -0.18q0.64 0.47 0.82 1.08t0.26 1.14t0.56 1.17t2.1 1.43t4.44 1.67q1.52 0.41 2.57 0.82t2.37 1.26t2.02 2.22t0.7 3.25z";
const Y2 = [
  {
    tx: -7,
    ty: 4.5,
    sk: -7,
    sc: 1.03,
    op: 0.34,
    stroke: "rgba(159,216,230,0.9)",
  },
  {
    tx: 6.5,
    ty: -4,
    sk: 6,
    sc: 1.07,
    op: 0.24,
    stroke: "rgba(159,216,230,0.9)",
  },
  {
    tx: -2.5,
    ty: -7.5,
    sk: 0,
    sc: 0.93,
    op: 0.17,
    stroke: "rgba(94,234,212,0.8)",
  },
];
const SHATTER_PARAMETERS = {
  shatterDuration: {
    default: 16,
    min: 8,
    max: 24,
    step: 0.5,
    label: "duration",
  },
  glitch: { default: 1, min: 0, max: 1.5, step: 0.05, label: "glitch" },
  crackWidth: {
    default: 1.6,
    min: 0.5,
    max: 4,
    step: 0.1,
    label: "crack px",
  },
  darkCore: { default: 1, min: 0, max: 2.5, step: 0.05, label: "dark core" },
  silver: { default: 1, min: 0, max: 2.5, step: 0.05, label: "silver glint" },
  chromaAmt: {
    default: 1,
    min: 0,
    max: 3,
    step: 0.05,
    label: "crack chroma",
  },
  energy: { default: 0.75, min: 0.2, max: 1, step: 0.05, label: "⟲ energy" },
  events: { default: 72, min: 24, max: 120, step: 4, label: "⟲ events" },
  chips: { default: 150, min: 0, max: 160, step: 5, label: "⟲ chips" },
  maxPlate: {
    default: 0.42,
    min: 0.35,
    max: 2,
    step: 0.05,
    label: "⟲ plate size",
  },
  debris: {
    default: 2e3,
    min: 0,
    max: 2200,
    step: 20,
    label: "⟲ fines budget",
  },
  thickness: {
    default: 0.024,
    min: 0.015,
    max: 0.15,
    step: 0.005,
    label: "⟲ glass th",
  },
  drainTime: {
    default: 0.9,
    min: 0.4,
    max: 1.6,
    step: 0.05,
    label: "⟲ drain s",
  },
  gravity: {
    default: 0.3,
    min: 0,
    max: 2,
    step: 0.05,
    label: "⟲ gravity ×9.81",
  },
  shock: {
    default: 1,
    min: 0.2,
    max: 2.5,
    step: 0.05,
    label: "⟲ breach punch",
  },
  flowForce: {
    default: 9,
    min: 0,
    max: 18,
    step: 0.1,
    label: "⟲ suction force",
  },
  coneSpread: {
    default: 1,
    min: 0.3,
    max: 2,
    step: 0.05,
    label: "⟲ flow spread",
  },
  dragQuad: {
    default: 1.3,
    min: 0,
    max: 3,
    step: 0.05,
    label: "⟲ drag (v²)",
  },
  dragLin: { default: 0.6, min: 0, max: 3, step: 0.05, label: "⟲ drag (v)" },
  alignAero: { default: 1, min: 0, max: 3, step: 0.05, label: "⟲ flutter" },
  spinDrag: {
    default: 0.8,
    min: 0,
    max: 3,
    step: 0.05,
    label: "⟲ spin drag",
  },
  simSpeed: {
    default: 1,
    min: 0.3,
    max: 2.5,
    step: 0.05,
    label: "sim speed",
  },
  suctionV: {
    default: 1,
    min: 0.3,
    max: 2.2,
    step: 0.05,
    label: "fines flow",
  },
  tauScale: { default: 1, min: 0.4, max: 2.5, step: 0.05, label: "fines τ" },
  camDive: { default: 4, min: 0, max: 6, step: 0.1, label: "dive speed" },
  envPunch: { default: 1, min: 0, max: 3, step: 0.05, label: "env punch" },
  rimGlint: { default: 0.35, min: 0, max: 6, step: 0.1, label: "rim glint" },
  rimPower: { default: 3.4, min: 1, max: 6, step: 0.1, label: "rim falloff" },
  filigree: {
    default: 1.9,
    min: 0,
    max: 3,
    step: 0.05,
    label: "edge filigree",
  },
  refrAmt: { default: 1, min: 0, max: 2.5, step: 0.05, label: "refraction" },
  bloom: { default: 1, min: 0, max: 2, step: 0.05, label: "bloom" },
  bloomThresh: {
    default: 0.92,
    min: 0.4,
    max: 1.4,
    step: 0.02,
    label: "bloom thresh",
  },
  seaDim: { default: 0.9, min: 0, max: 1, step: 0.05, label: "sea @ break" },
  beamGlow: { default: 1, min: 0, max: 3, step: 0.05, label: "beam glow" },
  lensMax: { default: 0.34, min: 0, max: 1, step: 0.02, label: "lens bulge" },
  lensChroma: {
    default: 0.006,
    min: 0,
    max: 0.04,
    step: 0.002,
    label: "lens chroma",
  },
};
function shatterDefaults(t) {
  const e = {};
  for (const n of Object.keys(SHATTER_PARAMETERS))
    e[n] = t[n] ?? SHATTER_PARAMETERS[n].default;
  return e;
}
const ml = (t) => {
  const e = Math.sin(t * 127.1 + 311.7) * 43758.5453;
  return e - Math.floor(e);
};
const kI = (t) => {
  const e = Math.sin(t * 269.5 + 183.3) * 23421.6312;
  return e - Math.floor(e);
};
const ur = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const jr = (t, e, n) => ur((t - e) / (n - e));
const DI = (t) => {
  const e = 1 - t;
  return 1 - e * e * e;
};
const Fv = (t) => t * t * t;
const xWe = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * (t - 1)));
const wWe = (t, e, n) => {
  const r = (t - e) / n;
  return Math.exp(-r * r);
};
const LI = `
float beamGR( vec3 wp ){
  float dx = wp.x - 0.6 - 0.22 * wp.y;
  return exp( - dx * dx / 2.6 );
}`;
function SWe() {
  const e = new Uint8Array(65536),
    n = (o, a) => {
      let l = (o * 374761393 + a * 668265263) ^ 0x14057b7ef7678100;
      return (
        (l = Math.imul(l ^ (l >>> 13), 1274126177)),
        ((l ^ (l >>> 16)) >>> 0) / 4294967296
      );
    },
    r = (o, a) => {
      const l = Math.floor(o),
        c = Math.floor(a),
        u = o - l,
        d = a - c,
        f = u * u * (3 - 2 * u),
        h = d * d * (3 - 2 * d),
        _ = (m, p) => n(((m % 8) + 8) % 8, ((p % 8) + 8) % 8);
      return (
        (_(l, c) * (1 - f) + _(l + 1, c) * f) * (1 - h) +
        (_(l, c + 1) * (1 - f) + _(l + 1, c + 1) * f) * h
      );
    },
    i = (o, a) =>
      r((o / 128) * 8, (a / 128) * 8) +
      0.45 * r((o / 128) * 8 * 2.7 + 3.1, (a / 128) * 8 * 2.7 + 1.7);
  for (let o = 0; o < 128; o++)
    for (let a = 0; a < 128; a++) {
      const l = i(a + 1, o) - i(a - 1, o),
        c = i(a, o + 1) - i(a, o - 1),
        u = (o * 128 + a) * 4;
      ((e[u] = 128 + Math.max(-127, Math.min(127, l * 240))),
        (e[u + 1] = 128 + Math.max(-127, Math.min(127, c * 240))),
        (e[u + 2] = 255),
        (e[u + 3] = 255));
    }
  const s = new DataTexture(e, 128, 128, RGBAFormat);
  return ((s.wrapS = s.wrapT = RepeatWrapping), (s.needsUpdate = !0), s);
}
function createGlassMaterial(t, e, n, r) {
  const i = new MeshPhysicalMaterial({
    emissiveMap: t,
    emissive: 16777215,
    emissiveIntensity: 1.25,
    color: 263946,
    metalness: 0,
    roughness: 0.022,
    dispersion: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularIntensity: 1.2,
    envMapIntensity: 0.55,
    iridescence: 0.04,
    iridescenceIOR: 1.3,
    normalMap: SWe(),
    normalScale: new Vector2(0.08, 0.08),
    side: DoubleSide,
  });
  return (
    (i.transparent = !0),
    (i.onBeforeCompile = (s) => {
      ((s.uniforms.uRefrTex = e.tex),
        (s.uniforms.uRefrRes = e.res),
        (s.uniforms.uRefrAmt = e.amt),
        (s.uniforms.uRefrDim = e.dim),
        (s.uniforms.uTb = n.tb),
        (s.uniforms.uBeamOn = r.on),
        (s.vertexShader = s.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
        attribute float aDeath;
        attribute float aArea;
        varying float vDeath;
        varying float vArea;
        varying vec3 vWPosGR;`,
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
        vDeath = aDeath;
        vArea = aArea;
        vWPosGR = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;`,
          )),
        (s.fragmentShader = s.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
        uniform sampler2D uRefrTex;
        uniform vec2 uRefrRes;
        uniform float uRefrAmt;
        uniform float uRefrDim;
        uniform float uTb;
        uniform float uBeamOn;
        varying float vDeath;
        varying float vArea;
        varying vec3 vWPosGR;
        ${LI}
        // exact inverse of the blit's ACES fit (same as the backdrop quad) so
        // the refracted sea round-trips the grade instead of double-grading
        vec3 acesInvGR( vec3 y ){
          y = clamp( y, 0.0, 0.999 );
          vec3 a = 2.51 - 2.43 * y, b = 0.03 - 0.59 * y;
          return ( sqrt( b * b + 0.56 * y * a ) - b ) / ( 2.0 * a );
        }`,
          )
          .replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
        {
          // r03 per-shard page-light death: the display dies from the breach
          // OUTWARD (vDeath = per-shard delay) — quadratic ember falloff plus
          // the global one-frame rupture flash, then a tiny phosphor residue
          // r04: faster ember (0.24 → 0.17) + dimmer residue — by the reveal
          // frames the field must be dark glass, not lit gray plates
          // r05 (review #2: the rupture frame is "chunky gray facets"): a
          // POWER-CUT — flash, then the whole field collapses dark within
          // ~0.2 s (ember 0.17 → 0.11, residue 0.007 → 0.004); only the rim
          // shards still ember when the burst is read
          // r06 (review #2: image 4's broad charcoal faces ARE the embers):
          // faster still (0.11 → 0.085, residue → 0.002) AND the dying face
          // gains VIEW-ANGLE dependence — flat emissive paper has none, glass
          // does; tilted ember plates now shade dark instead of reading as
          // uniform gray cardboard wedges
          float dk = clamp( ( uTb - vDeath ) / 0.085, 0.0, 1.0 );
          float live = ( 1.0 - dk ) * ( 1.0 - dk );
          float flash = 0.95 * exp( - ( uTb * uTb ) / 0.0016 );
          float aVN = abs( dot( normalize( vViewPosition ), normalize( normal ) ) );
          float glassy = mix( 1.0, 0.25 + 0.75 * aVN, clamp( dk * 1.6, 0.0, 1.0 ) );
          totalEmissiveRadiance *= ( live * glassy + 0.002 + flash );
        }`,
          )
          .replace(
            "#include <opaque_fragment>",
            `
        {
          // r07 AREA EXTINCTION (review #2): once the breach is open, BIG
          // plates surrender their steady optical reads — env/specular ramp
          // out by area within ~0.35 s of the break.
          // r09 TRANSMISSION, NOT SILHOUETTE (review #3, through the material
          // lens): r07 also cut the refraction gain ×0.3, which turned every
          // extinct plate into a matte-black CUTOUT — the reviewed "broad
          // opaque charcoal slabs blocking the underwater handoff". Real big
          // glass in a dark volume is a WINDOW: it shows the world behind it,
          // slightly shifted. Extinction now REDIRECTS the optical budget
          // into transmission — env/spec die, the refracted sea gain RISES.
          // r10 IDENTITY WINDOW (review #2, third pass — the slabs STILL read
          // as cardboard): r09's window AMPLIFIED the sea ×1.7, tinted it
          // green, and dimmed it by fresnel — a plate was always brighter or
          // darker than the pixels it covered, so its silhouette never died.
          // Extinct transmission now converges to IDENTITY: gain → 1.0,
          // tint → neutral, fresnel-dimming → none, displacement → ~0 (thin
          // glass barely shifts the world). A big plate equals the background
          // it covers = invisible (refs 10/11: faces vanish into black);
          // small shards keep the shifted, tinted, amplified view — the
          // per-shard optical identity lives where the refs put it.
          float killA = vArea * clamp( ( uTb - 0.08 ) / 0.27, 0.0, 1.0 );
          outgoingLight *= mix( 1.0, 0.05, killA );
          // screen-space refraction: the dark sea, displaced along the face
          // normal — the micro normal map makes the displacement WOBBLE
          // (frost variation), and each shard's tumble angle gives it its own
          // shifted view of the world (ref-11013502's refraction jumps,
          // refs 7191394/10514906's near-invisible transmissive faces).
          // Large faces expose the real ocean at the rupture frame. Sampling
          // the ocean snapshot on them produces a screen-aligned blue plate;
          // small shards retain refraction so their tumble still reads.
          float ruptureOn = step( 0.0, uTb );
          float largeFace = smoothstep( 0.55, 0.9, vArea );
          float windowT = largeFace * ruptureOn;
          vec2 sUV = gl_FragCoord.xy / uRefrRes;
          vec3 nV = normalize( normal );
          vec2 off = nV.xy * ( 0.085 * uRefrAmt ) * mix( 1.0, 0.15, windowT );
          vec3 refrS = texture2D( uRefrTex, clamp( sUV - off, vec2( 0.001 ), vec2( 0.999 ) ) ).rgb;
          refrS = acesInvGR( refrS ) / 1.05;
          vec3 Vv = normalize( vViewPosition );
          float Fg = 0.04 + 0.96 * pow( 1.0 - abs( dot( Vv, nV ) ), 5.0 );
          // Before separation, adjacent faces sample an aligned snapshot and
          // reconstruct one bright rectangular pane. Refraction appears only
          // after the shards have started moving independently.
          float refractionOpen = smoothstep( 0.1, 0.24, uTb );
          float trG = 1.7 * ( 1.0 - Fg ) * mix( 1.0, 0.15, vArea )
                    * ( 1.0 - windowT ) * refractionOpen;
          vec3 trTint = mix( vec3( 0.82, 1.0, 0.92 ), vec3( 1.0 ), windowT );
          outgoingLight += refrS * uRefrDim * trG * trTint;
          // r09: the visible god-ray column TRANSMITS through the plates —
          // the beam plane sits behind the shard field (z=-2, depth-tested),
          // so an opaque plate used to silhouette black against it (the
          // reviewed "rectangular beam column" blocked by slabs). Same
          // gaussian + vertical envelope as makeBeamMat, no striations
          // (diffused by the frosted faces): a plate crossing the column now
          // GLOWS with the column, and the breach breathes through the glass.
          // r10: the (1-Fg) factor made tilted plates BLOCK the column (dark
          // slab against the beam) — angle response is now mild, and the
          // through-gain tracks killA so the column reads ~continuous through
          // an extinct plate
          float vertB = smoothstep( -8.0, 5.0, vWPosGR.y )
                      * ( 0.45 + 0.55 * smoothstep( -6.0, 7.0, vWPosGR.y ) );
          outgoingLight += vec3( 0.55, 0.78, 0.76 ) * beamGR( vWPosGR ) * vertB
                         * uBeamOn * 0.8 * ( 0.55 + 0.45 * ( 1.0 - Fg ) )
                         * ( 0.3 + 0.7 * killA );
          // r06 RARE FULL-FACE FLASH (review #2 / refs 7191394/10514906: a
          // face is invisible until it MIRRORS the source to the eye, then it
          // burns for a frame or two). Mirror-lobe test against the same two
          // sources as the edge filigree (overhead pool + tilted shaft), high
          // exponent = geometrically rare; per-shard hash (from the baked
          // death delay) varies peak brightness. Pure function of pose.
          // r07: flashes obey THE BEAM — a face firing outside the column
          // glints dim; inside, it burns (refs 10/11's beam-lit grammar).
          vec3 Rm = reflect( -Vv, nV );
          vec3 L1f = normalize( ( viewMatrix * vec4( 0.18, 0.94, 0.28, 0.0 ) ).xyz );
          vec3 L2f = normalize( ( viewMatrix * vec4( -0.5, 0.62, 0.55, 0.0 ) ).xyz );
          float hsF = fract( sin( vDeath * 9871.7 ) * 43758.5453 );
          float fGl = pow( max( dot( Rm, L1f ), 0.0 ), 140.0 ) * 2.6
                    + pow( max( dot( Rm, L2f ), 0.0 ), 90.0 ) * 3.4;
          outgoingLight += vec3( 0.82, 1.0, 0.95 ) * fGl * ( 0.35 + 1.1 * hsF )
                         * ( 0.22 + 1.05 * beamGR( vWPosGR ) );
        }
        #include <opaque_fragment>
        // light-death → clear glass: drop the shard's alpha as it dies so the bright
        // ocean (real #ocean canvas behind the boot) shows THROUGH it. Pure fn of the
        // per-shard death delay (scrub-safe); ~flash frame stays opaque (the burst).
        gl_FragColor.a *= mix(1.0, 0.18, clamp((uTb - vDeath) / 0.085, 0.0, 1.0));
        // Remove large faces at rupture while preserving their side walls and
        // edge filigree. Recomputed here because the block above has ended.
        float largeFaceAlpha = smoothstep(0.55, 0.9, vArea) * step(0.0, uTb);
        gl_FragColor.a *= 1.0 - largeFaceAlpha;`,
          )));
    }),
    (i.customProgramCacheKey = () => "ssRefrFace15"),
    i
  );
}
function TWe(t) {
  return new MeshBasicMaterial({ map: t });
}
function EWe() {
  return new MeshPhysicalMaterial({
    color: 4160102,
    metalness: 0,
    roughness: 0.2,
    specularIntensity: 1,
    specularColor: new Color(16056319),
    dispersion: 0.07,
    clearcoat: 0.75,
    clearcoatRoughness: 0.08,
    envMapIntensity: 2,
    side: DoubleSide,
  });
}
function CWe(t) {
  return new ShaderMaterial({
    blending: AdditiveBlending,
    transparent: !0,
    depthWrite: !1,
    depthTest: !0,
    uniforms: { uGain: t.gain, uCol: { value: new Color(14286836) } },
    vertexShader: `
      attribute vec3 aDir;
      attribute float aH;
      attribute float aAlong;
      attribute float aLen;
      attribute float aGate;
      varying float vH; varying float vAlong; varying float vLen; varying float vGate; varying vec3 vDirW; varying vec3 vWPos;
      void main() {
        vH = aH; vAlong = aAlong; vLen = aLen; vGate = aGate;
        vDirW = normalize( mat3( modelMatrix ) * aDir );
        vec4 wp = modelMatrix * vec4( position, 1.0 );
        vWPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uGain; uniform vec3 uCol;
      varying float vH; varying float vAlong; varying float vLen; varying float vGate; varying vec3 vDirW; varying vec3 vWPos;
      ${LI}
      void main() {
        vec3 V = normalize( cameraPosition - vWPos );
        // two sources: the overhead surface pool + the tilted god-ray shaft
        vec3 L1 = normalize( vec3( 0.18, 0.94, 0.28 ) );
        vec3 L2 = normalize( vec3( -0.5, 0.62, 0.55 ) );
        vec3 H1 = normalize( L1 + V );
        vec3 H2 = normalize( L2 + V );
        float d1 = dot( vDirW, H1 );
        float d2 = dot( vDirW, H2 );
        float s1 = pow( max( 1.0 - d1 * d1, 0.0 ), 30.0 );
        float s2 = pow( max( 1.0 - d2 * d2, 0.0 ), 44.0 );
        // r08: far fewer edges exist at all (one rim, halved keep) — the
        // survivors burn hotter so a firing trace still hits the bloom
        // r09 (review #2: "require beam plus strong orientation before a
        // line EXISTS, not just before it brightens"): a hard glint floor —
        // weak alignments now produce NOTHING instead of a dim dash; the
        // residual dim-dash population was rebuilding the confetti cage
        float g = max( 4.4 * s1 + 3.4 * s2 - 0.55, 0.0 ) * 1.3;
        // one hot streak per rim, hash-placed, + a RARE faint secondary —
        // most of every edge is dark; the streak is the whole identity.
        // r07 (review #3: "post-break edge field too continuous and webby"):
        // the streak window is capped in ABSOLUTE length — long plate rims
        // near the lens were drawing frame-crossing lines because the window
        // scaled with edge length; a real glint trace has a fixed physical
        // extent regardless of how long the edge is.
        float u = vAlong / max( vLen, 1e-4 );
        float c1 = fract( vH * 13.73 );
        float w1 = 0.05 + 0.11 * fract( vH * 29.31 );
        float wN = min( w1 * vLen, 0.42 ) / max( vLen, 1e-4 );
        float prof = exp( - pow( ( u - c1 ) / wN, 2.0 ) )
                   + 0.45 * step( 0.62, fract( vH * 5.21 ) )
                     * exp( - pow( ( u - fract( vH * 7.39 + 0.43 ) ) / ( wN * 0.55 ), 2.0 ) );
        // r07 THE BEAM (shared with faces + glitter): outside the column the
        // filigree sinks to near-black — black negative space owns the frame,
        // brilliance clusters in one soft shaft (refs 10/11)
        // r08 (review #2: "remove the beam floor"): NO floor — an edge trace
        // outside the column simply does not exist; off-axis brightness
        // belongs to the point sparks, which keep their own soft floor
        // r09: steeper beam response (pow 1.4) — a trace at the column's
        // skirt no longer survives at half strength
        float beamC = beamGR( vWPos );
        float beam = 1.6 * pow( beamC, 1.4 );
        float depthK = clamp( 1.55 - 0.085 * length( cameraPosition - vWPos ), 0.3, 1.1 );
        // rare hot beads (point sparks) — live rims only, glint-gated; beads
        // keep a small off-beam presence (they are the spark population)
        float bead = step( 0.93, fract( vAlong * 3.1 + vH * 7.0 ) );
        vec3 col = uCol * g * prof * vGate * beam * depthK
                 + vec3( 1.0 ) * bead * ( 0.02 + 0.9 * g ) * vGate * ( 0.12 + 1.1 * beamC );
        gl_FragColor = vec4( col * uGain, 1.0 );
      }`,
  });
}
function RWe() {
  return new ShaderMaterial({
    blending: AdditiveBlending,
    transparent: !0,
    depthWrite: !1,
    depthTest: !0,
    uniforms: { uOn: { value: 0 }, uT: { value: 0 } },
    vertexShader: `
      varying vec3 vWP;
      void main() {
        vec4 wp = modelMatrix * vec4( position, 1.0 );
        vWP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uOn; uniform float uT;
      varying vec3 vWP;
      void main() {
        float dx = vWP.x - 0.6 - 0.22 * vWP.y;
        float core = exp( - dx * dx / 2.6 );
        // brighter toward the surface, dissolving into the deep
        float vert = smoothstep( -8.0, 5.0, vWP.y ) * ( 0.45 + 0.55 * smoothstep( -6.0, 7.0, vWP.y ) );
        // god-ray striations: slow drift, deterministic in uT — three
        // incommensurate frequencies at low contrast so the rays read as
        // soft watery banding, never a regular venetian blind
        float st = 0.68
          + 0.16 * sin( dx * 5.3 - uT * 0.45 + vWP.y * 0.21 )
          + 0.1 * sin( dx * 12.7 + uT * 0.3 + 1.7 )
          + 0.07 * sin( dx * 29.3 - uT * 0.2 + vWP.y * 0.5 );
        vec3 col = vec3( 0.55, 0.78, 0.76 ) * core * vert * st * uOn;
        gl_FragColor = vec4( col, 1.0 );
      }`,
  });
}
function createEdgeMaterial(t, e, n) {
  return (
    (t.onBeforeCompile = (r) => {
      ((r.uniforms.uRimI = e.intensity),
        (r.uniforms.uRimPow = e.power),
        (r.uniforms.uRimCol = e.color),
        (r.uniforms.uTbGR = n.tb),
        (r.vertexShader = r.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
        attribute float aArea;
        varying float vAreaGR;
        varying vec3 vPosGR;`,
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
        vPosGR = position;
        vAreaGR = aArea;`,
          )),
        (r.fragmentShader = r.fragmentShader
          .replace(
            "uniform vec3 emissive;",
            `uniform vec3 emissive;
uniform float uRimI;
uniform float uRimPow;
uniform vec3 uRimCol;
uniform float uTbGR;
varying vec3 vPosGR;
varying float vAreaGR;`,
          )
          .replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
        {
          vec3 rimV = normalize( vViewPosition );
          float rimF = pow( clamp( 1.0 - abs( dot( rimV, normal ) ), 0.0, 1.0 ), uRimPow );
          // broken filigree (refs 10514906/10231104): real fracture edges
          // sparkle in dashes, not as continuous neon bars — gate the rim by
          // object-space hash noise along the edge
          // r01: SPARSER + HOTTER — fewer dashes survive the gate but each
          // burns brighter (the refs' edge filigree is broken brilliance, the
          // old continuous cyan band was the "slabby rim" tell)
          float gh = fract( sin( dot( floor( vPosGR.xy * 26.0 ), vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
          float gate = smoothstep( 0.55, 0.9, gh );
          // r07 area extinction (shared grammar with the faces): big plates'
          // rims stop outlining once the breach frames the dive
          float killGR = vAreaGR * clamp( ( uTbGR - 0.08 ) / 0.27, 0.0, 1.0 );
          totalEmissiveRadiance += uRimCol * ( rimF * uRimI * ( 0.05 + 2.3 * gate ) )
                                 * mix( 1.0, 0.12, killGR );
        }`,
          )
          .replace(
            "#include <opaque_fragment>",
            `
        {
          // r07 (review #2: "green side strips… reduce side env intensity"):
          // the side walls of LARGE plates go optically dead with the same
          // area-extinction ramp — thick-edge green survives only on small
          // shards, where real thick-edge tint lives
          // r10 (review #2: "kill side-wall green harder"): 0.18 → 0.06,
          // ramp matched to the faces' tightened extinction
          float killS = vAreaGR * clamp( ( uTbGR - 0.08 ) / 0.27, 0.0, 1.0 );
          outgoingLight *= mix( 1.0, 0.06, killS );
        }
        #include <opaque_fragment>`,
          )));
    }),
    (t.customProgramCacheKey = () => "fresnelRimFiligree4"),
    t
  );
}
function PWe() {
  const t = new MeshPhysicalMaterial({
    color: 15398648,
    metalness: 0,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 9,
    specularIntensity: 1.2,
    emissive: 13625580,
    emissiveIntensity: 1.05,
  });
  return (
    (t.onBeforeCompile = (e) => {
      ((e.vertexShader = e.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
        attribute float aLuck;
        varying float vLuck;
        varying vec3 vWPosGl;`,
        )
        .replace(
          "#include <project_vertex>",
          `#include <project_vertex>
        vec4 wpGl = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          wpGl = instanceMatrix * wpGl;
        #endif
        vWPosGl = ( modelMatrix * wpGl ).xyz;
        vLuck = aLuck;`,
        )),
        (e.fragmentShader = e.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
        varying float vLuck;
        varying vec3 vWPosGl;
        ${LI}`,
          )
          .replace(
            "#include <opaque_fragment>",
            `
        outgoingLight *= ( 0.2 + 1.3 * beamGR( vWPosGl ) ) * vLuck;
        #include <opaque_fragment>`,
          )));
    }),
    (t.customProgramCacheKey = () => "glitterLuck2"),
    t
  );
}
function IWe() {
  return new MeshBasicMaterial({
    color: 10470607,
    transparent: !0,
    opacity: 0.16,
    blending: AdditiveBlending,
    depthWrite: !1,
  });
}
function kWe() {
  const n = document.createElement("canvas");
  ((n.width = 1024), (n.height = 512));
  const r = n.getContext("2d");
  if (!r) throw new Error("boot env: 2D context unavailable");
  let i = r.createLinearGradient(0, 0, 0, 512);
  (i.addColorStop(0, "#2a4a55"),
    i.addColorStop(0.18, "#11272f"),
    i.addColorStop(0.5, "#061218"),
    i.addColorStop(1, "#010406"),
    (r.fillStyle = i),
    r.fillRect(0, 0, 1024, 512),
    (i = r.createRadialGradient(
      1024 * 0.5,
      512 * 0.02,
      0,
      1024 * 0.5,
      512 * 0.02,
      512 * 0.42,
    )),
    i.addColorStop(0, "rgba(225,245,250,0.95)"),
    i.addColorStop(0.35, "rgba(150,200,215,0.35)"),
    i.addColorStop(1, "rgba(120,180,200,0)"),
    (r.fillStyle = i),
    r.fillRect(0, 0, 1024, 512 * 0.5),
    ((f, h, _, m) => {
      for (let p = 0; p < 512 * 0.92; p += 4) {
        const v = p / 471.04,
          y = (h + (_ - h) * v) * 1024,
          x = m * (1 - v * 0.72),
          w = r.createLinearGradient(f * 1024 - y, 0, f * 1024 + y, 0);
        (w.addColorStop(0, "rgba(190,240,235,0)"),
          w.addColorStop(0.5, `rgba(205,248,240,${x})`),
          w.addColorStop(1, "rgba(190,240,235,0)"),
          (r.fillStyle = w),
          r.fillRect(f * 1024 - y, p, y * 2, 4));
      }
    })(0.56, 0.016, 0.05, 0.85));
  const o = (f, h, _, m, p) => {
    ((i = r.createRadialGradient(
      f * 1024,
      h * 512,
      0,
      f * 1024,
      h * 512,
      _ * 1024,
    )),
      i.addColorStop(0, `rgba(${m},${p})`),
      i.addColorStop(1, `rgba(${m},0)`),
      (r.fillStyle = i),
      r.fillRect(0, 0, 1024, 512));
  };
  (o(0.2, 0.3, 0.13, "110,170,185", 0.1),
    o(0.84, 0.26, 0.1, "120,185,195", 0.08),
    o(0.68, 0.55, 0.16, "70,130,150", 0.06),
    o(0.36, 0.62, 0.2, "50,100,120", 0.05),
    o(0.75, 0.45, 0.28, "90,140,160", 0.04));
  const a = r.getImageData(0, 0, 1024, 512).data,
    l = new Float32Array(1024 * 512 * 4),
    c = (f) => {
      const h = f / 255;
      return h <= 0.04045 ? h / 12.92 : ((h + 0.055) / 1.055) ** 2.4;
    },
    u = 7.5;
  for (let f = 0; f < 512; f++) {
    const h = f * 1024 * 4,
      _ = (511 - f) * 1024 * 4;
    for (let m = 0; m < 1024 * 4; m += 4) {
      const p = c(a[h + m]),
        v = c(a[h + m + 1]),
        y = c(a[h + m + 2]),
        x = 0.2126 * p + 0.7152 * v + 0.0722 * y,
        w = Math.min(1, Math.max(0, (x - 0.3) / 0.55)),
        S = 1 + u * w * w * (3 - 2 * w);
      ((l[_ + m] = p * S),
        (l[_ + m + 1] = v * S),
        (l[_ + m + 2] = y * S),
        (l[_ + m + 3] = 1));
    }
  }
  const d = new DataTexture(l, 1024, 512, RGBAFormat, FloatType);
  return (
    (d.mapping = EquirectangularReflectionMapping),
    (d.colorSpace = LinearSRGBColorSpace),
    (d.magFilter = LinearFilter),
    (d.minFilter = LinearFilter),
    (d.needsUpdate = !0),
    d
  );
}
const { PW: Dn, PH: tr, SEED: DWe } = li;
const ec = Math.PI * 2;
const Ut = { x: 0.07, y: -0.04 };
const LWe = 3.5;
function NWe(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    ((e ^= t.charCodeAt(n)), (e = Math.imul(e, 16777619)));
  return (
    (e ^= e >>> 15),
    (e = Math.imul(e, 2246822519)),
    (e ^= e >>> 13),
    (e >>> 0) / 4294967296
  );
}
const Ke = (...t) => NWe(DWe + "|" + t.join("|"));
const Ds = (t) =>
  Math.sqrt(-2 * Math.log(1 - Ke(t, "u1") * 0.999999)) *
  Math.cos(ec * Ke(t, "u2"));
const ja = (t, e, n) => Math.exp(e + n * Ds(t));
function nC(t, e, n) {
  const r = Math.floor(e),
    i = Math.floor(n),
    s = e - r,
    o = n - i,
    a = s * s * (3 - 2 * s),
    l = o * o * (3 - 2 * o),
    c = (u, d) => Ke("n2", t, u, d);
  return (
    (c(r, i) * (1 - a) + c(r + 1, i) * a) * (1 - l) +
    (c(r, i + 1) * (1 - a) + c(r + 1, i + 1) * a) * l -
    0.5
  );
}
const Vu = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const uo = (t, e, n) => {
  const r = Vu((n - t) / (e - t));
  return r * r * (3 - 2 * r);
};
const kr = (t, e, n) => t + (e - t) * n;
const _c = (t, e) => Math.hypot(t.x - e.x, t.y - e.y);
const NI = (t) => Math.abs(t.x) <= Dn / 2 && Math.abs(t.y) <= tr / 2;
function OWe(t) {
  let e = 0;
  for (let n = 0; n < t.length; n++) {
    const r = t[n],
      i = t[(n + 1) % t.length];
    e += r.x * i.y - i.x * r.y;
  }
  return e / 2;
}
function FWe(t) {
  let e = 0,
    n = 0,
    r = 0;
  for (let i = 0; i < t.length; i++) {
    const s = t[i],
      o = t[(i + 1) % t.length],
      a = s.x * o.y - o.x * s.y;
    ((e += a), (n += (s.x + o.x) * a), (r += (s.y + o.y) * a));
  }
  return (
    (e /= 2),
    e === 0 ? { x: t[0].x, y: t[0].y } : { x: n / (6 * e), y: r / (6 * e) }
  );
}
const rC = Math.hypot(Dn / 2 + Math.abs(Ut.x), tr / 2 + Math.abs(Ut.y));
function OI(t, e, n, r) {
  let i = null;
  for (const s of n) {
    if (r != null && s.crackId === r) continue;
    const o = { x: e.x - t.x, y: e.y - t.y },
      a = { x: s.b.x - s.a.x, y: s.b.y - s.a.y },
      l = o.x * a.y - o.y * a.x;
    if (Math.abs(l) < 1e-12) continue;
    const c = ((s.a.x - t.x) * a.y - (s.a.y - t.y) * a.x) / l,
      u = ((s.a.x - t.x) * o.y - (s.a.y - t.y) * o.x) / l;
    c > 1e-4 &&
      c < 1 - 1e-4 &&
      u > -1e-4 &&
      u < 1 + 1e-4 &&
      (!i || c < i.t) &&
      (i = { t: c, point: { x: t.x + o.x * c, y: t.y + o.y * c } });
  }
  return i;
}
const BWe = (t) => Math.min(Dn / 2 - Math.abs(t.x), tr / 2 - Math.abs(t.y));
function UWe(t) {
  const e = t.x / (Dn / 2),
    n = t.y / (tr / 2),
    r = 0.55 + 0.45 * Math.max(0, 1 - 0.45 * e * e - 0.7 * n * n),
    i = Math.exp(-BWe(t) / 0.18),
    s = _c(t, Ut),
    o = 1 / Math.sqrt(1 + (s / 0.33) ** 2);
  return 0.42 * r + 0.25 * i + 0.5 * o;
}
function VWe() {
  const t = [];
  t.push({
    id: "breach",
    kind: "breach",
    p: { x: Ut.x + 0.025 * Ds("bjx"), y: Ut.y + 0.025 * Ds("bjy") },
    a0: 0.035,
    Kc: ja("Kc:breach", 0, 0.18),
    forced: !0,
  });
  for (let e = 0; e < 64; e++)
    t.push({
      id: "surf:" + e,
      kind: "surface",
      p: {
        x: (Ke("sfx", e) - 0.5) * Dn * 0.94,
        y: (Ke("sfy", e) - 0.5) * tr * 0.94,
      },
      a0: ja("a0s:" + e, Math.log(0.006), 0.75),
      Kc: ja("Kcs:" + e, Math.log(1.1), 0.25),
    });
  for (let e = 0; e < 44; e++) {
    const n = Ke("egu", e) * 2 * (Dn + tr);
    let r;
    (n < Dn
      ? (r = { x: n - Dn / 2, y: -tr / 2 })
      : n < Dn + tr
        ? (r = { x: Dn / 2, y: n - Dn - tr / 2 })
        : n < 2 * Dn + tr
          ? (r = { x: n - Dn - tr - Dn / 2, y: tr / 2 })
          : (r = { x: -Dn / 2, y: n - 2 * Dn - tr - tr / 2 }),
      t.push({
        id: "edge:" + e,
        kind: "edge",
        p: r,
        a0: ja("a0e:" + e, Math.log(0.012), 0.85),
        Kc: ja("Kce:" + e, Math.log(0.95), 0.3),
      }));
  }
  for (const e of t) {
    const r =
      (e.kind === "edge" ? 1.35 : e.kind === "breach" ? 1.6 : 1.1) *
      UWe(e.p) *
      Math.sqrt(Math.PI * e.a0);
    ((e.score =
      r / e.Kc + (e.kind === "breach" ? 0.45 : 0) + 0.08 * Ds("score:" + e.id)),
      (e.used = !1));
  }
  return t;
}
const Mi = {
  tf: LWe,
  eps: 0.075,
  p: 1.05,
  tFirst: 0.72,
  quietGap: 0.58,
  tEnd: 3.43,
};
function GWe(t, e, n, r, i, s) {
  const o = r - e + i,
    a = r - n + i;
  if (Math.abs(s - 1) < 1e-4) {
    const u = Math.log(o) + t * (Math.log(a) - Math.log(o));
    return r + i - Math.exp(u);
  }
  const l = 1 - s,
    c = Math.pow(o, l) + t * (Math.pow(a, l) - Math.pow(o, l));
  return r + i - Math.pow(c, 1 / l);
}
const jWe = (t) => uo(0.55, Mi.tf - 0.06, t);
function HWe(t) {
  const e = [Math.max(0.3, Mi.tFirst + 0.08 * Ds("firstJit"))],
    n = e[0] + Mi.quietGap;
  for (let r = 1; r < t; r++) {
    const i = Vu((r - 0.5 + 0.72 * (Ke("evU", r) - 0.5)) / (t - 1));
    e.push(GWe(i, n, Mi.tEnd, Mi.tf, Mi.eps, Mi.p));
  }
  return (e.sort((r, i) => r - i), e);
}
function zWe(t) {
  const e = t.c;
  return {
    Lmedian: 0.17 * Math.exp(2.3 * e) * ja("L:" + t.id, 0, 0.35),
    Lmax: kr(0.22, 3.5, uo(0.25, 0.95, e)),
    branchPerUnit: kr(0.05, 0.7, uo(0.35, 0.92, e)),
    arrestProb: 1 - uo(0.62, 0.9, e),
    unstableProb: uo(0.72, 0.96, e),
    stepDt: kr(0.02, 0.004, e),
    linkFraction: uo(0.42, 0.88, e),
    energy: kr(0.4, 1.3, e),
  };
}
function WWe(t, e, n) {
  if (t.role === "firstPop") {
    const u = n.find((d) => d.kind === "breach");
    return (
      (u.used = !0),
      { p: { ...u.p }, dir: ec * Ke("dir:" + t.id), from: "flaw", twoSided: !0 }
    );
  }
  const r = t.c,
    i = Ke("siteMode:" + t.id),
    s = kr(0.18, 0.55, uo(0.2, 0.82, r)),
    o = kr(0.02, 0.28, uo(0.45, 0.92, r));
  if (i < s && e.tips.length) {
    let u = null,
      d = -1;
    for (let h = 0; h < e.tips.length; h++) {
      const m = e.tips[h].weight * (0.4 + 0.6 * Ke("tipPick:" + t.id, h));
      m > d && ((d = m), (u = h));
    }
    const f = e.tips.splice(u, 1)[0];
    return {
      p: { ...f.p },
      dir: f.dir + 0.12 * Ds("kink:" + t.id),
      from: "tip",
      twoSided: !1,
    };
  }
  if (i < s + o && e.junctions.length)
    return {
      p: {
        ...e.junctions[Math.floor(Ke("jPick:" + t.id) * e.junctions.length)].p,
      },
      dir: ec * Ke("jDir:" + t.id),
      from: "junction",
      twoSided: !1,
    };
  let a = null,
    l = -1;
  for (const u of n) {
    if (u.used || u.kind === "breach") continue;
    const d = u.score * (0.5 + 0.5 * Ke("fPick:" + t.id, u.id));
    d > l && ((l = d), (a = u));
  }
  if (!a)
    return {
      p: { x: Ds("fx" + t.id) * 0.8, y: Ds("fy" + t.id) * 0.5 },
      dir: ec * Ke("fd" + t.id),
      from: "flaw",
      twoSided: !0,
    };
  a.used = !0;
  const c =
    a.kind === "edge"
      ? $We(a) + 0.4 * Ds("eDir:" + t.id)
      : ec * Ke("fDir:" + t.id);
  return { p: { ...a.p }, dir: c, from: "flaw", twoSided: a.kind !== "edge" };
}
function $We(t) {
  return Math.abs(Math.abs(t.p.x) - Dn / 2) < 0.001
    ? Math.atan2(0, -Math.sign(t.p.x))
    : Math.atan2(-Math.sign(t.p.y), 0);
}
function qWe(t, e, n) {
  if (Ke("targetGate:" + t.id) > t.gp.linkFraction) return null;
  const r = t.c,
    i = [];
  for (let a = 0; a < n.tips.length; a++) {
    const l = n.tips[a],
      c = _c(e.p, l.p);
    c < 0.12 ||
      c > kr(0.55, 2.8, r) ||
      i.push({
        p: l.p,
        tipIndex: a,
        w: Math.exp(-c / kr(0.55, 1.6, r)) * (1 + l.weight),
      });
  }
  for (let a = 0; a < n.all.length; a += 5) {
    const l = n.all[a];
    if (l.type === "chip" || l.type === "fork") continue;
    const c = { x: (l.a.x + l.b.x) / 2, y: (l.a.y + l.b.y) / 2 },
      u = _c(e.p, c);
    u < 0.1 ||
      u > kr(0.4, 1.8, r) ||
      i.push({
        p: c,
        tipIndex: -1,
        w: 0.65 * Math.exp(-u / kr(0.4, 1.2, r)) * uo(0.35, 0.95, r),
      });
  }
  if (!i.length) return null;
  let s = 0;
  for (const a of i) s += a.w;
  let o = Ke("target:" + t.id) * s;
  for (const a of i) if (((o -= a.w), o <= 0)) return a;
  return i.at(-1);
}
function XWe(t, e, n, r) {
  const i = t.gp,
    s =
      e.twoSided && !n
        ? [e.dir, e.dir + Math.PI + 0.1 * Ds("opp:" + t.id)]
        : [e.dir],
    o = !n && Ke("unstable:" + t.id) < i.unstableProb,
    a = n ? 1 / 0 : Math.min(i.Lmedian, i.Lmax);
  for (let l = 0; l < s.length; l++) {
    let c = { ...e.p },
      u = n ? Math.atan2(n.p.y - c.y, n.p.x - c.x) : s[l],
      d = i.energy * (n ? 1.1 : 1),
      f = t.tSec,
      h = 0,
      _ = !1;
    for (let m = 0; m < 140 && NI(c); m++) {
      if (!o && !n && h >= a) {
        _ = !0;
        break;
      }
      if (o && d < 0.03) break;
      const p = `g:${t.id}:${l}:${m}`,
        v = ja(p + ":ds", Math.log(0.062), 0.35);
      if (n) {
        let E = Math.atan2(n.p.y - c.y, n.p.x - c.x) - u;
        for (; E > Math.PI;) E -= ec;
        for (; E < -Math.PI;) E += ec;
        u += 0.45 * E + 0.08 * nC(t.id * 13, c.x * 2.1, c.y * 2.1);
      } else
        u +=
          0.07 * nC(t.id * 13 + l, c.x * 1.4, c.y * 1.4) +
          0.025 * Ds(p + ":turn");
      let y = { x: c.x + Math.cos(u) * v, y: c.y + Math.sin(u) * v },
        x = !1;
      n && _c(y, n.p) < 0.09 && ((y = { ...n.p }), (x = !0));
      const w = h < 0.05 ? null : OI(c, y, r.all, t.id);
      w && (y = w.point);
      const S = n
        ? "cross"
        : t.role === "firstPop" || (t.c < 0.5 && !o)
          ? "precursor"
          : "through";
      if (
        (r.all.push({
          a: { ...c },
          b: { ...y },
          type: S,
          crackId: t.id,
          t0: f,
          t1: f + i.stepDt * 1.4,
          energy: d,
          eventId: t.id,
        }),
        (h += _c(c, y)),
        (f += i.stepDt),
        w || x)
      ) {
        (r.junctions.push({ p: { ...y }, tSec: f, fromEvent: t.id }),
          (t.linked = !0));
        break;
      }
      c = y;
      const T = i.branchPerUnit * v * (0.5 + 0.5 * t.c);
      if (Ke(p + ":br") < T && r.depth < 1) {
        r.depth++;
        const R =
          u + (Ke(p + ":bs") < 0.5 ? -1 : 1) * (0.24 + 0.66 * Ke(p + ":ba"));
        (KWe(t, { ...c }, R, d * kr(0.22, 0.55, t.c), f, r),
          r.depth--,
          (d *= 0.8));
      }
      o && (d *= Math.exp(-v / 2.2));
    }
    if (_) {
      const m = {
        p: { ...c },
        dir: u,
        tSec: f,
        weight: 0.7 + 0.6 * Ke("tw:" + t.id, l),
        fromEvent: t.id,
      };
      if ((r.tips.push(m), t.tips.push(m), t.c < 0.55)) {
        const p = Ke("nf:" + t.id, l) < 0.55 ? 1 : 2;
        for (let v = 0; v < p; v++) {
          const y = (v === 0 ? 1 : -1) * (0.09 + 0.16 * Ke("fa:" + t.id, l, v)),
            x = 0.02 + 0.045 * Ke("fl:" + t.id, l, v);
          r.all.push({
            a: { ...c },
            b: { x: c.x + Math.cos(u + y) * x, y: c.y + Math.sin(u + y) * x },
            type: "fork",
            crackId: t.id,
            t0: f - 0.004,
            t1: f + 0.03,
            eventId: t.id,
          });
        }
      }
    }
  }
}
function KWe(t, e, n, r, i, s) {
  let o = e,
    a = n,
    l = r,
    c = i;
  for (let u = 0; u < 40 && !(!NI(o) || l < 0.03); u++) {
    const d = `b:${t.id}:${u}`,
      f = ja(d + ":ds", Math.log(0.055), 0.35);
    a += 0.09 * nC(t.id * 29, o.x * 2, o.y * 2) + 0.03 * Ds(d + ":t");
    let h = { x: o.x + Math.cos(a) * f, y: o.y + Math.sin(a) * f };
    const _ = OI(o, h, s.all, t.id);
    if (
      (_ && (h = _.point),
      s.all.push({
        a: { ...o },
        b: { ...h },
        type: "fork",
        crackId: t.id,
        t0: c,
        t1: c + 0.012,
        eventId: t.id,
      }),
      _)
    ) {
      s.junctions.push({ p: { ...h }, tSec: c, fromEvent: t.id });
      break;
    }
    ((o = h), (c += 0.008), (l *= Math.exp(-f / 0.7)));
  }
}
function YWe(t, e, n) {
  const r = kr(0.13, 0.3, n),
    i = Mi.tf * 0.88;
  for (let s = 0; s < e; s++) {
    const o = ec * Ke("chTh", s),
      a = r * Math.pow(Ke("chU", s), 1.8) * 0.45 + 0.015;
    let l = { x: Ut.x + Math.cos(o) * a, y: Ut.y + Math.sin(o) * a },
      c = o + (Ke("chA", s) - 0.5) * 1.6;
    const u = 1 + Math.floor(Ke("chN", s) * 2.4);
    let d = i + Mi.tf * 0.1 * Ke("chT", s);
    for (let f = 0; f < u; f++) {
      const h = 0.03 + 0.07 * Ke("chDs", s, f);
      let _ = { x: l.x + Math.cos(c) * h, y: l.y + Math.sin(c) * h };
      const m = OI(l, _, t, -1);
      if (
        (m && (_ = m.point),
        t.push({
          a: { ...l },
          b: { ..._ },
          type: "chip",
          crackId: -1,
          t0: d,
          t1: d + 0.03,
        }),
        m)
      )
        break;
      ((l = _), (c += (Ke("chW", s, f) - 0.5) * 0.9), (d += 0.02));
    }
  }
}
const Bv = 6e-4;
function ZWe(t) {
  const e = [
      { x: -Dn / 2, y: -tr / 2 },
      { x: Dn / 2, y: -tr / 2 },
      { x: Dn / 2, y: tr / 2 },
      { x: -Dn / 2, y: tr / 2 },
    ],
    n = t.filter((c) => _c(c.a, c.b) > 1e-5).map((c) => ({ ...c }));
  for (let c = 0; c < 4; c++)
    n.push({ a: e[c], b: e[(c + 1) % 4], type: "rim", t0: 0, t1: 0 });
  for (const c of n)
    if (c.type !== "rim")
      for (const u of ["a", "b"]) {
        const d = u === "a" ? c.b : c.a,
          f = c[u];
        if (NI(f)) continue;
        let h = 1;
        for (const [_, m] of [
          ["x", Dn / 2],
          ["y", tr / 2],
        ]) {
          const p = f[_] - d[_];
          Math.abs(f[_]) > m &&
            Math.abs(p) > 1e-9 &&
            (h = Math.min(h, (Math.sign(f[_]) * m - d[_]) / p));
        }
        c[u] = { x: d.x + (f.x - d.x) * h, y: d.y + (f.y - d.y) * h };
      }
  const r = n.map(() => []);
  for (let c = 0; c < n.length; c++)
    for (let u = c + 1; u < n.length; u++) {
      const d = n[c],
        f = n[u],
        h = { x: d.b.x - d.a.x, y: d.b.y - d.a.y },
        _ = { x: f.b.x - f.a.x, y: f.b.y - f.a.y },
        m = h.x * _.y - h.y * _.x;
      if (Math.abs(m) < 1e-12) continue;
      const p = ((f.a.x - d.a.x) * _.y - (f.a.y - d.a.y) * _.x) / m,
        v = ((f.a.x - d.a.x) * h.y - (f.a.y - d.a.y) * h.x) / m;
      p < -1e-4 ||
        p > 1 + 1e-4 ||
        v < -1e-4 ||
        v > 1 + 1e-4 ||
        (p > 1e-4 && p < 1 - 1e-4 && r[c].push(p),
        v > 1e-4 && v < 1 - 1e-4 && r[u].push(v));
    }
  const i = [],
    s = new Map(),
    o = (c) => {
      const u = Math.round(c.x / Bv),
        d = Math.round(c.y / Bv),
        f = u + "_" + d;
      let h = s.get(f);
      return (
        h == null &&
          ((h = i.length), i.push({ x: u * Bv, y: d * Bv }), s.set(f, h)),
        h
      );
    },
    a = [],
    l = new Map();
  for (let c = 0; c < n.length; c++) {
    const u = n[c],
      d = [0, ...r[c].sort((f, h) => f - h), 1];
    for (let f = 0; f < d.length - 1; f++) {
      const h = d[f],
        _ = d[f + 1];
      if (_ - h < 1e-6) continue;
      const m = o({
          x: u.a.x + (u.b.x - u.a.x) * h,
          y: u.a.y + (u.b.y - u.a.y) * h,
        }),
        p = o({
          x: u.a.x + (u.b.x - u.a.x) * _,
          y: u.a.y + (u.b.y - u.a.y) * _,
        });
      if (m === p) continue;
      const v = m < p ? m + "_" + p : p + "_" + m;
      l.has(v) ||
        (l.set(v, a.length),
        a.push({
          a: m,
          b: p,
          type: u.type,
          eventId: u.eventId,
          t0: u.t0 + (u.t1 - u.t0) * h,
          t1: u.t0 + (u.t1 - u.t0) * _,
        }));
    }
  }
  return { verts: i, edges: a };
}
function JWe(t, e) {
  const n = new Map(),
    r = [];
  for (let o = 0; o < e.length; o++) {
    const a = e[o],
      l = t[a.b].x - t[a.a].x,
      c = t[a.b].y - t[a.a].y,
      u = {
        id: r.length,
        from: a.a,
        to: a.b,
        ang: Math.atan2(c, l),
        edge: o,
        rev: null,
      };
    r.push(u);
    const d = {
      id: r.length,
      from: a.b,
      to: a.a,
      ang: Math.atan2(-c, -l),
      edge: o,
      rev: null,
    };
    (r.push(d),
      (u.rev = d),
      (d.rev = u),
      n.has(a.a) || n.set(a.a, []),
      n.has(a.b) || n.set(a.b, []),
      n.get(a.a).push(u),
      n.get(a.b).push(d));
  }
  for (const o of n.values()) o.sort((a, l) => a.ang - l.ang);
  const i = new Uint8Array(r.length),
    s = [];
  for (const o of r) {
    if (i[o.id]) continue;
    const a = [],
      l = [];
    let c = o;
    for (let m = 0; m < 1e5; m++) {
      ((i[c.id] = 1), a.push(c.from), l.push(c.edge));
      const p = n.get(c.to),
        v = p.indexOf(c.rev);
      if (((c = p[(v - 1 + p.length) % p.length]), c.id === o.id)) break;
    }
    const u = a.slice(),
      d = l.slice();
    let f = !0;
    for (; f && u.length > 2;) {
      f = !1;
      for (let m = 0; m < u.length; m++) {
        const p = u[(m - 1 + u.length) % u.length],
          v = u[(m + 1) % u.length];
        if (p === v) {
          const y = [m, (m + 1) % u.length].sort((x, w) => w - x);
          for (const x of y)
            (u.splice(x, 1), d.splice(x <= d.length - 1 ? x : d.length - 1, 1));
          f = !0;
          break;
        }
      }
    }
    if (u.length < 3) continue;
    const h = u.map((m) => t[m]),
      _ = OWe(h);
    _ < 5e-5 ||
      Math.abs(_) > Dn * tr * 0.95 ||
      s.push({ poly: h, vids: u, eids: d, area: _ });
  }
  return s;
}
function QWe(t, e, n) {
  const r = uo(0.08 * rC, rC, _c(t, Ut));
  return (
    kr(kr(0.005, 0.014, 1 - e), kr(0.22, 0.8, 1 - e) * n, r) *
    ja(`amax:${t.x.toFixed(2)}:${t.y.toFixed(2)}`, 0, 0.5)
  );
}
function e7e(t, e, n) {
  const r = t.poly,
    i = r.length;
  if (i < 4) return null;
  const s = (v, y, x) => {
    const w = Math.cos(y),
      S = Math.sin(y);
    let T = null;
    for (let R = 0; R < i; R++) {
      if (R === x) continue;
      const E = r[R],
        M = r[(R + 1) % i],
        C = M.x - E.x,
        A = M.y - E.y,
        k = w * A - S * C;
      if (Math.abs(k) < 1e-12) continue;
      const N = ((E.x - v.x) * A - (E.y - v.y) * C) / k,
        P = ((E.x - v.x) * S - (E.y - v.y) * w) / k;
      N > 0.01 &&
        P >= -1e-6 &&
        P <= 1 + 1e-6 &&
        (!T || N < T.s) &&
        (T = { s: N, p: { x: v.x + w * N, y: v.y + S * N } });
    }
    return T;
  };
  let o = 0;
  for (let v = 0; v < i; v++)
    o += Math.hypot(r[(v + 1) % i].x - r[v].x, r[(v + 1) % i].y - r[v].y);
  let a = null;
  for (let v = 0; v < 4; v++) {
    const y = o * ((v + Ke("chordU", n, v)) / 4);
    let x = 0,
      w = 0,
      S = r[0];
    for (let C = 0; C < i; C++) {
      const A = r[C],
        k = r[(C + 1) % i],
        N = Math.hypot(k.x - A.x, k.y - A.y);
      if (x + N >= y) {
        const P = (y - x) / Math.max(N, 1e-9);
        ((w = C), (S = { x: A.x + (k.x - A.x) * P, y: A.y + (k.y - A.y) * P }));
        break;
      }
      x += N;
    }
    const T = r[w],
      R = r[(w + 1) % i],
      E =
        Math.atan2(R.y - T.y, R.x - T.x) +
        Math.PI / 2 +
        (Ke("chordA", n, v) - 0.5) * 0.7,
      M = s(S, E, w);
    M && (!a || M.s > a.len) && (a = { A: S, B: M.p, len: M.s });
  }
  if (!a || a.len < 0.02) return null;
  const { A: l, B: c, len: u } = a,
    d = Mi.tf * (0.7 + 0.28 * Math.pow(Ke("chordW", n), 0.6)),
    f = (v, y) => ({
      a: { ...v },
      b: { ...y },
      type: "fine",
      crackId: -1,
      t0: d,
      t1: d + 0.06,
    });
  if (u < 0.45) return [f(l, c)];
  const h = -(c.y - l.y) / u,
    _ = (c.x - l.x) / u,
    m = (Ke("chordK", n) - 0.5) * 0.1 * u,
    p = { x: (l.x + c.x) / 2 + h * m, y: (l.y + c.y) / 2 + _ * m };
  return [f(l, p), f(p, c)];
}
function FI(t, e) {
  let n = 0;
  for (const o of t.events) {
    if (e < o.tSec) break;
    n += o.gp.energy * Math.exp(-(e - o.tSec) / kr(0.16, 0.055, o.c));
  }
  n = Vu(n * 0.18);
  const r = Vu(e / t.refTf),
    i = t.damageCurve[Math.min(63, Math.round(r * 63))],
    s = Vu(0.04 * r * r + 0.34 * n + 0.62 * uo(0.4, 0.96, i));
  return { ae: n, damage: i, corrupt: s };
}
function createFractureGraph(t) {
  const e = Vu(t.energy),
    n = VWe(),
    r = Math.max(24, Math.min(120, Math.round(t.events ?? 72))),
    i = HWe(r),
    s = { all: [], tips: [], junctions: [], depth: 0 },
    o = [];
  for (let y = 0; y < r; y++) {
    const x = {
      id: y,
      tSec: i[y],
      t: i[y] / Mi.tf,
      c: jWe(i[y]),
      role: y === 0 ? "firstPop" : "event",
      tips: [],
      linked: !1,
    };
    ((x.gp = zWe(x)), (x.gp.energy *= kr(0.7, 1.15, e)));
    const w = WWe(x, s, n);
    x.p = w.p;
    const S = qWe(x, w, s);
    (S && S.tipIndex >= 0 && s.tips.splice(S.tipIndex, 1),
      XWe(x, w, S, s),
      o.push(x));
  }
  YWe(s.all, Math.round((t.chips ?? 70) * 0.45), e);
  let a = s.all,
    l,
    c;
  for (let y = 0; y < 8; y++) {
    ((l = ZWe(a)), (c = JWe(l.verts, l.edges)));
    const x = [];
    let w = 0;
    for (const S of c) {
      const T = FWe(S.poly);
      if (S.area > QWe(T, e, t.maxPlate)) {
        const R = e7e(S, e, `${y}:${w++}:${T.x.toFixed(2)}`);
        R && x.push(...R);
      }
    }
    if (globalThis.__CG_DEBUG) {
      const S = c
        .map((T) => T.area)
        .sort((T, R) => R - T)
        .slice(0, 5);
      console.log(
        `round ${y}: faces ${c.length}, oversized ${w}, chords ${x.length}, top ${S.map((T) => T.toFixed(2)).join(" ")}`,
      );
    }
    if (!x.length || y === 7) break;
    a = a.concat(x);
  }
  for (const y of l.edges)
    y.type !== "rim" &&
      ((y.T0 = Vu(y.t0 / Mi.tf)),
      (y.T1 = Math.max(Math.min(y.t1 / Mi.tf, 1), y.T0 + 0.003)));
  let u = 0;
  const d = [];
  for (const y of l.edges) {
    if (y.type === "rim") continue;
    const x = _c(l.verts[y.a], l.verts[y.b]);
    ((u += x), d.push([y.T0, x]));
  }
  d.sort((y, x) => y[0] - x[0]);
  const f = 64,
    h = new Float32Array(f);
  let _ = 0,
    m = 0;
  for (let y = 0; y < f; y++) {
    const x = y / (f - 1);
    for (; m < d.length && d[m][0] <= x;) _ += d[m++][1];
    h[y] = u > 0 ? _ / u : 0;
  }
  const p = new Map();
  for (const y of l.edges)
    if (y.type !== "rim")
      for (const x of [y.a, y.b]) (p.has(x) || p.set(x, []), p.get(x).push(y));
  const v = [];
  for (const [y, x] of p) {
    if (x.length < 3) continue;
    const w = x.map((S) => S.T1).sort((S, T) => S - T);
    v.push({ p: l.verts[y], T: w[2], valence: x.length });
  }
  return {
    verts: l.verts,
    edges: l.edges,
    faces: c,
    impact: Ut,
    Rmax: rC,
    events: o,
    junctions: v,
    damageCurve: h,
    refTf: Mi.tf,
  };
}
const { PW: Uv, PH: Vv } = li;
function FZ(t) {
  let e = 0;
  for (let n = 0; n < t.length; n++) {
    const r = t[n],
      i = t[(n + 1) % t.length];
    e += r.x * i.y - i.x * r.y;
  }
  return e / 2;
}
function BZ(t) {
  let e = 0,
    n = 0,
    r = 0;
  for (let i = 0; i < t.length; i++) {
    const s = t[i],
      o = t[(i + 1) % t.length],
      a = s.x * o.y - o.x * s.y;
    ((e += a), (n += (s.x + o.x) * a), (r += (s.y + o.y) * a));
  }
  return (
    (e /= 2),
    e === 0 ? { x: t[0].x, y: t[0].y } : { x: n / (6 * e), y: r / (6 * e) }
  );
}
function UZ(t, e, n) {
  FZ(t) < 0 && (t = t.slice().reverse());
  const r = new Shape(t.map((a) => new Vector2(a.x, a.y))),
    i = new ExtrudeGeometry(r, { depth: n, bevelEnabled: !1 });
  i.translate(0, 0, -n / 2);
  const s = BZ(t);
  i.translate(-s.x, -s.y, 0);
  const o = new Mesh(i, e);
  return (o.position.set(s.x, s.y, 0), o);
}
function n7e(t, e, n = 0.05) {
  FZ(t) < 0 && (t = t.slice().reverse());
  const r = BZ(t),
    i = t.length,
    s = [],
    o = [],
    a = [],
    l = [],
    c = [],
    u = [],
    d = r7e((n - 0.008) / 0.22),
    f = 0.34 - 0.3 * d * d * (3 - 2 * d);
  for (let _ = 0; _ < i; _++) {
    const m = t[_],
      p = t[(_ + 1) % i],
      v = p.x - m.x,
      y = p.y - m.y,
      x = Math.hypot(v, y) || 1e-5,
      w = v / x,
      S = y / x,
      T = ml(m.x * 12.9898 + m.y * 78.233 + _ * 0.731);
    if (!(kI(m.x * 3.7 + p.y * 9.1 + _ * 1.93) < f)) continue;
    const E = 0.45 + 0.55 * ml(p.x * 5.3 + m.y * 2.9 + _),
      M = e / 2;
    (s.push(m.x - r.x, m.y - r.y, M, p.x - r.x, p.y - r.y, M),
      o.push(w, S, 0, w, S, 0),
      a.push(T, T),
      l.push(0, x),
      c.push(x, x),
      u.push(E, E));
  }
  const h = new BufferGeometry();
  return (
    h.setAttribute("position", new Float32BufferAttribute(s, 3)),
    h.setAttribute("aDir", new Float32BufferAttribute(o, 3)),
    h.setAttribute("aH", new Float32BufferAttribute(a, 1)),
    h.setAttribute("aAlong", new Float32BufferAttribute(l, 1)),
    h.setAttribute("aLen", new Float32BufferAttribute(c, 1)),
    h.setAttribute("aGate", new Float32BufferAttribute(u, 1)),
    h
  );
}
const r7e = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
function i7e(t, e) {
  return UZ(
    [
      { x: -Uv / 2, y: -Vv / 2 },
      { x: Uv / 2, y: -Vv / 2 },
      { x: Uv / 2, y: Vv / 2 },
      { x: -Uv / 2, y: Vv / 2 },
    ],
    t,
    e,
  );
}
const { PW: s7e, PH: o7e, SCALE: VZ } = li;
const Zd = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const xp = (t, e, n) => {
  const r = Zd((n - t) / (e - t));
  return r * r * (3 - 2 * r);
};
const Cl = (t, e, n) => t + (e - t) * n;
const a7e = (t) =>
  Math.sqrt(-2 * Math.log(1 - Ke(t, "bm1") * 0.999999)) *
  Math.cos(Math.PI * 2 * Ke(t, "bm2"));
const l7e = (t, e) => Math.exp(e * a7e(t));
const c7e = {
  chip: 0.25,
  through: 0.45,
  cross: 0.55,
  fork: 0.7,
  precursor: 0.8,
  fine: 1.6,
  rim: 2,
};
const u7e = {
  chip: 0.7,
  through: 1,
  cross: 1.05,
  fork: 1.1,
  precursor: 1.2,
  fine: 1.5,
  rim: 2,
};
const DB = 9.81 * VZ;
const Bt = {
  STORE_HZ: 60,
  T_BAKE: 2.6,
  SUBSTEPS: 40,
  MASS_MIN: 0.002,
  K_BOND: 1800,
  ZETA: 0.9,
  DB_BASE: 0.006,
  TOUGH_NEAR: 0.6,
  TOUGH_FAR: 1,
  T_FRONT: 0.95,
  FRONT_W: 0.22,
  FRONT_JIT: 0.14,
  ANCHOR_K: 0.9,
  V_CLAMP: 55,
  W_CLAMP: 32,
  Z_THRUST: 2.5,
  KICK: 9,
  KICK_RAND: 6,
  KICK_SPIN: 9,
};
function d7e(t) {
  let e = 0,
    n = 0,
    r = 0;
  for (let i = 0; i < t.length; i++) {
    const s = t[i],
      o = t[(i + 1) % t.length],
      a = s.x * o.y - o.x * s.y;
    ((e += a), (n += (s.x + o.x) * a), (r += (s.y + o.y) * a));
  }
  return (
    (e /= 2),
    e === 0 ? { x: t[0].x, y: t[0].y } : { x: n / (6 * e), y: r / (6 * e) }
  );
}
function f7e(t) {
  let e = 0;
  for (let n = 0; n < t.length; n++)
    e += Math.hypot(
      t[n].x - t[(n + 1) % t.length].x,
      t[n].y - t[(n + 1) % t.length].y,
    );
  return e;
}
function h7e(t, e) {
  let n = 0,
    r = 0;
  for (let i = 0; i < t.length; i++) {
    const s = { x: t[i].x - e.x, y: t[i].y - e.y },
      o = {
        x: t[(i + 1) % t.length].x - e.x,
        y: t[(i + 1) % t.length].y - e.y,
      },
      a = s.x * o.y - o.x * s.y;
    ((n += a * (s.y * s.y + s.y * o.y + o.y * o.y)),
      (r += a * (s.x * s.x + s.x * o.x + o.x * o.x)));
  }
  return (
    (n = Math.abs(n) / 12),
    (r = Math.abs(r) / 12),
    { x: Math.max(n, 1e-6), y: Math.max(r, 1e-6), z: Math.max(n + r, 2e-6) }
  );
}
function Dd(t, e, n, r, i, s, o, a) {
  const l = 2 * (e * o - n * s),
    c = 2 * (n * i - t * o),
    u = 2 * (t * s - e * i);
  ((a[0] = i + r * l + (e * u - n * c)),
    (a[1] = s + r * c + (n * l - t * u)),
    (a[2] = o + r * u + (t * c - e * l)));
}
function simulateShardBodies(t, e) {
  const { verts: n, edges: r, faces: i } = t,
    s = i.map((re, ue) => {
      const de = d7e(re.poly),
        Y = Math.abs(re.area),
        ge = h7e(re.poly, de),
        q = Math.max(Y, Bt.MASS_MIN);
      return {
        id: ue,
        poly: re.poly,
        area: Y,
        centroid: de,
        mass: q,
        perimeter: f7e(re.poly),
        inertia: ge,
        areaU: xp(0.004, 0.18, Y),
        exposedLen: 0,
        released: !1,
        release: null,
        firstBreakT: -1,
      };
    }),
    o = s.length,
    a = Math.hypot(s7e / 2 + Math.abs(Ut.x), o7e / 2 + Math.abs(Ut.y)),
    l = (re, ue) => {
      const de = xp(0, a, Math.hypot(re - Ut.x, ue - Ut.y));
      return Cl(Bt.TOUGH_NEAR, Bt.TOUGH_FAR, Math.pow(de, 0.8));
    },
    c = new Map();
  i.forEach((re, ue) => {
    for (const de of re.eids) {
      c.has(de) || c.set(de, []);
      const Y = c.get(de);
      Y.includes(ue) || Y.push(ue);
    }
  });
  const u = [],
    d = [],
    f = s.map(() => []);
  for (const [re, ue] of c) {
    const de = r[re],
      Y = n[de.a],
      ge = n[de.b],
      q = Math.hypot(Y.x - ge.x, Y.y - ge.y),
      ce = (Y.x + ge.x) / 2,
      Te = (Y.y + ge.y) / 2;
    if (de.type === "rim") {
      for (const ie of ue) {
        const ye = s[ie];
        d.push({
          i: ie,
          restx: ce,
          resty: Te,
          lix: ce - ye.centroid.x,
          liy: Te - ye.centroid.y,
          elen: q,
          Dbreak:
            Bt.DB_BASE *
            Bt.ANCHOR_K *
            l(ce, Te) *
            (0.7 + 0.6 * Ke("anchorJ", ie, re)),
          broken: !1,
        });
      }
      continue;
    }
    if (ue.length !== 2) continue;
    const Re = s[ue[0]],
      Ce = s[ue[1]],
      Ie =
        (c7e[de.type] ?? 0.6) *
        Math.sqrt(Math.max(q, 0.01)) *
        l7e(`bond:${re}`, 0.45),
      H = {
        id: u.length,
        i: ue[0],
        j: ue[1],
        type: de.type,
        elen: q,
        mx: ce,
        my: Te,
        lix: ce - Re.centroid.x,
        liy: Te - Re.centroid.y,
        ljx: ce - Ce.centroid.x,
        ljy: Te - Ce.centroid.y,
        strength: Ie,
        Dbreak:
          Bt.DB_BASE *
          l(ce, Te) *
          (u7e[de.type] ?? 1) *
          (0.6 + 0.7 * Ke("db", u.length)),
        broken: !1,
      };
    (u.push(H), f[ue[0]].push(H), f[ue[1]].push(H));
  }
  const h = (re, ue) => {
      let de = !1;
      for (let Y = 0, ge = ue.length - 1; Y < ue.length; ge = Y++) {
        const q = ue[Y],
          ce = ue[ge];
        q.y > re.y != ce.y > re.y &&
          re.x < ((ce.x - q.x) * (re.y - q.y)) / (ce.y - q.y) + q.x &&
          (de = !de);
      }
      return de;
    },
    _ = new Uint8Array(o);
  for (const re of s)
    (Math.hypot(re.centroid.x - Ut.x, re.centroid.y - Ut.y) < 0.3 ||
      h(Ut, re.poly)) &&
      (_[re.id] = 1);
  if (!_.some((re) => re)) {
    let re = 0,
      ue = 1 / 0;
    for (const de of s) {
      const Y = Math.hypot(de.centroid.x - Ut.x, de.centroid.y - Ut.y);
      Y < ue && ((ue = Y), (re = de.id));
    }
    _[re] = 1;
  }
  const m = new Float64Array(o),
    p = new Float64Array(o),
    v = new Float64Array(o),
    y = new Float64Array(o),
    x = new Float64Array(o),
    w = new Float64Array(o),
    S = new Float64Array(o),
    T = new Float64Array(o),
    R = new Float64Array(o),
    E = new Float64Array(o),
    M = new Float64Array(o),
    C = new Float64Array(o),
    A = new Float64Array(o),
    k = new Float64Array(o),
    N = new Float64Array(o),
    P = new Float64Array(o),
    D = new Float64Array(o),
    L = new Float64Array(o),
    O = new Float64Array(o),
    I = new Float64Array(o),
    F = new Float64Array(o),
    G = new Float64Array(o),
    ee = new Float64Array(o);
  for (let re = 0; re < o; re++) {
    const ue = s[re];
    ((m[re] = ue.centroid.x),
      (p[re] = ue.centroid.y),
      (v[re] = 0),
      (S[re] = 1),
      (k[re] = 1 / ue.mass),
      (N[re] = 1 / ue.inertia.x),
      (P[re] = 1 / ue.inertia.y),
      (D[re] = 1 / ue.inertia.z));
  }
  const oe = e.gravity ?? 1,
    W = (e.flowForce ?? 3.2) * DB,
    $ = (e.breachImpulse ?? 1) * 1.4 * VZ,
    ne = e.dragQuad ?? 0.9,
    V = e.dragLin ?? 0.6,
    z = e.alignAero ?? 1,
    te = e.spinDrag ?? 0.8,
    K = e.flowSpread ?? 1;
  for (let re = 0; re < o; re++) {
    if (!_[re]) continue;
    const ue = m[re] - Ut.x,
      de = p[re] - (Ut.y - 0.1),
      Y = Math.hypot(ue, de) || 1e-4,
      ge = (ue / Y) * 0.4,
      q = (de / Y) * 0.4,
      ce = 1,
      Te = Math.hypot(ge, q, ce),
      Re = ($ * (0.8 + 0.4 * Ke("bkick", re))) / Te;
    ((T[re] = ge * Re),
      (R[re] = q * Re),
      (E[re] = ce * Re),
      (s[re].exposedLen = s[re].perimeter));
  }
  const Q = [];
  Q.push({
    kind: "breachCrush",
    t: -0.02,
    p: { ...Ut },
    severity: 0.85,
    massFrac: 0.48,
    parentShard: -1,
  });
  const X = 1 / Bt.STORE_HZ,
    he = X / Bt.SUBSTEPS,
    U = Math.round(Bt.T_BAKE * Bt.STORE_HZ) + 1,
    ae = new Float32Array(U * o * 7);
  let pe = 0;
  const _e = u.length || 1,
    J = [0, 0, 0],
    le = [0, 0, 0],
    se = [0, 0, 0],
    ve = [0, 0, 0],
    we = [0, 0, 0],
    me = new Uint8Array(o),
    j = new Float64Array(o).fill(-1),
    B = (re) => {
      const ue = re * o * 7;
      for (let de = 0; de < o; de++) {
        const Y = ue + de * 7;
        ((ae[Y] = m[de]),
          (ae[Y + 1] = p[de]),
          (ae[Y + 2] = v[de]),
          (ae[Y + 3] = y[de]),
          (ae[Y + 4] = x[de]),
          (ae[Y + 5] = w[de]),
          (ae[Y + 6] = S[de]));
      }
    };
  B(0);
  const fe = Bt.ZETA * 2 * Math.sqrt(Bt.K_BOND);
  let be = 0;
  for (let re = 1; re < U; re++) {
    for (let ue = 0; ue < Bt.SUBSTEPS; ue++) {
      be += he;
      const de = a / Bt.T_FRONT;
      for (let Y = 0; Y < o; Y++) {
        const ge = s[Y];
        ((F[Y] = 0), (G[Y] = 0), (ee[Y] = 0));
        const q =
            Math.hypot(ge.centroid.x - Ut.x, ge.centroid.y - (Ut.y - 0.1)) ||
            1e-4,
          ce = q / de + Bt.FRONT_JIT * (Ke("front", Y) - 0.5),
          Te = Zd((be - ce) / Bt.FRONT_W);
        ((L[Y] = 0), (O[Y] = -DB * oe * ge.mass * Te), (I[Y] = 0));
        const Re = Zd(ge.exposedLen / Math.max(1e-5, ge.perimeter));
        {
          const Ie = m[Y] - Ut.x,
            H = p[Y] - (Ut.y - 0.1),
            ie = Math.hypot(Ie, H) || 1e-4,
            ye = xp(0, a, q),
            Ae = ge.areaU,
            ke = W * ge.area * Te * (0.6 + 0.4 * Re),
            Se = Cl(1, 2.6, Ae),
            Ne =
              ke * (0.55 + 0.3 * xp(0.15, 1.6, ie)) * Se * K * Cl(1.2, 0.6, Ae);
          ((L[Y] += (Ie / ie) * Ne), (O[Y] += (H / ie) * Ne));
          const Oe = Cl(1, 0.22, Math.pow(ye, 0.6));
          if (
            ((I[Y] += ke * Bt.Z_THRUST * Oe * Cl(1.15, 0.45, Ae)),
            !me[Y] && be >= ce)
          ) {
            ((me[Y] = 1), (j[Y] = be));
            const Qe = Cl(1.25, 0.5, Ae),
              at = Cl(1, 0.5, ye),
              Fe = Bt.KICK * at * Qe,
              We = Bt.Z_THRUST * 0.5 * Cl(1.1, 0.4, ye),
              tn = Bt.KICK_RAND * (0.6 + 0.5 * ye);
            ((T[Y] += (Ie / ie) * 0.5 * Fe + (Ke("kx", Y) - 0.5) * 2 * tn),
              (R[Y] += (H / ie) * 0.5 * Fe + (Ke("ky", Y) - 0.5) * 2 * tn),
              (E[Y] += (0.6 + We) * Fe + (Ke("kz", Y) - 0.5) * tn));
            const mr = Bt.KICK_SPIN;
            ((M[Y] += (Ke("wx", Y) - 0.5) * 2 * mr),
              (C[Y] += (Ke("wy", Y) - 0.5) * 2 * mr),
              (A[Y] += (Ke("wz", Y) - 0.5) * mr));
          }
        }
        const Ce = T[Y] * T[Y] + R[Y] * R[Y] + E[Y] * E[Y];
        if (Ce > 1e-6) {
          const Ie = Math.sqrt(Ce),
            H = T[Y] / Ie,
            ie = R[Y] / Ie,
            ye = E[Y] / Ie;
          Dd(y[Y], x[Y], w[Y], S[Y], 0, 0, 1, se);
          const Ae = se[0] * H + se[1] * ie + se[2] * ye,
            ke = 0.12 + 0.88 * Math.abs(Ae),
            Se = (V * Ie + ne * Ce) * ge.area * ke;
          ((L[Y] -= H * Se), (O[Y] -= ie * Se), (I[Y] -= ye * Se));
          const Ne = Ae < 0 ? -1 : 1,
            Oe = se[1] * ye - se[2] * ie,
            Qe = se[2] * H - se[0] * ye,
            at = se[0] * ie - se[1] * H,
            Fe = z * 0.5 * Ce * ge.area * Ne;
          ((F[Y] += Oe * Fe), (G[Y] += Qe * Fe), (ee[Y] += at * Fe));
        }
        ((F[Y] -= te * ge.area * M[Y]),
          (G[Y] -= te * ge.area * C[Y]),
          (ee[Y] -= te * ge.area * A[Y]));
      }
      for (let Y = 0; Y < u.length; Y++) {
        const ge = u[Y];
        if (ge.broken) continue;
        const q = ge.i,
          ce = ge.j;
        (Dd(y[q], x[q], w[q], S[q], ge.lix, ge.liy, 0, J),
          Dd(y[ce], x[ce], w[ce], S[ce], ge.ljx, ge.ljy, 0, le));
        const Te = m[q] + J[0],
          Re = p[q] + J[1],
          Ce = v[q] + J[2],
          Ie = m[ce] + le[0],
          H = p[ce] + le[1],
          ie = v[ce] + le[2],
          ye = Ie - Te,
          Ae = H - Re,
          ke = ie - Ce;
        if (Math.sqrt(ye * ye + Ae * Ae + ke * ke) > ge.Dbreak) {
          ((ge.broken = !0),
            pe++,
            (s[q].exposedLen += ge.elen),
            (s[ce].exposedLen += ge.elen),
            s[q].firstBreakT < 0 && (s[q].firstBreakT = be),
            s[ce].firstBreakT < 0 && (s[ce].firstBreakT = be),
            ge.elen > 0.08 &&
              Ke("sue", ge.id) < 0.3 &&
              Q.push({
                kind: "seamUnzip",
                t: be,
                p: { x: ge.mx, y: ge.my },
                severity: Zd(ge.strength),
                parentShard: q,
                massFrac: 9e-4 * ge.elen,
              }));
          continue;
        }
        const Ne =
            T[ce] +
            C[ce] * le[2] -
            A[ce] * le[1] -
            (T[q] + C[q] * J[2] - A[q] * J[1]),
          Oe =
            R[ce] +
            A[ce] * le[0] -
            M[ce] * le[2] -
            (R[q] + A[q] * J[0] - M[q] * J[2]),
          Qe =
            E[ce] +
            M[ce] * le[1] -
            C[ce] * le[0] -
            (E[q] + M[q] * J[1] - C[q] * J[0]),
          at = fe * Math.sqrt(1 / (k[q] + k[ce])),
          Fe = Bt.K_BOND * ye + at * Ne,
          We = Bt.K_BOND * Ae + at * Oe,
          tn = Bt.K_BOND * ke + at * Qe;
        ((L[q] += Fe),
          (O[q] += We),
          (I[q] += tn),
          (L[ce] -= Fe),
          (O[ce] -= We),
          (I[ce] -= tn),
          (F[q] += J[1] * tn - J[2] * We),
          (G[q] += J[2] * Fe - J[0] * tn),
          (ee[q] += J[0] * We - J[1] * Fe),
          (F[ce] -= le[1] * tn - le[2] * We),
          (G[ce] -= le[2] * Fe - le[0] * tn),
          (ee[ce] -= le[0] * We - le[1] * Fe));
      }
      for (let Y = 0; Y < d.length; Y++) {
        const ge = d[Y];
        if (ge.broken) continue;
        const q = ge.i;
        Dd(y[q], x[q], w[q], S[q], ge.lix, ge.liy, 0, J);
        const ce = m[q] + J[0],
          Te = p[q] + J[1],
          Re = v[q] + J[2],
          Ce = ge.restx - ce,
          Ie = ge.resty - Te,
          H = 0 - Re;
        if (Math.sqrt(Ce * Ce + Ie * Ie + H * H) > ge.Dbreak) {
          ((ge.broken = !0),
            (s[q].exposedLen += ge.elen),
            s[q].firstBreakT < 0 && (s[q].firstBreakT = be));
          continue;
        }
        const ye = -(T[q] + C[q] * J[2] - A[q] * J[1]),
          Ae = -(R[q] + A[q] * J[0] - M[q] * J[2]),
          ke = -(E[q] + M[q] * J[1] - C[q] * J[0]),
          Se = fe * Math.sqrt(s[q].mass),
          Ne = Bt.K_BOND * Ce + Se * ye,
          Oe = Bt.K_BOND * Ie + Se * Ae,
          Qe = Bt.K_BOND * H + Se * ke;
        ((L[q] += Ne),
          (O[q] += Oe),
          (I[q] += Qe),
          (F[q] += J[1] * Qe - J[2] * Oe),
          (G[q] += J[2] * Ne - J[0] * Qe),
          (ee[q] += J[0] * Oe - J[1] * Ne));
      }
      for (let Y = 0; Y < o; Y++) {
        ((T[Y] += L[Y] * k[Y] * he),
          (R[Y] += O[Y] * k[Y] * he),
          (E[Y] += I[Y] * k[Y] * he),
          Dd(-y[Y], -x[Y], -w[Y], S[Y], F[Y], G[Y], ee[Y], ve),
          (ve[0] *= N[Y]),
          (ve[1] *= P[Y]),
          (ve[2] *= D[Y]),
          Dd(y[Y], x[Y], w[Y], S[Y], ve[0], ve[1], ve[2], we),
          (M[Y] += we[0] * he),
          (C[Y] += we[1] * he),
          (A[Y] += we[2] * he));
        const ge = T[Y] * T[Y] + R[Y] * R[Y] + E[Y] * E[Y];
        if (ge > Bt.V_CLAMP * Bt.V_CLAMP) {
          const We = Bt.V_CLAMP / Math.sqrt(ge);
          ((T[Y] *= We), (R[Y] *= We), (E[Y] *= We));
        }
        const q = M[Y] * M[Y] + C[Y] * C[Y] + A[Y] * A[Y];
        if (q > Bt.W_CLAMP * Bt.W_CLAMP) {
          const We = Bt.W_CLAMP / Math.sqrt(q);
          ((M[Y] *= We), (C[Y] *= We), (A[Y] *= We));
        }
        ((m[Y] += T[Y] * he), (p[Y] += R[Y] * he), (v[Y] += E[Y] * he));
        const ce = M[Y],
          Te = C[Y],
          Re = A[Y],
          Ce = y[Y],
          Ie = x[Y],
          H = w[Y],
          ie = S[Y],
          ye = ce * ie + Te * H - Re * Ie,
          Ae = Te * ie + Re * Ce - ce * H,
          ke = Re * ie + ce * Ie - Te * Ce,
          Se = -(ce * Ce + Te * Ie + Re * H),
          Ne = Ce + 0.5 * he * ye,
          Oe = Ie + 0.5 * he * Ae,
          Qe = H + 0.5 * he * ke,
          at = ie + 0.5 * he * Se,
          Fe = 1 / (Math.sqrt(Ne * Ne + Oe * Oe + Qe * Qe + at * at) || 1);
        ((y[Y] = Ne * Fe),
          (x[Y] = Oe * Fe),
          (w[Y] = Qe * Fe),
          (S[Y] = at * Fe));
      }
    }
    B(re);
  }
  for (let re = 0; re < o; re++) {
    const ue = s[re];
    ((ue.released = !0),
      (ue.release = {
        t: ue.firstBreakT >= 0 ? ue.firstBreakT : Bt.T_BAKE,
        v: { x: T[re], y: R[re], z: E[re] },
        open: Zd(ue.exposedLen / Math.max(1e-5, ue.perimeter)),
      }),
      ue.firstBreakT >= 0 &&
        ue.release.open > 0.12 &&
        Ke("spall", re) < 0.5 &&
        Q.push({
          kind: "releaseSpall",
          t: ue.firstBreakT,
          p: { x: ue.centroid.x, y: ue.centroid.y },
          severity: ue.release.open,
          parentShard: re,
          massFrac: 0.0012 * xp(0.12, 0.65, ue.release.open),
        }));
  }
  const Pe = t.junctions
    .filter((re) => re.T > 0.55 && re.T < 0.97)
    .sort((re, ue) => ue.valence - re.valence)
    .slice(0, 26);
  for (const re of Pe)
    Q.push({
      kind: "junctionBurst",
      Tpre: re.T,
      p: { ...re.p },
      severity: Zd((re.valence - 2) / 4),
      parentShard: -1,
      massFrac: 4e-4 + 0.0014 * Math.pow(re.T, 3.2),
    });
  if (typeof window < "u") {
    const re = s
        .map((Fe) => Fe.release.t)
        .filter((Fe) => Fe < Bt.T_BAKE)
        .sort((Fe, We) => Fe - We),
      ue = (Fe) =>
        re.length
          ? re[Math.min(re.length - 1, Math.floor(Fe * re.length))]
          : -1;
    let de = 0,
      Y = 0,
      ge = 0;
    for (let Fe = 0; Fe < o; Fe++) {
      const We = Math.hypot(T[Fe], R[Fe], E[Fe]);
      (We > de && (de = We),
        (!isFinite(m[Fe]) || !isFinite(S[Fe])) && Y++,
        s[Fe].firstBreakT >= 0 && ge++);
    }
    const q = new Int32Array(o);
    for (let Fe = 0; Fe < o; Fe++) q[Fe] = Fe;
    const ce = (Fe) => {
      for (; q[Fe] !== Fe;) ((q[Fe] = q[q[Fe]]), (Fe = q[Fe]));
      return Fe;
    };
    for (const Fe of u)
      if (!Fe.broken) {
        const We = ce(Fe.i),
          tn = ce(Fe.j);
        We !== tn && (q[We] = tn);
      }
    const Te = new Map();
    for (let Fe = 0; Fe < o; Fe++) {
      const We = ce(Fe);
      Te.set(We, (Te.get(We) || 0) + 1);
    }
    const Re = [...Te.values()].sort((Fe, We) => We - Fe),
      Ce = Re.filter((Fe) => Fe >= 4);
    let Ie = -1,
      H = 0;
    for (const [Fe, We] of Te) We > H && ((H = We), (Ie = Fe));
    const ie = [];
    for (let Fe = 0; Fe < o; Fe++) ce(Fe) === Ie && ie.push(Fe);
    let ye = 9,
      Ae = 0,
      ke = 0,
      Se = 0,
      Ne = 0,
      Oe = 0;
    for (const Fe of ie) {
      const We = Math.hypot(s[Fe].centroid.x - Ut.x, s[Fe].centroid.y - Ut.y);
      ((ye = Math.min(ye, We)),
        (Ae = Math.max(Ae, We)),
        me[Fe] && ke++,
        (Se += T[Fe]),
        (Ne += R[Fe]),
        (Oe += E[Fe]));
    }
    ((Se /= ie.length), (Ne /= ie.length), (Oe /= ie.length));
    let Qe = 0;
    for (const Fe of ie)
      Qe += (T[Fe] - Se) ** 2 + (R[Fe] - Ne) ** 2 + (E[Fe] - Oe) ** 2;
    Qe = Math.sqrt(Qe / ie.length);
    const at = {
      size: ie.length,
      kickedPct: +((100 * ke) / ie.length).toFixed(0),
      rMin: +ye.toFixed(2),
      rMax: +Ae.toFixed(2),
      meanV: [+Se.toFixed(1), +Ne.toFixed(1), +Oe.toFixed(1)],
      vStd: +Qe.toFixed(2),
    };
    globalThis.__simStats = {
      faces: o,
      bonds: u.length,
      anchors: d.length,
      breach: _.reduce((Fe, We) => Fe + We, 0),
      emitters: Q.length,
      frameCount: U,
      storeHz: Bt.STORE_HZ,
      bakeMB: +(ae.byteLength / 1048576).toFixed(2),
      freed: ge,
      freedPct: +((100 * ge) / o).toFixed(1),
      brokenBonds: pe,
      brokenPct: +((100 * pe) / _e).toFixed(1),
      maxSpeed: +de.toFixed(1),
      nan: Y,
      kickQ: (() => {
        const Fe = [...j].filter((tn) => tn >= 0).sort((tn, mr) => tn - mr),
          We = (tn) =>
            Fe.length
              ? +Fe[
                  Math.min(Fe.length - 1, Math.floor(tn * Fe.length))
                ].toFixed(2)
              : -1;
        return {
          q10: We(0.1),
          q25: We(0.25),
          q50: We(0.5),
          q75: We(0.75),
          q90: We(0.9),
          q99: We(0.99),
          max: +(Fe[Fe.length - 1] ?? -1).toFixed(2),
        };
      })(),
      clusters: {
        total: Re.length,
        largest: Re[0],
        largestPct: +((100 * Re[0]) / o).toFixed(1),
        top5: Re.slice(0, 5),
        clumpsGE4: Ce.length,
        inClumpsGE4Pct: +(
          (100 * Ce.reduce((Fe, We) => Fe + We, 0)) /
          o
        ).toFixed(1),
        largestInfo: at,
      },
      relQ: {
        q10: ue(0.1),
        q25: ue(0.25),
        q50: ue(0.5),
        q75: ue(0.75),
        q90: ue(0.9),
        q99: ue(0.99),
        max: re[re.length - 1] ?? -1,
      },
    };
  }
  return {
    shards: s,
    bonds: u,
    emitters: Q,
    bake: { frames: ae, frameCount: U, storeDt: X, count: o },
  };
}
const { PW: m7e, PH: g7e, SCALE: v7e } = li;
const GZ = Math.PI * 2;
const ao = (t, e, n) => t + (e - t) * n;
const LB = (t) =>
  Math.sqrt(-2 * Math.log(1 - Ke(t, "fn1") * 0.999999)) *
  Math.cos(GZ * Ke(t, "fn2"));
function b7e(t, e) {
  switch (t) {
    case "breachCrush":
      return { d63: ao(45e-6, 14e-5, e), m: 0.72 };
    case "junctionBurst":
      return { d63: ao(35e-6, 11e-5, e), m: 0.65 };
    case "seamUnzip":
      return { d63: ao(7e-5, 24e-5, e), m: 0.8 };
    case "releaseSpall":
      return { d63: ao(14e-5, 65e-5, e), m: 0.95 };
    default:
      return { d63: 9e-5, m: 0.75 };
  }
}
const NB = (t, e, n) => 1 - Math.exp(-Math.pow(t / e, n));
function _7e(t, e, n, r, i) {
  const s = NB(r, e, n),
    o = NB(i, e, n),
    a = ao(s, o, t);
  return e * Math.pow(-Math.log(Math.max(1e-9, 1 - a)), 1 / n);
}
function y7e(t, e) {
  const n = (2500 * t * t) / 3258e-7,
    r = (1.2 * e * t) / 181e-7;
  return n / (1 + 0.15 * Math.pow(Math.max(0, r), 0.687));
}
const x7e = 5e-6;
const w7e = 8e-5;
const nM = 8e-4;
const S7e = 0.003;
function M7e(t, e, n) {
  const r = t.reduce((l, c) => l + c.massFrac, 0) || 1,
    i = [],
    s = [],
    o = t.map((l) => Math.sqrt(l.massFrac / r)),
    a = o.reduce((l, c) => l + c, 0) || 1;
  for (let l = 0; l < t.length; l++) {
    const c = t[l],
      { d63: u, m: d } = b7e(c.kind, c.severity),
      f = Math.max(1, Math.min(380, Math.round((n * o[l]) / a))),
      h = Math.hypot(c.p.x - Ut.x, c.p.y - Ut.y) / TZ,
      _ = 0.12 + 0.88 * Math.exp(-((h / 0.36) ** 2));
    let m = 0,
      p = 0,
      v = 0;
    if (c.parentShard >= 0 && e[c.parentShard]?.release) {
      const y = e[c.parentShard].release.v;
      ((m = y.x * 0.8), (p = y.y * 0.8), (v = y.z * 0.8));
    }
    for (let y = 0; y < f; y++) {
      const x = `f:${l}:${y}`,
        w = (y + Ke(x, "du")) / f,
        S = _7e(w, u, d, x7e, c.kind === "releaseSpall" ? S7e : nM),
        T = S < w7e ? "dust" : S < nM ? "glitter" : "sliver",
        R =
          c.kind === "breachCrush"
            ? 0.02 + 0.34 * Math.pow(Ke(x, "r"), 0.6)
            : 0.012 + 0.05 * Ke(x, "r"),
        E = GZ * Ke(x, "a"),
        M = {
          x: c.p.x + Math.cos(E) * R,
          y: c.p.y + Math.sin(E) * R * (g7e / m7e),
        },
        C = M.x - Ut.x,
        A = M.y - (Ut.y - 0.1),
        k = Math.hypot(C, A) || 1e-4,
        N = 0.3 + 0.5 * Ke(x, "sp"),
        P = (C / k) * N + 0.22 * LB(x + ":jx"),
        D = (A / k) * N + 0.22 * LB(x + ":jy"),
        L = 1 + 0.25 * Ke(x, "jz"),
        O = Math.hypot(P, D, L),
        I =
          (T === "dust"
            ? ao(0.25, 1.5, c.severity)
            : T === "glitter"
              ? ao(0.8, 3.5, c.severity)
              : ao(1.2, 5, c.severity)) * v7e,
        F = {
          p0: M,
          v0: { x: m + (P / O) * I, y: p + (D / O) * I, z: v + (L / O) * I },
          tau: Math.max(0.004, y7e(S, T === "dust" ? 2 : 3)),
          size:
            T === "dust"
              ? ao(0.003, 0.006, Ke(x, "s"))
              : T === "glitter"
                ? ao(0.004, 0.011, Math.pow(S / nM, 0.5))
                : ao(0.011, 0.02, Ke(x, "s")),
          h: Ke(x, "h"),
          h2: Ke(x, "h2"),
          birthJit: 0.018 * Math.pow(Ke(x, "bj"), 2.2),
        },
        G = Ke(x, "lk");
      ((F.luck =
        _ * (0.1 + 0.9 * G * G + (G > 0.94 ? 3.4 + 11 * (G - 0.94) : 0))),
        c.Tpre != null ? (F.Tpre = c.Tpre) : (F.t0 = c.t),
        (T === "dust" ? i : s).push(F));
    }
  }
  return { dust: i, glitter: s };
}
const $n = {
  frame0Word: "FUTURUM",
  visitorZh: "访客通道",
  visitorEn: "GUEST",
  connecting: "Connecting to AlephPro",
  dropped: "连接中断",
  leakLine: "连接，即抵达。所有逻辑上可能的世界，都在这里。",
  n0r1: "N0R1",
  calibrate: ["正在为您校准接入点…", "同步意识锚点…"],
  retries: [
    "正在重新连接（1/3）…",
    "正在重新连接（2/3）…",
    "正在重新连接（3/3）…",
  ],
  retryFailed: "重连失败",
  takeover: "检测到同频意识波动，正在接管会话…",
  reconnectNoriOS: "正在重新连接：NoriOS…",
};
const wr = {
  mono: '"IBM Plex Mono", ui-monospace, "JetBrains Mono", Menlo, monospace',
  zh: '"LXGW WenKai", "Noto Sans SC", "WenQuanYi Zen Hei", sans-serif',
  sys: '"Plus Jakarta Sans", "Noto Sans SC", system-ui, sans-serif',
};
const { BREAK: T7e } = SHATTER_MARKERS;
const E7e = (t, e, n) => ur(1 - Math.abs(t - e) / n);
function BI(t) {
  let e = 0,
    n = 0;
  for (const r of MZ) {
    const i = E7e(t, r.c, r.w);
    r.kind === "line" ? (e = Math.max(e, i)) : (n = Math.max(n, i));
  }
  return { line: e, n0r1: n, any: Math.max(e, n) };
}
function jZ(t, e) {
  let n = t * e;
  for (const [r, i] of oWe)
    t >= i ? (n -= (i - r) * e) : t > r && (n -= (t - r) * e);
  return n;
}
function HZ(t) {
  return t < BOOT_DROPS.DROP1
    ? "calm"
    : t < BOOT_DROPS.RETRY1
      ? "drop1"
      : t < BOOT_DROPS.DROP2
        ? "retry1"
        : t < BOOT_DROPS.RETRY2
          ? "drop2"
          : t < BOOT_DROPS.DROP3
            ? "retry2"
            : t < BOOT_DROPS.RETRY3
              ? "drop3"
              : t < BOOT_DROPS.DEAD
                ? "retry3"
                : "dead";
}
const N1 = (t) => t === "drop1" || t === "drop2" || t === "drop3";
const zZ = (t) =>
  t === "retry1" ? 1 : t === "retry2" ? 2 : t === "retry3" ? 3 : 0;
const WZ = [BOOT_DROPS.RETRY1, BOOT_DROPS.RETRY2, BOOT_DROPS.RETRY3];
function $Z(t) {
  const e = (r, i, s, o) => r + (i - r) * DI(jr(t, s, o));
  return t < BOOT_DROPS.DROP1
    ? 0
    : t < BOOT_DROPS.RETRY1
      ? jr(t, BOOT_DROPS.DROP1, BOOT_DROPS.DROP1 + 0.0156) * 1
      : t < BOOT_DROPS.DROP2
        ? e(1, 0.18, BOOT_DROPS.RETRY1, BOOT_DROPS.RETRY1 + 0.081)
        : t < BOOT_DROPS.RETRY2
          ? 0.18 + jr(t, BOOT_DROPS.DROP2, BOOT_DROPS.DROP2 + 0.0156) * 1.22
          : t < BOOT_DROPS.DROP3
            ? e(1.4, 0.34, BOOT_DROPS.RETRY2, BOOT_DROPS.RETRY2 + 0.081)
            : t < BOOT_DROPS.RETRY3
              ? 0.34 + jr(t, BOOT_DROPS.DROP3, BOOT_DROPS.DROP3 + 0.0156) * 1.46
              : t < BOOT_DROPS.DEAD
                ? e(1.8, 0.55, BOOT_DROPS.RETRY3, BOOT_DROPS.RETRY3 + 0.075)
                : 0.55 + jr(t, BOOT_DROPS.DEAD, BOOT_DROPS.DEAD + 0.1) * 2.45;
}
const OB = "∅⌁▓<>/#%";
function C7e(t, e, n) {
  if (e <= 0) return t;
  let r = "";
  for (let i = 0; i < t.length; i++) {
    const s = t[i];
    r +=
      s !== " " && ml(i * 7.3 + n * 13.1) < e
        ? OB[Math.floor(kI(i * 3.7 + n * 5.9) * OB.length)]
        : s;
  }
  return r;
}
const qZ = (t, e) => Math.floor(t * e * 9);
function XZ(t, e, n, r) {
  const i = zZ(n);
  if (n === "calm") {
    const o = -0.4 + 1.4 * ((r / 2.2) % 1);
    return { a: Math.max(0, o), b: Math.min(1, o + 0.4) };
  }
  if (N1(n)) return null;
  if (i > 0) {
    const a = -0.4 + 1.4 * ((((t - WZ[i - 1]) * e * (1 - i * 0.18)) / 2.2) % 1);
    return { a: Math.max(0, a), b: Math.min(1, a + 0.4) };
  }
  return {
    a: 0,
    b: Math.min(0.42 + 0.74 * DI(jr(t, BOOT_DROPS.DEAD, T7e)) ** 2, 1.16),
  };
}
function KZ(t, e, n, r, i) {
  const s = zZ(n),
    o = N1(n) || n === "dead";
  let a,
    l = 0;
  (o
    ? ((a = $n.dropped),
      n === "dead" &&
        (l = 0.2 + 0.4 * jr(t, BOOT_DROPS.DEAD, 0.7875) + 0.1 * ur(i)))
    : ((a = $n.connecting.toUpperCase()),
      s === 3 && (l = 0.15 + 0.25 * jr(t, BOOT_DROPS.RETRY3, BOOT_DROPS.DEAD))),
    (a = C7e(a, l, qZ(t, e))));
  let c = null;
  if (!o) {
    const u = s > 0 ? (t - WZ[s - 1]) * e * (1 + s * 0.3) : r;
    c = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((u / 2.6) * Math.PI * 2));
  }
  return { label: a, dropped: o, blink: c };
}
const R7e = [
  { at: 0.05, text: $n.calibrate[0], kind: "cal" },
  { at: 0.1875, text: $n.calibrate[1], kind: "cal" },
  { at: BOOT_DROPS.RETRY1, text: $n.retries[0], kind: "cal" },
  { at: BOOT_DROPS.RETRY2, text: $n.retries[1], kind: "cal" },
  { at: BOOT_DROPS.RETRY3, text: $n.retries[2], kind: "cal" },
  { at: 0.725, text: $n.retryFailed, kind: "err" },
  { at: 0.7625, text: $n.takeover, kind: "cold" },
  { at: 0.797, text: $n.reconnectNoriOS, kind: "cold" },
];
function YZ(t) {
  const e = R7e.filter((r) => t >= r.at).slice(-3),
    n = e.at(-1)?.at ?? 0;
  return e.map((r) => ({
    ...r,
    fadeIn: DI(jr(t, r.at, r.at + 0.022)),
    isLast: r.at === n,
  }));
}
const lt = {
  topbar: {
    y: 0.045,
    x: 0.04,
    font: 0.024,
    trackEm: 0.42,
    visitorFont: 0.0176,
    visitorRight: 0.04,
    visitorZhTrackEm: 0.14,
    visitorEnTrackEm: 0.08,
    visitorZhRightEm: 4.4,
  },
  logomark: { cy: 0.39, glyphH: 0.165 },
  bar: { y: 0.51, w: 0.1875, h: 0.00156, glow: 0.007 },
  status: {
    y: 0.56,
    font: 0.0145,
    trackEm: 0.36,
    droppedTrackEm: 0.3,
    dotDiaEm: 0.56,
    dotCenterEm: 0.9,
    dotGlowEm: 0.32,
  },
  stream: {
    y: 0.62,
    lineH: 0.034,
    zhFont: 0.0165,
    coldFont: 0.015,
    zhTrackEm: 0.06,
    coldTrackEm: 0.04,
    coldGlow: 0.0078,
    errGlow: 0.0062,
  },
  leakLine: { y: 0.5, font: 0.0185, trackEm: 0.1, dx: 0.00122 },
  n0r1: { y: 0.485, font: 0.13, trackEm: 0.24, dx: 0.00342 },
};
function A7e(t) {
  const e = li.PW / li.PH,
    n = Math.min(1, t / e) / li.OVERSCAN,
    r = Math.min(1, e / t) / li.OVERSCAN;
  return { x0: (1 - n) / 2, y0: (1 - r) / 2, w: n, h: r };
}
const ZZ = () => ({
  scr: null,
  bakeCanvas: null,
  bakeCtx: null,
  baked: new Set(),
  bakeTs: -1,
  bakeKey: "",
});
const Ky = (t, e) => {
  if (typeof document < "u") {
    const n = document.createElement("canvas");
    return ((n.width = t), (n.height = e), n);
  }
  return new OffscreenCanvas(t, e);
};
const FB = typeof document < "u" ? { willReadFrequently: !0 } : void 0;
const { CRACK_START: Lm, CRACK_FULL: iC } = SHATTER_MARKERS;
const { PW: JZ, PH: QZ } = li;
const yo = 2048;
const xo = Math.round((yo * QZ) / JZ);
const Yy = (t) => (t / JZ + 0.5) * yo;
const Zy = (t) => (0.5 - t / QZ) * xo;
function Gv(t, e, n, r, i) {
  ((t.letterSpacing = `${i}px`),
    t.fillText(e, n + i / 2, r),
    (t.letterSpacing = "0px"));
}
const sC = (t) => 1 - (1 - t) ** 3;
const Jy = Math.PI * 2;
const BB = -0.4472;
const UB = -0.8944;
const eJ = [18, 30];
let Rl = null;
let rM = null;
function P7e(t, e) {
  if (e.scr) return e.scr;
  const { verts: n, edges: r } = t,
    i = [];
  for (let s = 0; s < r.length; s++) {
    const o = r[s];
    if (o.type === "rim" || o.T0 == null) {
      i.push(null);
      continue;
    }
    const a = Yy(n[o.a].x),
      l = Zy(n[o.a].y),
      c = Yy(n[o.b].x),
      u = Zy(n[o.b].y),
      d = c - a,
      f = u - l,
      h = Math.hypot(d, f) || 1e-4,
      _ = -f / h,
      m = d / h,
      p = Math.abs(_ * BB + m * UB);
    i.push({
      ax: a,
      ay: l,
      bx: c,
      by: u,
      nx: _,
      ny: m,
      len: h,
      ndl: p,
      side: _ * BB + m * UB >= 0 ? 1 : -1,
      h: ml(s * 2.1),
      h2: kI(s * 3.3),
    });
  }
  return ((e.scr = i), i);
}
function lo(t, e, n, r, i, s, o) {
  ((t.strokeStyle = o),
    (t.lineWidth = s),
    t.beginPath(),
    t.moveTo(e.ax + r, e.ay + i),
    t.lineTo(e.ax + (e.bx - e.ax) * n + r, e.ay + (e.by - e.ay) * n + i),
    t.stroke());
}
function I7e(t, e, n, r) {
  for (const i of e.events) {
    const s = i.id < 3 ? 1 : k7e(0.45, 0.1, i.c);
    if (!(s < 0.08 || n - i.t * r < -0.1))
      for (const a of i.tips) {
        const l = (a.tSec / e.refTf) * r;
        if (n < l) continue;
        const c = Math.exp(-Math.max(0, n - l - 0.04) / 0.45) * s,
          u = Math.exp(-(((n - l) / 0.02) ** 2)) * s,
          d = Yy(a.p.x),
          f = Zy(a.p.y),
          h = -a.dir;
        ((t.globalCompositeOperation = "screen"),
          (t.fillStyle = `rgba(94,180,190,${0.12 * c})`),
          t.beginPath(),
          t.ellipse(d, f, 1.6, 0.9, h, 0, Jy),
          t.fill(),
          (t.fillStyle = `rgba(255,255,255,${0.2 * c + 0.3 * u})`),
          t.beginPath(),
          t.ellipse(
            d - Math.sin(h),
            f + Math.cos(h),
            2 + 1.8 * u,
            0.9,
            h,
            0,
            Jy,
          ),
          t.fill());
      }
  }
}
const k7e = (t, e, n) => t + (e - t) * n;
function D7e(t, e, n) {
  const i = ur((n - 0.84) / 0.16000000000000003);
  if (i <= 0.15) return;
  const s = Yy(Ut.x),
    o = Zy(Ut.y);
  t.globalCompositeOperation = "source-over";
  const a = 13 * sC(ur((i - 0.15) / 0.85));
  ((t.fillStyle = `rgba(0,0,0,${0.7 * i})`), t.beginPath());
  for (let l = 0; l <= 14; l++) {
    const c = (l / 14) * Jy,
      u = a * (0.75 + 0.45 * ml(l * 3.9)),
      d = s + Math.cos(c) * u,
      f = o + Math.sin(c) * u * 0.85;
    l === 0 ? t.moveTo(d, f) : t.lineTo(d, f);
  }
  (t.closePath(), t.fill());
}
function L7e(t, e, n, r) {
  for (const { e: i, gi: s } of e) {
    const o =
      i.type === "precursor" || i.type === "through" || i.type === "cross";
    if (s.len < 8) continue;
    const a = (o ? 0.11 : 0.06) * r.darkCore;
    lo(
      t,
      s,
      1,
      0,
      0,
      (o ? 5.2 + 2.4 * s.h2 : 3.2) * n,
      `rgba(120,210,205,${a})`,
    );
  }
  for (const { e: i, gi: s } of e) {
    if (
      s.len < 18 ||
      (i.type !== "precursor" && i.type !== "through" && i.type !== "cross") ||
      s.h2 > 0.6
    )
      continue;
    const o = (2 + 4 * s.h) * (s.h2 < 0.3 ? 1 : -1),
      a = 0.1 * r.darkCore * (0.7 + 0.5 * s.h);
    lo(t, s, 1, s.nx * o, s.ny * o, 0.7 * n, `rgba(150,195,208,${a})`);
  }
  for (const { e: i, gi: s } of e) {
    const o =
        i.type === "precursor" || i.type === "through" || i.type === "cross",
      l =
        (o ? 0.8 : i.type === "fork" ? 0.6 : 0.45) *
        (0.85 + 0.3 * s.h) *
        r.darkCore,
      c = n * (o ? 1.05 + 0.7 * s.h2 : 0.7 + 0.4 * s.h2);
    (lo(t, s, 1, 0, 0, c, `rgba(214,240,250,${l})`),
      o &&
        s.len > 24 &&
        lo(
          t,
          s,
          0.3 + 0.35 * s.h,
          0,
          0,
          c * 1.55,
          `rgba(214,240,250,${l * 0.7})`,
        ));
  }
  t.setLineDash(eJ);
  for (const { e: i, gi: s } of e) {
    if (
      !(i.type === "precursor" || i.type === "through" || i.type === "cross") ||
      s.len < 30 ||
      s.h > 0.55
    )
      continue;
    const l = (0.2 + 0.3 * (0.45 + 0.55 * Math.pow(s.ndl, 1.5))) * r.silver;
    ((t.lineDashOffset = s.h2 * 47),
      lo(t, s, 1, 0, 0, (0.9 + 0.6 * s.h) * n, `rgba(250,254,255,${l})`));
  }
  t.setLineDash([]);
}
function drawCracks(t, e, n, r, i, s, o, a) {
  const l = ur((r - Lm) / (iC - Lm));
  if (l <= 0) return;
  const c = (iC - Lm) * s,
    u = l * c,
    { edges: d } = e,
    f = P7e(e, n),
    h = i / 1.6,
    _ = 0.28,
    m = `${h}|${o.darkCore}|${o.silver}`;
  if (
    !n.bakeCanvas ||
    n.bakeCanvas.width !== t.canvas.width ||
    n.bakeCanvas.height !== t.canvas.height
  ) {
    const y = Ky(t.canvas.width, t.canvas.height);
    ((n.bakeCanvas = y),
      (n.bakeCtx = y.getContext("2d", FB)),
      (n.baked = new Set()),
      (n.bakeTs = -1),
      (n.bakeKey = m));
  }
  ((u < n.bakeTs - 0.04 || m !== n.bakeKey) &&
    (n.bakeCtx.clearRect(0, 0, n.bakeCanvas.width, n.bakeCanvas.height),
    n.baked.clear(),
    (n.bakeKey = m)),
    (n.bakeTs = u));
  const p = [],
    v = [];
  for (let y = 0; y < d.length; y++) {
    const x = f[y];
    if (!x) continue;
    const w = d[y],
      S = w.T0 * c,
      T = w.T1 * c;
    if (u <= S) continue;
    const R = u - T;
    if (R >= _) {
      n.baked.has(y) || v.push({ i: y, e: w, gi: x });
      continue;
    }
    const E = sC(ur((u - S) / Math.max(T - S, 1e-4))),
      M = R > -0.02 && R < 0.07 ? Math.exp(-(((R - 0.008) / 0.022) ** 2)) : 0,
      C = jr(R, 0.06, 0.28);
    p.push({ e: w, gi: x, reveal: E, flash: M, settled: C });
  }
  if (v.length) {
    const y = n.bakeCtx;
    (y.save(),
      (y.lineCap = "round"),
      (y.globalCompositeOperation = "source-over"),
      L7e(y, v, h, o),
      y.restore());
    for (const x of v) n.baked.add(x.i);
  }
  if (
    (t.save(),
    (t.lineCap = "round"),
    I7e(t, e, u, c),
    (t.globalCompositeOperation = "source-over"),
    a)
  ) {
    let y = 0,
      x = null;
    for (let w = 0; w < d.length && y < 24; w++) {
      const S = f[w];
      if (!S || S.len < 34) continue;
      const T = d[w];
      if (T.type !== "precursor" && T.type !== "through" && T.type !== "cross")
        continue;
      const R = T.T0 * c;
      if (u <= R) continue;
      const E = sC(ur((u - R) / Math.max(T.T1 * c - R, 1e-4)));
      if (!x) {
        const N = t.canvas.width,
          P = t.canvas.height;
        (Rl || ((Rl = Ky(N, P)), (rM = Rl.getContext("2d", FB))),
          Rl.width !== N && (Rl.width = N),
          Rl.height !== P && (Rl.height = P),
          rM.clearRect(0, 0, N, P),
          rM.drawImage(t.canvas, 0, 0),
          (x = Rl));
      }
      const M = (1.2 + 1.4 * S.h) * (S.h2 < 0.5 ? 1 : -1),
        C = S.ax + (S.bx - S.ax) * E,
        A = S.ay + (S.by - S.ay) * E,
        k = 7 + 9 * S.h2;
      (t.save(),
        t.beginPath(),
        t.moveTo(S.ax, S.ay),
        t.lineTo(C, A),
        t.lineTo(C + S.nx * k, A + S.ny * k),
        t.lineTo(S.ax + S.nx * k, S.ay + S.ny * k),
        t.closePath(),
        t.clip(),
        t.drawImage(x, -S.nx * M, -S.ny * M),
        t.restore(),
        y++);
    }
  }
  ((t.globalCompositeOperation = "screen"), t.drawImage(n.bakeCanvas, 0, 0));
  for (const y of p) {
    const x = y.e,
      w = y.gi,
      S = x.type === "precursor" || x.type === "through" || x.type === "cross";
    if (w.len < 8) continue;
    const T = (S ? 0.11 : 0.06) * o.darkCore;
    lo(
      t,
      w,
      y.reveal,
      0,
      0,
      (S ? 5.2 + 2.4 * w.h2 : 3.2) * h,
      `rgba(120,210,205,${T})`,
    );
  }
  for (const y of p) {
    const x = y.e,
      w = y.gi;
    if (
      w.len < 18 ||
      (x.type !== "precursor" && x.type !== "through" && x.type !== "cross") ||
      w.h2 > 0.6
    )
      continue;
    const S = (2 + 4 * w.h) * (w.h2 < 0.3 ? 1 : -1),
      T = 0.1 * o.darkCore * (0.7 + 0.5 * w.h);
    lo(t, w, y.reveal, w.nx * S, w.ny * S, 0.7 * h, `rgba(150,195,208,${T})`);
  }
  for (const y of p) {
    const x = y.e,
      w = y.gi,
      S = x.type === "precursor" || x.type === "through" || x.type === "cross",
      R =
        (S ? 0.8 : x.type === "fork" ? 0.6 : 0.45) *
        (0.85 + 0.3 * w.h) *
        o.darkCore,
      E = h * (S ? 1.05 + 0.7 * w.h2 : 0.7 + 0.4 * w.h2);
    (lo(t, w, y.reveal, 0, 0, E, `rgba(214,240,250,${R})`),
      S &&
        w.len > 24 &&
        lo(
          t,
          w,
          y.reveal * (0.3 + 0.35 * w.h),
          0,
          0,
          E * 1.55,
          `rgba(214,240,250,${R * 0.7})`,
        ));
  }
  t.globalCompositeOperation = "source-over";
  {
    t.setLineDash(eJ);
    for (const y of p) {
      const x = y.e,
        w = y.gi;
      if (
        !(
          x.type === "precursor" ||
          x.type === "through" ||
          x.type === "cross"
        ) ||
        w.len < 30 ||
        w.h > 0.55
      )
        continue;
      const R = (0.2 + 0.3 * (0.45 + 0.55 * Math.pow(w.ndl, 1.5))) * o.silver;
      ((t.lineDashOffset = w.h2 * 47),
        lo(
          t,
          w,
          y.reveal,
          0,
          0,
          (0.9 + 0.6 * w.h) * h,
          `rgba(250,254,255,${R})`,
        ));
    }
    t.setLineDash([]);
  }
  t.globalCompositeOperation = "screen";
  for (const y of p) {
    if (y.flash < 0.2) continue;
    const x = y.gi,
      w = 0.05 * y.flash * o.chromaAmt;
    lo(
      t,
      x,
      y.reveal,
      x.nx * 1.1,
      x.ny * 1.1,
      0.7 * h,
      `rgba(170,220,255,${w})`,
    );
  }
  (D7e(t, e, l), t.restore());
}
let jv = null;
function N7e() {
  if (jv) return jv;
  const t = Ky(yo, xo),
    e = t.getContext("2d"),
    n = yo,
    r = xo;
  ((e.fillStyle = dn.SHEET), e.fillRect(0, 0, n, r));
  let i = e.createRadialGradient(n / 2, r * 0.46, 0, n / 2, r * 0.46, r * 0.62);
  (i.addColorStop(0, "rgba(94,234,212,0.05)"),
    i.addColorStop(1, "rgba(94,234,212,0)"),
    (e.fillStyle = i),
    e.fillRect(0, 0, n, r),
    (i = e.createRadialGradient(n / 2, r / 2, 0, n / 2, r / 2, r * 0.9)),
    i.addColorStop(0, "rgba(159,216,230,0.035)"),
    i.addColorStop(1, "rgba(159,216,230,0)"),
    (e.fillStyle = i),
    e.fillRect(0, 0, n, r),
    (e.strokeStyle = "rgba(232,238,242,0.016)"),
    (e.lineWidth = 1));
  const s = 152;
  e.beginPath();
  for (let o = s; o < n; o += s) (e.moveTo(o + 0.5, 0), e.lineTo(o + 0.5, r));
  for (let o = s; o < r; o += s) (e.moveTo(0, o + 0.5), e.lineTo(n, o + 0.5));
  return (
    e.stroke(),
    (i = e.createRadialGradient(
      n / 2,
      r / 2,
      r * 0.35,
      n / 2,
      r / 2,
      r * 1.05,
    )),
    i.addColorStop(0, "rgba(0,0,0,0)"),
    i.addColorStop(1, "rgba(0,0,0,0.5)"),
    (e.fillStyle = i),
    e.fillRect(0, 0, n, r),
    (jv = t),
    jv
  );
}
const to = (lt.logomark.glyphH * xo) / 120;
let O7e = null;
const nJ = () => (O7e ??= new Path2D(nm));
let VB = null;
let GB = null;
let jB = null;
function iM(t) {
  const e = t === "haloCold" ? VB : t === "haloSeam" ? GB : jB;
  if (e) return e;
  const n = 40 * to,
    r = Math.ceil(120 * to + n * 2),
    i = Ky(r, r),
    s = i.getContext("2d");
  return (
    s.translate(n, n),
    s.scale(to, to),
    t === "haloCold"
      ? ((s.filter = `blur(${7 * to}px)`),
        (s.fillStyle = "rgba(110,240,220,0.55)"))
      : t === "haloSeam"
        ? ((s.filter = `blur(${9 * to}px)`),
          (s.fillStyle = "rgba(255,45,107,0.5)"))
        : ((s.shadowColor = "rgba(159,216,230,0.6)"),
          (s.shadowBlur = 8 * to),
          (s.fillStyle = "#dcecf4")),
    s.fill(nJ()),
    t === "haloCold" ? (VB = i) : t === "haloSeam" ? (GB = i) : (jB = i),
    i
  );
}
function F7e(t, e, n, r) {
  const i = yo / 2,
    s = xo * lt.logomark.cy,
    o = $Z(e),
    a = 40 * to,
    l = 60 * to,
    c = 0.9 + 0.1 * Math.sin((n / 6.4) * Math.PI * 2),
    u = r === "dead",
    d = 0.5 * c * (1 - 0.55 * ur(o)) * (u ? 0.4 : 1);
  ((t.globalCompositeOperation = "screen"),
    (t.globalAlpha = d),
    t.drawImage(iM("haloCold"), i - l - a, s - l - a),
    u &&
      ((t.globalAlpha = 0.28 + 0.12 * Math.sin(n * 9)),
      t.drawImage(iM("haloSeam"), i - l - a, s - l - a)),
    (t.globalAlpha = 1));
  for (let h = 0; h < Y2.length; h++) {
    const _ = Y2[h],
      p =
        Math.sin(n * (0.5 + h * 0.17) + h * 2.1) * 1.4 +
        (o > 0.8 ? (ml(Math.floor(n * 30) + h) - 0.5) * 3 * o : 0),
      v = Math.cos(n * (0.4 + h * 0.13) + h) * 1.1,
      y = 1 + o * (1.6 + h * 0.5),
      x = Math.tan((_.sk * (1 + o * 0.8) * Math.PI) / 180);
    (t.save(),
      t.translate(i, s),
      t.scale(to, to),
      t.translate(_.tx * y + p, _.ty * y + v),
      t.transform(1, 0, x, 1, 0, 0),
      t.scale(_.sc, _.sc),
      t.translate(-60, -60),
      (t.globalAlpha = Math.min(1, _.op * (1 + o * 0.9))),
      (t.strokeStyle = _.stroke),
      (t.lineWidth = 0.8),
      (t.lineJoin = "round"),
      t.stroke(nJ()),
      t.restore());
  }
  t.globalAlpha = 1;
  let f = c;
  (N1(r) && (f = 0.45 + 0.1 * Math.sin(n * 30)),
    u && (f = ml(Math.floor(n * 24)) < 0.25 ? 0.25 : 0.8),
    (t.globalAlpha = f),
    t.drawImage(iM("core"), i - l - a, s - l - a),
    (t.globalAlpha = 1),
    (t.globalCompositeOperation = "source-over"));
}
function drawBootScreen(t, e, n, r, i, s, o, a) {
  const l = yo,
    c = xo,
    u = l / 2,
    d = e * n,
    f = jZ(e, n),
    h = HZ(e),
    _ = BI(e),
    m = ur((e - Lm) / (iC - Lm)) * r.refTf,
    p = FI(r, m),
    v = qZ(e, n);
  (t.drawImage(N7e(), 0, 0),
    (t.textAlign = "center"),
    (t.textBaseline = "middle"));
  const y = lt.topbar,
    x = A7e(a),
    w = Math.round(c * x.h * y.font),
    S = c * (x.y0 + x.h * y.y),
    T = w * y.trackEm,
    R = l * (x.x0 + x.w * y.x);
  (t.save(),
    (t.textAlign = "left"),
    (t.font = `500 ${w}px ${wr.mono}`),
    (t.letterSpacing = `${T}px`),
    (t.fillStyle = dn.INK),
    t.fillText($n.frame0Word, R, S),
    t.restore(),
    (t.textAlign = "right"),
    (t.fillStyle = "rgba(232,238,242,0.16)"));
  const E = Math.round(c * x.h * y.visitorFont),
    M = l * (x.x0 + x.w * (1 - y.visitorRight));
  ((t.font = `300 ${E}px ${wr.sys}`),
    (t.letterSpacing = `${E * y.visitorZhTrackEm}px`),
    t.fillText(`${$n.visitorZh}`, M - E * y.visitorZhRightEm, S),
    (t.font = `300 ${E}px ${wr.mono}`),
    (t.letterSpacing = `${E * y.visitorEnTrackEm}px`),
    t.fillText($n.visitorEn, M, S),
    (t.letterSpacing = "0px"),
    (t.textAlign = "center"),
    F7e(t, e, d, h));
  const C = Math.round(l * lt.bar.w),
    A = Math.round(c * lt.bar.h),
    k = u - C / 2,
    N = c * lt.bar.y;
  ((t.fillStyle = dn.HAIRLINE), t.fillRect(k, N, C, A));
  const P = XZ(e, n, h, f);
  if (P && P.b > P.a) {
    const $ = t.createLinearGradient(k + P.a * C, 0, k + P.b * C, 0);
    ($.addColorStop(0, "rgba(94,234,212,0.2)"),
      $.addColorStop(1, "rgba(94,234,212,0.95)"),
      (t.fillStyle = $),
      (t.shadowColor = "rgba(94,234,212,0.5)"),
      (t.shadowBlur = c * lt.bar.glow),
      t.fillRect(k + P.a * C, N, (P.b - P.a) * C, A),
      (t.shadowBlur = 0));
  }
  const D = lt.status,
    L = c * D.y,
    O = Math.round(c * D.font),
    I = KZ(e, n, h, f, p.corrupt);
  if ((t.save(), I.dropped))
    ((t.font = `${O}px ${wr.zh}`),
      (t.fillStyle = dn.SEAM_MAGENTA),
      (t.letterSpacing = `${O * D.droppedTrackEm}px`),
      t.fillText(I.label, u + O * (D.droppedTrackEm / 2), L));
  else {
    ((t.font = `${O}px ${wr.mono}`),
      (t.fillStyle = dn.STATUS),
      (t.letterSpacing = `${O * D.trackEm}px`));
    const $ = t.measureText(I.label).width;
    ((t.globalAlpha = I.blink ?? 1),
      (t.fillStyle = dn.TEAL),
      (t.shadowColor = "rgba(94,234,212,0.7)"),
      (t.shadowBlur = O * D.dotGlowEm),
      t.beginPath(),
      t.arc(u - $ / 2 - O * D.dotCenterEm, L, O * (D.dotDiaEm / 2), 0, Jy),
      t.fill(),
      (t.shadowBlur = 0),
      (t.globalAlpha = 1),
      (t.fillStyle = dn.STATUS),
      t.fillText(I.label, u + O * (D.trackEm / 2), L));
  }
  t.restore();
  const F = lt.stream,
    G = Math.round(c * F.zhFont),
    ee = Math.round(c * F.coldFont),
    oe = c * F.lineH;
  let W = c * F.y;
  t.save();
  for (const $ of YZ(e)) {
    const { fadeIn: ne, isLast: V } = $;
    ($.kind === "cold"
      ? ((t.font = `${ee}px ${wr.sys}`),
        (t.fillStyle = dn.COLD),
        (t.shadowColor = "rgba(159,216,230,0.4)"),
        (t.shadowBlur = c * F.coldGlow),
        (t.globalAlpha = ne * 0.95),
        (t.letterSpacing = `${ee * F.coldTrackEm}px`))
      : ((t.font = `${G}px ${wr.zh}`),
        (t.fillStyle = $.kind === "err" ? dn.SEAM_MAGENTA : dn.CALIBRATE),
        (t.shadowColor =
          $.kind === "err" ? "rgba(255,45,107,0.25)" : "transparent"),
        (t.shadowBlur = $.kind === "err" ? c * F.errGlow : 0),
        (t.globalAlpha = ne * (V ? 0.9 : $.kind === "err" ? 0.75 : 0.5)),
        (t.letterSpacing = `${G * F.zhTrackEm}px`)),
      t.fillText($.text, u, W),
      (W += oe));
  }
  if (
    (t.restore(),
    (t.letterSpacing = "0px"),
    drawCracks(t, r, i, e, s, n, o, !0),
    _.any > 0.03)
  ) {
    (t.save(),
      (t.globalAlpha = _.any),
      (t.fillStyle = "rgba(232,238,242,0.05)"));
    for (let $ = (v * 7) % 4; $ < c; $ += 4) t.fillRect(0, $, l, 1);
    if (((t.globalCompositeOperation = "screen"), _.line > 0.03)) {
      const $ = lt.leakLine,
        ne = Math.round(c * $.font);
      ((t.font = `${ne}px ${wr.zh}`),
        (t.globalAlpha = _.line),
        (t.fillStyle = dn.SEAM_MAGENTA),
        Gv(t, $n.leakLine, u - l * $.dx, c * $.y, ne * $.trackEm),
        (t.fillStyle = dn.SEAM_CYAN),
        Gv(t, $n.leakLine, u + l * $.dx, c * $.y, ne * $.trackEm));
    }
    if (_.n0r1 > 0.03) {
      const $ = lt.n0r1,
        ne = Math.round(c * $.font);
      ((t.font = `600 ${ne}px ${wr.mono}`),
        (t.globalAlpha = _.n0r1 * 0.9),
        (t.fillStyle = dn.SEAM_MAGENTA),
        Gv(t, $n.n0r1, u - l * $.dx, c * $.y, ne * $.trackEm),
        (t.fillStyle = dn.SEAM_CYAN),
        Gv(t, $n.n0r1, u + l * $.dx, c * $.y, ne * $.trackEm));
    }
    t.restore();
  }
}
function Qy(t) {
  const e = new Scene();
  return (
    e.add(new Mesh(new PlaneGeometry(2, 2), t)),
    { scene: e, cam: new OrthographicCamera(-1, 1, 1, -1, 0, 1) }
  );
}
function createCorruptionPass(t) {
  const e = new WebGLRenderTarget(yo, xo, {
    depthBuffer: !1,
    stencilBuffer: !1,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  });
  ((e.texture.colorSpace = SRGBColorSpace), (e.texture.anisotropy = 8));
  const n = new ShaderMaterial({
    depthTest: !1,
    depthWrite: !1,
    uniforms: {
      tScreen: { value: t },
      uRes: { value: new Vector2(yo, xo) },
      uPixel: { value: 0 },
      uGlitch: { value: 0 },
      uP: { value: 0 },
    },
    vertexShader:
      "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }",
    fragmentShader: `
      uniform sampler2D tScreen; uniform vec2 uRes; uniform float uPixel, uGlitch, uP; varying vec2 vUv;
      float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float ord(vec2 fp){ vec2 m=mod(fp,2.0); return mix(mix(0.0,0.5,m.x),mix(0.75,0.25,m.x),m.y)-0.375; }
      float stepT(float t,float f){ return floor(t*f)/f; }
      float gate(float t,float s,float thr){ return step(thr, fract(sin((floor(t)*57.0+s)*12.9898)*43758.5453)); }
      void main(){
        vec2 res=uRes; vec2 fragPx=vUv*res; float aspect=res.x/max(res.y,1.0);
        float t=uP*16.0; float ts=stepT(t, mix(6.0,22.0,uGlitch)); // p → seconds at the 16 s default
        vec2 uv=vUv;
        if (uPixel>0.001){
          float blocks=mix(440.0,150.0,clamp(uPixel,0.0,1.0));
          vec2 cells=vec2(blocks, blocks/aspect);
          vec2 cid=floor(vUv*cells); vec2 cuv=(cid+0.5)/cells;
          float stuck=step(0.82-0.30*uGlitch, h21(cid*2.3+floor(ts*2.0)));
          vec2 dup=(fract(vec2(h21(cid+floor(ts*2.0)),h21(cid.yx+1.3+floor(ts*2.0))))-0.5)*stuck*(1.6/cells);
          uv=mix(vUv, cuv+dup, uPixel);
        }
        float rowId=floor(vUv.y*mix(80.0,170.0,uGlitch));
        float rowKey=h21(vec2(rowId, floor(ts*9.0)));
        float rowHit=step(0.93-0.10*uGlitch,rowKey)*uGlitch;
        uv.x += (rowKey-0.5)*rowHit*0.05;
        float split=uGlitch*(0.004+0.012*gate(ts*7.0,3.0,0.5));
        vec3 col;
        col.r=texture2D(tScreen, uv+vec2(split,0.0)).r;
        col.g=texture2D(tScreen, uv).g;
        col.b=texture2D(tScreen, uv-vec2(split,0.0)).b;
        if (uGlitch>0.001){
          float levels=mix(64.0,16.0,uGlitch);
          vec3 q=floor(col*levels+0.5+ord(fragPx)/levels)/levels;
          col=mix(col,q,0.5*uGlitch);
        }
        float lum=dot(col,vec3(0.299,0.587,0.114));
        float pick=h21(floor(uv*vec2(130.0,82.0))+floor(ts*3.0));
        vec3 tint = pick<0.5 ? vec3(1.0,0.18,0.42) : vec3(0.0,0.88,1.0);
        col += tint*lum*uGlitch*0.12*gate(ts*5.0,pick*9.0,0.6);
        col += 0.018*uGlitch*sin(vUv.y*res.y*0.7 - t*40.0)*vec3(0.2,0.5,0.5);
        gl_FragColor=vec4(col,1.0);
      }`,
  });
  return { rt: e, ...Qy(n), mat: n };
}
function createBloomPass(t) {
  const e = () =>
      new WebGLRenderTarget(2, 2, {
        depthBuffer: !1,
        stencilBuffer: !1,
        type: HalfFloatType,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
      }),
    n = e(),
    r = e(),
    i =
      "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }",
    s = new ShaderMaterial({
      depthTest: !1,
      depthWrite: !1,
      uniforms: { tSrc: { value: t }, uThresh: { value: 0.82 } },
      vertexShader: i,
      fragmentShader: `
      uniform sampler2D tSrc; uniform float uThresh; varying vec2 vUv;
      void main(){
        vec4 s = texture2D(tSrc, vUv);
        float lum = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
        float k = max(lum - uThresh, 0.0) / max(lum, 1e-4); // soft-ish knee
        gl_FragColor = vec4(s.rgb * k * s.a, 1.0);          // gate by coverage: the void doesn't bloom
      }`,
    }),
    o = new ShaderMaterial({
      depthTest: !1,
      depthWrite: !1,
      uniforms: { tSrc: { value: null }, uDir: { value: new Vector2(1, 0) } },
      vertexShader: i,
      fragmentShader: `
      uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
      void main(){
        vec3 acc = texture2D(tSrc, vUv).rgb * 0.227027;
        vec2 o1 = uDir * 1.3846153846, o2 = uDir * 3.2307692308;
        acc += (texture2D(tSrc, vUv + o1).rgb + texture2D(tSrc, vUv - o1).rgb) * 0.3162162162;
        acc += (texture2D(tSrc, vUv + o2).rgb + texture2D(tSrc, vUv - o2).rgb) * 0.0702702703;
        gl_FragColor = vec4(acc, 1.0);
      }`,
    }),
    a = Qy(s),
    l = Qy(o),
    c = new Vector2(1 / 2, 1 / 2);
  return {
    texture: n.texture,
    brightMat: s,
    blurMat: o,
    setSize(u, d) {
      const f = Math.max(1, Math.round(u / 2)),
        h = Math.max(1, Math.round(d / 2));
      (n.setSize(f, h), r.setSize(f, h), c.set(1 / f, 1 / h));
    },
    render(u) {
      (u.setClearColor(0, 1), u.setRenderTarget(n), u.render(a.scene, a.cam));
      for (const d of [0.9, 1.7, 2.6])
        ((o.uniforms.tSrc.value = n.texture),
          o.uniforms.uDir.value.set(c.x * d, 0),
          u.setRenderTarget(r),
          u.render(l.scene, l.cam),
          (o.uniforms.tSrc.value = r.texture),
          o.uniforms.uDir.value.set(0, c.y * d),
          u.setRenderTarget(n),
          u.render(l.scene, l.cam));
    },
    dispose() {
      (n.dispose(), r.dispose(), s.dispose(), o.dispose());
    },
  };
}
function createCompositePass(t, e) {
  const n = new ShaderMaterial({
    depthTest: !1,
    depthWrite: !1,
    transparent: !1,
    blending: FrontSide,
    uniforms: {
      tDiffuse: { value: t },
      tBloom: { value: e ?? null },
      uAmount: { value: 0 },
      uChroma: { value: 0 },
      uExposure: { value: 1.05 },
      uOut: { value: 1 },
      uFlat: { value: 0 },
      uBloom: { value: 0 },
    },
    vertexShader:
      "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform sampler2D tBloom;
      uniform float uAmount, uChroma, uExposure, uOut, uFlat, uBloom; varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
      vec3 toSRGB(vec3 c){ c=max(c, 0.0); return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(0.0031308, c)); }
      void main(){
        vec2 c = vUv - 0.5;
        float r2 = dot(c, c);
        float f = 1.0 + uAmount * r2;                 // >1 toward the rim → CENTER magnified
        vec2 uv  = 0.5 + c * f;
        vec2 uvR = 0.5 + c * (f - uChroma);
        vec2 uvB = 0.5 + c * (f + uChroma);
        vec4 sG = texture2D(tDiffuse, uv);
        vec3 col = vec3(texture2D(tDiffuse, uvR).r, sG.g, texture2D(tDiffuse, uvB).b);
        vec3 bloom = texture2D(tBloom, uv).rgb * uBloom;
        col += bloom;                                  // linear add → graded below
        float vig = clamp(1.0 - uAmount * r2 * 1.2, 0.0, 1.0);
        col = mix(toSRGB(aces(col * uExposure)), toSRGB(col), uFlat);
        // sensor dither: kills 8-bit gradient banding (the god-ray shafts + the
        // dark void ramp). TWO hashed uniforms summed to ±1 = triangular-PDF,
        // the high-quality dither; applied FLAT across the luma range — the old
        // shadow-gate ((1-luma)) faded it out exactly on the mid-bright rays,
        // which is where the banding lived. Only pulled back near pure white so
        // the flat page stays clean, and fully off while uFlat=1 (the page).
        float d1 = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float d2 = fract(sin(dot(gl_FragCoord.xy + 11.3, vec2(39.346, 11.135))) * 21897.137);
        float lumB = dot(col, vec3(0.333));
        // SHADOW-BOOSTED: this is a near-black underwater scene — 8-bit has only
        // a handful of levels down there, so banding is worst in deep shadow and
        // a flat dither is too weak. Ramp the dither up to ~6.5/255 in the
        // deepest shadow, easing to ~2.5/255 in the mids, off near white (page).
        float ditherAmp = (2.5 + 4.0 * (1.0 - smoothstep(0.0, 0.22, lumB))) / 255.0;
        float hiProtect = 1.0 - 0.85 * smoothstep(0.8, 1.0, lumB);
        col += (d1 + d2 - 1.0) * ditherAmp * hiProtect * (1.0 - uFlat);
        float bAlpha = clamp(dot(bloom, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
        float a = clamp(sG.a + bAlpha, 0.0, 1.0) * uOut;
        gl_FragColor = vec4(col * vig, a);             // straight alpha (premultipliedAlpha:false)
      }`,
  });
  return { ...Qy(n), mat: n };
}
function createBackdrop(t) {
  if (!t) return null;
  const e = document.createElement("canvas");
  ((e.width = t.width || 1280), (e.height = t.height || 720));
  const n = e.getContext("2d");
  if (!n) return null;
  const r = new CanvasTexture(e);
  ((r.colorSpace = SRGBColorSpace),
    (r.generateMipmaps = !1),
    (r.minFilter = LinearFilter),
    (r.magFilter = LinearFilter));
  const i = new ShaderMaterial({
      uniforms: {
        tScene: { value: r },
        uDim: { value: 1 },
        uFlat: { value: 0 },
        uExposure: { value: 1.05 },
      },
      vertexShader:
        "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9995, 1.0); }",
      fragmentShader: `
      uniform sampler2D tScene; uniform float uDim, uFlat, uExposure; varying vec2 vUv;
      // exact inverse of the blit's ACES fit (solve the rational quadratic)
      vec3 acesInv(vec3 y){
        y = clamp(y, 0.0, 0.999);
        vec3 a = 2.51 - 2.43*y, b = 0.03 - 0.59*y;
        return (sqrt(b*b + 0.56*y*a) - b) / (2.0*a);
      }
      void main(){
        vec3 lin = texture2D(tScene, vUv).rgb;                 // linear (hw-decoded sRGB)
        vec3 col = mix(acesInv(lin) / uExposure, lin, uFlat);  // undo whichever grade the blit applies
        gl_FragColor = vec4(col * uDim, 1.0);
      }`,
    }),
    s = new Mesh(new PlaneGeometry(2, 2), i);
  ((s.frustumCulled = !1), (s.visible = !1), (s.renderOrder = -1));
  const o = 1366;
  return {
    mesh: s,
    mat: i,
    tex: r,
    draw() {
      const a = t.width,
        l = t.height;
      if (!a) return;
      const c = Math.min(1, o / a),
        u = Math.max(1, Math.round(a * c)),
        d = Math.max(1, Math.round(l * c));
      (e.width !== u && ((e.width = u), (e.height = d)),
        n.drawImage(t, 0, 0, u, d),
        (r.needsUpdate = !0));
    },
    dispose() {
      (r.dispose(), i.dispose(), s.geometry.dispose());
    },
  };
}
const { BREAK: j7e } = SHATTER_MARKERS;
function createScreenTexture(t) {
  const e = ZZ(),
    n = document.createElement("canvas");
  ((n.width = yo), (n.height = xo));
  const r = n.getContext("2d", { willReadFrequently: !0 });
  if (!r) throw new Error("boot screen: 2D context unavailable");
  const i = new CanvasTexture(n);
  ((i.colorSpace = SRGBColorSpace), (i.anisotropy = 8));
  let s = -999,
    o = "";
  return {
    texture: i,
    draw(a, l, c, u, d) {
      const f = Math.min(a, j7e),
        h = { darkCore: u.darkCore, silver: u.silver, chromaAmt: u.chromaAmt },
        _ = `${l}|${c}|${h.darkCore}|${h.silver}|${h.chromaAmt}|${d.toFixed(4)}`;
      (Math.abs(f - s) < 6e-4 && _ === o) ||
        ((s = f),
        (o = _),
        drawBootScreen(r, f, l, t, e, c, h, d),
        (i.needsUpdate = !0));
    },
    invalidate() {
      ((s = -999), (o = ""));
    },
    whenRendered() {
      return Promise.resolve();
    },
    dispose() {
      i.dispose();
    },
  };
}
const {
  CRACK_START: Zs,
  CRACK_FULL: e_,
  BREAK: _i,
  OUT_END: zB,
} = SHATTER_MARKERS;
const { PW: WB, PH: $B, SCALE: rJ } = li;
const qB = 460809;
const z7e = 9.81 * rJ;
const wp = new Vector3();
const XB = new Vector3();
const KB = new Vector3();
const sM = new Quaternion();
const YB = new Matrix4();
const Sp = new Vector3();
const W7e = new Quaternion();
const Mp = (t, e, n) => t + (e - t) * n;
const ZB = (t, e, n) => {
  const r = ur((n - t) / (e - t));
  return r * r * (3 - 2 * r);
};
const $c = () => ({});
const $7e = () => {
  const t = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat);
  return ((t.needsUpdate = !0), t);
};
const q7e = Zs + 0.5 * (e_ - Zs);
class ShatterRenderer {
  renderer;
  scene;
  camBaseZ;
  camera;
  clearAlpha;
  pmrem;
  envRT;
  group;
  graph;
  brk = null;
  bp0;
  screen;
  corrupt;
  bg;
  beamMat;
  beam;
  rimU;
  refrU;
  deathU;
  beamU;
  faceMat;
  sideMat;
  pageMat;
  pane;
  filU;
  filigreeMat;
  sceneRT;
  bloom;
  blit;
  constructor(e, n, r, backdrop = null) {
    this.backdropCanvas = backdrop;
    const i = shatterDefaults(n),
      s = new WebGLRenderer({
        canvas: e,
        antialias: !0,
        alpha: !0,
        premultipliedAlpha: !1,
      });
    (s.setPixelRatio(Math.min(devicePixelRatio, 2) * ($c().__rscale || 1)),
      (s.toneMapping = NoToneMapping),
      (s.autoClear = !0),
      (s.info.autoReset = !1),
      (this.renderer = s),
      (this.scene = new Scene()),
      (this.camBaseZ = 7),
      (this.camera = new PerspectiveCamera(40, 1, 0.1, 100)),
      this.camera.position.set(0, 0, this.camBaseZ),
      (this.clearAlpha = 1),
      (this.pmrem = new PMREMGenerator(s)),
      (this.envRT = this.pmrem.fromEquirectangular(kWe()).texture),
      (this.scene.environment = this.envRT));
    const o = new DirectionalLight(13627125, 1.6);
    (o.position.set(3, 4, 6), this.scene.add(o));
    const a = new DirectionalLight(6220500, 1.1);
    (a.position.set(-2, -3, -4),
      this.scene.add(a),
      this.scene.add(new AmbientLight(1454652, 0.5)),
      (this.group = new Group()),
      this.scene.add(this.group),
      (this.graph = r),
      (this.bp0 = i),
      (this.screen = createScreenTexture(this.graph)),
      (this.corrupt = createCorruptionPass(this.screen.texture)));
    const l = this.corrupt.rt.texture;
    (l.offset.set(0.5, 0.5),
      l.repeat.set(1 / WB, 1 / $B),
      (this.bg = createBackdrop(backdrop)),
      this.bg && this.scene.add(this.bg.mesh),
      (this.beamMat = RWe()),
      (this.beam = new Mesh(new PlaneGeometry(9, 18), this.beamMat)),
      this.beam.position.set(0.6, 0, -2),
      (this.beam.renderOrder = 2),
      (this.beam.frustumCulled = !1),
      (this.beam.visible = !1),
      this.scene.add(this.beam),
      (this.rimU = {
        intensity: { value: i.rimGlint },
        power: { value: i.rimPower },
        color: { value: new Color(15400191) },
      }),
      (this.refrU = {
        tex: { value: this.bg ? this.bg.tex : $7e() },
        res: { value: new Vector2(2, 2) },
        amt: { value: i.refrAmt },
        dim: { value: 1 },
      }),
      (this.deathU = { tb: { value: -10 } }),
      (this.beamU = { on: { value: 0 } }),
      (this.faceMat = createGlassMaterial(
        l,
        this.refrU,
        this.deathU,
        this.beamU,
      )),
      (this.sideMat = createEdgeMaterial(EWe(), this.rimU, this.deathU)),
      (this.pageMat = TWe(l)),
      (this.pane = i7e([this.pageMat, this.sideMat], i.thickness)),
      (this.pane.renderOrder = 1),
      this.group.add(this.pane),
      (this.filU = { gain: { value: i.filigree } }),
      (this.filigreeMat = CWe(this.filU)),
      (this.sceneRT = new WebGLRenderTarget(2, 2, {
        depthBuffer: !0,
        stencilBuffer: !1,
        samples: $c().__msaa != null ? $c().__msaa : 4,
        type: HalfFloatType,
      })),
      (this.bloom = createBloomPass(this.sceneRT.texture)),
      (this.blit = createCompositePass(
        this.sceneRT.texture,
        this.bloom.texture,
      )),
      this.resize(e.clientWidth || 1280, e.clientHeight || 720));
  }
  ensureBreakStage() {
    if (this.brk) return this.brk;
    const e = this.bp0,
      {
        shards: n,
        emitters: r,
        bake: i,
      } = simulateShardBodies(this.graph, {
        gravity: e.gravity,
        flowForce: e.flowForce,
        breachImpulse: e.shock,
        dragLin: e.dragLin,
        dragQuad: e.dragQuad,
        alignAero: e.alignAero,
        spinDrag: e.spinDrag,
        flowSpread: e.coneSpread,
      }),
      s = n,
      o = M7e(r, n, Math.round(e.debris));
    for (const f of s) {
      ((f.mesh = UZ(f.poly, [this.faceMat, this.sideMat], e.thickness)),
        (f.mesh.visible = !1));
      const h = Math.hypot(f.centroid.x - Ut.x, f.centroid.y - Ut.y) / TZ,
        _ = 0.015 + 0.085 * Math.min(1, h),
        m = f.mesh.geometry.getAttribute("position").count;
      f.mesh.geometry.setAttribute(
        "aDeath",
        new Float32BufferAttribute(new Float32Array(m).fill(_), 1),
      );
      const p = ZB(0.004, 0.18, f.area);
      (f.mesh.geometry.setAttribute(
        "aArea",
        new Float32BufferAttribute(new Float32Array(m).fill(p), 1),
      ),
        (f.fil = new LineSegments(
          n7e(f.poly, e.thickness, f.area),
          this.filigreeMat,
        )),
        (f.fil.renderOrder = 3),
        f.mesh.add(f.fil),
        this.group.add(f.mesh));
    }
    const a = PWe(),
      l = new InstancedMesh(
        new TetrahedronGeometry(1),
        a,
        Math.max(1, o.glitter.length),
      ),
      c = new Float32Array(Math.max(1, o.glitter.length)).fill(1);
    for (let f = 0; f < o.glitter.length; f++) c[f] = o.glitter[f].luck ?? 1;
    (l.geometry.setAttribute("aLuck", new InstancedBufferAttribute(c, 1)),
      (l.frustumCulled = !1),
      (l.visible = !1),
      this.group.add(l));
    const u = IWe(),
      d = new InstancedMesh(
        new PlaneGeometry(1, 1),
        u,
        Math.max(1, o.dust.length),
      );
    return (
      (d.frustumCulled = !1),
      (d.visible = !1),
      this.group.add(d),
      (this.brk = {
        shards: s,
        bake: i,
        fines: o,
        glitterMat: a,
        glitter: l,
        dustMat: u,
        dust: d,
      }),
      this.brk
    );
  }
  render(e, n) {
    const r = ur(e);
    (this.renderer.info.reset(),
      this.screen.draw(
        r,
        n.shatterDuration,
        n.crackWidth,
        n,
        this.camera.aspect,
      ),
      this.update(r, n));
    const i = this.renderer;
    (i.setClearColor(0, 1),
      i.setRenderTarget(this.corrupt.rt),
      i.render(this.corrupt.scene, this.corrupt.cam),
      i.setClearColor(qB, this.clearAlpha),
      i.setRenderTarget(this.sceneRT),
      i.render(this.scene, this.camera),
      this.blit.mat.uniforms.uBloom.value > 0.001 && this.bloom.render(i),
      i.setClearColor(qB, 0),
      i.setRenderTarget(null),
      i.render(this.blit.scene, this.blit.cam));
  }
  drawBackdrop() {
    if (!this.bg) {
      const e = this.backdropCanvas;
      if (!e || ((this.bg = createBackdrop(e)), !this.bg)) return;
      (this.scene.add(this.bg.mesh), (this.refrU.tex.value = this.bg.tex));
    }
    this.bg.draw();
  }
  invalidateScreen() {
    this.screen.invalidate();
  }
  prewarm(e) {
    try {
      (this.ensureBreakStage(), this.renderer.compile(this.scene, this.camera));
      for (const n of [0.86, 0.9, 0.94, 0.98]) this.render(n, e);
      (this.renderer.getContext().finish(), this.screen.invalidate());
    } catch {}
  }
  flowAt(e, n, r, i, s) {
    const o = e - Ut.x,
      a = n - (Ut.y - 0.1),
      l = Math.hypot(o, a),
      c =
        (0.16 + 0.46 * Math.pow(r, 0.65) + 0.16 * ZB(0.15, 1.6, l)) *
        s.coneSpread,
      u = (l > 1e-5 ? o / l : 1) * c,
      d = (l > 1e-5 ? a / l : 0) * c,
      f = Math.hypot(u, d, 1),
      h =
        0.38 *
        Mp(1.3, 2.4, Math.pow(r, 0.55)) *
        rJ *
        Mp(1.15, 0.6, i) *
        s.suctionV,
      _ = Mp(1, 2.9, i);
    return (
      KB.set((u / f) * h * _, (d / f) * h * _, (1 / f) * h * Mp(1.05, 0.3, i)),
      KB
    );
  }
  sampleBake(e, n, r, i) {
    const s = i.frameCount,
      o = i.count,
      a = i.frames,
      l = (n * (r.simSpeed ?? 1)) / i.storeDt;
    let c = l < 0 ? 0 : Math.floor(l),
      u = l - c,
      d = c + 1;
    c >= s - 1 && ((c = s - 1), (d = s - 1), (u = 0));
    const f = (c * o + e.id) * 7,
      h = (d * o + e.id) * 7,
      _ = e.mesh;
    _.position.set(
      a[f] + (a[h] - a[f]) * u,
      a[f + 1] + (a[h + 1] - a[f + 1]) * u,
      a[f + 2] + (a[h + 2] - a[f + 2]) * u,
    );
    const m = a[f + 3],
      p = a[f + 4],
      v = a[f + 5],
      y = a[f + 6];
    let x = a[h + 3],
      w = a[h + 4],
      S = a[h + 5],
      T = a[h + 6];
    m * x + p * w + v * S + y * T < 0 &&
      ((x = -x), (w = -w), (S = -S), (T = -T));
    const R = m + (x - m) * u,
      E = p + (w - p) * u,
      M = v + (S - v) * u,
      C = y + (T - y) * u,
      A = 1 / (Math.hypot(R, E, M, C) || 1);
    _.quaternion.set(R * A, E * A, M * A, C * A);
  }
  poseFines(e, n, r, i, s, o, a) {
    let l = !1;
    for (let c = 0; c < e.length; c++) {
      const u = e[c],
        d = (u.t0 != null ? u.t0 : ((u.Tpre ?? 0) - 1) * a) + u.birthJit,
        f = r - d;
      if (f <= 0) {
        (Sp.setScalar(0), this.poseDummy(n, c));
        continue;
      }
      const h = u.tau * i.tauScale,
        _ = this.flowAt(u.p0.x, u.p0.y, ur(r / 0.5), 0, i),
        m = _.x,
        p = _.y - z7e * i.gravity * h,
        v = _.z,
        y = h * (1 - Math.exp(-f / h));
      if (
        (wp.set(
          u.p0.x + m * f + (u.v0.x - m) * y,
          u.p0.y + p * f + (u.v0.y - p) * y,
          v * f + (u.v0.z - v) * y,
        ),
        wp.z > s - 0.1)
      ) {
        (Sp.setScalar(0), this.poseDummy(n, c));
        continue;
      }
      (o
        ? sM.copy(o)
        : (XB.set(
            Math.sin(u.h * 6.28),
            Math.cos(u.h * 6.28),
            Math.sin(u.h2 * 6.28),
          ).normalize(),
          sM.setFromAxisAngle(XB, Mp(6, 26, u.h2) * f)),
        Sp.setScalar(u.size),
        n.setMatrixAt(c, YB.compose(wp, sM, Sp)),
        (l = !0));
    }
    return ((n.instanceMatrix.needsUpdate = !0), l);
  }
  poseDummy(e, n) {
    (wp.set(0, 0, 999), e.setMatrixAt(n, YB.compose(wp, W7e, Sp)));
  }
  update(e, n) {
    const r = n.shatterDuration,
      i = e * r,
      s = e >= _i,
      o = i - _i * r,
      a = BI(e),
      l = (e_ - Zs) * r,
      c = e >= q7e ? this.ensureBreakStage() : this.brk,
      u = ur((e - Zs) / (e_ - Zs)) * this.graph.refTf,
      d = FI(this.graph, u),
      f = 1 - Fv(jr(e, _i + 0.0675, zB));
    ((this.corrupt.mat.uniforms.uGlitch.value =
      n.glitch * ur(a.any + 0.03 * d.corrupt) * f),
      (this.corrupt.mat.uniforms.uPixel.value =
        n.glitch * (0.3 * a.n0r1 + 0.012 * d.ae) * f),
      (this.corrupt.mat.uniforms.uP.value = e),
      (this.pane.visible = !s),
      this.pageMat.color.setScalar(1 - 0.1 * a.any),
      (this.blit.mat.uniforms.uFlat.value = s ? 1 - ur(o / 0.12) : 1),
      (this.blit.mat.uniforms.uBloom.value =
        s && !$c().__noBloom ? n.bloom * ur(o / 0.22) : 0),
      (this.bloom.brightMat.uniforms.uThresh.value = n.bloomThresh),
      (this.rimU.intensity.value = n.rimGlint),
      (this.rimU.power.value = n.rimPower),
      (this.faceMat.envMapIntensity = 0.12 * n.envPunch),
      (this.sideMat.envMapIntensity = 0.45 * n.envPunch),
      c && (c.glitterMat.envMapIntensity = 9 * n.envPunch),
      (this.filU.gain.value = n.filigree),
      (this.refrU.amt.value = n.refrAmt),
      (this.deathU.tb.value = s ? o : -10),
      (this.beam.visible = !1),
      (this.beamU.on.value = 0));
    const h = 0.42,
      _ = Math.max(0, o),
      m = Math.max(0, o - 0.16),
      p = Math.exp(-m / h),
      v = s ? n.camDive * m + h * (0.25 * n.camDive - n.camDive) * (1 - p) : 0,
      y = this.camBaseZ - v,
      x = y - 0.15;
    if (c) {
      for (const N of c.shards) {
        const P = N.mesh;
        ((P.visible = s),
          s &&
            (this.sampleBake(N, o, n, c.bake),
            P.position.z > x && (P.visible = !1)));
      }
      const k = !$c().__noFines && e > Zs + 0.6 * (e_ - Zs);
      ((c.glitter.visible = k),
        (c.dust.visible = k && s),
        k &&
          (this.poseFines(c.fines.glitter, c.glitter, o, n, y, null, l),
          s &&
            this.poseFines(
              c.fines.dust,
              c.dust,
              o,
              n,
              y,
              this.camera.quaternion,
              l,
            )));
    }
    const w = Fv(jr(e, Zs + 0.31 * (_i - Zs), _i));
    let S = n.lensMax * w;
    const T = jr(e, _i, _i + 0.039);
    (T > 0 &&
      (S = n.lensMax * Math.exp(-T * 7.5) * Math.cos(T * Math.PI * 2.2)),
      (this.blit.mat.uniforms.uAmount.value = S));
    const R = e >= _i ? 1 : 0.3;
    this.blit.mat.uniforms.uChroma.value =
      n.lensChroma *
      R *
      Math.min(1, n.lensMax > 0 ? Math.abs(S) / n.lensMax : 0);
    const E = xWe(jr(e, Zs + 0.64 * (_i - Zs), _i)),
      M = wWe(e, _i, 0.012),
      C = E * 0.006 + M * 0.03 + 0.004 * d.ae;
    ((this.camera.position.z = y - M * 0.25),
      (this.camera.position.x = Math.sin(e * r * 58) * C),
      (this.camera.position.y = Math.cos(e * r * 53) * C * 0.7),
      this.camera.lookAt(0, 0, 0),
      s &&
        this.camera.rotateZ(
          0.012 * Math.exp(-_ / 0.12) * Math.sin(37 * _ + 1.7),
        ),
      (this.clearAlpha = 1 - Fv(jr(e, _i, _i + 0.011))),
      (this.blit.mat.uniforms.uOut.value = 1 - Fv(jr(e, _i + 0.073, zB))),
      this.bg &&
        ((this.bg.mesh.visible = s && !($c().__noBg ?? !0)),
        (this.bg.mat.uniforms.uFlat.value = this.blit.mat.uniforms.uFlat.value),
        (this.bg.mat.uniforms.uDim.value =
          1 + (n.seaDim - 1) * this.clearAlpha),
        (this.refrU.dim.value = this.bg.mat.uniforms.uDim.value)));
  }
  resize(e, n) {
    (this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, 2) * ($c().__rscale || 1),
    ),
      this.renderer.setSize(e, n, !1),
      (this.camera.aspect = e / n),
      this.camera.updateProjectionMatrix(),
      this.frameCamera());
    const r = this.renderer.getPixelRatio();
    (this.sceneRT.setSize(
      Math.max(1, Math.round(e * r)),
      Math.max(1, Math.round(n * r)),
    ),
      this.bloom.setSize(
        Math.max(1, Math.round(e * r)),
        Math.max(1, Math.round(n * r)),
      ),
      this.refrU.res.value.set(
        Math.max(1, Math.round(e * r)),
        Math.max(1, Math.round(n * r)),
      ));
  }
  frameCamera() {
    const e = (this.camera.fov * Math.PI) / 180;
    this.camBaseZ = 7;
    const n = Math.tan(e * 0.5) * this.camBaseZ,
      r = n * this.camera.aspect;
    this.group.scale.setScalar(
      Math.max(n / ($B * 0.5), r / (WB * 0.5)) * li.OVERSCAN,
    );
  }
  dispose() {
    if (
      (this.screen.dispose(),
      this.corrupt.rt.dispose(),
      this.corrupt.mat.dispose(),
      this.sceneRT.dispose(),
      this.bloom.dispose(),
      this.blit.mat.dispose(),
      this.bg && this.bg.dispose(),
      this.pane.geometry.dispose(),
      this.pageMat.dispose(),
      this.faceMat.dispose(),
      this.sideMat.dispose(),
      this.brk)
    ) {
      for (const e of this.brk.shards)
        (e.mesh.geometry.dispose(), e.fil && e.fil.geometry.dispose());
      (this.brk.glitter.geometry.dispose(),
        this.brk.glitterMat.dispose(),
        this.brk.dust.geometry.dispose(),
        this.brk.dustMat.dispose());
    }
    (this.filigreeMat.dispose(),
      this.beam.geometry.dispose(),
      this.beamMat.dispose(),
      this.envRT.dispose(),
      this.pmrem.dispose(),
      this.renderer.dispose());
  }
}
export {
  ShatterRenderer,
  createFractureGraph,
  shatterDefaults,
  SHATTER_PARAMETERS,
};
