import { GlProgram, GpuProgram, Shader, UniformGroup } from "pixi.js";
import type { MarginalGrowthParams } from "../../state/marginal-growth-store";

/**
 * Shipped `K`. Pulse ring size, and the `${K}` substitution in the shader templates.
 * The exported sources keep `${K}` so they stay byte-for-byte substrings of
 * `public/assets/IdleScreen-DCDB640k.js`. Programs receive it replaced with 32.
 */
export const PULSE_SLOT_COUNT = 32;

/** Shipped vertex template `es` (`IdleScreen-DCDB640k.js` line 961). */
export const RIBBON_VERTEX_GLSL: string = "#version 300 es\nin vec2 aPosition;\nin vec4 aSegAB;\nin vec2 aChainDist;\nin vec3 aMeta;          // birthStep, layer (0=circle, 1=icon), isMain (0/1)\nin vec2 aBranchAB;\nin vec2 aBranchLen;\nin vec2 aThicknessAB;   // dynamic: per-endpoint current thickness\n\nuniform mat3 uProjectionMatrix;\nuniform mat3 uWorldTransformMatrix;\nuniform mat3 uTransformMatrix;\n\nuniform float uTimeMs;\nuniform float uCurrentStep;\nuniform float uLineWidth;\nuniform float uIconOpacity;\nuniform float uCircleOpacity;\nuniform float uDebugMainOnly;\nuniform float uDebugSideOnly;\n\nuniform float uSwayEnabled;\nuniform float uSwayAmplitude;\nuniform float uSwayFrequency;\nuniform float uSwayChainMax;\nuniform float uSwayMinBranchLen;\nuniform float uSwayIconScale;\nuniform float uSwayCircleScale;\n\n// Phase 7 — singularity warp (vertex displacement on top of sway). Other\n// tier-8-11 fx (lattice, orbital, starfield) live in the fragment shader.\nuniform vec2  uWorldCenter;\nuniform float uWarpAmplitude;\n\n// Per-vertex-hoisted fx (see vFx below).\nuniform float uBreathEnabled;\nuniform float uBreathFrequency;\nuniform float uBreathAmplitude;\nuniform float uTipGlowEnabled;\nuniform float uTipGlowDecay;\nuniform float uTipGlowBoost;\n\nout vec2 vWorldPos;\nout vec4 vSegAB;\nout vec2 vHW;\nout vec2 vAlpha;\nout vec2 vChainDist;\nout vec2 vMeta;\n// Fragment-cost hoists — the mesh rasterizes far more fragments than it has\n// vertices, so per-quad-constant or long-wavelength terms are evaluated here:\n//   vFx.x — tip-glow brightness boost. exp() of (uCurrentStep − birthStep),\n//           flat across the quad, so the hoist is exact.\n//   vFx.y — breath width multiplier. Radial wavelength ≈ 1256 wu vs ~5 wu\n//           segments, so linear interpolation across a quad is exact to\n//           well under a percent of the swing.\nout vec2 vFx;\n\nfloat branchPhase(float id) {\n  return fract(sin(id * 12.9898) * 43758.5453) * 6.28318;\n}\n\nvec2 swayField(vec2 p, float tSec, float phase) {\n  float t = tSec * uSwayFrequency;\n  vec2 base = vec2(\n    sin(t * 6.28318 * 1.0 + p.x * 0.0008 + p.y * 0.0003 + phase),\n    cos(t * 6.28318 * 0.9 + p.x * 0.0004 + p.y * 0.001  + phase * 1.3)\n  );\n  vec2 detail = vec2(\n    sin(t * 6.28318 * 2.7 + p.x * 0.003  + p.y * 0.002 + phase * 1.7),\n    cos(t * 6.28318 * 2.5 + p.x * 0.002  + p.y * 0.003 + phase * 2.1)\n  );\n  return base + detail * 0.3;\n}\n\nvoid cullToDegenerate() {\n  gl_Position = vec4(2.0, 2.0, 2.0, 1.0);\n  vWorldPos = vec2(0.0);\n  vSegAB = vec4(0.0);\n  vHW = vec2(0.0);\n  vAlpha = vec2(0.0);\n  vChainDist = vec2(0.0);\n  vMeta = vec2(0.0);\n  vFx = vec2(0.0, 1.0);\n}\n\nvoid main() {\n  float birthStep = aMeta.x;\n  float layer = aMeta.y;\n  float isMain = aMeta.z;\n\n  // Birth-step cull — collapse pre-born quads to a single clip-space point.\n  if (birthStep > uCurrentStep + 0.5) { cullToDegenerate(); return; }\n  // Debug filter cull (uniform-driven; no CPU rebuild on filter change).\n  if (uDebugMainOnly > 0.5 && isMain < 0.5) { cullToDegenerate(); return; }\n  if (uDebugSideOnly > 0.5 && isMain > 0.5) { cullToDegenerate(); return; }\n\n  // Per-endpoint hw / alpha from thickness + uniforms. Parent and child\n  // always share a layer (the cache build emits separate per-layer sub-\n  // networks), so a single layer flag covers both endpoints.\n  float layerOp = mix(uCircleOpacity, uIconOpacity, layer);\n  float thA = aThicknessAB.x;\n  float thB = aThicknessAB.y;\n  vec2 hw = vec2(uLineWidth + thA, uLineWidth + thB) * 0.5;\n  vec2 alpha = vec2(\n    layerOp * (thA * (1.0 / 3.0) + 0.2),\n    layerOp * (thB * (1.0 / 3.0) + 0.2)\n  );\n\n  vec2 worldPos = aPosition;\n  vec4 segAB = aSegAB;\n\n  if (uSwayEnabled > 0.5) {\n    float tSec = uTimeMs * 0.001;\n    float chainMax = max(uSwayChainMax, 1.0);\n    float fallA = clamp(aChainDist.x / chainMax, 0.0, 1.0);\n    float fallB = clamp(aChainDist.y / chainMax, 0.0, 1.0);\n    float phaseA = branchPhase(aBranchAB.x);\n    float phaseB = branchPhase(aBranchAB.y);\n    float minLen = max(uSwayMinBranchLen, 1.0);\n    float lenScaleA = clamp(aBranchLen.x / minLen, 0.0, 1.0);\n    float lenScaleB = clamp(aBranchLen.y / minLen, 0.0, 1.0);\n    float layerScale = mix(uSwayCircleScale, uSwayIconScale, layer);\n    vec2 dispA = swayField(aSegAB.xy, tSec, phaseA) * uSwayAmplitude * fallA * lenScaleA * layerScale;\n    vec2 dispB = swayField(aSegAB.zw, tSec, phaseB) * uSwayAmplitude * fallB * lenScaleB * layerScale;\n\n    vec2 ba = aSegAB.zw - aSegAB.xy;\n    float h = clamp(dot(aPosition - aSegAB.xy, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);\n    vec2 dispVert = mix(dispA, dispB, h);\n\n    worldPos = aPosition + dispVert;\n    segAB = vec4(aSegAB.xy + dispA, aSegAB.zw + dispB);\n  }\n\n  // Singularity warp — spiral pull toward world center, scaled by inverse\n  // distance so the warp falls off at the rim. Visual hint of gravity, no\n  // physics. Off when uWarpAmplitude == 0 (tier 10 stage 0 or below).\n  if (uWarpAmplitude > 0.0) {\n    vec2 toCenter = uWorldCenter - worldPos;\n    float dist = length(toCenter);\n    if (dist > 1.0) {\n      vec2 tangent = vec2(-toCenter.y, toCenter.x) / dist;\n      float fall = 1.0 / (1.0 + dist * 0.0008);\n      float t = uTimeMs * 0.0001;\n      vec2 spiral = (toCenter / dist) * 0.6 + tangent * 0.4;\n      worldPos += spiral * uWarpAmplitude * fall * (0.7 + 0.3 * sin(t * 6.28));\n      segAB.xy += spiral * uWarpAmplitude * fall * 0.5;\n      segAB.zw += spiral * uWarpAmplitude * fall * 0.5;\n    }\n  }\n\n  // Fragment-cost hoists (see the vFx varying comment).\n  float tipGlow = 0.0;\n  if (uTipGlowEnabled > 0.5) {\n    float age = max(0.0, uCurrentStep - birthStep);\n    tipGlow = exp(-age / max(uTipGlowDecay, 1.0)) * uTipGlowBoost;\n  }\n  float breathMul = 1.0;\n  if (uBreathEnabled > 0.5) {\n    float radial = length(worldPos - uWorldCenter);\n    float phase = uTimeMs * 0.001 * uBreathFrequency * 6.283185 - radial * 0.005;\n    breathMul = 1.0 + sin(phase) * uBreathAmplitude;\n  }\n\n  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;\n  gl_Position = vec4((mvp * vec3(worldPos, 1.0)).xy, 0.0, 1.0);\n  vWorldPos = worldPos;\n  vSegAB = segAB;\n  vHW = hw;\n  vAlpha = alpha;\n  vChainDist = aChainDist;\n  vMeta = vec2(birthStep, layer);\n  vFx = vec2(tipGlow, breathMul);\n}\n";

