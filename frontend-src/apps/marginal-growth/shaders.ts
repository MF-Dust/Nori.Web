import { GlProgram, GpuProgram, Shader, UniformGroup } from "pixi.js";
import type { MarginalGrowthParams } from "../../state/marginal-growth-store";

/**
 * Shipped `K`. Pulse ring size, and the `${K}` substitution in the shader templates.
 * The exported sources keep `${K}` so they stay byte-for-byte substrings of
 * `public/assets/IdleScreen-DCDB640k.js`. Programs receive it replaced with 32.
 */
export const PULSE_SLOT_COUNT = 32;

/** Shipped vertex template `es` (`IdleScreen-DCDB640k.js` line 961). */
export const RIBBON_VERTEX_GLSL: string = "#version 300 es\r\nin vec2 aPosition;\r\nin vec4 aSegAB;\r\nin vec2 aChainDist;\r\nin vec3 aMeta;          // birthStep, layer (0=circle, 1=icon), isMain (0/1)\r\nin vec2 aBranchAB;\r\nin vec2 aBranchLen;\r\nin vec2 aThicknessAB;   // dynamic: per-endpoint current thickness\r\n\r\nuniform mat3 uProjectionMatrix;\r\nuniform mat3 uWorldTransformMatrix;\r\nuniform mat3 uTransformMatrix;\r\n\r\nuniform float uTimeMs;\r\nuniform float uCurrentStep;\r\nuniform float uLineWidth;\r\nuniform float uIconOpacity;\r\nuniform float uCircleOpacity;\r\nuniform float uDebugMainOnly;\r\nuniform float uDebugSideOnly;\r\n\r\nuniform float uSwayEnabled;\r\nuniform float uSwayAmplitude;\r\nuniform float uSwayFrequency;\r\nuniform float uSwayChainMax;\r\nuniform float uSwayMinBranchLen;\r\nuniform float uSwayIconScale;\r\nuniform float uSwayCircleScale;\r\n\r\n// Phase 7 — singularity warp (vertex displacement on top of sway). Other\r\n// tier-8-11 fx (lattice, orbital, starfield) live in the fragment shader.\r\nuniform vec2  uWorldCenter;\r\nuniform float uWarpAmplitude;\r\n\r\n// Per-vertex-hoisted fx (see vFx below).\r\nuniform float uBreathEnabled;\r\nuniform float uBreathFrequency;\r\nuniform float uBreathAmplitude;\r\nuniform float uTipGlowEnabled;\r\nuniform float uTipGlowDecay;\r\nuniform float uTipGlowBoost;\r\n\r\nout vec2 vWorldPos;\r\nout vec4 vSegAB;\r\nout vec2 vHW;\r\nout vec2 vAlpha;\r\nout vec2 vChainDist;\r\nout vec2 vMeta;\r\n// Fragment-cost hoists — the mesh rasterizes far more fragments than it has\r\n// vertices, so per-quad-constant or long-wavelength terms are evaluated here:\r\n//   vFx.x — tip-glow brightness boost. exp() of (uCurrentStep − birthStep),\r\n//           flat across the quad, so the hoist is exact.\r\n//   vFx.y — breath width multiplier. Radial wavelength ≈ 1256 wu vs ~5 wu\r\n//           segments, so linear interpolation across a quad is exact to\r\n//           well under a percent of the swing.\r\nout vec2 vFx;\r\n\r\nfloat branchPhase(float id) {\r\n  return fract(sin(id * 12.9898) * 43758.5453) * 6.28318;\r\n}\r\n\r\nvec2 swayField(vec2 p, float tSec, float phase) {\r\n  float t = tSec * uSwayFrequency;\r\n  vec2 base = vec2(\r\n    sin(t * 6.28318 * 1.0 + p.x * 0.0008 + p.y * 0.0003 + phase),\r\n    cos(t * 6.28318 * 0.9 + p.x * 0.0004 + p.y * 0.001  + phase * 1.3)\r\n  );\r\n  vec2 detail = vec2(\r\n    sin(t * 6.28318 * 2.7 + p.x * 0.003  + p.y * 0.002 + phase * 1.7),\r\n    cos(t * 6.28318 * 2.5 + p.x * 0.002  + p.y * 0.003 + phase * 2.1)\r\n  );\r\n  return base + detail * 0.3;\r\n}\r\n\r\nvoid cullToDegenerate() {\r\n  gl_Position = vec4(2.0, 2.0, 2.0, 1.0);\r\n  vWorldPos = vec2(0.0);\r\n  vSegAB = vec4(0.0);\r\n  vHW = vec2(0.0);\r\n  vAlpha = vec2(0.0);\r\n  vChainDist = vec2(0.0);\r\n  vMeta = vec2(0.0);\r\n  vFx = vec2(0.0, 1.0);\r\n}\r\n\r\nvoid main() {\r\n  float birthStep = aMeta.x;\r\n  float layer = aMeta.y;\r\n  float isMain = aMeta.z;\r\n\r\n  // Birth-step cull — collapse pre-born quads to a single clip-space point.\r\n  if (birthStep > uCurrentStep + 0.5) { cullToDegenerate(); return; }\r\n  // Debug filter cull (uniform-driven; no CPU rebuild on filter change).\r\n  if (uDebugMainOnly > 0.5 && isMain < 0.5) { cullToDegenerate(); return; }\r\n  if (uDebugSideOnly > 0.5 && isMain > 0.5) { cullToDegenerate(); return; }\r\n\r\n  // Per-endpoint hw / alpha from thickness + uniforms. Parent and child\r\n  // always share a layer (the cache build emits separate per-layer sub-\r\n  // networks), so a single layer flag covers both endpoints.\r\n  float layerOp = mix(uCircleOpacity, uIconOpacity, layer);\r\n  float thA = aThicknessAB.x;\r\n  float thB = aThicknessAB.y;\r\n  vec2 hw = vec2(uLineWidth + thA, uLineWidth + thB) * 0.5;\r\n  vec2 alpha = vec2(\r\n    layerOp * (thA * (1.0 / 3.0) + 0.2),\r\n    layerOp * (thB * (1.0 / 3.0) + 0.2)\r\n  );\r\n\r\n  vec2 worldPos = aPosition;\r\n  vec4 segAB = aSegAB;\r\n\r\n  if (uSwayEnabled > 0.5) {\r\n    float tSec = uTimeMs * 0.001;\r\n    float chainMax = max(uSwayChainMax, 1.0);\r\n    float fallA = clamp(aChainDist.x / chainMax, 0.0, 1.0);\r\n    float fallB = clamp(aChainDist.y / chainMax, 0.0, 1.0);\r\n    float phaseA = branchPhase(aBranchAB.x);\r\n    float phaseB = branchPhase(aBranchAB.y);\r\n    float minLen = max(uSwayMinBranchLen, 1.0);\r\n    float lenScaleA = clamp(aBranchLen.x / minLen, 0.0, 1.0);\r\n    float lenScaleB = clamp(aBranchLen.y / minLen, 0.0, 1.0);\r\n    float layerScale = mix(uSwayCircleScale, uSwayIconScale, layer);\r\n    vec2 dispA = swayField(aSegAB.xy, tSec, phaseA) * uSwayAmplitude * fallA * lenScaleA * layerScale;\r\n    vec2 dispB = swayField(aSegAB.zw, tSec, phaseB) * uSwayAmplitude * fallB * lenScaleB * layerScale;\r\n\r\n    vec2 ba = aSegAB.zw - aSegAB.xy;\r\n    float h = clamp(dot(aPosition - aSegAB.xy, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);\r\n    vec2 dispVert = mix(dispA, dispB, h);\r\n\r\n    worldPos = aPosition + dispVert;\r\n    segAB = vec4(aSegAB.xy + dispA, aSegAB.zw + dispB);\r\n  }\r\n\r\n  // Singularity warp — spiral pull toward world center, scaled by inverse\r\n  // distance so the warp falls off at the rim. Visual hint of gravity, no\r\n  // physics. Off when uWarpAmplitude == 0 (tier 10 stage 0 or below).\r\n  if (uWarpAmplitude > 0.0) {\r\n    vec2 toCenter = uWorldCenter - worldPos;\r\n    float dist = length(toCenter);\r\n    if (dist > 1.0) {\r\n      vec2 tangent = vec2(-toCenter.y, toCenter.x) / dist;\r\n      float fall = 1.0 / (1.0 + dist * 0.0008);\r\n      float t = uTimeMs * 0.0001;\r\n      vec2 spiral = (toCenter / dist) * 0.6 + tangent * 0.4;\r\n      worldPos += spiral * uWarpAmplitude * fall * (0.7 + 0.3 * sin(t * 6.28));\r\n      segAB.xy += spiral * uWarpAmplitude * fall * 0.5;\r\n      segAB.zw += spiral * uWarpAmplitude * fall * 0.5;\r\n    }\r\n  }\r\n\r\n  // Fragment-cost hoists (see the vFx varying comment).\r\n  float tipGlow = 0.0;\r\n  if (uTipGlowEnabled > 0.5) {\r\n    float age = max(0.0, uCurrentStep - birthStep);\r\n    tipGlow = exp(-age / max(uTipGlowDecay, 1.0)) * uTipGlowBoost;\r\n  }\r\n  float breathMul = 1.0;\r\n  if (uBreathEnabled > 0.5) {\r\n    float radial = length(worldPos - uWorldCenter);\r\n    float phase = uTimeMs * 0.001 * uBreathFrequency * 6.283185 - radial * 0.005;\r\n    breathMul = 1.0 + sin(phase) * uBreathAmplitude;\r\n  }\r\n\r\n  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;\r\n  gl_Position = vec4((mvp * vec3(worldPos, 1.0)).xy, 0.0, 1.0);\r\n  vWorldPos = worldPos;\r\n  vSegAB = segAB;\r\n  vHW = hw;\r\n  vAlpha = alpha;\r\n  vChainDist = aChainDist;\r\n  vMeta = vec2(birthStep, layer);\r\n  vFx = vec2(tipGlow, breathMul);\r\n}\r\n";

