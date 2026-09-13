/** Authorized cult-flash shader source; two-pass rendering, original phase landmarks. */
const ws = {
  read0: 0.08,
  read1: 0.52,
  open0: 0.6,
  open1: 0.655,
  crush0: 0.74,
  black: 0.78,
};
const WU = 0.95;
const Js = ws;
const fXe = `#version 300 es
// Fullscreen triangle from gl_VertexID — no attribute buffers.
void main() {
  vec2 p = vec2((gl_VertexID == 1) ? 3.0 : -1.0, (gl_VertexID == 2) ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}
`;
const hXe = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform float u_p;    // 0..1 progress — sole driver, scrub-safe
uniform vec2  u_res;

const float DUR   = 7.0;   // internal seconds scale (motion rates only)
const float LINES = 9.0;
const float Y_TOP =  0.40;
const float Y_BOT = -0.30;
const float P_READ0 = ${Js.read0.toFixed(4)}, P_READ1 = ${Js.read1.toFixed(4)};
const float P_HOLD  = ${Js.read1.toFixed(4)};
const float P_OPEN0 = ${Js.open0.toFixed(4)}, P_OPEN1 = ${Js.open1.toFixed(4)};
const float P_CRUSH0 = ${Js.crush0.toFixed(4)}, P_CRUSH1 = ${Js.black.toFixed(4)};
const float P_BLACK = ${Js.black.toFixed(4)};

float hash21(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1,0)), c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float fbm(vec2 p){
  float v=0.0, amp=0.5;
  for(int i=0;i<5;i++){ v+=amp*vnoise(p); p=rot(0.7)*p*2.02; amp*=0.5; }
  return v;
}

float seg(float p, float a, float b){ return clamp((p-a)/(b-a), 0.0, 1.0); }
float spike(float p, float c, float w){ float x=(p-c)/w; return exp(-x*x); }
float easeOutExpo(float x){ return x>=1.0 ? 1.0 : 1.0-exp2(-10.0*x); }
float easeInExpo (float x){ return x<=0.0 ? 0.0 : exp2(10.0*(x-1.0)); }
float easeOutBack(float x){ const float c1=1.70158, c3=c1+1.0; float h=x-1.0; return 1.0+c3*h*h*h+c1*h*h; }

const float DY = (Y_TOP - Y_BOT) / (LINES - 1.0);
// The reading lamp steps down line by line: quick advance (easeOutExpo), then a
// HOLD on the line while the carriage sweeps — a reader, not a scanner.
float lampLine(float k){
  float s = k * (LINES - 1.0);
  float i = floor(s), f = fract(s);
  return i + easeOutExpo(min(f/0.28, 1.0));
}
float rowFreezeP(float row){
  return P_READ0 + (P_READ1-P_READ0) * clamp(row,0.0,LINES-1.0) / (LINES-1.0);
}

// Almost-characters: thin strokes on a 4x5 sub-grid — the texture of a script,
// never legible.
float glyph(vec2 cellUv, vec2 cellId){
  float present = step(0.22, hash21(cellId*1.61+7.3));
  vec2 sp = cellUv*vec2(4.0,5.0);
  vec2 si = floor(sp), sf = fract(sp);
  float h = hash21(cellId*3.7 + si*13.1);
  float hOn = step(0.55, h);
  float hBar = hOn * smoothstep(0.30,0.42,sf.y) * smoothstep(0.74,0.62,sf.y);
  float vOn = step(0.82, hash21(cellId*5.1 + si*7.7));
  float vBar = vOn * smoothstep(0.30,0.44,sf.x) * smoothstep(0.72,0.58,sf.x);
  return present * max(hBar, vBar);
}

vec3 aces(vec3 x){ // cheap ACES fit — keeps hue as brights approach white
  return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);
}