/** Shipped fragment template `ts` (line 1135), including `${K}`. */
export const RIBBON_FRAGMENT_GLSL: string = "#version 300 es\nprecision highp float;\n\nin vec2 vWorldPos;\nin vec4 vSegAB;\nin vec2 vHW;\nin vec2 vAlpha;\nin vec2 vChainDist;\nin vec2 vMeta;\nin vec2 vFx;   // x = tip-glow boost, y = breath width multiplier (vertex-hoisted)\n\nuniform vec4 uColor;\nuniform vec4 uWorldColorAlpha;\n\nuniform float uTimeMs;\nuniform float uCurrentStep;\nuniform vec2  uWorldCenter;\nuniform vec4  uPulses[${K}];\nuniform float uActivePulseCount;\nuniform float uPulseSpeed;\nuniform float uPulseBand;\nuniform float uPulseDuration;\nuniform float uPulseBrightness;\nuniform vec4  uPulseTints[${K}];\nuniform float uFlowEnabled;\nuniform float uFlowSpeed;\nuniform float uFlowSpacing;\nuniform float uFlowWidth;\nuniform float uFlowBrightness;\nuniform float uTwinkleEnabled;\nuniform float uTwinkleFrequency;\nuniform float uTwinkleAmplitude;\nuniform float uLayerSplitEnabled;\nuniform vec3  uCircleColor;\nuniform vec3  uIconColor;\n\n// Phase 7 (post-redesign) - tier-7-11 fx contributing additive RGB to the\n// ribbon. Each gates on its presence uniform == 0 to early-out cheaply.\n// uWarpAmplitude is also used in the vertex shader (warp displacement);\n// declared here so the GLSL linker sees a consistent uniform set in both\n// stages.\nuniform float uQuantumPresence;\nuniform float uQuantumCarrierHz;\nuniform float uQuantumCollapsePeriodMs;\nuniform float uQuantumCollapseHalfWidthMs;\nuniform vec3  uQuantumColor;\nuniform float uHivePresence;\nuniform float uHivePulseHz;\nuniform float uHiveInterferenceScale;\nuniform float uHiveDoubleBeat;\nuniform float uHiveRimBoost;\nuniform vec3  uHiveColor;\nuniform float uOrbitalPresence;\nuniform float uOrbitalDashRate;\nuniform vec3  uOrbitalColor;\nuniform float uWarpAmplitude;\nuniform vec3  uWarpColor;\nuniform float uEschatonPresence;\nuniform float uEschatonBeamCount;\nuniform float uEschatonBeamWidth;\nuniform float uEschatonBeamSpeed;\nuniform float uEschatonHalo;\nuniform float uEschatonFlashPeriod;\nuniform float uEschatonFlashStrength;\nuniform vec3  uEschatonColor;\n// Per-frame scalar envelopes hoisted to the CPU (tick() computes them from\n// uTimeMs + the fx params): the quantum collapse strobe and the eschaton\n// annunciation flash are functions of time only, so evaluating their mod/exp\n// once per frame beats once per fragment.\nuniform float uQuantumCollapse;\nuniform float uEschatonFlash;\n\n// Sway uniforms appear in the same UniformGroup but only the vertex shader\n// uses them; declared here so the shared GLSL program links cleanly.\nuniform float uLineWidth;\nuniform float uIconOpacity;\nuniform float uCircleOpacity;\nuniform float uDebugMainOnly;\nuniform float uDebugSideOnly;\nuniform float uSwayEnabled;\nuniform float uSwayAmplitude;\nuniform float uSwayFrequency;\nuniform float uSwayChainMax;\nuniform float uSwayMinBranchLen;\nuniform float uSwayIconScale;\nuniform float uSwayCircleScale;\n\n// Master layer opacity (the lab alpha slider). Applied in-shader because a\n// container worldAlpha doesn't reliably reach this custom mesh/MAX-blend path.\nuniform float uRenderOpacity;\n\nout vec4 finalColor;\n\nfloat hash21(vec2 p) {\n  p = fract(p * vec2(123.34, 456.21));\n  p += dot(p, p + 45.32);\n  return fract(p.x * p.y);\n}\n\nvoid main() {\n  vec2 a = vSegAB.xy;\n  vec2 b = vSegAB.zw;\n  vec2 ba = b - a;\n  vec2 pa = vWorldPos - a;\n  float denom = max(dot(ba, ba), 1e-6);\n  float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);\n  float lineDist = length(pa - ba * h);\n  // (3) Breathing — slow radial wave modulates capsule half-width\n  // (vertex-hoisted; vFx.y is 1.0 when the effect is off).\n  float w = mix(vHW.x, vHW.y, h) * vFx.y;\n\n  float sd = lineDist - w;\n  float aa = max(fwidth(sd), 1e-4);\n  float cov = 1.0 - smoothstep(-aa, aa, sd);\n\n  float alpha = mix(vAlpha.x, vAlpha.y, h);\n\n  // Every output term below rides alpha*cov, so a zero-coverage fragment is a\n  // MAX-blend no-op — return before the fx stack. The quads are padded well\n  // past the capsule (sway/warp headroom), so these are the majority of\n  // rasterized fragments; skipping them here is exact, not an approximation.\n  if (alpha * cov <= 0.0) {\n    finalColor = vec4(0.0);\n    return;\n  }\n\n  float brightness = 1.0;\n\n  // (2) Chain flow packets.\n  if (uFlowEnabled > 0.5) {\n    float chainPos = mix(vChainDist.x, vChainDist.y, h);\n    float offset = uTimeMs * 0.001 * uFlowSpeed - chainPos;\n    float m = mod(offset, uFlowSpacing);\n    if (m > uFlowSpacing * 0.5) m -= uFlowSpacing;\n    float d = m / max(uFlowWidth, 1e-4);\n    brightness += exp(-d * d) * uFlowBrightness;\n  }\n\n  // (4) Tip glow — newly-grown segments emit a fading bloom (vertex-hoisted;\n  // birthStep is constant per quad, so the exp() moved out exactly).\n  brightness += vFx.x;\n\n  // (1) Click pulses — early-out when the ring buffer is empty. We compact\n  // the active-pulse count on the CPU (see RibbonMesh.pulse / decayPulses)\n  // so the loop bound is tight; iterating the inactive tail would waste\n  // fragment-shader cycles every frame regardless of pulse activity.\n  // p.w encodes a per-pulse brightness multiplier (0 or unset = use 1.0).\n  // uPulseTints[i].rgb encodes a per-pulse accent color; (0,0,0) → use the\n  // legacy white-brightness path (modulated by the ribbon layer color),\n  // non-zero → additive colored glow unmodulated by layer (tier comet/flash).\n  int activeCount = int(uActivePulseCount + 0.5);\n  vec3 pulseColorAdd = vec3(0.0);\n  for (int i = 0; i < ${K}; i++) {\n    if (i >= activeCount) break;\n    vec4 p = uPulses[i];\n    if (p.z <= 0.0) continue;\n    float elapsed = (uTimeMs - p.z) * 0.001;\n    if (elapsed < 0.0 || elapsed > uPulseDuration) continue;\n    float waveRadius = elapsed * uPulseSpeed;\n    float pixelRadius = length(vWorldPos - p.xy);\n    float d = (pixelRadius - waveRadius) / max(uPulseBand, 1e-4);\n    float fade = 1.0 - elapsed / max(uPulseDuration, 1e-4);\n    float perPulseMul = p.w > 0.0 ? p.w : 1.0;\n    float contrib = exp(-d * d) * fade * uPulseBrightness * perPulseMul;\n    vec3 tint = uPulseTints[i].rgb;\n    if (tint.r + tint.g + tint.b > 0.0) {\n      pulseColorAdd += tint * contrib;\n    } else {\n      brightness += contrib;\n    }\n  }\n\n  // (5) Twinkle — cell-based hash noise scintillation.\n  if (uTwinkleEnabled > 0.5) {\n    vec2 cell = floor(vWorldPos * uTwinkleFrequency + uTimeMs * 0.01);\n    float n = hash21(cell);\n    brightness *= 1.0 + (n - 0.5) * 2.0 * uTwinkleAmplitude;\n  }\n\n  brightness = max(brightness, 0.0);\n\n  // (6) Layer color split — coral hue vs circuit hue, mixed by layer flag.\n  vec3 layerColor = vec3(1.0);\n  if (uLayerSplitEnabled > 0.5) {\n    layerColor = mix(uCircleColor, uIconColor, vMeta.y);\n  }\n\n  // (7) Tier 7-11 fx (post-redesign) - each routes contributions through\n  // either brightness (scalar boost ridden by layerColor) or fxAdd\n  // (RGB additive). All ride on the ribbon via alpha*cov below.\n  vec3 fxAdd = vec3(0.0);\n\n  // QUANTUM — Probability Cloud Collapse. Continuous interference bands\n  // along chain + periodic synchronous global collapse strobe. No spatial\n  // origin: every fragment peaks at the same instant.\n  if (uQuantumPresence > 0.0) {\n    float qSec = uTimeMs * 0.001;\n    float chainPos = mix(vChainDist.x, vChainDist.y, h);\n    float k1 = uQuantumCarrierHz;\n    float k2 = uQuantumCarrierHz * 1.618;\n    float w1 = sin(chainPos * 0.025 + qSec * k1 * 6.2831);\n    float w2 = sin(chainPos * 0.041 - qSec * k2 * 6.2831 + vMeta.x * 0.13);\n    float w3 = sin((vWorldPos.x + vWorldPos.y) * 0.018 + qSec * k1 * 3.1);\n    float interf = (w1 + w2 + w3) / 3.0;\n    float cloud = 0.5 + 0.5 * interf;\n    // Collapse: gaussian peak every period, sharp synchronous network-wide.\n    // Time-only — evaluated on the CPU each frame (see tick()).\n    float collapse = uQuantumCollapse;\n    float quantumSnap = pow(0.5 + 0.5 * sin(chainPos * 0.06 + qSec * 12.0), 4.0);\n    float field = mix(cloud, quantumSnap, collapse);\n    brightness += uQuantumPresence * (0.35 + 0.65 * field) + uQuantumPresence * collapse * 1.4;\n    vec3 violet = mix(uQuantumColor, vec3(1.0), collapse * 0.6);\n    fxAdd += violet * uQuantumPresence * (0.4 * field + 1.2 * collapse);\n  }\n\n  // HIVEMIND — Synchronized Heartbeat. Global temporal pulse, no spatial\n  // propagation. Stage 3 = lub-dub + rim glow.\n  if (uHivePresence > 0.0) {\n    float hSec = uTimeMs * 0.001;\n    float gPhase = hSec * uHivePulseHz * 6.28318;\n    vec2 hq = vWorldPos * uHiveInterferenceScale;\n    float drift = hSec * 0.15;\n    float hInterf = sin(hq.x + drift) * 0.5 + sin(hq.y * 1.21 - drift * 0.7) * 0.5;\n    float hPhase = gPhase + hInterf * 1.2;\n    float beatSin = sin(hPhase);\n    float beatHeart = max(sin(hPhase), 0.55 * sin(hPhase - 1.13));\n    float beat = mix(beatSin, beatHeart, clamp(uHiveDoubleBeat, 0.0, 1.0));\n    float flash = max(beat, 0.0);\n    flash = flash * flash;\n    float edge = clamp(1.0 - smoothstep(0.0, w * 0.55, lineDist), 0.0, 1.0);\n    float rim = (1.0 - edge) * uHiveRimBoost;\n    fxAdd += uHiveColor * uHivePresence * flash * (1.0 + rim);\n  }\n\n  // ORBITAL — Annular rings with rotating azimuthal dashes. Two fixed\n  // radii; rotation rate scales with stage. Wider sigma than before so\n  // the rings register through alpha*cov modulation.\n  if (uOrbitalPresence > 0.0) {\n    float oSec = uTimeMs * 0.001;\n    float r = length(vWorldPos - uWorldCenter);\n    float ang = atan(vWorldPos.y - uWorldCenter.y, vWorldPos.x - uWorldCenter.x);\n    float ringA = exp(-pow((r - uWorldCenter.x * 0.55) / 80.0, 2.0));\n    float ringB = exp(-pow((r - uWorldCenter.x * 0.80) / 80.0, 2.0));\n    // Rotating dash modulation — bright at peaks of cos, faint between.\n    float dashA = 0.55 + 0.45 * cos(ang * 14.0 + oSec * uOrbitalDashRate * 6.28);\n    float dashB = 0.55 + 0.45 * cos(ang * 10.0 - oSec * uOrbitalDashRate * 4.5);\n    fxAdd += uOrbitalColor * uOrbitalPresence * (ringA * dashA + ringB * 0.85 * dashB);\n  }\n\n  if (uWarpAmplitude > 0.0) {\n    float r = length(vWorldPos - uWorldCenter);\n    float halo = exp(-r * 0.0008);\n    fxAdd += uWarpColor * halo * 0.35;\n  }\n\n  // ESCHATON — Ascension Beams. Godrays from world center + perimeter\n  // aureola + periodic full-network annunciation flash.\n  if (uEschatonPresence > 0.0) {\n    vec2 ed = vWorldPos - uWorldCenter;\n    float er = length(ed);\n    float eAng = atan(ed.y, ed.x);\n    float eSec = uTimeMs * 0.001;\n    float n = max(uEschatonBeamCount, 1.0);\n    float sector = 6.28318 / n;\n    float rel = mod(eAng - eSec * uEschatonBeamSpeed + 3.14159, sector) - sector * 0.5;\n    float bw = max(uEschatonBeamWidth, 0.0001);\n    float beam = exp(-(rel * rel) / (bw * bw));\n    float radialGain = smoothstep(0.0, uWorldCenter.x, er);\n    float godray = beam * (0.4 + 0.6 * radialGain);\n    float rimT = (er - uWorldCenter.x * 0.6) / max(uWorldCenter.x * 0.5, 1.0);\n    float halo = exp(-rimT * rimT * 3.0) * uEschatonHalo;\n    // Annunciation flash: time-only — evaluated on the CPU each frame.\n    float flash = uEschatonFlash;\n    float eIntensity = (godray * 1.2 + halo + flash) * uEschatonPresence;\n    fxAdd += uEschatonColor * eIntensity;\n  }\n\n  brightness = max(brightness, 0.0);\n  vec4 base = uColor * uWorldColorAlpha;\n  finalColor = base * vec4(layerColor, 1.0) * (alpha * cov * brightness);\n  finalColor.rgb += (pulseColorAdd + fxAdd) * (alpha * cov);\n  // Single linear master dimmer over the whole layer (body + glows + pulses).\n  finalColor *= uRenderOpacity;\n}\n";