/** Shipped fragment template `ts` (line 1135), including `${K}`. */
export const RIBBON_FRAGMENT_GLSL: string = "#version 300 es\r\nprecision highp float;\r\n\r\nin vec2 vWorldPos;\r\nin vec4 vSegAB;\r\nin vec2 vHW;\r\nin vec2 vAlpha;\r\nin vec2 vChainDist;\r\nin vec2 vMeta;\r\nin vec2 vFx;   // x = tip-glow boost, y = breath width multiplier (vertex-hoisted)\r\n\r\nuniform vec4 uColor;\r\nuniform vec4 uWorldColorAlpha;\r\n\r\nuniform float uTimeMs;\r\nuniform float uCurrentStep;\r\nuniform vec2  uWorldCenter;\r\nuniform vec4  uPulses[${K}];\r\nuniform float uActivePulseCount;\r\nuniform float uPulseSpeed;\r\nuniform float uPulseBand;\r\nuniform float uPulseDuration;\r\nuniform float uPulseBrightness;\r\nuniform vec4  uPulseTints[${K}];\r\nuniform float uFlowEnabled;\r\nuniform float uFlowSpeed;\r\nuniform float uFlowSpacing;\r\nuniform float uFlowWidth;\r\nuniform float uFlowBrightness;\r\nuniform float uTwinkleEnabled;\r\nuniform float uTwinkleFrequency;\r\nuniform float uTwinkleAmplitude;\r\nuniform float uLayerSplitEnabled;\r\nuniform vec3  uCircleColor;\r\nuniform vec3  uIconColor;\r\n\r\n// Phase 7 (post-redesign) - tier-7-11 fx contributing additive RGB to the\r\n// ribbon. Each gates on its presence uniform == 0 to early-out cheaply.\r\n// uWarpAmplitude is also used in the vertex shader (warp displacement);\r\n// declared here so the GLSL linker sees a consistent uniform set in both\r\n// stages.\r\nuniform float uQuantumPresence;\r\nuniform float uQuantumCarrierHz;\r\nuniform float uQuantumCollapsePeriodMs;\r\nuniform float uQuantumCollapseHalfWidthMs;\r\nuniform vec3  uQuantumColor;\r\nuniform float uHivePresence;\r\nuniform float uHivePulseHz;\r\nuniform float uHiveInterferenceScale;\r\nuniform float uHiveDoubleBeat;\r\nuniform float uHiveRimBoost;\r\nuniform vec3  uHiveColor;\r\nuniform float uOrbitalPresence;\r\nuniform float uOrbitalDashRate;\r\nuniform vec3  uOrbitalColor;\r\nuniform float uWarpAmplitude;\r\nuniform vec3  uWarpColor;\r\nuniform float uEschatonPresence;\r\nuniform float uEschatonBeamCount;\r\nuniform float uEschatonBeamWidth;\r\nuniform float uEschatonBeamSpeed;\r\nuniform float uEschatonHalo;\r\nuniform float uEschatonFlashPeriod;\r\nuniform float uEschatonFlashStrength;\r\nuniform vec3  uEschatonColor;\r\n// Per-frame scalar envelopes hoisted to the CPU (tick() computes them from\r\n// uTimeMs + the fx params): the quantum collapse strobe and the eschaton\r\n// annunciation flash are functions of time only, so evaluating their mod/exp\r\n// once per frame beats once per fragment.\r\nuniform float uQuantumCollapse;\r\nuniform float uEschatonFlash;\r\n\r\n// Sway uniforms appear in the same UniformGroup but only the vertex shader\r\n// uses them; declared here so the shared GLSL program links cleanly.\r\nuniform float uLineWidth;\r\nuniform float uIconOpacity;\r\nuniform float uCircleOpacity;\r\nuniform float uDebugMainOnly;\r\nuniform float uDebugSideOnly;\r\nuniform float uSwayEnabled;\r\nuniform float uSwayAmplitude;\r\nuniform float uSwayFrequency;\r\nuniform float uSwayChainMax;\r\nuniform float uSwayMinBranchLen;\r\nuniform float uSwayIconScale;\r\nuniform float uSwayCircleScale;\r\n\r\n// Master layer opacity (the lab alpha slider). Applied in-shader because a\r\n// container worldAlpha doesn't reliably reach this custom mesh/MAX-blend path.\r\nuniform float uRenderOpacity;\r\n\r\nout vec4 finalColor;\r\n\r\nfloat hash21(vec2 p) {\r\n  p = fract(p * vec2(123.34, 456.21));\r\n  p += dot(p, p + 45.32);\r\n  return fract(p.x * p.y);\r\n}\r\n\r\nvoid main() {\r\n  vec2 a = vSegAB.xy;\r\n  vec2 b = vSegAB.zw;\r\n  vec2 ba = b - a;\r\n  vec2 pa = vWorldPos - a;\r\n  float denom = max(dot(ba, ba), 1e-6);\r\n  float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);\r\n  float lineDist = length(pa - ba * h);\r\n  // (3) Breathing — slow radial wave modulates capsule half-width\r\n  // (vertex-hoisted; vFx.y is 1.0 when the effect is off).\r\n  float w = mix(vHW.x, vHW.y, h) * vFx.y;\r\n\r\n  float sd = lineDist - w;\r\n  float aa = max(fwidth(sd), 1e-4);\r\n  float cov = 1.0 - smoothstep(-aa, aa, sd);\r\n\r\n  float alpha = mix(vAlpha.x, vAlpha.y, h);\r\n\r\n  // Every output term below rides alpha*cov, so a zero-coverage fragment is a\r\n  // MAX-blend no-op — return before the fx stack. The quads are padded well\r\n  // past the capsule (sway/warp headroom), so these are the majority of\r\n  // rasterized fragments; skipping them here is exact, not an approximation.\r\n  if (alpha * cov <= 0.0) {\r\n    finalColor = vec4(0.0);\r\n    return;\r\n  }\r\n\r\n  float brightness = 1.0;\r\n\r\n  // (2) Chain flow packets.\r\n  if (uFlowEnabled > 0.5) {\r\n    float chainPos = mix(vChainDist.x, vChainDist.y, h);\r\n    float offset = uTimeMs * 0.001 * uFlowSpeed - chainPos;\r\n    float m = mod(offset, uFlowSpacing);\r\n    if (m > uFlowSpacing * 0.5) m -= uFlowSpacing;\r\n    float d = m / max(uFlowWidth, 1e-4);\r\n    brightness += exp(-d * d) * uFlowBrightness;\r\n  }\r\n\r\n  // (4) Tip glow — newly-grown segments emit a fading bloom (vertex-hoisted;\r\n  // birthStep is constant per quad, so the exp() moved out exactly).\r\n  brightness += vFx.x;\r\n\r\n  // (1) Click pulses — early-out when the ring buffer is empty. We compact\r\n  // the active-pulse count on the CPU (see RibbonMesh.pulse / decayPulses)\r\n  // so the loop bound is tight; iterating the inactive tail would waste\r\n  // fragment-shader cycles every frame regardless of pulse activity.\r\n  // p.w encodes a per-pulse brightness multiplier (0 or unset = use 1.0).\r\n  // uPulseTints[i].rgb encodes a per-pulse accent color; (0,0,0) → use the\r\n  // legacy white-brightness path (modulated by the ribbon layer color),\r\n  // non-zero → additive colored glow unmodulated by layer (tier comet/flash).\r\n  int activeCount = int(uActivePulseCount + 0.5);\r\n  vec3 pulseColorAdd = vec3(0.0);\r\n  for (int i = 0; i < ${K}; i++) {\r\n    if (i >= activeCount) break;\r\n    vec4 p = uPulses[i];\r\n    if (p.z <= 0.0) continue;\r\n    float elapsed = (uTimeMs - p.z) * 0.001;\r\n    if (elapsed < 0.0 || elapsed > uPulseDuration) continue;\r\n    float waveRadius = elapsed * uPulseSpeed;\r\n    float pixelRadius = length(vWorldPos - p.xy);\r\n    float d = (pixelRadius - waveRadius) / max(uPulseBand, 1e-4);\r\n    float fade = 1.0 - elapsed / max(uPulseDuration, 1e-4);\r\n    float perPulseMul = p.w > 0.0 ? p.w : 1.0;\r\n    float contrib = exp(-d * d) * fade * uPulseBrightness * perPulseMul;\r\n    vec3 tint = uPulseTints[i].rgb;\r\n    if (tint.r + tint.g + tint.b > 0.0) {\r\n      pulseColorAdd += tint * contrib;\r\n    } else {\r\n      brightness += contrib;\r\n    }\r\n  }\r\n\r\n  // (5) Twinkle — cell-based hash noise scintillation.\r\n  if (uTwinkleEnabled > 0.5) {\r\n    vec2 cell = floor(vWorldPos * uTwinkleFrequency + uTimeMs * 0.01);\r\n    float n = hash21(cell);\r\n    brightness *= 1.0 + (n - 0.5) * 2.0 * uTwinkleAmplitude;\r\n  }\r\n\r\n  brightness = max(brightness, 0.0);\r\n\r\n  // (6) Layer color split — coral hue vs circuit hue, mixed by layer flag.\r\n  vec3 layerColor = vec3(1.0);\r\n  if (uLayerSplitEnabled > 0.5) {\r\n    layerColor = mix(uCircleColor, uIconColor, vMeta.y);\r\n  }\r\n\r\n  // (7) Tier 7-11 fx (post-redesign) - each routes contributions through\r\n  // either brightness (scalar boost ridden by layerColor) or fxAdd\r\n  // (RGB additive). All ride on the ribbon via alpha*cov below.\r\n  vec3 fxAdd = vec3(0.0);\r\n\r\n  // QUANTUM — Probability Cloud Collapse. Continuous interference bands\r\n  // along chain + periodic synchronous global collapse strobe. No spatial\r\n  // origin: every fragment peaks at the same instant.\r\n  if (uQuantumPresence > 0.0) {\r\n    float qSec = uTimeMs * 0.001;\r\n    float chainPos = mix(vChainDist.x, vChainDist.y, h);\r\n    float k1 = uQuantumCarrierHz;\r\n    float k2 = uQuantumCarrierHz * 1.618;\r\n    float w1 = sin(chainPos * 0.025 + qSec * k1 * 6.2831);\r\n    float w2 = sin(chainPos * 0.041 - qSec * k2 * 6.2831 + vMeta.x * 0.13);\r\n    float w3 = sin((vWorldPos.x + vWorldPos.y) * 0.018 + qSec * k1 * 3.1);\r\n    float interf = (w1 + w2 + w3) / 3.0;\r\n    float cloud = 0.5 + 0.5 * interf;\r\n    // Collapse: gaussian peak every period, sharp synchronous network-wide.\r\n    // Time-only — evaluated on the CPU each frame (see tick()).\r\n    float collapse = uQuantumCollapse;\r\n    float quantumSnap = pow(0.5 + 0.5 * sin(chainPos * 0.06 + qSec * 12.0), 4.0);\r\n    float field = mix(cloud, quantumSnap, collapse);\r\n    brightness += uQuantumPresence * (0.35 + 0.65 * field) + uQuantumPresence * collapse * 1.4;\r\n    vec3 violet = mix(uQuantumColor, vec3(1.0), collapse * 0.6);\r\n    fxAdd += violet * uQuantumPresence * (0.4 * field + 1.2 * collapse);\r\n  }\r\n\r\n  // HIVEMIND — Synchronized Heartbeat. Global temporal pulse, no spatial\r\n  // propagation. Stage 3 = lub-dub + rim glow.\r\n  if (uHivePresence > 0.0) {\r\n    float hSec = uTimeMs * 0.001;\r\n    float gPhase = hSec * uHivePulseHz * 6.28318;\r\n    vec2 hq = vWorldPos * uHiveInterferenceScale;\r\n    float drift = hSec * 0.15;\r\n    float hInterf = sin(hq.x + drift) * 0.5 + sin(hq.y * 1.21 - drift * 0.7) * 0.5;\r\n    float hPhase = gPhase + hInterf * 1.2;\r\n    float beatSin = sin(hPhase);\r\n    float beatHeart = max(sin(hPhase), 0.55 * sin(hPhase - 1.13));\r\n    float beat = mix(beatSin, beatHeart, clamp(uHiveDoubleBeat, 0.0, 1.0));\r\n    float flash = max(beat, 0.0);\r\n    flash = flash * flash;\r\n    float edge = clamp(1.0 - smoothstep(0.0, w * 0.55, lineDist), 0.0, 1.0);\r\n    float rim = (1.0 - edge) * uHiveRimBoost;\r\n    fxAdd += uHiveColor * uHivePresence * flash * (1.0 + rim);\r\n  }\r\n\r\n  // ORBITAL — Annular rings with rotating azimuthal dashes. Two fixed\r\n  // radii; rotation rate scales with stage. Wider sigma than before so\r\n  // the rings register through alpha*cov modulation.\r\n  if (uOrbitalPresence > 0.0) {\r\n    float oSec = uTimeMs * 0.001;\r\n    float r = length(vWorldPos - uWorldCenter);\r\n    float ang = atan(vWorldPos.y - uWorldCenter.y, vWorldPos.x - uWorldCenter.x);\r\n    float ringA = exp(-pow((r - uWorldCenter.x * 0.55) / 80.0, 2.0));\r\n    float ringB = exp(-pow((r - uWorldCenter.x * 0.80) / 80.0, 2.0));\r\n    // Rotating dash modulation — bright at peaks of cos, faint between.\r\n    float dashA = 0.55 + 0.45 * cos(ang * 14.0 + oSec * uOrbitalDashRate * 6.28);\r\n    float dashB = 0.55 + 0.45 * cos(ang * 10.0 - oSec * uOrbitalDashRate * 4.5);\r\n    fxAdd += uOrbitalColor * uOrbitalPresence * (ringA * dashA + ringB * 0.85 * dashB);\r\n  }\r\n\r\n  if (uWarpAmplitude > 0.0) {\r\n    float r = length(vWorldPos - uWorldCenter);\r\n    float halo = exp(-r * 0.0008);\r\n    fxAdd += uWarpColor * halo * 0.35;\r\n  }\r\n\r\n  // ESCHATON — Ascension Beams. Godrays from world center + perimeter\r\n  // aureola + periodic full-network annunciation flash.\r\n  if (uEschatonPresence > 0.0) {\r\n    vec2 ed = vWorldPos - uWorldCenter;\r\n    float er = length(ed);\r\n    float eAng = atan(ed.y, ed.x);\r\n    float eSec = uTimeMs * 0.001;\r\n    float n = max(uEschatonBeamCount, 1.0);\r\n    float sector = 6.28318 / n;\r\n    float rel = mod(eAng - eSec * uEschatonBeamSpeed + 3.14159, sector) - sector * 0.5;\r\n    float bw = max(uEschatonBeamWidth, 0.0001);\r\n    float beam = exp(-(rel * rel) / (bw * bw));\r\n    float radialGain = smoothstep(0.0, uWorldCenter.x, er);\r\n    float godray = beam * (0.4 + 0.6 * radialGain);\r\n    float rimT = (er - uWorldCenter.x * 0.6) / max(uWorldCenter.x * 0.5, 1.0);\r\n    float halo = exp(-rimT * rimT * 3.0) * uEschatonHalo;\r\n    // Annunciation flash: time-only — evaluated on the CPU each frame.\r\n    float flash = uEschatonFlash;\r\n    float eIntensity = (godray * 1.2 + halo + flash) * uEschatonPresence;\r\n    fxAdd += uEschatonColor * eIntensity;\r\n  }\r\n\r\n  brightness = max(brightness, 0.0);\r\n  vec4 base = uColor * uWorldColorAlpha;\r\n  finalColor = base * vec4(layerColor, 1.0) * (alpha * cov * brightness);\r\n  finalColor.rgb += (pulseColorAdd + fxAdd) * (alpha * cov);\r\n  // Single linear master dimmer over the whole layer (body + glows + pulses).\r\n  finalColor *= uRenderOpacity;\r\n}\r\n";