void main(){
  float aspect = u_res.x/u_res.y;
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res)/u_res.y;
  float p = clamp(u_p, 0.0, 1.0);
  float t = p * DUR;

  float kRead  = seg(p, P_READ0, P_READ1);
  float openK  = easeOutBack(seg(p, P_OPEN0, P_OPEN1));
  float crushK = easeInExpo(seg(p, P_CRUSH0, P_CRUSH1));
  float apK    = openK * (1.0 - crushK);

  // lens pinch: while the aperture is open the whole frozen image bends toward it
  float rC = length(uv);
  uv *= 1.0 - 0.16*apK*exp(-rC*rC*3.0);

  // per-pixel time: read rows freeze at the moment they were read; after the
  // hold the whole world freezes — only 祂's aperture moves after that.
  float row = (Y_TOP - uv.y)/DY;
  float tFreeze = rowFreezeP(row) * DUR;
  float tm = min(t, tFreeze);
  tm = min(tm, P_HOLD*DUR);

  float lampL = lampLine(kRead);
  float ly = Y_TOP - lampL*DY;
  float readMask = smoothstep(ly, ly+0.012, uv.y) * step(P_READ0, p);

  // the medium: cold living water below the lamp, slow, sinking
  vec2 q = uv*2.0;
  float w1 = fbm(q + vec2(0.0, tm*0.16));
  float w2 = fbm(q*1.6 - vec2(tm*0.11, w1));
  float med = fbm(q + 1.5*vec2(w1,w2) - vec2(0.0, tm*0.05));
  vec3 deep = vec3(0.008, 0.016, 0.030);
  vec3 cold = vec3(0.055, 0.115, 0.145);
  vec3 col = mix(deep, cold, smoothstep(0.22, 0.92, med));
  // depth gradient: darker toward the top (we are UNDER something)
  col *= mix(1.0, 0.55, smoothstep(-0.1, 0.55, uv.y));

  // read region: drained — desaturated, paper-cold, holding its last frame
  vec3 readCol = mix(col, vec3(dot(col, vec3(0.333)))*vec3(1.05,1.0,0.86), 0.75) * 0.8;
  col = mix(col, readCol, readMask);

  vec3 hdr = vec3(0.0);

  // the bright floor beneath all seas + light pillars (what was collected)
  float horizon = -0.44;
  float floorGlow = 0.012 / max(abs(uv.y - horizon), 0.012);
  floorGlow *= smoothstep(0.25, -0.15, uv.y);
  float xx = uv.x*9.0 + 0.004*sin(tm*0.4 + uv.y*3.0);
  float cid = floor(xx);
  float ch = hash21(vec2(cid, 3.7));
  float f = fract(xx)-0.5;
  float wCol = 0.05 + 0.10*ch;
  float pil = exp(-(f/wCol)*(f/wCol));
  float top = horizon + 0.05 + 0.33*ch*ch;
  pil *= smoothstep(top, top-0.22, uv.y) * smoothstep(horizon-0.3, horizon-0.05, uv.y);
  float floorIn = smoothstep(0.0, 0.10, p);
  pil *= 0.8 + 0.2*sin(tm*0.6 + ch*6.28);
  hdr += vec3(0.30,0.62,0.62) * (floorGlow*0.55 + pil*0.75) * floorIn;

  // the lamp: a reading light, not a scanline
  float lampOn = step(P_READ0, p) * (1.0 - smoothstep(P_HOLD, P_HOLD+0.03, p));
  float dLamp = abs(uv.y - ly);
  float lampGlow = 0.0032 / max(dLamp, 0.0045);
  // a soft downward beam: the light falls on what is NOT yet read
  float beam = exp(-max(ly-uv.y, 0.0)*4.5) * step(uv.y, ly) * 0.18;
  float s = kRead*(LINES-1.0);
  float lf = fract(s);
  float sweepK = seg(lf, 0.28, 1.0);
  float sx = mix(-aspect*0.62, aspect*0.62, sweepK);
  float carriage = exp(-(uv.x-sx)*(uv.x-sx)*60.0) * exp(-dLamp*dLamp*900.0);
  hdr += vec3(0.70,0.95,1.05) * (lampGlow*0.9 + beam + carriage*1.6) * lampOn;

  // glyphs: rows transcribe as the lamp passes, flash gold, then hold forever
  float rowI = floor(row + 0.5);
  float inRows = step(-0.5, rowI) * step(rowI, LINES-0.5);
  float rowY = Y_TOP - rowI*DY;
  float inBand = smoothstep(0.36, 0.30, abs(uv.y-rowY)/DY);
  vec2 cellId = vec2(floor(uv.x/0.052), rowI);
  vec2 cellUv = vec2(fract(uv.x/0.052), clamp((uv.y-rowY)/(DY*0.62)+0.5, 0.0, 1.0));
  float gl = glyph(cellUv, cellId) * inRows * inBand;
  float readRow = step(rowFreezeP(rowI), p);
  float sinceRead = max(t - rowFreezeP(rowI)*DUR, 0.0);
  float inkVar = 0.65 + 0.55*hash21(cellId*9.13+1.7);      // uneven ink
  float gB = readRow * (0.22 + 2.6*exp(-sinceRead*2.4)) * inkVar;
  hdr += vec3(0.95,0.72,0.38) * gl * gB;

  // THE APERTURE — not an eye, not a panel: the image itself tears open
  float hS = 0.060 * apK;
  float wS = aspect*0.42 * (1.0 - 0.9*easeInExpo(seg(p, P_CRUSH0+0.022, P_CRUSH1)));
  float apOn = step(0.001, hS);
  float xr = uv.x / max(wS, 1e-3);
  float taper = max(1.0 - xr*xr, 0.0);
  float hProf = hS * pow(taper, 0.55);
  float wobT = (fbm(vec2(uv.x*5.0, 3.7)) - 0.5) * 0.030 * apK;
  float wobB = (fbm(vec2(uv.x*5.0, 9.2)) - 0.5) * 0.030 * apK;
  float dTop = uv.y - (hProf + wobT);
  float dBot = -(uv.y) - (hProf + wobB);
  float dSlit = max(dTop, dBot);
  float inside = smoothstep(0.0015, -0.0015, dSlit) * apOn * smoothstep(0.0, 0.04, taper);
  // interior: rings falling INWARD (花倒着开) over a texture-less light
  float rr = length(uv / max(vec2(wS, hS)*1.2, vec2(1e-3)));
  float tAp = max(t - P_OPEN0*DUR, 0.0);
  float ringsIn = 0.5 + 0.5*sin(rr*22.0 + tAp*7.0);
  vec3 apCol = vec3(2.3, 2.6, 2.7) * (0.45 + 0.65*ringsIn*ringsIn*ringsIn);
  // the light illuminates NOTHING: world + transcript drain instead of catching glow
  float drain = 1.0 - 0.60*apK*smoothstep(1.1, 0.15, rC);
  col *= drain;
  hdr *= mix(1.0, drain, 0.7);
  col = mix(col, vec3(0.0), inside);            // texture stops entirely
  hdr = mix(hdr, vec3(0.0), inside);
  hdr += apCol * inside;

  // inversion spikes: at the tear-open and at the crush
  float inv = spike(p, P_OPEN0+0.004, 0.005) + spike(p, P_CRUSH1-0.002, 0.005);

  vec3 outc = col + hdr;
  outc = aces(outc);
  outc = mix(outc, 1.0-outc, clamp(inv, 0.0, 1.0)*0.9);

  // blackout + afterimage: retinal ghosts of the slit and the page
  float post = seg(p, P_BLACK, 1.0);
  if (p >= P_BLACK) {
    float decay = exp(-post*5.0);
    float ghost = exp(-(uv.y*uv.y)*300.0) * exp(-(uv.x*uv.x)*1.8);
    vec3 dark = vec3(0.0);
    dark += vec3(0.16,0.24,0.26) * ghost * decay * (0.4+0.6*step(0.5,hash21(vec2(floor(t*11.0),3.0))));
    float pf = step(0.85, hash21(vec2(floor(t*9.0), 9.0))) * step(post, 0.45);
    dark += outc * pf * 0.20 * decay;
    outc = dark;
  }

  outc *= smoothstep(0.0, 0.05, p);
  outc *= 1.0 - seg(p, 0.97, 1.0);
  // gentle lift out of the toe (we live in the darks)
  outc = pow(max(outc, 0.0), vec3(1.0/1.25));
  fragColor = vec4(clamp(outc, 0.0, 1.0), 1.0);
}
`;
const pXe = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform vec2  u_res;
uniform float u_p;

const float DUR = 7.0;
const float P_HOLD = ${Js.read1.toFixed(4)}, P_OPEN0 = ${Js.open0.toFixed(4)}, P_CRUSH1 = ${Js.black.toFixed(4)};

float hash11(float n){ return fract(sin(n*127.1)*43758.5453); }
float hash21(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
float spike(float p, float c, float w){ float x=(p-c)/w; return exp(-x*x); }

vec3 toYIQ(vec3 c){
  return vec3(dot(c, vec3(0.299, 0.587, 0.114)),
              dot(c, vec3(0.596,-0.274,-0.322)),
              dot(c, vec3(0.211,-0.523, 0.312)));
}
vec3 toRGB(vec3 y){
  return vec3(y.x + 0.956*y.y + 0.621*y.z,
              y.x - 0.272*y.y - 0.647*y.z,
              y.x - 1.106*y.y + 1.703*y.z);
}
vec3 tap(vec2 uv){
  // black outside the tube
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);
  return texture(u_tex, uv).rgb;
}

void main(){
  vec2 suv = gl_FragCoord.xy / u_res;
  float p = clamp(u_p, 0.0, 1.0);
  float t = p * DUR;

  // beat-aware damage level
  float dread = smoothstep(0.14, P_HOLD, p);
  float level = 0.30 + 0.50*dread;
  level *= 1.0 - 0.85*(step(P_HOLD, p) - step(P_OPEN0, p));   // silence in the HOLD
  level += 1.1*spike(p, P_OPEN0+0.01, 0.018);                 // tear-open shock
  level += 1.6*spike(p, P_CRUSH1-0.004, 0.010);               // crush shock
  level = mix(level, 0.22, step(P_CRUSH1, p));                // dead tape over blackout
  level += 0.9*spike(p, 0.085, 0.012);                        // the lamp turns on

  // barrel curvature (the tube)
  vec2 cc = suv - 0.5;
  float r2 = dot(cc, cc);
  vec2 uv = 0.5 + cc*(1.0 + 0.055*r2 + 0.030*r2*r2);

  // vertical hold wobble + rare frame slip
  uv.y += (hash11(floor(t*60.0)) - 0.5) * 0.0014 * (0.5 + level);
  float slip = step(0.985 - 0.01*level, hash11(floor(t*7.0)+3.1));
  uv.y = fract(uv.y + slip * (hash11(floor(t*7.0)) - 0.5) * 0.08);

  // wandering tracking band: shoves lines sideways, eats detail
  float bandY = fract(hash11(floor(t*0.8)+11.0)*7.31 - t*0.055);
  float dBand = (uv.y - bandY) * u_res.y / 90.0;
  float bandM = exp(-dBand*dBand);
  uv.x += bandM * (hash21(vec2(floor(uv.y*u_res.y/2.0), floor(t*24.0))) - 0.5) * 0.055 * level;

  // head-switch tear: the bottom few lines lag sideways
  float hsw = smoothstep(0.030, 0.0, uv.y);
  uv.x += hsw*hsw * (0.015 + 0.045*hash11(floor(t*30.0)+7.0)) * (0.4 + 0.6*level);

  // time-base error: per-line horizontal jitter
  float line = floor(uv.y * u_res.y);
  uv.x += (hash21(vec2(line, floor(t*90.0))) - 0.5) * 0.0016 * (0.4 + level);

  // luma sharp, chroma smeared + shifted (Y/C separation)
  vec3 yiq = toYIQ(tap(uv));
  vec3 chroma = vec3(0.0);
  float spreadPx = 2.2 + 9.0*level;
  for (int i = 0; i < 6; i++) {
    float o = (float(i) + 0.5) / 6.0;
    chroma += toYIQ(tap(uv - vec2(o * spreadPx / u_res.x, 0.0)));
  }
  chroma /= 6.0;
  yiq.yz = chroma.yz;
  // chroma phase noise: color wanders on damaged lines
  float cNoise = (hash21(vec2(line, floor(t*40.0))) - 0.5) * (0.03 + 0.10*bandM) * level;
  yiq.y += cNoise;

  // dropouts: at most ONE bright comet streak at a time, on a random line
  float dropSeed = floor(t*13.0);
  float dropRowPick = floor(hash11(dropSeed+5.7) * u_res.y);
  float isDrop = step(abs(line - dropRowPick), 1.5)
               * step(0.55, hash11(dropSeed+0.7))     // often no dropout at all
               * step(0.30, level);                   // never on calm tape
  float dropX = hash11(dropSeed+1.3);
  float dx = uv.x - dropX;
  float streak = exp(-dx*dx*400.0) * step(0.0, dx) * exp(-dx*9.0);
  yiq.x += isDrop * streak * 0.9;

  // band noise: the tracking band froths
  yiq.x += bandM * (hash21(uv*u_res.xy + fract(t)*31.7) - 0.5) * 0.30 * level;

  vec3 col = toRGB(yiq);

  // scanlines + faint triad shimmer
  col *= 0.90 + 0.10*sin(uv.y*u_res.y*3.14159);
  col *= 0.985 + 0.015*sin(uv.x*u_res.x*2.0944);

  // tape grain (alive even over black)
  float grain = hash21(suv*vec2(311.7,197.3) + fract(t*0.73)*17.0) - 0.5;
  col += grain * (0.030 + 0.045*level);

  // corner vignette + tube edge
  float vig = smoothstep(0.72, 0.30, length(cc));
  col *= mix(0.62, 1.0, vig);
  float edge = smoothstep(0.0, 0.006, uv.x) * smoothstep(1.0, 0.994, uv.x)
             * smoothstep(0.0, 0.006, uv.y) * smoothstep(1.0, 0.994, uv.y);
  col *= edge;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
export { fXe as CULT_VERTEX, hXe as CULT_FRAGMENT, pXe as CULT_POST_FRAGMENT };