/** Shipped WebGPU template `Mt` (line 1420), including `${K}`. */
export const RIBBON_GPU_WGSL: string = "\nstruct GlobalUniforms {\n  uProjectionMatrix: mat3x3<f32>,\n  uWorldTransformMatrix: mat3x3<f32>,\n  uWorldColorAlpha: vec4<f32>,\n  uResolution: vec2<f32>,\n}\n\nstruct LocalUniforms {\n  uTransformMatrix: mat3x3<f32>,\n  uColor: vec4<f32>,\n  uRound: f32,\n}\n\nstruct EffectUniforms {\n  uPulses: array<vec4<f32>, ${K}>,\n  uPulseTints: array<vec4<f32>, ${K}>,\n  uWorldCenter: vec2<f32>,\n  uTimeMs: f32,\n  uCurrentStep: f32,\n  uLineWidth: f32,\n  uIconOpacity: f32,\n  uCircleOpacity: f32,\n  uActivePulseCount: f32,\n  uDebugMainOnly: f32,\n  uDebugSideOnly: f32,\n  uPulseSpeed: f32,\n  uPulseBand: f32,\n  uPulseDuration: f32,\n  uPulseBrightness: f32,\n  uFlowEnabled: f32,\n  uFlowSpeed: f32,\n  uFlowSpacing: f32,\n  uFlowWidth: f32,\n  uFlowBrightness: f32,\n  uBreathEnabled: f32,\n  uBreathFrequency: f32,\n  uBreathAmplitude: f32,\n  uTipGlowEnabled: f32,\n  uTipGlowDecay: f32,\n  uTipGlowBoost: f32,\n  uTwinkleEnabled: f32,\n  uTwinkleFrequency: f32,\n  uTwinkleAmplitude: f32,\n  uLayerSplitEnabled: f32,\n  uSwayEnabled: f32,\n  uSwayAmplitude: f32,\n  uSwayFrequency: f32,\n  uSwayChainMax: f32,\n  uSwayMinBranchLen: f32,\n  uSwayIconScale: f32,\n  uSwayCircleScale: f32,\n  uCircleColor: vec3<f32>,\n  uIconColor: vec3<f32>,\n  uQuantumPresence: f32,\n  uQuantumCarrierHz: f32,\n  uQuantumCollapsePeriodMs: f32,\n  uQuantumCollapseHalfWidthMs: f32,\n  uQuantumColor: vec3<f32>,\n  uHivePresence: f32,\n  uHivePulseHz: f32,\n  uHiveInterferenceScale: f32,\n  uHiveDoubleBeat: f32,\n  uHiveRimBoost: f32,\n  uHiveColor: vec3<f32>,\n  uOrbitalPresence: f32,\n  uOrbitalDashRate: f32,\n  uOrbitalColor: vec3<f32>,\n  uWarpAmplitude: f32,\n  uWarpColor: vec3<f32>,\n  uEschatonPresence: f32,\n  uEschatonBeamCount: f32,\n  uEschatonBeamWidth: f32,\n  uEschatonBeamSpeed: f32,\n  uEschatonHalo: f32,\n  uEschatonFlashPeriod: f32,\n  uEschatonFlashStrength: f32,\n  uEschatonColor: vec3<f32>,\n  uQuantumCollapse: f32,\n  uEschatonFlash: f32,\n  uRenderOpacity: f32,\n}\n\n@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;\n@group(1) @binding(0) var<uniform> localUniforms: LocalUniforms;\n@group(2) @binding(0) var<uniform> effectUniforms: EffectUniforms;\n\nstruct VsOut {\n  @builtin(position) position: vec4<f32>,\n  @location(0) vWorldPos: vec2<f32>,\n  @location(1) vSegAB: vec4<f32>,\n  @location(2) vHW: vec2<f32>,\n  @location(3) vAlpha: vec2<f32>,\n  @location(4) vChainDist: vec2<f32>,\n  @location(5) vMeta: vec2<f32>,\n  // x = tip-glow boost, y = breath width multiplier (vertex-hoisted; see the\n  // GLSL twin's vFx comment).\n  @location(6) vFx: vec2<f32>,\n}\n\nfn branchPhase(id: f32) -> f32 {\n  return fract(sin(id * 12.9898) * 43758.5453) * 6.28318;\n}\n\nfn swayField(p: vec2<f32>, tSec: f32, phase: f32) -> vec2<f32> {\n  let t = tSec * effectUniforms.uSwayFrequency;\n  let base = vec2<f32>(\n    sin(t * 6.28318 * 1.0 + p.x * 0.0008 + p.y * 0.0003 + phase),\n    cos(t * 6.28318 * 0.9 + p.x * 0.0004 + p.y * 0.001  + phase * 1.3)\n  );\n  let detail = vec2<f32>(\n    sin(t * 6.28318 * 2.7 + p.x * 0.003  + p.y * 0.002 + phase * 1.7),\n    cos(t * 6.28318 * 2.5 + p.x * 0.002  + p.y * 0.003 + phase * 2.1)\n  );\n  return base + detail * 0.3;\n}\n\nfn degenerate() -> VsOut {\n  var out: VsOut;\n  out.position = vec4<f32>(2.0, 2.0, 2.0, 1.0);\n  out.vWorldPos = vec2<f32>(0.0);\n  out.vSegAB = vec4<f32>(0.0);\n  out.vHW = vec2<f32>(0.0);\n  out.vAlpha = vec2<f32>(0.0);\n  out.vChainDist = vec2<f32>(0.0);\n  out.vMeta = vec2<f32>(0.0);\n  out.vFx = vec2<f32>(0.0, 1.0);\n  return out;\n}\n\n@vertex\nfn mainVertex(\n  @location(0) aPosition: vec2<f32>,\n  @location(1) aSegAB: vec4<f32>,\n  @location(2) aChainDist: vec2<f32>,\n  @location(3) aMeta: vec3<f32>,\n  @location(4) aBranchAB: vec2<f32>,\n  @location(5) aBranchLen: vec2<f32>,\n  @location(6) aThicknessAB: vec2<f32>,\n) -> VsOut {\n  let birthStep = aMeta.x;\n  let layer = aMeta.y;\n  let isMain = aMeta.z;\n\n  if (birthStep > effectUniforms.uCurrentStep + 0.5) { return degenerate(); }\n  if (effectUniforms.uDebugMainOnly > 0.5 && isMain < 0.5) { return degenerate(); }\n  if (effectUniforms.uDebugSideOnly > 0.5 && isMain > 0.5) { return degenerate(); }\n\n  let layerOp = mix(effectUniforms.uCircleOpacity, effectUniforms.uIconOpacity, layer);\n  let thA = aThicknessAB.x;\n  let thB = aThicknessAB.y;\n  let hw = vec2<f32>(effectUniforms.uLineWidth + thA, effectUniforms.uLineWidth + thB) * 0.5;\n  let alpha = vec2<f32>(\n    layerOp * (thA * (1.0 / 3.0) + 0.2),\n    layerOp * (thB * (1.0 / 3.0) + 0.2)\n  );\n\n  var worldPos = aPosition;\n  var segAB = aSegAB;\n\n  if (effectUniforms.uSwayEnabled > 0.5) {\n    let tSec = effectUniforms.uTimeMs * 0.001;\n    let chainMax = max(effectUniforms.uSwayChainMax, 1.0);\n    let fallA = clamp(aChainDist.x / chainMax, 0.0, 1.0);\n    let fallB = clamp(aChainDist.y / chainMax, 0.0, 1.0);\n    let phaseA = branchPhase(aBranchAB.x);\n    let phaseB = branchPhase(aBranchAB.y);\n    let minLen = max(effectUniforms.uSwayMinBranchLen, 1.0);\n    let lenScaleA = clamp(aBranchLen.x / minLen, 0.0, 1.0);\n    let lenScaleB = clamp(aBranchLen.y / minLen, 0.0, 1.0);\n    let layerScale = mix(effectUniforms.uSwayCircleScale, effectUniforms.uSwayIconScale, layer);\n    let dispA = swayField(aSegAB.xy, tSec, phaseA) * effectUniforms.uSwayAmplitude * fallA * lenScaleA * layerScale;\n    let dispB = swayField(aSegAB.zw, tSec, phaseB) * effectUniforms.uSwayAmplitude * fallB * lenScaleB * layerScale;\n\n    let ba = aSegAB.zw - aSegAB.xy;\n    let h = clamp(dot(aPosition - aSegAB.xy, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);\n    let dispVert = mix(dispA, dispB, h);\n\n    worldPos = aPosition + dispVert;\n    segAB = vec4<f32>(aSegAB.xy + dispA, aSegAB.zw + dispB);\n  }\n\n  if (effectUniforms.uWarpAmplitude > 0.0) {\n    let toCenter = effectUniforms.uWorldCenter - worldPos;\n    let dist = length(toCenter);\n    if (dist > 1.0) {\n      let tangent = vec2<f32>(-toCenter.y, toCenter.x) / dist;\n      let fall = 1.0 / (1.0 + dist * 0.0008);\n      let tSec = effectUniforms.uTimeMs * 0.0001;\n      let spiral = (toCenter / dist) * 0.6 + tangent * 0.4;\n      worldPos = worldPos + spiral * effectUniforms.uWarpAmplitude * fall * (0.7 + 0.3 * sin(tSec * 6.28));\n      segAB = vec4<f32>(\n        segAB.xy + spiral * effectUniforms.uWarpAmplitude * fall * 0.5,\n        segAB.zw + spiral * effectUniforms.uWarpAmplitude * fall * 0.5,\n      );\n    }\n  }\n\n  // Fragment-cost hoists (mirrors the GLSL twin).\n  var tipGlow = 0.0;\n  if (effectUniforms.uTipGlowEnabled > 0.5) {\n    let age = max(0.0, effectUniforms.uCurrentStep - birthStep);\n    tipGlow = exp(-age / max(effectUniforms.uTipGlowDecay, 1.0)) * effectUniforms.uTipGlowBoost;\n  }\n  var breathMul = 1.0;\n  if (effectUniforms.uBreathEnabled > 0.5) {\n    let radial = length(worldPos - effectUniforms.uWorldCenter);\n    let phase = effectUniforms.uTimeMs * 0.001 * effectUniforms.uBreathFrequency * 6.283185 - radial * 0.005;\n    breathMul = 1.0 + sin(phase) * effectUniforms.uBreathAmplitude;\n  }\n\n  let mvp = globalUniforms.uProjectionMatrix * globalUniforms.uWorldTransformMatrix * localUniforms.uTransformMatrix;\n  let clip = mvp * vec3<f32>(worldPos, 1.0);\n  var out: VsOut;\n  out.position = vec4<f32>(clip.xy, 0.0, 1.0);\n  out.vWorldPos = worldPos;\n  out.vSegAB = segAB;\n  out.vHW = hw;\n  out.vAlpha = alpha;\n  out.vChainDist = aChainDist;\n  out.vMeta = vec2<f32>(birthStep, layer);\n  out.vFx = vec2<f32>(tipGlow, breathMul);\n  return out;\n}\n\nfn hash21(p_in: vec2<f32>) -> f32 {\n  var p = fract(p_in * vec2<f32>(123.34, 456.21));\n  p = p + vec2<f32>(dot(p, p + 45.32));\n  return fract(p.x * p.y);\n}\n\n@fragment\nfn mainFragment(in: VsOut) -> @location(0) vec4<f32> {\n  let a = in.vSegAB.xy;\n  let b = in.vSegAB.zw;\n  let ba = b - a;\n  let pa = in.vWorldPos - a;\n  let denom = max(dot(ba, ba), 1e-6);\n  let h = clamp(dot(pa, ba) / denom, 0.0, 1.0);\n  let lineDist = length(pa - ba * h);\n  // Breath is vertex-hoisted; in.vFx.y is 1.0 when the effect is off.\n  let w = mix(in.vHW.x, in.vHW.y, h) * in.vFx.y;\n\n  let sd = lineDist - w;\n  let aa = max(fwidth(sd), 1e-4);\n  let cov = 1.0 - smoothstep(-aa, aa, sd);\n\n  let alpha = mix(in.vAlpha.x, in.vAlpha.y, h);\n\n  // Every output term below rides alpha*cov, so a zero-coverage fragment is a\n  // MAX-blend no-op — return before the fx stack (see the GLSL twin).\n  if (alpha * cov <= 0.0) {\n    return vec4<f32>(0.0);\n  }\n\n  var brightness: f32 = 1.0;\n\n  if (effectUniforms.uFlowEnabled > 0.5) {\n    let chainPos = mix(in.vChainDist.x, in.vChainDist.y, h);\n    let offset = effectUniforms.uTimeMs * 0.001 * effectUniforms.uFlowSpeed - chainPos;\n    var m = offset - effectUniforms.uFlowSpacing * floor(offset / effectUniforms.uFlowSpacing);\n    if (m > effectUniforms.uFlowSpacing * 0.5) {\n      m = m - effectUniforms.uFlowSpacing;\n    }\n    let d = m / max(effectUniforms.uFlowWidth, 1e-4);\n    brightness = brightness + exp(-d * d) * effectUniforms.uFlowBrightness;\n  }\n\n  // Tip glow is vertex-hoisted (exact: birthStep is constant per quad).\n  brightness = brightness + in.vFx.x;\n\n  let activeCount = u32(effectUniforms.uActivePulseCount + 0.5);\n  var pulseColorAdd = vec3<f32>(0.0);\n  for (var i = 0u; i < ${K}u; i = i + 1u) {\n    if (i >= activeCount) { break; }\n    let p = effectUniforms.uPulses[i];\n    if (p.z <= 0.0) { continue; }\n    let elapsed = (effectUniforms.uTimeMs - p.z) * 0.001;\n    if (elapsed < 0.0 || elapsed > effectUniforms.uPulseDuration) { continue; }\n    let waveRadius = elapsed * effectUniforms.uPulseSpeed;\n    let pixelRadius = length(in.vWorldPos - p.xy);\n    let d = (pixelRadius - waveRadius) / max(effectUniforms.uPulseBand, 1e-4);\n    let fade = 1.0 - elapsed / max(effectUniforms.uPulseDuration, 1e-4);\n    let perPulseMul = select(1.0, p.w, p.w > 0.0);\n    let contrib = exp(-d * d) * fade * effectUniforms.uPulseBrightness * perPulseMul;\n    let tint = effectUniforms.uPulseTints[i].rgb;\n    if (tint.r + tint.g + tint.b > 0.0) {\n      pulseColorAdd = pulseColorAdd + tint * contrib;\n    } else {\n      brightness = brightness + contrib;\n    }\n  }\n\n  if (effectUniforms.uTwinkleEnabled > 0.5) {\n    let cell = floor(in.vWorldPos * effectUniforms.uTwinkleFrequency + effectUniforms.uTimeMs * 0.01);\n    let n = hash21(cell);\n    brightness = brightness * (1.0 + (n - 0.5) * 2.0 * effectUniforms.uTwinkleAmplitude);\n  }\n\n  brightness = max(brightness, 0.0);\n\n  var layerColor = vec3<f32>(1.0);\n  if (effectUniforms.uLayerSplitEnabled > 0.5) {\n    layerColor = mix(effectUniforms.uCircleColor, effectUniforms.uIconColor, in.vMeta.y);\n  }\n\n  var fxAdd = vec3<f32>(0.0);\n\n  // QUANTUM — Probability Cloud Collapse.\n  if (effectUniforms.uQuantumPresence > 0.0) {\n    let qSec = effectUniforms.uTimeMs * 0.001;\n    let chainPos = mix(in.vChainDist.x, in.vChainDist.y, h);\n    let k1 = effectUniforms.uQuantumCarrierHz;\n    let k2 = effectUniforms.uQuantumCarrierHz * 1.618;\n    let w1 = sin(chainPos * 0.025 + qSec * k1 * 6.2831);\n    let w2 = sin(chainPos * 0.041 - qSec * k2 * 6.2831 + in.vMeta.x * 0.13);\n    let w3 = sin((in.vWorldPos.x + in.vWorldPos.y) * 0.018 + qSec * k1 * 3.1);\n    let interf = (w1 + w2 + w3) / 3.0;\n    let cloud = 0.5 + 0.5 * interf;\n    // Time-only — evaluated on the CPU each frame (see tick()).\n    let collapse = effectUniforms.uQuantumCollapse;\n    let quantumSnap = pow(0.5 + 0.5 * sin(chainPos * 0.06 + qSec * 12.0), 4.0);\n    let field = mix(cloud, quantumSnap, collapse);\n    brightness = brightness + effectUniforms.uQuantumPresence * (0.35 + 0.65 * field) + effectUniforms.uQuantumPresence * collapse * 1.4;\n    let violet = mix(effectUniforms.uQuantumColor, vec3<f32>(1.0), collapse * 0.6);\n    fxAdd = fxAdd + violet * effectUniforms.uQuantumPresence * (0.4 * field + 1.2 * collapse);\n  }\n\n  // HIVEMIND — Synchronized Heartbeat.\n  if (effectUniforms.uHivePresence > 0.0) {\n    let hSec = effectUniforms.uTimeMs * 0.001;\n    let gPhase = hSec * effectUniforms.uHivePulseHz * 6.28318;\n    let hq = in.vWorldPos * effectUniforms.uHiveInterferenceScale;\n    let drift = hSec * 0.15;\n    let hInterf = sin(hq.x + drift) * 0.5 + sin(hq.y * 1.21 - drift * 0.7) * 0.5;\n    let hPhase = gPhase + hInterf * 1.2;\n    let beatSin = sin(hPhase);\n    let beatHeart = max(sin(hPhase), 0.55 * sin(hPhase - 1.13));\n    let beat = mix(beatSin, beatHeart, clamp(effectUniforms.uHiveDoubleBeat, 0.0, 1.0));\n    var flash = max(beat, 0.0);\n    flash = flash * flash;\n    let edge = clamp(1.0 - smoothstep(0.0, w * 0.55, lineDist), 0.0, 1.0);\n    let rim = (1.0 - edge) * effectUniforms.uHiveRimBoost;\n    fxAdd = fxAdd + effectUniforms.uHiveColor * effectUniforms.uHivePresence * flash * (1.0 + rim);\n  }\n\n  // ORBITAL — Annular rings with rotating azimuthal dashes.\n  if (effectUniforms.uOrbitalPresence > 0.0) {\n    let oSec = effectUniforms.uTimeMs * 0.001;\n    let r = length(in.vWorldPos - effectUniforms.uWorldCenter);\n    let ang = atan2(in.vWorldPos.y - effectUniforms.uWorldCenter.y, in.vWorldPos.x - effectUniforms.uWorldCenter.x);\n    let ringA = exp(-pow((r - effectUniforms.uWorldCenter.x * 0.55) / 80.0, 2.0));\n    let ringB = exp(-pow((r - effectUniforms.uWorldCenter.x * 0.80) / 80.0, 2.0));\n    let dashA = 0.55 + 0.45 * cos(ang * 14.0 + oSec * effectUniforms.uOrbitalDashRate * 6.28);\n    let dashB = 0.55 + 0.45 * cos(ang * 10.0 - oSec * effectUniforms.uOrbitalDashRate * 4.5);\n    fxAdd = fxAdd + effectUniforms.uOrbitalColor * effectUniforms.uOrbitalPresence * (ringA * dashA + ringB * 0.85 * dashB);\n  }\n\n  if (effectUniforms.uWarpAmplitude > 0.0) {\n    let r = length(in.vWorldPos - effectUniforms.uWorldCenter);\n    let halo = exp(-r * 0.0008);\n    fxAdd = fxAdd + effectUniforms.uWarpColor * halo * 0.35;\n  }\n\n  // ESCHATON — Ascension Beams.\n  if (effectUniforms.uEschatonPresence > 0.0) {\n    let ed = in.vWorldPos - effectUniforms.uWorldCenter;\n    let er = length(ed);\n    let eAng = atan2(ed.y, ed.x);\n    let eSec = effectUniforms.uTimeMs * 0.001;\n    let n = max(effectUniforms.uEschatonBeamCount, 1.0);\n    let sector = 6.28318 / n;\n    let preRel = eAng - eSec * effectUniforms.uEschatonBeamSpeed + 3.14159;\n    let rel = preRel - sector * floor(preRel / sector) - sector * 0.5;\n    let bw = max(effectUniforms.uEschatonBeamWidth, 0.0001);\n    let beam = exp(-(rel * rel) / (bw * bw));\n    let radialGain = smoothstep(0.0, effectUniforms.uWorldCenter.x, er);\n    let godray = beam * (0.4 + 0.6 * radialGain);\n    let rimT = (er - effectUniforms.uWorldCenter.x * 0.6) / max(effectUniforms.uWorldCenter.x * 0.5, 1.0);\n    let halo = exp(-rimT * rimT * 3.0) * effectUniforms.uEschatonHalo;\n    // Annunciation flash: time-only — evaluated on the CPU each frame.\n    let flash = effectUniforms.uEschatonFlash;\n    let eIntensity = (godray * 1.2 + halo + flash) * effectUniforms.uEschatonPresence;\n    fxAdd = fxAdd + effectUniforms.uEschatonColor * eIntensity;\n  }\n\n  brightness = max(brightness, 0.0);\n  let base = localUniforms.uColor * globalUniforms.uWorldColorAlpha;\n  var rgba = base * vec4<f32>(layerColor, 1.0) * (alpha * cov * brightness);\n  rgba = vec4<f32>(rgba.rgb + (pulseColorAdd + fxAdd) * (alpha * cov), rgba.a);\n  // Single linear master dimmer over the whole layer (body + glows + pulses).\n  rgba = rgba * effectUniforms.uRenderOpacity;\n  return rgba;\n}\n";