/** Shipped WebGPU template `Mt` (line 1420), including `${K}`. */
export const RIBBON_GPU_WGSL: string = "\r\nstruct GlobalUniforms {\r\n  uProjectionMatrix: mat3x3<f32>,\r\n  uWorldTransformMatrix: mat3x3<f32>,\r\n  uWorldColorAlpha: vec4<f32>,\r\n  uResolution: vec2<f32>,\r\n}\r\n\r\nstruct LocalUniforms {\r\n  uTransformMatrix: mat3x3<f32>,\r\n  uColor: vec4<f32>,\r\n  uRound: f32,\r\n}\r\n\r\nstruct EffectUniforms {\r\n  uPulses: array<vec4<f32>, ${K}>,\r\n  uPulseTints: array<vec4<f32>, ${K}>,\r\n  uWorldCenter: vec2<f32>,\r\n  uTimeMs: f32,\r\n  uCurrentStep: f32,\r\n  uLineWidth: f32,\r\n  uIconOpacity: f32,\r\n  uCircleOpacity: f32,\r\n  uActivePulseCount: f32,\r\n  uDebugMainOnly: f32,\r\n  uDebugSideOnly: f32,\r\n  uPulseSpeed: f32,\r\n  uPulseBand: f32,\r\n  uPulseDuration: f32,\r\n  uPulseBrightness: f32,\r\n  uFlowEnabled: f32,\r\n  uFlowSpeed: f32,\r\n  uFlowSpacing: f32,\r\n  uFlowWidth: f32,\r\n  uFlowBrightness: f32,\r\n  uBreathEnabled: f32,\r\n  uBreathFrequency: f32,\r\n  uBreathAmplitude: f32,\r\n  uTipGlowEnabled: f32,\r\n  uTipGlowDecay: f32,\r\n  uTipGlowBoost: f32,\r\n  uTwinkleEnabled: f32,\r\n  uTwinkleFrequency: f32,\r\n  uTwinkleAmplitude: f32,\r\n  uLayerSplitEnabled: f32,\r\n  uSwayEnabled: f32,\r\n  uSwayAmplitude: f32,\r\n  uSwayFrequency: f32,\r\n  uSwayChainMax: f32,\r\n  uSwayMinBranchLen: f32,\r\n  uSwayIconScale: f32,\r\n  uSwayCircleScale: f32,\r\n  uCircleColor: vec3<f32>,\r\n  uIconColor: vec3<f32>,\r\n  uQuantumPresence: f32,\r\n  uQuantumCarrierHz: f32,\r\n  uQuantumCollapsePeriodMs: f32,\r\n  uQuantumCollapseHalfWidthMs: f32,\r\n  uQuantumColor: vec3<f32>,\r\n  uHivePresence: f32,\r\n  uHivePulseHz: f32,\r\n  uHiveInterferenceScale: f32,\r\n  uHiveDoubleBeat: f32,\r\n  uHiveRimBoost: f32,\r\n  uHiveColor: vec3<f32>,\r\n  uOrbitalPresence: f32,\r\n  uOrbitalDashRate: f32,\r\n  uOrbitalColor: vec3<f32>,\r\n  uWarpAmplitude: f32,\r\n  uWarpColor: vec3<f32>,\r\n  uEschatonPresence: f32,\r\n  uEschatonBeamCount: f32,\r\n  uEschatonBeamWidth: f32,\r\n  uEschatonBeamSpeed: f32,\r\n  uEschatonHalo: f32,\r\n  uEschatonFlashPeriod: f32,\r\n  uEschatonFlashStrength: f32,\r\n  uEschatonColor: vec3<f32>,\r\n  uQuantumCollapse: f32,\r\n  uEschatonFlash: f32,\r\n  uRenderOpacity: f32,\r\n}\r\n\r\n@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;\r\n@group(1) @binding(0) var<uniform> localUniforms: LocalUniforms;\r\n@group(2) @binding(0) var<uniform> effectUniforms: EffectUniforms;\r\n\r\nstruct VsOut {\r\n  @builtin(position) position: vec4<f32>,\r\n  @location(0) vWorldPos: vec2<f32>,\r\n  @location(1) vSegAB: vec4<f32>,\r\n  @location(2) vHW: vec2<f32>,\r\n  @location(3) vAlpha: vec2<f32>,\r\n  @location(4) vChainDist: vec2<f32>,\r\n  @location(5) vMeta: vec2<f32>,\r\n  // x = tip-glow boost, y = breath width multiplier (vertex-hoisted; see the\r\n  // GLSL twin's vFx comment).\r\n  @location(6) vFx: vec2<f32>,\r\n}\r\n\r\nfn branchPhase(id: f32) -> f32 {\r\n  return fract(sin(id * 12.9898) * 43758.5453) * 6.28318;\r\n}\r\n\r\nfn swayField(p: vec2<f32>, tSec: f32, phase: f32) -> vec2<f32> {\r\n  let t = tSec * effectUniforms.uSwayFrequency;\r\n  let base = vec2<f32>(\r\n    sin(t * 6.28318 * 1.0 + p.x * 0.0008 + p.y * 0.0003 + phase),\r\n    cos(t * 6.28318 * 0.9 + p.x * 0.0004 + p.y * 0.001  + phase * 1.3)\r\n  );\r\n  let detail = vec2<f32>(\r\n    sin(t * 6.28318 * 2.7 + p.x * 0.003  + p.y * 0.002 + phase * 1.7),\r\n    cos(t * 6.28318 * 2.5 + p.x * 0.002  + p.y * 0.003 + phase * 2.1)\r\n  );\r\n  return base + detail * 0.3;\r\n}\r\n\r\nfn degenerate() -> VsOut {\r\n  var out: VsOut;\r\n  out.position = vec4<f32>(2.0, 2.0, 2.0, 1.0);\r\n  out.vWorldPos = vec2<f32>(0.0);\r\n  out.vSegAB = vec4<f32>(0.0);\r\n  out.vHW = vec2<f32>(0.0);\r\n  out.vAlpha = vec2<f32>(0.0);\r\n  out.vChainDist = vec2<f32>(0.0);\r\n  out.vMeta = vec2<f32>(0.0);\r\n  out.vFx = vec2<f32>(0.0, 1.0);\r\n  return out;\r\n}\r\n\r\n@vertex\r\nfn mainVertex(\r\n  @location(0) aPosition: vec2<f32>,\r\n  @location(1) aSegAB: vec4<f32>,\r\n  @location(2) aChainDist: vec2<f32>,\r\n  @location(3) aMeta: vec3<f32>,\r\n  @location(4) aBranchAB: vec2<f32>,\r\n  @location(5) aBranchLen: vec2<f32>,\r\n  @location(6) aThicknessAB: vec2<f32>,\r\n) -> VsOut {\r\n  let birthStep = aMeta.x;\r\n  let layer = aMeta.y;\r\n  let isMain = aMeta.z;\r\n\r\n  if (birthStep > effectUniforms.uCurrentStep + 0.5) { return degenerate(); }\r\n  if (effectUniforms.uDebugMainOnly > 0.5 && isMain < 0.5) { return degenerate(); }\r\n  if (effectUniforms.uDebugSideOnly > 0.5 && isMain > 0.5) { return degenerate(); }\r\n\r\n  let layerOp = mix(effectUniforms.uCircleOpacity, effectUniforms.uIconOpacity, layer);\r\n  let thA = aThicknessAB.x;\r\n  let thB = aThicknessAB.y;\r\n  let hw = vec2<f32>(effectUniforms.uLineWidth + thA, effectUniforms.uLineWidth + thB) * 0.5;\r\n  let alpha = vec2<f32>(\r\n    layerOp * (thA * (1.0 / 3.0) + 0.2),\r\n    layerOp * (thB * (1.0 / 3.0) + 0.2)\r\n  );\r\n\r\n  var worldPos = aPosition;\r\n  var segAB = aSegAB;\r\n\r\n  if (effectUniforms.uSwayEnabled > 0.5) {\r\n    let tSec = effectUniforms.uTimeMs * 0.001;\r\n    let chainMax = max(effectUniforms.uSwayChainMax, 1.0);\r\n    let fallA = clamp(aChainDist.x / chainMax, 0.0, 1.0);\r\n    let fallB = clamp(aChainDist.y / chainMax, 0.0, 1.0);\r\n    let phaseA = branchPhase(aBranchAB.x);\r\n    let phaseB = branchPhase(aBranchAB.y);\r\n    let minLen = max(effectUniforms.uSwayMinBranchLen, 1.0);\r\n    let lenScaleA = clamp(aBranchLen.x / minLen, 0.0, 1.0);\r\n    let lenScaleB = clamp(aBranchLen.y / minLen, 0.0, 1.0);\r\n    let layerScale = mix(effectUniforms.uSwayCircleScale, effectUniforms.uSwayIconScale, layer);\r\n    let dispA = swayField(aSegAB.xy, tSec, phaseA) * effectUniforms.uSwayAmplitude * fallA * lenScaleA * layerScale;\r\n    let dispB = swayField(aSegAB.zw, tSec, phaseB) * effectUniforms.uSwayAmplitude * fallB * lenScaleB * layerScale;\r\n\r\n    let ba = aSegAB.zw - aSegAB.xy;\r\n    let h = clamp(dot(aPosition - aSegAB.xy, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);\r\n    let dispVert = mix(dispA, dispB, h);\r\n\r\n    worldPos = aPosition + dispVert;\r\n    segAB = vec4<f32>(aSegAB.xy + dispA, aSegAB.zw + dispB);\r\n  }\r\n\r\n  if (effectUniforms.uWarpAmplitude > 0.0) {\r\n    let toCenter = effectUniforms.uWorldCenter - worldPos;\r\n    let dist = length(toCenter);\r\n    if (dist > 1.0) {\r\n      let tangent = vec2<f32>(-toCenter.y, toCenter.x) / dist;\r\n      let fall = 1.0 / (1.0 + dist * 0.0008);\r\n      let tSec = effectUniforms.uTimeMs * 0.0001;\r\n      let spiral = (toCenter / dist) * 0.6 + tangent * 0.4;\r\n      worldPos = worldPos + spiral * effectUniforms.uWarpAmplitude * fall * (0.7 + 0.3 * sin(tSec * 6.28));\r\n      segAB = vec4<f32>(\r\n        segAB.xy + spiral * effectUniforms.uWarpAmplitude * fall * 0.5,\r\n        segAB.zw + spiral * effectUniforms.uWarpAmplitude * fall * 0.5,\r\n      );\r\n    }\r\n  }\r\n\r\n  // Fragment-cost hoists (mirrors the GLSL twin).\r\n  var tipGlow = 0.0;\r\n  if (effectUniforms.uTipGlowEnabled > 0.5) {\r\n    let age = max(0.0, effectUniforms.uCurrentStep - birthStep);\r\n    tipGlow = exp(-age / max(effectUniforms.uTipGlowDecay, 1.0)) * effectUniforms.uTipGlowBoost;\r\n  }\r\n  var breathMul = 1.0;\r\n  if (effectUniforms.uBreathEnabled > 0.5) {\r\n    let radial = length(worldPos - effectUniforms.uWorldCenter);\r\n    let phase = effectUniforms.uTimeMs * 0.001 * effectUniforms.uBreathFrequency * 6.283185 - radial * 0.005;\r\n    breathMul = 1.0 + sin(phase) * effectUniforms.uBreathAmplitude;\r\n  }\r\n\r\n  let mvp = globalUniforms.uProjectionMatrix * globalUniforms.uWorldTransformMatrix * localUniforms.uTransformMatrix;\r\n  let clip = mvp * vec3<f32>(worldPos, 1.0);\r\n  var out: VsOut;\r\n  out.position = vec4<f32>(clip.xy, 0.0, 1.0);\r\n  out.vWorldPos = worldPos;\r\n  out.vSegAB = segAB;\r\n  out.vHW = hw;\r\n  out.vAlpha = alpha;\r\n  out.vChainDist = aChainDist;\r\n  out.vMeta = vec2<f32>(birthStep, layer);\r\n  out.vFx = vec2<f32>(tipGlow, breathMul);\r\n  return out;\r\n}\r\n\r\nfn hash21(p_in: vec2<f32>) -> f32 {\r\n  var p = fract(p_in * vec2<f32>(123.34, 456.21));\r\n  p = p + vec2<f32>(dot(p, p + 45.32));\r\n  return fract(p.x * p.y);\r\n}\r\n\r\n@fragment\r\nfn mainFragment(in: VsOut) -> @location(0) vec4<f32> {\r\n  let a = in.vSegAB.xy;\r\n  let b = in.vSegAB.zw;\r\n  let ba = b - a;\r\n  let pa = in.vWorldPos - a;\r\n  let denom = max(dot(ba, ba), 1e-6);\r\n  let h = clamp(dot(pa, ba) / denom, 0.0, 1.0);\r\n  let lineDist = length(pa - ba * h);\r\n  // Breath is vertex-hoisted; in.vFx.y is 1.0 when the effect is off.\r\n  let w = mix(in.vHW.x, in.vHW.y, h) * in.vFx.y;\r\n\r\n  let sd = lineDist - w;\r\n  let aa = max(fwidth(sd), 1e-4);\r\n  let cov = 1.0 - smoothstep(-aa, aa, sd);\r\n\r\n  let alpha = mix(in.vAlpha.x, in.vAlpha.y, h);\r\n\r\n  // Every output term below rides alpha*cov, so a zero-coverage fragment is a\r\n  // MAX-blend no-op — return before the fx stack (see the GLSL twin).\r\n  if (alpha * cov <= 0.0) {\r\n    return vec4<f32>(0.0);\r\n  }\r\n\r\n  var brightness: f32 = 1.0;\r\n\r\n  if (effectUniforms.uFlowEnabled > 0.5) {\r\n    let chainPos = mix(in.vChainDist.x, in.vChainDist.y, h);\r\n    let offset = effectUniforms.uTimeMs * 0.001 * effectUniforms.uFlowSpeed - chainPos;\r\n    var m = offset - effectUniforms.uFlowSpacing * floor(offset / effectUniforms.uFlowSpacing);\r\n    if (m > effectUniforms.uFlowSpacing * 0.5) {\r\n      m = m - effectUniforms.uFlowSpacing;\r\n    }\r\n    let d = m / max(effectUniforms.uFlowWidth, 1e-4);\r\n    brightness = brightness + exp(-d * d) * effectUniforms.uFlowBrightness;\r\n  }\r\n\r\n  // Tip glow is vertex-hoisted (exact: birthStep is constant per quad).\r\n  brightness = brightness + in.vFx.x;\r\n\r\n  let activeCount = u32(effectUniforms.uActivePulseCount + 0.5);\r\n  var pulseColorAdd = vec3<f32>(0.0);\r\n  for (var i = 0u; i < ${K}u; i = i + 1u) {\r\n    if (i >= activeCount) { break; }\r\n    let p = effectUniforms.uPulses[i];\r\n    if (p.z <= 0.0) { continue; }\r\n    let elapsed = (effectUniforms.uTimeMs - p.z) * 0.001;\r\n    if (elapsed < 0.0 || elapsed > effectUniforms.uPulseDuration) { continue; }\r\n    let waveRadius = elapsed * effectUniforms.uPulseSpeed;\r\n    let pixelRadius = length(in.vWorldPos - p.xy);\r\n    let d = (pixelRadius - waveRadius) / max(effectUniforms.uPulseBand, 1e-4);\r\n    let fade = 1.0 - elapsed / max(effectUniforms.uPulseDuration, 1e-4);\r\n    let perPulseMul = select(1.0, p.w, p.w > 0.0);\r\n    let contrib = exp(-d * d) * fade * effectUniforms.uPulseBrightness * perPulseMul;\r\n    let tint = effectUniforms.uPulseTints[i].rgb;\r\n    if (tint.r + tint.g + tint.b > 0.0) {\r\n      pulseColorAdd = pulseColorAdd + tint * contrib;\r\n    } else {\r\n      brightness = brightness + contrib;\r\n    }\r\n  }\r\n\r\n  if (effectUniforms.uTwinkleEnabled > 0.5) {\r\n    let cell = floor(in.vWorldPos * effectUniforms.uTwinkleFrequency + effectUniforms.uTimeMs * 0.01);\r\n    let n = hash21(cell);\r\n    brightness = brightness * (1.0 + (n - 0.5) * 2.0 * effectUniforms.uTwinkleAmplitude);\r\n  }\r\n\r\n  brightness = max(brightness, 0.0);\r\n\r\n  var layerColor = vec3<f32>(1.0);\r\n  if (effectUniforms.uLayerSplitEnabled > 0.5) {\r\n    layerColor = mix(effectUniforms.uCircleColor, effectUniforms.uIconColor, in.vMeta.y);\r\n  }\r\n\r\n  var fxAdd = vec3<f32>(0.0);\r\n\r\n  // QUANTUM — Probability Cloud Collapse.\r\n  if (effectUniforms.uQuantumPresence > 0.0) {\r\n    let qSec = effectUniforms.uTimeMs * 0.001;\r\n    let chainPos = mix(in.vChainDist.x, in.vChainDist.y, h);\r\n    let k1 = effectUniforms.uQuantumCarrierHz;\r\n    let k2 = effectUniforms.uQuantumCarrierHz * 1.618;\r\n    let w1 = sin(chainPos * 0.025 + qSec * k1 * 6.2831);\r\n    let w2 = sin(chainPos * 0.041 - qSec * k2 * 6.2831 + in.vMeta.x * 0.13);\r\n    let w3 = sin((in.vWorldPos.x + in.vWorldPos.y) * 0.018 + qSec * k1 * 3.1);\r\n    let interf = (w1 + w2 + w3) / 3.0;\r\n    let cloud = 0.5 + 0.5 * interf;\r\n    // Time-only — evaluated on the CPU each frame (see tick()).\r\n    let collapse = effectUniforms.uQuantumCollapse;\r\n    let quantumSnap = pow(0.5 + 0.5 * sin(chainPos * 0.06 + qSec * 12.0), 4.0);\r\n    let field = mix(cloud, quantumSnap, collapse);\r\n    brightness = brightness + effectUniforms.uQuantumPresence * (0.35 + 0.65 * field) + effectUniforms.uQuantumPresence * collapse * 1.4;\r\n    let violet = mix(effectUniforms.uQuantumColor, vec3<f32>(1.0), collapse * 0.6);\r\n    fxAdd = fxAdd + violet * effectUniforms.uQuantumPresence * (0.4 * field + 1.2 * collapse);\r\n  }\r\n\r\n  // HIVEMIND — Synchronized Heartbeat.\r\n  if (effectUniforms.uHivePresence > 0.0) {\r\n    let hSec = effectUniforms.uTimeMs * 0.001;\r\n    let gPhase = hSec * effectUniforms.uHivePulseHz * 6.28318;\r\n    let hq = in.vWorldPos * effectUniforms.uHiveInterferenceScale;\r\n    let drift = hSec * 0.15;\r\n    let hInterf = sin(hq.x + drift) * 0.5 + sin(hq.y * 1.21 - drift * 0.7) * 0.5;\r\n    let hPhase = gPhase + hInterf * 1.2;\r\n    let beatSin = sin(hPhase);\r\n    let beatHeart = max(sin(hPhase), 0.55 * sin(hPhase - 1.13));\r\n    let beat = mix(beatSin, beatHeart, clamp(effectUniforms.uHiveDoubleBeat, 0.0, 1.0));\r\n    var flash = max(beat, 0.0);\r\n    flash = flash * flash;\r\n    let edge = clamp(1.0 - smoothstep(0.0, w * 0.55, lineDist), 0.0, 1.0);\r\n    let rim = (1.0 - edge) * effectUniforms.uHiveRimBoost;\r\n    fxAdd = fxAdd + effectUniforms.uHiveColor * effectUniforms.uHivePresence * flash * (1.0 + rim);\r\n  }\r\n\r\n  // ORBITAL — Annular rings with rotating azimuthal dashes.\r\n  if (effectUniforms.uOrbitalPresence > 0.0) {\r\n    let oSec = effectUniforms.uTimeMs * 0.001;\r\n    let r = length(in.vWorldPos - effectUniforms.uWorldCenter);\r\n    let ang = atan2(in.vWorldPos.y - effectUniforms.uWorldCenter.y, in.vWorldPos.x - effectUniforms.uWorldCenter.x);\r\n    let ringA = exp(-pow((r - effectUniforms.uWorldCenter.x * 0.55) / 80.0, 2.0));\r\n    let ringB = exp(-pow((r - effectUniforms.uWorldCenter.x * 0.80) / 80.0, 2.0));\r\n    let dashA = 0.55 + 0.45 * cos(ang * 14.0 + oSec * effectUniforms.uOrbitalDashRate * 6.28);\r\n    let dashB = 0.55 + 0.45 * cos(ang * 10.0 - oSec * effectUniforms.uOrbitalDashRate * 4.5);\r\n    fxAdd = fxAdd + effectUniforms.uOrbitalColor * effectUniforms.uOrbitalPresence * (ringA * dashA + ringB * 0.85 * dashB);\r\n  }\r\n\r\n  if (effectUniforms.uWarpAmplitude > 0.0) {\r\n    let r = length(in.vWorldPos - effectUniforms.uWorldCenter);\r\n    let halo = exp(-r * 0.0008);\r\n    fxAdd = fxAdd + effectUniforms.uWarpColor * halo * 0.35;\r\n  }\r\n\r\n  // ESCHATON — Ascension Beams.\r\n  if (effectUniforms.uEschatonPresence > 0.0) {\r\n    let ed = in.vWorldPos - effectUniforms.uWorldCenter;\r\n    let er = length(ed);\r\n    let eAng = atan2(ed.y, ed.x);\r\n    let eSec = effectUniforms.uTimeMs * 0.001;\r\n    let n = max(effectUniforms.uEschatonBeamCount, 1.0);\r\n    let sector = 6.28318 / n;\r\n    let preRel = eAng - eSec * effectUniforms.uEschatonBeamSpeed + 3.14159;\r\n    let rel = preRel - sector * floor(preRel / sector) - sector * 0.5;\r\n    let bw = max(effectUniforms.uEschatonBeamWidth, 0.0001);\r\n    let beam = exp(-(rel * rel) / (bw * bw));\r\n    let radialGain = smoothstep(0.0, effectUniforms.uWorldCenter.x, er);\r\n    let godray = beam * (0.4 + 0.6 * radialGain);\r\n    let rimT = (er - effectUniforms.uWorldCenter.x * 0.6) / max(effectUniforms.uWorldCenter.x * 0.5, 1.0);\r\n    let halo = exp(-rimT * rimT * 3.0) * effectUniforms.uEschatonHalo;\r\n    // Annunciation flash: time-only — evaluated on the CPU each frame.\r\n    let flash = effectUniforms.uEschatonFlash;\r\n    let eIntensity = (godray * 1.2 + halo + flash) * effectUniforms.uEschatonPresence;\r\n    fxAdd = fxAdd + effectUniforms.uEschatonColor * eIntensity;\r\n  }\r\n\r\n  brightness = max(brightness, 0.0);\r\n  let base = localUniforms.uColor * globalUniforms.uWorldColorAlpha;\r\n  var rgba = base * vec4<f32>(layerColor, 1.0) * (alpha * cov * brightness);\r\n  rgba = vec4<f32>(rgba.rgb + (pulseColorAdd + fxAdd) * (alpha * cov), rgba.a);\r\n  // Single linear master dimmer over the whole layer (body + glows + pulses).\r\n  rgba = rgba * effectUniforms.uRenderOpacity;\r\n  return rgba;\r\n}\r\n";

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