/** Shipped `bs`: accent colors are not desaturated. */
const ACCENT_DESATURATION = 0;

/**
 * Shipped `Ont` (`NormalApp` export `cJ`, bound as `kn` in the Idle screen).
 * `log(count) / log(1000)` clamped to `[0, 1]`.
 */
export function blendOwnedCount(count: number): number {
  if (count <= 0) return 0;
  const t = Math.log(count) / Math.log(1000);
  return t <= 0 ? 0 : t >= 1 ? 1 : t;
}

function compileRibbonShaderSource(source: string): string {
  return source.replaceAll("${K}", String(PULSE_SLOT_COUNT));
}

const f32 = (value: number) => ({ value, type: "f32" as const });
const vec2 = (value: Float32Array) => ({ value, type: "vec2<f32>" as const });
const vec3 = (value: Float32Array) => ({ value, type: "vec3<f32>" as const });
const vec4Array = (value: Float32Array, size: number) => ({
  value,
  type: "vec4<f32>" as const,
  size,
});

/** Shipped `ns`: effect uniform block consumed by `createRibbonShader`. */
export function createEffectUniforms() {
  const pulses = new Float32Array(PULSE_SLOT_COUNT * 4);
  const pulseTints = new Float32Array(PULSE_SLOT_COUNT * 4);
  return new UniformGroup({
    uPulses: vec4Array(pulses, PULSE_SLOT_COUNT),
    uPulseTints: vec4Array(pulseTints, PULSE_SLOT_COUNT),
    uWorldCenter: vec2(new Float32Array([0, 0])),
    uTimeMs: f32(0),
    uCurrentStep: f32(0),
    uLineWidth: f32(1),
    uIconOpacity: f32(1),
    uCircleOpacity: f32(1),
    uActivePulseCount: f32(0),
    uDebugMainOnly: f32(0),
    uDebugSideOnly: f32(0),
    uPulseSpeed: f32(0),
    uPulseBand: f32(0),
    uPulseDuration: f32(0),
    uPulseBrightness: f32(0),
    uFlowEnabled: f32(0),
    uFlowSpeed: f32(0),
    uFlowSpacing: f32(1),
    uFlowWidth: f32(1),
    uFlowBrightness: f32(0),
    uBreathEnabled: f32(0),
    uBreathFrequency: f32(0),
    uBreathAmplitude: f32(0),
    uTipGlowEnabled: f32(0),
    uTipGlowDecay: f32(1),
    uTipGlowBoost: f32(0),
    uTwinkleEnabled: f32(0),
    uTwinkleFrequency: f32(0.01),
    uTwinkleAmplitude: f32(0),
    uLayerSplitEnabled: f32(0),
    uSwayEnabled: f32(0),
    uSwayAmplitude: f32(0),
    uSwayFrequency: f32(1),
    uSwayChainMax: f32(1),
    uSwayMinBranchLen: f32(1),
    uSwayIconScale: f32(1),
    uSwayCircleScale: f32(1),
    uCircleColor: vec3(new Float32Array([1, 1, 1])),
    uIconColor: vec3(new Float32Array([1, 1, 1])),
    uQuantumPresence: f32(0),
    uQuantumCarrierHz: f32(0),
    uQuantumCollapsePeriodMs: f32(0),
    uQuantumCollapseHalfWidthMs: f32(1),
    uQuantumColor: vec3(new Float32Array([0, 0, 0])),
    uHivePresence: f32(0),
    uHivePulseHz: f32(0),
    uHiveInterferenceScale: f32(0),
    uHiveDoubleBeat: f32(0),
    uHiveRimBoost: f32(0),
    uHiveColor: vec3(new Float32Array([0, 0, 0])),
    uOrbitalPresence: f32(0),
    uOrbitalDashRate: f32(0),
    uOrbitalColor: vec3(new Float32Array([0, 0, 0])),
    uWarpAmplitude: f32(0),
    uWarpColor: vec3(new Float32Array([0, 0, 0])),
    uEschatonPresence: f32(0),
    uEschatonBeamCount: f32(0),
    uEschatonBeamWidth: f32(0),
    uEschatonBeamSpeed: f32(0),
    uEschatonHalo: f32(0),
    uEschatonFlashPeriod: f32(0),
    uEschatonFlashStrength: f32(0),
    uEschatonColor: vec3(new Float32Array([0, 0, 0])),
    uQuantumCollapse: f32(0),
    uEschatonFlash: f32(0),
    uRenderOpacity: f32(1),
  });
}

/** Shipped `as`: Pixi `GlProgram` / `GpuProgram` / `Shader` for the ribbon mesh. */
export function createRibbonShader(effectUniforms: UniformGroup): Shader {
  const glProgram = GlProgram.from({
    name: "marginal-growth-ribbon",
    vertex: compileRibbonShaderSource(RIBBON_VERTEX_GLSL),
    fragment: compileRibbonShaderSource(RIBBON_FRAGMENT_GLSL),
  });
  const gpuSource = compileRibbonShaderSource(RIBBON_GPU_WGSL);
  const gpuProgram = GpuProgram.from({
    name: "marginal-growth-ribbon",
    vertex: { source: gpuSource, entryPoint: "mainVertex" },
    fragment: { source: gpuSource, entryPoint: "mainFragment" },
  });
  return new Shader({
    glProgram,
    gpuProgram,
    resources: { effectUniforms },
  });
}

/** Shipped `ce`: unpack `0xRRGGBB` into a `vec3` uniform. */
export function writeRgb(target: Float32Array, color: number): void {
  target[0] = ((color >> 16) & 255) / 255;
  target[1] = ((color >> 8) & 255) / 255;
  target[2] = (color & 255) / 255;
}

/** Shipped `vs`. */
export function desaturateColor(color: number, amount: number): number {
  const red = (color >> 16) & 255;
  const green = (color >> 8) & 255;
  const blue = color & 255;
  const gray = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
  const mix = (channel: number) => Math.round(channel * (1 - amount) + gray * amount);
  return (mix(red) << 16) | (mix(green) << 8) | mix(blue);
}

/** Shipped `dn`. */
const EFFECT_TIERS = [
  { id: "cursor", sourceGenIds: ["token"] },
  { id: "neuron", sourceGenIds: ["server"] },
  { id: "microchip", sourceGenIds: ["compute_cluster"] },
  { id: "processor", sourceGenIds: ["compute_cluster"] },
  { id: "server", sourceGenIds: ["data_flywheel", "refined_dataset", "emergent_dataset"] },
  {
    id: "datacenter",
    sourceGenIds: ["long_reasoning_chain", "supervised_reasoning_chain", "differential_accord"],
  },
  {
    id: "quantum",
    sourceGenIds: ["dl_framework", "guardian_daemon", "native_language_paradigm"],
  },
  {
    id: "hivemind",
    sourceGenIds: ["neural_interconnect", "value_test_matrix", "high_dim_field"],
  },
  {
    id: "orbital",
    sourceGenIds: ["supercompute_center", "interpretability_core", "turbulence_dynamics"],
  },
  {
    id: "singularity",
    sourceGenIds: ["recursive_self_improvement", "full_feature_atlas", "homeostasis_structure"],
  },
  {
    id: "eschaton",
    sourceGenIds: ["singularity_gate", "terminal_lockdown", "primordial_protocol"],
  },
] as const;

type EffectPatch = Record<string, number>;
interface EffectLevels {
  off: EffectPatch;
  min: EffectPatch;
  max: EffectPatch;
}

/** Shipped `ss` through `ps`, keyed by `ms`. */
const EFFECT_LEVELS: Record<(typeof EFFECT_TIERS)[number]["id"], EffectLevels> = {
  cursor: {
    off: { lineWidth: 0, iconOpacity: 0, circleOpacity: 0 },
    min: { lineWidth: 0.6, iconOpacity: 0.3, circleOpacity: 0.15 },
    max: { lineWidth: 1.5, iconOpacity: 1, circleOpacity: 0.5 },
  },
  neuron: {
    off: { fxTipGlowEnabled: 0, fxTipGlowDecay: 1, fxTipGlowBoost: 0 },
    min: { fxTipGlowEnabled: 1, fxTipGlowDecay: 15, fxTipGlowBoost: 0.5 },
    max: { fxTipGlowEnabled: 1, fxTipGlowDecay: 3, fxTipGlowBoost: 1.4 },
  },
  microchip: {
    off: {
      fxFlowEnabled: 0,
      fxFlowSpacing: 1,
      fxFlowSpeed: 0,
      fxFlowWidth: 1,
      fxFlowBrightness: 0,
    },
    min: {
      fxFlowEnabled: 1,
      fxFlowSpacing: 800,
      fxFlowSpeed: 60,
      fxFlowWidth: 12,
      fxFlowBrightness: 0.3,
    },
    max: {
      fxFlowEnabled: 1,
      fxFlowSpacing: 200,
      fxFlowSpeed: 200,
      fxFlowWidth: 25,
      fxFlowBrightness: 0.55,
    },
  },
  processor: {
    off: { fxTwinkleEnabled: 0, fxTwinkleFrequency: 0.01, fxTwinkleAmplitude: 0 },
    min: { fxTwinkleEnabled: 1, fxTwinkleFrequency: 0.005, fxTwinkleAmplitude: 0.03 },
    max: { fxTwinkleEnabled: 1, fxTwinkleFrequency: 0.045, fxTwinkleAmplitude: 0.06 },
  },
  server: {
    off: { fxSwayEnabled: 0, fxSwayAmplitude: 0, fxSwayFrequency: 1 },
    min: { fxSwayEnabled: 1, fxSwayAmplitude: 0.8, fxSwayFrequency: 0.2 },
    max: { fxSwayEnabled: 1, fxSwayAmplitude: 3.2, fxSwayFrequency: 0.4 },
  },
  datacenter: {
    off: { fxBreathEnabled: 0, fxBreathFrequency: 0, fxBreathAmplitude: 0 },
    min: { fxBreathEnabled: 1, fxBreathFrequency: 0.15, fxBreathAmplitude: 0.04 },
    max: { fxBreathEnabled: 1, fxBreathFrequency: 0.4, fxBreathAmplitude: 0.09 },
  },
  quantum: {
    off: {
      fxQuantumPresence: 0,
      fxQuantumCarrierHz: 0,
      fxQuantumCollapsePeriodMs: 0,
      fxQuantumCollapseHalfWidthMs: 1,
    },
    min: {
      fxQuantumPresence: 0.35,
      fxQuantumCarrierHz: 1.4,
      fxQuantumCollapsePeriodMs: 6e3,
      fxQuantumCollapseHalfWidthMs: 280,
    },
    max: {
      fxQuantumPresence: 0.8,
      fxQuantumCarrierHz: 2.6,
      fxQuantumCollapsePeriodMs: 3e3,
      fxQuantumCollapseHalfWidthMs: 400,
    },
  },
  hivemind: {
    off: {
      fxHivePresence: 0,
      fxHivePulseHz: 0,
      fxHiveInterferenceScale: 0,
      fxHiveDoubleBeat: 0,
      fxHiveRimBoost: 0,
    },
    min: {
      fxHivePresence: 0.35,
      fxHivePulseHz: 0.55,
      fxHiveInterferenceScale: 0.0018,
      fxHiveDoubleBeat: 0,
      fxHiveRimBoost: 0,
    },
    max: {
      fxHivePresence: 0.8,
      fxHivePulseHz: 0.8,
      fxHiveInterferenceScale: 0.0048,
      fxHiveDoubleBeat: 0,
      fxHiveRimBoost: 0.4,
    },
  },
  orbital: {
    off: { fxOrbitalPresence: 0, fxOrbitalDashRate: 0 },
    min: { fxOrbitalPresence: 1.5, fxOrbitalDashRate: 0.2 },
    max: { fxOrbitalPresence: 3, fxOrbitalDashRate: 0.9 },
  },
  singularity: {
    off: { fxWarpAmplitude: 0 },
    min: { fxWarpAmplitude: 0.5 },
    max: { fxWarpAmplitude: 4 },
  },
  eschaton: {
    off: {
      fxEschatonPresence: 0,
      fxEschatonBeamCount: 0,
      fxEschatonBeamWidth: 0,
      fxEschatonBeamSpeed: 0,
      fxEschatonHalo: 0,
      fxEschatonFlashPeriod: 0,
      fxEschatonFlashStrength: 0,
    },
    min: {
      fxEschatonPresence: 0.35,
      fxEschatonBeamCount: 2,
      fxEschatonBeamWidth: 0.35,
      fxEschatonBeamSpeed: 0.05,
      fxEschatonHalo: 0.15,
      fxEschatonFlashPeriod: 0,
      fxEschatonFlashStrength: 0,
    },
    max: {
      fxEschatonPresence: 0.7,
      fxEschatonBeamCount: 6,
      fxEschatonBeamWidth: 0.6,
      fxEschatonBeamSpeed: 0.12,
      fxEschatonHalo: 0.5,
      fxEschatonFlashPeriod: 12,
      fxEschatonFlashStrength: 0.4,
    },
  },
};

/** Shipped `xs`. */
const ACCENT_COLOR_KEYS: Partial<Record<(typeof EFFECT_TIERS)[number]["id"], string>> = {
  quantum: "fxQuantumColor",
  hivemind: "fxHiveColor",
  orbital: "fxOrbitalColor",
  singularity: "fxWarpColor",
  eschaton: "fxEschatonColor",
};

/** Shipped `gs`. */
const ACCENT_PRESENCE_KEYS: Partial<Record<(typeof EFFECT_TIERS)[number]["id"], string>> = {
  quantum: "fxQuantumPresence",
  hivemind: "fxHivePresence",
  orbital: "fxOrbitalPresence",
  singularity: "fxWarpAmplitude",
  eschaton: "fxEschatonPresence",
};

/** Shipped `ws`. */
function accentForTier(
  tier: (typeof EFFECT_TIERS)[number],
  accents: Record<string, number>,
): number | undefined {
  for (const sourceId of tier.sourceGenIds) {
    const color = accents[sourceId];
    if (color !== undefined) return color;
  }
  return accents[tier.id];
}

/** Shipped `Cs`. */
function ownedForTier(
  tier: (typeof EFFECT_TIERS)[number],
  owned: Record<string, number>,
): number {
  let count = owned[tier.id] ?? 0;
  for (const sourceId of tier.sourceGenIds) {
    const value = owned[sourceId];
    if (value !== undefined && value > count) count = value;
  }
  return count;
}

/** Shipped `Ss`. */
function lerpEffectParams(min: EffectPatch, max: EffectPatch, t: number): EffectPatch {
  const merged: EffectPatch = {};
  for (const key of new Set([...Object.keys(min), ...Object.keys(max)])) {
    const from = min[key] ?? 0;
    const to = max[key] ?? 0;
    merged[key] = from + (to - from) * t;
  }
  return merged;
}

/** Shipped `ys`. */
export function applyAccentColors(
  params: MarginalGrowthParams,
  accents: Record<string, number>,
): MarginalGrowthParams {
  let next = params;
  for (const tier of EFFECT_TIERS) {
    const colorKey = ACCENT_COLOR_KEYS[tier.id];
    const presenceKey = ACCENT_PRESENCE_KEYS[tier.id];
    if (!colorKey || !presenceKey) continue;
    const color = accentForTier(tier, accents);
    if (color === undefined) continue;
    const mixed = next[presenceKey] > 0 ? desaturateColor(color, ACCENT_DESATURATION) : 0;
    next = { ...next, [colorKey]: mixed };
  }
  return next;
}

/** Shipped `As`. */
export function applyOwnedEffects(
  params: MarginalGrowthParams,
  owned: Record<string, number>,
): MarginalGrowthParams {
  let next = params;
  for (const tier of EFFECT_TIERS) {
    const levels = EFFECT_LEVELS[tier.id];
    const count = ownedForTier(tier, owned);
    const patch =
      count < 1 ? levels.off : lerpEffectParams(levels.min, levels.max, blendOwnedCount(count));
    next = { ...next, ...patch };
  }
  return next;
}

/** Shipped `jt`: sway amplitude fed into the bake ceiling. */
export function swayBakeAmplitude(params: MarginalGrowthParams): number {
  return params.fxSwayAmplitude * Math.max(params.fxSwayIconScale, params.fxSwayCircleScale);
}

/**
 * One accent applied to every tier id and source generator id.
 * The shipped screen writes the same alignment color onto each generator;
 * `accentForTier` then resolves it through `sourceGenIds`.
 */
export function accentsForColor(color: number): Record<string, number> {
  const accents: Record<string, number> = {};
  for (const tier of EFFECT_TIERS) {
    accents[tier.id] = color;
    for (const sourceId of tier.sourceGenIds) accents[sourceId] = color;
  }
  return accents;
}
