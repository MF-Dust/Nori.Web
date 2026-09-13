/** Source-owned graphics stages recovered from the authorized NormalApp reference. */
import {
  Group,
  Vector3,
  Color,
  LinearSRGBColorSpace,
  Scene,
  OrthographicCamera,
  Matrix4,
  Vector2,
  TextureLoader,
  LinearFilter,
  NoColorSpace,
  ShaderMaterial,
  AdditiveBlending,
  PlaneGeometry,
  BufferAttribute,
  Mesh,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  NormalBlending,
  InstancedMesh,
  WebGLRenderTarget,
  RGBAFormat,
  FrontSide,
  DataTexture,
  UniformsUtils,
  RepeatWrapping,
  ClampToEdgeWrapping,
  Vector4,
  Plane,
  PerspectiveCamera,
  FloatType,
  NearestFilter,
  UnsignedByteType,
  DataUtils,
  RedFormat,
  HalfFloatType,
} from "three";
const GLYPH_PLACEMENT = {
  cx: 0.5,
  cy: 0.6,
  r: 1.7,
  planeW: 4,
  planeH: 8,
};
const FIELD_DOMAIN = 1.4;
const FIELD_SIZE = 512;
const MAX_DISTANCE = 0.55;
const SYMBOL_URL = new URL("/assets/nori-symbol-D23r1Qw5.json", import.meta.url)
  .href;
function symbolToUv([t, e], n = GLYPH_PLACEMENT) {
  return [n.cx + (t * n.r) / n.planeW, n.cy + (e * n.r) / n.planeH];
}
const PETAL_ORDER = ["TL", "TR", "BR", "BL"];
function distanceSquared(t, e, n, r) {
  const i = t - n,
    s = e - r;
  return i * i + s * s;
}
function rotateOutline(t) {
  let e = 0,
    n = 1 / 0;
  for (let r = 0; r < t.length; r++) {
    const i = distanceSquared(t[r][0], t[r][1], 0, 0);
    i < n && ((n = i), (e = r));
  }
  return t.slice(e).concat(t.slice(0, e));
}
function buildStroke(t) {
  const e = Object.fromEntries(t.map((c) => [c.label, c])),
    n = [];
  for (const c of PETAL_ORDER) {
    const u = e[c];
    if (!u) continue;
    const d = rotateOutline(u.outline);
    (d.push([d[0][0], d[0][1]]), n.push(d));
  }
  let r = 0;
  for (const c of n)
    for (let u = 1; u < c.length; u++)
      r += Math.hypot(c[u][0] - c[u - 1][0], c[u][1] - c[u - 1][1]);
  r = r || 1;
  const i = [],
    s = [],
    o = [],
    a = [];
  let l = 0;
  for (const c of n)
    for (let u = 0; u < c.length; u++)
      if ((i.push(c[u]), s.push(l / r), o.push(u === 0), u < c.length - 1)) {
        const d = Math.hypot(c[u + 1][0] - c[u][0], c[u + 1][1] - c[u][1]);
        (a.push({
          a: c[u],
          b: c[u + 1],
          len: d,
          cum: l,
        }),
          (l += d));
      }
  return {
    pts: i,
    seg: a,
    total: r,
    sAt: s,
    cut: o,
  };
}
function insidePolygon(t, e, n) {
  let r = !1;
  for (let i = 0, s = n.length - 1; i < n.length; s = i++) {
    const o = n[i][0],
      a = n[i][1],
      l = n[s][0],
      c = n[s][1];
    a > e != c > e && t < ((l - o) * (e - a)) / (c - a) + o && (r = !r);
  }
  return r;
}
const SDF_RANGE = 4;
const SDF_WIDTH = 1024;
const SDF_HEIGHT = 2048;
const DISTANCE_INFINITY = 1e20;
function distanceTransformLine(t, e, n, r, i, s, o) {
  ((s[0] = 0),
    (o[0] = -DISTANCE_INFINITY),
    (o[1] = DISTANCE_INFINITY),
    (i[0] = t[e]));
  for (let a = 1, l = 0, c = 0; a < r; a++) {
    i[a] = t[e + a * n];
    const u = a * a;
    do {
      const d = s[l];
      c = (i[a] - i[d] + u - d * d) / (a - d) / 2;
    } while (c <= o[l] && --l > -1);
    (l++, (s[l] = a), (o[l] = c), (o[l + 1] = DISTANCE_INFINITY));
  }
  for (let a = 0, l = 0; a < r; a++) {
    for (; o[l + 1] < a;) l++;
    const c = s[l];
    t[e + a * n] = i[c] + (a - c) * (a - c);
  }
}
function distanceTransform(t, e, n, r, i, s) {
  for (let o = 0; o < e; o++) distanceTransformLine(t, o, e, n, r, i, s);
  for (let o = 0; o < n; o++) distanceTransformLine(t, o * e, 1, e, r, i, s);
}
function buildSdf(t) {
  const e = SDF_WIDTH,
    n = SDF_HEIGHT,
    r = e * n,
    i = 4 / e,
    s = new Float64Array(r),
    o = new Float64Array(r);
  for (let h = 0; h < r; h++) {
    const _ = t[h];
    ((s[h] =
      _ <= 0
        ? DISTANCE_INFINITY
        : _ >= 1
          ? 0
          : 0.5 - _ > 0
            ? (0.5 - _) * (0.5 - _)
            : 0),
      (o[h] =
        _ >= 1
          ? DISTANCE_INFINITY
          : _ <= 0
            ? 0
            : _ - 0.5 > 0
              ? (_ - 0.5) * (_ - 0.5)
              : 0));
  }
  const a = Math.max(e, n) + 1,
    l = new Float64Array(a),
    c = new Int32Array(a),
    u = new Float64Array(a + 1);
  (distanceTransform(s, e, n, l, c, u), distanceTransform(o, e, n, l, c, u));
  const d = new Uint16Array(r);
  for (let h = 0; h < r; h++) {
    const _ = (Math.sqrt(s[h]) - Math.sqrt(o[h])) * i;
    d[h] = DataUtils.toHalfFloat(Math.max(-SDF_RANGE, Math.min(SDF_RANGE, _)));
  }
  const f = new DataTexture(d, e, n, RedFormat, HalfFloatType);
  return (
    (f.minFilter = LinearFilter),
    (f.magFilter = LinearFilter),
    (f.wrapS = f.wrapT = ClampToEdgeWrapping),
    (f.needsUpdate = !0),
    f
  );
}
function closestPoint(t, e, n, r, i) {
  if (r < 0 || r > e - 1 || i < 0 || i > n - 1) return 0;
  const s = Math.floor(r),
    o = Math.floor(i),
    a = Math.min(e - 1, s + 1),
    l = Math.min(n - 1, o + 1),
    c = r - s,
    u = i - o,
    d = t[(o * e + s) * 4 + 3],
    f = t[(o * e + a) * 4 + 3],
    h = t[(l * e + s) * 4 + 3],
    _ = t[(l * e + a) * 4 + 3];
  return (
    (d * (1 - c) * (1 - u) + f * c * (1 - u) + h * (1 - c) * u + _ * c * u) /
    255
  );
}
function sampleSegment(t) {
  const e = t.naturalWidth || t.width,
    n = t.naturalHeight || t.height,
    r = document.createElement("canvas");
  ((r.width = e), (r.height = n));
  const i = r.getContext("2d", {
    willReadFrequently: !0,
  });
  return (
    i.drawImage(t, 0, 0),
    {
      data: i.getImageData(0, 0, e, n).data,
      iw: e,
      ih: n,
    }
  );
}
function decodeSdf(t) {
  const { data: e, iw: n, ih: r } = sampleSegment(t),
    i = SDF_WIDTH,
    s = SDF_HEIGHT,
    o = GLYPH_PLACEMENT,
    a = new Float32Array(i * s);
  for (let l = 0; l < s; l++)
    for (let c = 0; c < i; c++) {
      const u = (c + 0.5) / i,
        d = (l + 0.5) / s,
        f = ((u - o.cx) * o.planeW) / o.r,
        h = ((d - o.cy) * o.planeH) / o.r;
      a[l * i + c] = closestPoint(
        e,
        n,
        r,
        ((f + 1) / 2) * n,
        ((1 - h) / 2) * r,
      );
    }
  return buildSdf(a);
}
function fallbackSdf(t) {
  const e = SDF_WIDTH,
    n = SDF_HEIGHT,
    r = GLYPH_PLACEMENT,
    i = new Float32Array(e * n);
  for (let s = 0; s < n; s++)
    for (let o = 0; o < e; o++) {
      const a = (o + 0.5) / e,
        l = (s + 0.5) / n,
        c = ((a - r.cx) * r.planeW) / r.r,
        u = ((l - r.cy) * r.planeH) / r.r;
      let d = 0;
      for (let f = 0; f < t.length; f++)
        if (insidePolygon(c, u, t[f].outline)) {
          d = 1;
          break;
        }
      i[s * e + o] = d;
    }
  return buildSdf(i);
}
const SDF_URL = new URL("/assets/nori-symbol-BIxbSJhJ.png", import.meta.url)
  .href;
function loadBinary(t, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const clean = () => {
      image.onload = image.onerror = null;
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      clean();
      image.src = "";
      reject(new DOMException("Cancelled", "AbortError"));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    image.onload = () => {
      clean();
      resolve(image);
    };
    image.onerror = () => {
      clean();
      reject(new Error("Glyph SDF image failed"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    image.src = t;
  });
}
function buildStrokeField(t, e) {
  const n = FIELD_SIZE,
    r = FIELD_DOMAIN,
    i = new Uint8Array(n * n * 4),
    s = e.map((l) => l.outline),
    { seg: o } = t;
  for (let l = 0; l < n; l++) {
    const c = ((l + 0.5) / n) * 2 * r - r;
    for (let u = 0; u < n; u++) {
      const d = ((u + 0.5) / n) * 2 * r - r;
      let f = 1 / 0,
        h = 0;
      for (let v = 0; v < o.length; v++) {
        const y = o[v];
        if (y.len < 1e-6) continue;
        const x = y.b[0] - y.a[0],
          w = y.b[1] - y.a[1];
        let S = ((d - y.a[0]) * x + (c - y.a[1]) * w) / (y.len * y.len);
        S = S < 0 ? 0 : S > 1 ? 1 : S;
        const T = y.a[0] + S * x,
          R = y.a[1] + S * w,
          E = distanceSquared(d, c, T, R);
        E < f && ((f = E), (h = (y.cum + S * y.len) / t.total));
      }
      const _ = Math.sqrt(f);
      let m = 0;
      for (let v = 0; v < 2; v++)
        for (let y = 0; y < 2; y++) {
          const x = d + (y - 0.5) * (r / n),
            w = c + (v - 0.5) * (r / n);
          let S = !1;
          for (let T = 0; T < s.length; T++)
            if (insidePolygon(x, w, s[T])) {
              S = !0;
              break;
            }
          S && (m += 0.25);
        }
      const p = (l * n + u) * 4;
      ((i[p] = Math.max(
        0,
        Math.min(255, Math.round((_ / MAX_DISTANCE) * 255)),
      )),
        (i[p + 1] = Math.max(0, Math.min(255, Math.round(h * 255)))),
        (i[p + 2] = Math.round(m * 255)),
        (i[p + 3] = 255));
    }
  }
  const a = new DataTexture(i, n, n, RGBAFormat, UnsignedByteType);
  return (
    (a.minFilter = LinearFilter),
    (a.magFilter = LinearFilter),
    (a.wrapS = a.wrapT = ClampToEdgeWrapping),
    (a.needsUpdate = !0),
    a
  );
}
function updateGlyphAntialiasing(t, e, n, r) {
  const o =
    (2 *
      (r
        ? Math.max(0.1, e.position.distanceTo(r))
        : Math.max(0.1, Math.abs(e.position.z))) *
      Math.tan((e.fov * Math.PI) / 180 / 2)) /
    Math.max(1, n);
  (t.uAAworld && (t.uAAworld.value = o),
    t.uAAsym && (t.uAAsym.value = o / GLYPH_PLACEMENT.r));
}
async function createGlyphKit(signal) {
  const response = await fetch(SYMBOL_URL, { signal });
  if (!response.ok) throw new Error("Glyph outline failed");
  const n = (await response.json()).petals,
    r = buildStroke(n),
    i = buildStrokeField(r, n);
  let s;
  try {
    s = decodeSdf(await loadBinary(SDF_URL, signal));
  } catch (error) {
    if (signal?.aborted) {
      i.dispose();
      throw error;
    }
    try {
      s = fallbackSdf(n);
    } catch (fallbackError) {
      i.dispose();
      throw fallbackError;
    }
  }
  if (signal?.aborted) {
    i.dispose();
    s.dispose();
    throw new DOMException("Cancelled", "AbortError");
  }
  const o = r.pts.map((l, c) => ({
      x: l[0],
      y: l[1],
      s: r.sAt[c],
      cut: r.cut[c],
    })),
    a = o.map((l) => {
      const [c, u] = symbolToUv([l.x, l.y]);
      return {
        x: c,
        y: u,
        s: l.s,
        cut: l.cut,
      };
    });
  return {
    fieldTex: i,
    cloverSdfTex: s,
    strokeSym: o,
    strokeUv: a,
    placement: GLYPH_PLACEMENT,
    domain: FIELD_DOMAIN,
    applyUniforms(l) {
      (l.uField && (l.uField.value = i),
        l.uCloverSDF && (l.uCloverSDF.value = s));
    },
  };
}
const FXAA_SHADER = {
  uniforms: {
    tDiffuse: {
      value: null,
    },
    resolution: {
      value: new Vector2(1 / 1024, 1 / 512),
    },
  },
  vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
  fragmentShader: `

		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		varying vec2 vUv;

		#define EDGE_STEP_COUNT 6
		#define EDGE_GUESS 8.0
		#define EDGE_STEPS 1.0, 1.5, 2.0, 2.0, 2.0, 4.0
		const float edgeSteps[EDGE_STEP_COUNT] = float[EDGE_STEP_COUNT]( EDGE_STEPS );

		float _ContrastThreshold = 0.0312;
		float _RelativeThreshold = 0.063;
		float _SubpixelBlending = 1.0;

		vec4 Sample( sampler2D  tex2D, vec2 uv ) {

			return texture( tex2D, uv );

		}

		float SampleLuminance( sampler2D tex2D, vec2 uv ) {

			return dot( Sample( tex2D, uv ).rgb, vec3( 0.3, 0.59, 0.11 ) );

		}

		float SampleLuminance( sampler2D tex2D, vec2 texSize, vec2 uv, float uOffset, float vOffset ) {

			uv += texSize * vec2(uOffset, vOffset);
			return SampleLuminance(tex2D, uv);

		}

		struct LuminanceData {

			float m, n, e, s, w;
			float ne, nw, se, sw;
			float highest, lowest, contrast;

		};

		LuminanceData SampleLuminanceNeighborhood( sampler2D tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData l;
			l.m = SampleLuminance( tex2D, uv );
			l.n = SampleLuminance( tex2D, texSize, uv,  0.0,  1.0 );
			l.e = SampleLuminance( tex2D, texSize, uv,  1.0,  0.0 );
			l.s = SampleLuminance( tex2D, texSize, uv,  0.0, -1.0 );
			l.w = SampleLuminance( tex2D, texSize, uv, -1.0,  0.0 );

			l.ne = SampleLuminance( tex2D, texSize, uv,  1.0,  1.0 );
			l.nw = SampleLuminance( tex2D, texSize, uv, -1.0,  1.0 );
			l.se = SampleLuminance( tex2D, texSize, uv,  1.0, -1.0 );
			l.sw = SampleLuminance( tex2D, texSize, uv, -1.0, -1.0 );

			l.highest = max( max( max( max( l.n, l.e ), l.s ), l.w ), l.m );
			l.lowest = min( min( min( min( l.n, l.e ), l.s ), l.w ), l.m );
			l.contrast = l.highest - l.lowest;
			return l;

		}

		bool ShouldSkipPixel( LuminanceData l ) {

			float threshold = max( _ContrastThreshold, _RelativeThreshold * l.highest );
			return l.contrast < threshold;

		}

		float DeterminePixelBlendFactor( LuminanceData l ) {

			float f = 2.0 * ( l.n + l.e + l.s + l.w );
			f += l.ne + l.nw + l.se + l.sw;
			f *= 1.0 / 12.0;
			f = abs( f - l.m );
			f = clamp( f / l.contrast, 0.0, 1.0 );

			float blendFactor = smoothstep( 0.0, 1.0, f );
			return blendFactor * blendFactor * _SubpixelBlending;

		}

		struct EdgeData {

			bool isHorizontal;
			float pixelStep;
			float oppositeLuminance, gradient;

		};

		EdgeData DetermineEdge( vec2 texSize, LuminanceData l ) {

			EdgeData e;
			float horizontal =
				abs( l.n + l.s - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.se - 2.0 * l.e ) +
				abs( l.nw + l.sw - 2.0 * l.w );
			float vertical =
				abs( l.e + l.w - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.nw - 2.0 * l.n ) +
				abs( l.se + l.sw - 2.0 * l.s );
			e.isHorizontal = horizontal >= vertical;

			float pLuminance = e.isHorizontal ? l.n : l.e;
			float nLuminance = e.isHorizontal ? l.s : l.w;
			float pGradient = abs( pLuminance - l.m );
			float nGradient = abs( nLuminance - l.m );

			e.pixelStep = e.isHorizontal ? texSize.y : texSize.x;

			if (pGradient < nGradient) {

				e.pixelStep = -e.pixelStep;
				e.oppositeLuminance = nLuminance;
				e.gradient = nGradient;

			} else {

				e.oppositeLuminance = pLuminance;
				e.gradient = pGradient;

			}

			return e;

		}

		float DetermineEdgeBlendFactor( sampler2D  tex2D, vec2 texSize, LuminanceData l, EdgeData e, vec2 uv ) {

			vec2 uvEdge = uv;
			vec2 edgeStep;
			if (e.isHorizontal) {

				uvEdge.y += e.pixelStep * 0.5;
				edgeStep = vec2( texSize.x, 0.0 );

			} else {

				uvEdge.x += e.pixelStep * 0.5;
				edgeStep = vec2( 0.0, texSize.y );

			}

			float edgeLuminance = ( l.m + e.oppositeLuminance ) * 0.5;
			float gradientThreshold = e.gradient * 0.25;

			vec2 puv = uvEdge + edgeStep * edgeSteps[0];
			float pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
			bool pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !pAtEnd; i++ ) {

				puv += edgeStep * edgeSteps[i];
				pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
				pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			}

			if ( !pAtEnd ) {

				puv += edgeStep * EDGE_GUESS;

			}

			vec2 nuv = uvEdge - edgeStep * edgeSteps[0];
			float nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
			bool nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !nAtEnd; i++ ) {

				nuv -= edgeStep * edgeSteps[i];
				nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
				nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			}

			if ( !nAtEnd ) {

				nuv -= edgeStep * EDGE_GUESS;

			}

			float pDistance, nDistance;
			if ( e.isHorizontal ) {

				pDistance = puv.x - uv.x;
				nDistance = uv.x - nuv.x;

			} else {

				pDistance = puv.y - uv.y;
				nDistance = uv.y - nuv.y;

			}

			float shortestDistance;
			bool deltaSign;
			if ( pDistance <= nDistance ) {

				shortestDistance = pDistance;
				deltaSign = pLuminanceDelta >= 0.0;

			} else {

				shortestDistance = nDistance;
				deltaSign = nLuminanceDelta >= 0.0;

			}

			if ( deltaSign == ( l.m - edgeLuminance >= 0.0 ) ) {

				return 0.0;

			}

			return 0.5 - shortestDistance / ( pDistance + nDistance );

		}

		vec4 ApplyFXAA( sampler2D  tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
			if ( ShouldSkipPixel( luminance ) ) {

				return Sample( tex2D, uv );

			}

			float pixelBlend = DeterminePixelBlendFactor( luminance );
			EdgeData edge = DetermineEdge( texSize, luminance );
			float edgeBlend = DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv );
			float finalBlend = max( pixelBlend, edgeBlend );

			if (edge.isHorizontal) {

				uv.y += edge.pixelStep * finalBlend;

			} else {

				uv.x += edge.pixelStep * finalBlend;

			}

			return Sample( tex2D, uv );

		}

		void main() {

			gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );

		}`,
};
const GODRAY_VERTEX = `#define GLSLIFY 1
attribute float aOffset;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vOffset;

void main () {
    vUv = uv;
	vOffset = aOffset;
	vWorldPosition = (modelMatrix * vec4( position, 1 )).xyz;
	vec4 mvPosition = projectionMatrix * modelViewMatrix * vec4( position, 1 );
    gl_Position = mvPosition;
}`;
const GODRAY_BASE_FRAGMENT = `#define GLSLIFY 1
vec4 fog(float fogNear, float fogFar, float fogDepth, vec3 fogNearColor, vec3 fogFarColor) {
	float fogFactor = smoothstep(fogNear, fogFar, fogDepth);
	return vec4(mix( gl_FragColor.rgb, mix(fogNearColor, fogFarColor, fogFactor), fogFactor ), gl_FragColor.a);
}

varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vOffset;

uniform sampler2D uNoiseTexture;
uniform float uTime;
uniform vec2 uDirection;
uniform float uStrength;
uniform float uLength;
uniform float uFadeSmoothness;
uniform float uScale;
uniform float uSpeed;
uniform vec3 uLightColor;
uniform float fogNear;
uniform float fogFar;

const vec2 lengthDirection = vec2(0., -1.);
const vec2 center = vec2(0.5);

void main() {
	vec2 worldPos = vWorldPosition.xy * 0.1;
	vec2 godRayOrigin = worldPos + uDirection;
    float uvDirection = atan(godRayOrigin.y, godRayOrigin.x);
	uvDirection *= uScale * clamp(0.75, 1., (0.5 + vOffset));

	float noise1 = texture2D(uNoiseTexture, vec2(uvDirection - uTime * 0.01)).r;
	float noise2 = texture2D(uNoiseTexture, vec2(uvDirection + vOffset * 5.2734 + uTime * 0.05 * uSpeed, uvDirection) * 1.5).g;
	float alpha = min(noise1, noise2);

	vec2 v2 = normalize(lengthDirection);
    float d = v2.x * center.x + v2.y * center.y;
	float length = uLength - cameraPosition.y * 0.005;
	alpha *= (1.0 - smoothstep(-uFadeSmoothness, 0.0, v2.x * vUv.x + v2.y * vUv.y - (d - 0.5 + length * (1. + uFadeSmoothness))));

	alpha *= uStrength;

	gl_FragColor = vec4(uLightColor, alpha);

	gl_FragColor.a *= smoothstep(0., 5., cameraPosition.z - 2.5 - vWorldPosition.z);

	float fogDepth = gl_FragCoord.z / gl_FragCoord.w;
	float fogFactor = smoothstep(fogNear, fogFar, fogDepth);
	gl_FragColor.a = mix(gl_FragColor.a, 0., fogFactor);
}`;
const DUST_VERTEX = `#define GLSLIFY 1
attribute float aID;
attribute float aUVID;
attribute vec3 aPosition;

varying float vRotation;
varying float vBlur;
varying vec2 vUV1;
varying vec2 vUV2;
varying float vMix;
varying float vOpacity;

uniform float uTime;
uniform vec3 uBounds;

const vec2 spriteSize = vec2(8);

float n11(float p) {
    return fract(97531.2468 * sin(24680.135 * p));
}

vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

vec2 rotate2d(vec2 uv, float a) {
    float sinTheta = sin(a);
    float cosTheta = cos(a);
    uv = mat2(cosTheta, -sinTheta, sinTheta, cosTheta) * uv;
    return uv;
}

void main () {
	vec3 objectNormal = vec3(normal);
	vec3 transformedNormal = objectNormal;

	mat3 m = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
	transformedNormal = m * transformedNormal;

	vec4 worldPosition = vec4( position, 1.0 );
	worldPosition = instanceMatrix * worldPosition;

	vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 billboardPos = right * position.x + up * position.y;

    vec4 mvPosition = vec4( billboardPos, 1.0 );

	mvPosition = instanceMatrix * mvPosition;
	vec3 instancedPosition = mvPosition.xyz;

	// sway movement
	float posNoise = noise(vec3(aPosition * 0.5) + vec3(uTime * 0.1, uTime * 0.2, uTime * 0.3)) * 0.1;

	// loop xyz with camera
	mvPosition.xyz += mod(aPosition - cameraPosition + posNoise, uBounds);

	mvPosition = modelViewMatrix * mvPosition;

	vec2 spriteSizeMinus1 = spriteSize - 1.0;
    float blurLevel = spriteSizeMinus1.y * smoothstep(0., 10.0, abs(-mvPosition.z - 6.0));
    vBlur = blurLevel;
    vec4 offsets = vec4(vec2(aUVID, spriteSizeMinus1.y - floor(blurLevel)), vec2(aUVID, spriteSizeMinus1.y - ceil(blurLevel)));
    vUV1 = (uv + offsets.xy) / spriteSize;
    vUV2 = (uv + offsets.zw) / spriteSize;
    vMix = fract(blurLevel);

	float rand = n11(aID);
    vec3 positionRotated = instancedPosition.xyz;
    vRotation = (0.45 - rand) * uTime + 21.0 * aID;
    positionRotated.xy = rotate2d(positionRotated.xy, vRotation);
    mvPosition.xyz += positionRotated;

	gl_Position = projectionMatrix * mvPosition;

	vOpacity = smoothstep(0.1, 0.3, -mvPosition.z) * 0.8;
}`;
const DUST_FRAGMENT_BASE = `#define GLSLIFY 1
varying float vRotation;
varying float vBlur;
varying vec2 vUV1;
varying vec2 vUV2;
varying float vMix;
varying float vOpacity;

uniform sampler2D uTexture;
uniform vec3 uColor;

vec2 rotate2d(vec2 uv, float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a)) * uv;
}

void main() {
	vec4 dust1 = texture2D(uTexture, vUV1);
    vec4 dust2 = texture2D(uTexture, vUV2);
    vec4 dust = mix(dust1, dust2, vMix);
    vec3 normal = vec3(dust.rg * 2.0 - 1.0, 0.0);
    
    normal.xy = rotate2d(normal.xy, 3.1415926 - vRotation);
    normal.z = sqrt(1.0 - normal.x * normal.x - normal.y * normal.y);
    normal = normalize(normal);
    vec3 lightPosition = vec3(1.0, -5., 1.);
    float light = max(0.0, dot(normal, normalize(lightPosition))) * 4.;
    
    float alpha = dust.b / (1.0 + vBlur * 1.0);
    gl_FragColor = vec4(uColor, alpha * light * vOpacity);
}`;
const WATER_VERTEX = `#define GLSLIFY 1
varying vec2 vUv;
varying vec4 vPosition;
// varying vec3 vWorldPosition;
varying float fogDepth;
varying vec4 vMirrorCoord;
varying vec4 vWorldPosition;

uniform float uTime;
uniform mat4 uTextureMatrix;

void main () {
    vUv = uv;
	vec3 transformedPosition = position;

	vWorldPosition.xyz = (modelMatrix * vec4(transformedPosition, 1.0)).xyz;
	transformedPosition.z += cos((vWorldPosition.z - vWorldPosition.x) * -0.4 + uTime * 0.5) * 0.08;
	// transformedPosition.z += cos(vWorldPosition.x * 2. + uTime * 0.5) * 0.04;

	vMirrorCoord = modelMatrix * vec4( transformedPosition, 1.0 );
	vWorldPosition = vMirrorCoord.xyzw;
	vMirrorCoord = uTextureMatrix * vMirrorCoord;

	vec4 mvPosition = vec4( transformedPosition, 1.0 );
	mvPosition = modelViewMatrix * mvPosition;
	gl_Position = projectionMatrix * mvPosition;

	vPosition = vec4(position, 1.);
	fogDepth = -mvPosition.z;
}`;
const WATER_BASE_FRAGMENT = `#define GLSLIFY 1
vec4 fog(float fogNear, float fogFar, float fogDepth, vec3 fogNearColor, vec3 fogFarColor) {
	float fogFactor = smoothstep(fogNear, fogFar, fogDepth);
	return vec4(mix( gl_FragColor.rgb, mix(fogNearColor, fogFarColor, fogFactor), fogFactor ), gl_FragColor.a);
}

varying vec4 vMirrorCoord;
varying vec4 vWorldPosition;
varying float fogDepth;

uniform vec3 uColor;
uniform sampler2D uNormalTexture;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform float uShine;
uniform float uDiffuse;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uReflectionDistortion;
uniform float uReflectionStrength;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform vec3 fogFarColor;
uniform vec3 fogNearColor;
uniform float fogNear;
uniform float fogFar;

vec4 getNoise( vec2 uv, float time ) {
	vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
	vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
	vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
	vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
	vec4 noise = texture2D( uNormalTexture, uv0 ) +
		texture2D( uNormalTexture, uv1 ) +
		texture2D( uNormalTexture, uv2 ) +
		texture2D( uNormalTexture, uv3 );
	return noise * 0.5 - 1.0;
}

void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
	vec3 reflection = normalize( reflect( -uLightPos, surfaceNormal ) );
	float direction = max( 0.0, dot( eyeDirection, reflection ) );
	specularColor += pow( direction, shiny ) * uLightColor * spec;
	diffuseColor += max( dot( uLightPos, surfaceNormal ), 0.0 ) * uLightColor * diffuse;
}

void main() {
	vec3 baseColor = uColor;

	vec4 noise = getNoise( vWorldPosition.xz * uNoiseScale, (uTime + 100.) * uNoiseSpeed );
	vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

	vec3 diffuseLight = uDiffuseColor;
	vec3 specularLight = uSpecularColor;

	vec3 worldToEye = vec3(0)-vWorldPosition.xyz;
	vec3 eyeDirection = normalize( worldToEye );
	sunLight( surfaceNormal, eyeDirection, uShine, uLightIntensity, uDiffuse, diffuseLight, specularLight );

	float distance = length(worldToEye);

	vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * uReflectionDistortion;
	vec3 reflectionSample = vec3( texture2D( uTexture, vMirrorCoord.xy / vMirrorCoord.w + distortion ) ) * uReflectionStrength;

	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
	float rf0 = 0.3;
	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
	vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * baseColor;
	vec3 albedo = mix( ( uLightColor * diffuseLight * 0.3 + scatter ), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
	vec3 outgoingLight = albedo;
	gl_FragColor = vec4( outgoingLight, 1. );

	gl_FragColor = fog(fogNear, fogFar, fogDepth, fogNearColor, fogFarColor);
}`;
const FULLSCREEN_UV_VERTEX = `#define GLSLIFY 1
varying vec2 vUv;

void main () {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1 );
}`;
const OCEAN_COMPOSITE_BASE_FRAGMENT = `#define GLSLIFY 1
vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}

varying vec2 vUv;

uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uOpacity;
uniform bool uEnableBlur;
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform vec2 uResolution;
uniform sampler2D tDiffuse;
uniform sampler2D uHUDTexture;
uniform sampler2D uBloom;        // pre-blurred bright-pass (cold-open glow)
uniform float uBloomStrength;    // 0 = no bloom (the desktop never runs this pass)
uniform vec3 uSeaTint;           // deep-water teal body lift
uniform float uSeaTintAmt;       // 0 = none → fills the dark void with graded teal

void main() {
	vec2 uv = vUv;

    vec4 sceneColor = texture2D(tDiffuse, vUv);
	vec4 blurredScene = sceneColor;

	if (uEnableBlur) {
		float blurAmount = 1.5;
		vec4 sceneColorBlur1 = blur9(tDiffuse, uv, uResolution, vec2(blurAmount, -blurAmount)) * 0.5;
		vec4 sceneColorBlur2 = blur9(tDiffuse, uv, uResolution, vec2(-blurAmount, blurAmount)) * 0.5;
		blurredScene = sceneColorBlur1 + sceneColorBlur2;
	}

	vec2 centered = uv - vec2(0.5);
    vec4 finalColor = vec4(mix(uBottomColor, uTopColor, vUv.y), 1.);
	float vignette = smoothstep(uInnerRadius, uOuterRadius, length(centered));

	sceneColor = mix(sceneColor, blurredScene, vignette);

    finalColor *= vignette;
    finalColor = mix(sceneColor, finalColor, vignette * uOpacity);

	// Deep-water TEAL body: lift the dark void toward graded teal (brighter up-frame),
	// only where the scene is dark, so the empty water reads as a lit medium not black.
	// A faint radial falloff keeps the centre richer than the corners.
	float voidLum = dot(finalColor.rgb, vec3(0.299, 0.587, 0.114));
	float fillMask = (1.0 - smoothstep(0.0, 0.16, voidLum)) * (0.5 + 0.5 * vUv.y);
	finalColor.rgb += uSeaTint * uSeaTintAmt * fillMask;

	// Additive BLOOM glow (cold-open only): bright morph/glyph/plankton bleed soft light.
	finalColor.rgb += texture2D(uBloom, uv).rgb * uBloomStrength;

	vec4 hud = texture2D(uHUDTexture, uv);
	finalColor = mix(finalColor, hud, hud.a);

	gl_FragColor = finalColor;
}`;
const BLOOM_EXTRACT_FRAGMENT = `#define GLSLIFY 1
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float uThreshold;
uniform float uKnee;
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  float w = smoothstep(uThreshold, uThreshold + uKnee, l);
  gl_FragColor = vec4(c * w, 1.0);
}`;
const BLOOM_BLUR_FRAGMENT = `#define GLSLIFY 1
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform vec2 uDirection;
vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}
void main() {
  gl_FragColor = blur9(tDiffuse, vUv, uResolution, uDirection);
}`;
const GODRAY_POSITIONS = [
  [0, -10],
  [-0.002, -16.902],
  [0.302, -23.797],
  [0.745, -30.672],
  [1.489, -37.523],
  [2.484, -44.298],
  [3.537, -51.184],
  [4.555, -58.017],
  [5.532, -64.857],
  [6.207, -71.554],
  [6.498, -78.592],
  [6.428, -85.514],
  [5.974, -92.366],
  [5.32, -99.268],
  [4.475, -106.115],
  [3.387, -113.005],
  [2.261, -119.797],
  [1.149, -126.576],
  [0.136, -132.754],
  [-1.146, -139.921],
  [-2.291, -146.701],
  [-3.19, -153.295],
  [-3.963, -160.162],
  [-4.517, -166.843],
  [-4.752, -173.678],
  [-4.731, -180.498],
  [-4.415, -187.215],
  [-3.82, -194.129],
  [-3.118, -200.941],
  [-2.398, -207.802],
  [-1.677, -214.667],
  [-0.956, -221.533],
  [-0.235, -228.406],
  [0.487, -235.236],
  [1.202, -242.13],
  [1.661, -249.028],
  [2.09, -255.825],
  [2.514, -262.546],
  [2.951, -269.469],
  [3.383, -276.315],
  [3.814, -283.146],
  [4.256, -290.069],
  [4.548, -297],
  [4.663, -303.903],
  [4.661, -310.79],
  [4.677, -317.694],
  [4.278, -324.575],
  [3.236, -331.409],
  [1.882, -338.178],
  [0.415, -344.924],
  [-0.778, -351.71],
  [-1.518, -358.579],
  [-1.495, -365.46],
  [-1.449, -372.355],
  [-0.625, -379.431],
  [2.229, -385.436],
  [6.599, -390.735],
  [11.649, -395.454],
  [16.718, -400.232],
  [21.621, -405],
  [25.739, -410.533],
  [28.093, -416.951],
  [29.724, -423.661],
];
const GODRAY_Y = -25;
const GODRAY_SCALE = 100;
const linearColor = (t) => new Color().setHex(t, LinearSRGBColorSpace);
const OCEAN_FOG = {
  near: 2,
  far: 19,
  nearColor: 1128043,
  farColor: 598854,
};
const fogUniforms = (t) => ({
  fogNear: {
    value: t.near,
  },
  fogFar: {
    value: t.far,
  },
  fogNearColor: {
    value: linearColor(t.nearColor),
  },
  fogFarColor: {
    value: linearColor(t.farColor),
  },
});
const OCEAN_POSITION = new Vector3(0, 89.6, 51);
const oceanAsset = (t) => `/ocean/${t}`;
const OCEAN_OPACITY = 0.5;
const OCEAN_COMPOSITE_FRAGMENT = OCEAN_COMPOSITE_BASE_FRAGMENT.replace(
  "uniform sampler2D uHUDTexture;",
  `uniform sampler2D uHUDTexture;
uniform float uDim;
uniform float uBlur;`,
)
  .replace("gl_FragColor = finalColor;", "gl_FragColor = finalColor * uDim;")
  .replace("float blurAmount = 1.5;", "float blurAmount = uBlur;");
const DUST_FRAGMENT = DUST_FRAGMENT_BASE.replace(
  "uniform vec3 uColor;",
  `uniform vec3 uColor;
uniform float uFade;`,
).replace("alpha * light * vOpacity)", "alpha * light * vOpacity * uFade)");
const GODRAY_FRAGMENT = GODRAY_BASE_FRAGMENT.replace(
  "float length = uLength - cameraPosition.y * 0.005;",
  `float length = uLength - (cameraPosition.y - ${OCEAN_POSITION.y}) * 0.005;`,
);
const WATER_FRAGMENT = WATER_BASE_FRAGMENT.replace(
  "vec3 worldToEye = vec3(0)-vWorldPosition.xyz;",
  "vec3 worldToEye = cameraPosition - vWorldPosition.xyz;",
);
const TILT_SHIFT_FRAGMENT = `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  uniform float blur;
  uniform float taper;
  uniform vec2 start;
  uniform vec2 end;
  uniform vec2 direction;
  uniform int samples;
  varying vec2 vUv;
  float random(vec3 scale, float seed){
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
  }
  void main(){
    vec2 uv = vUv;
    vec4 color = vec4(0.0);
    float total = 0.0;
    vec2 startPixel = vec2(start.x * resolution.x, start.y * resolution.y);
    vec2 endPixel   = vec2(end.x * resolution.x, end.y * resolution.y);
    float f_samples = float(samples);
    float half_samples = f_samples / 2.0;
    float maxScreenDistance = distance(vec2(0.0), resolution);
    float gradientRadius = taper * maxScreenDistance;
    float blurRadius = blur * (maxScreenDistance / 16.0);
    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
    vec2 normal = normalize(vec2(startPixel.y - endPixel.y, endPixel.x - startPixel.x));
    float radius = smoothstep(0.0, 1.0, abs(dot(uv * resolution - startPixel, normal)) / gradientRadius) * blurRadius;
    for (int i = 0; i <= 100; i++){
      if (i >= samples) break;
      float s_i = -half_samples + float(i);
      float percent = (s_i + offset - 0.5) / half_samples;
      float weight = 1.0 - abs(percent);
      vec4 sample_i = texture2D(tDiffuse, uv + normalize(direction) / resolution * percent * radius);
      sample_i.rgb *= sample_i.a;
      color += sample_i * weight;
      total += weight;
    }
    vec4 outc = color / total;
    outc.rgb /= outc.a + 0.00001;
    gl_FragColor = outc;
  }
`;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const randomRange = (t, e) => t + Math.random() * (e - t);
function createOceanStage(scene, renderer, camera) {
  const textures = new Set();
  let failed = false;
  const timeUniform = {
      value: 0,
    },
    group = new Group();
  (group.position.copy(OCEAN_POSITION), scene.add(group));
  let ready = !1,
    disposed = !1,
    active = !1;
  const surfaceColor = linearColor(598854),
    fogFarColor = linearColor(OCEAN_FOG.farColor),
    fogNearColor = linearColor(OCEAN_FOG.nearColor),
    depthColor = linearColor(66309),
    backgroundColor = linearColor(598854),
    previousBackground = scene.background;
  let godrayMaterial = null;
  const godrays = [];
  let dustMesh = null,
    dustMaterial = null,
    waterMesh = null,
    waterMaterial = null,
    reflectionTarget = null,
    sceneTarget = null,
    compositeTarget = null,
    aaTarget = null,
    compositeMaterial = null,
    aaMaterial = null,
    tiltMaterial = null,
    fallbackTexture = null,
    oceanFade = 1,
    quad = null,
    bloomTarget = null,
    bloomScratch = null,
    bloomExtract = null,
    bloomBlur = null;
  const postScene = new Scene(),
    postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1),
    reflectionMatrix = new Matrix4(),
    bufferSize = new Vector2();
  let bufferWidth = 0,
    bufferHeight = 0;
  const loader = new TextureLoader(),
    loadTexture = async (me, j, B = !0) => {
      const fe = await loader.loadAsync(oceanAsset(me));
      if (disposed) {
        fe.dispose();
        throw new DOMException("Cancelled", "AbortError");
      }
      textures.add(fe);
      return (
        (fe.wrapS = fe.wrapT = j),
        (fe.minFilter = LinearFilter),
        (fe.magFilter = LinearFilter),
        (fe.generateMipmaps = !1),
        (fe.colorSpace = NoColorSpace),
        (fe.flipY = B),
        (fe.needsUpdate = !0),
        fe
      );
    },
    createGodrays = (me) => {
      godrayMaterial = new ShaderMaterial({
        vertexShader: GODRAY_VERTEX,
        fragmentShader: GODRAY_FRAGMENT,
        transparent: !0,
        depthTest: !1,
        depthWrite: !0,
        blending: AdditiveBlending,
        uniforms: {
          uTime: timeUniform,
          uNoiseTexture: {
            value: me,
          },
          ...fogUniforms(OCEAN_FOG),
          uDirection: {
            value: new Vector2(-0.4, -2.24),
          },
          uStrength: {
            value: 1.35,
          },
          uLength: {
            value: 0.25,
          },
          uFadeSmoothness: {
            value: 0.04,
          },
          uScale: {
            value: 0.9,
          },
          uSpeed: {
            value: 0.29,
          },
          uLightColor: {
            value: linearColor(4718591),
          },
        },
      });
      const j = new PlaneGeometry(1, 1),
        B = 0.37;
      for (const [fe, be] of GODRAY_POSITIONS) {
        const Pe = j.clone();
        Pe.setAttribute(
          "aOffset",
          new BufferAttribute(new Float32Array([B, B, B, B]), 1),
        );
        const re = new Mesh(Pe, godrayMaterial);
        (re.position.set(fe, GODRAY_Y, be),
          re.scale.set(GODRAY_SCALE, GODRAY_SCALE, 1),
          (re.renderOrder = 0),
          (re.frustumCulled = !0),
          (re.visible = !1),
          group.add(re),
          godrays.push(re));
      }
      j.dispose();
    },
    createDust = (me) => {
      const Pe = new PlaneGeometry(0.8, 0.8),
        re = new InstancedBufferGeometry();
      ((re.index = Pe.index),
        (re.attributes.position = Pe.attributes.position),
        (re.attributes.normal = Pe.attributes.normal),
        (re.attributes.uv = Pe.attributes.uv));
      const ue = new Float32Array(2e3),
        de = new Float32Array(2e3),
        Y = new Float32Array(2e3 * 3);
      for (let ce = 0; ce < 2e3; ce++)
        ((ue[ce] = ce + 1),
          (de[ce] = ce % 8),
          (Y[ce * 3] = randomRange(-7 / 2, 7 / 2)),
          (Y[ce * 3 + 1] = randomRange(-4 / 2, 4 / 2)),
          (Y[ce * 3 + 2] = randomRange(-10 / 2, 10 / 2)));
      (re.setAttribute("aID", new InstancedBufferAttribute(ue, 1)),
        re.setAttribute("aUVID", new InstancedBufferAttribute(de, 1)),
        re.setAttribute("aPosition", new InstancedBufferAttribute(Y, 3)),
        (re.instanceCount = 2e3),
        (dustMaterial = new ShaderMaterial({
          vertexShader: DUST_VERTEX,
          fragmentShader: DUST_FRAGMENT,
          transparent: !0,
          depthTest: !0,
          depthWrite: !1,
          blending: NormalBlending,
          uniforms: {
            uTime: timeUniform,
            uTexture: {
              value: me,
            },
            uColor: {
              value: linearColor(2002354),
            },
            uFade: {
              value: 1,
            },
            uBounds: {
              value: new Vector3(7, 4, 10),
            },
            fogNear: {
              value: 0,
            },
            fogFar: {
              value: 1,
            },
            fogNearColor: {
              value: linearColor(16777215),
            },
            fogFarColor: {
              value: linearColor(16777215),
            },
          },
        })),
        (dustMesh = new InstancedMesh(re, dustMaterial, 2e3)));
      const ge = new Matrix4().makeScale(0.02, 0.02, 0.02);
      for (let ce = 0; ce < 2e3; ce++) dustMesh.setMatrixAt(ce, ge);
      ((dustMesh.instanceMatrix.needsUpdate = !0),
        (dustMesh.renderOrder = 100),
        (dustMesh.frustumCulled = !1),
        (dustMesh.visible = !1));
      const q = dustMesh;
      ((dustMesh.onBeforeRender = () => {
        q.position.set(
          camera.position.x - 7 / 2,
          camera.position.y - 4 / 2,
          camera.position.z - 10,
        );
      }),
        scene.add(dustMesh));
    },
    createWater = (me) => {
      const j = new PlaneGeometry(1, 1, 50, 50);
      ((reflectionTarget = new WebGLRenderTarget(800, 450, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
      })),
        (waterMaterial = new ShaderMaterial({
          vertexShader: WATER_VERTEX,
          fragmentShader: WATER_FRAGMENT,
          transparent: !1,
          depthTest: !0,
          depthWrite: !0,
          side: FrontSide,
          blending: NormalBlending,
          uniforms: {
            uTime: timeUniform,
            uNormalTexture: {
              value: me,
            },
            uLightPos: {
              value: new Vector3(2.5, -4.7, -16.69),
            },
            uLightColor: {
              value: linearColor(16777215),
            },
            uLightIntensity: {
              value: 1,
            },
            uReflectionDistortion: {
              value: 1.15,
            },
            uColor: {
              value: linearColor(0),
            },
            uShine: {
              value: 150,
            },
            uDiffuse: {
              value: 0.5,
            },
            uDiffuseColor: {
              value: linearColor(2673148),
            },
            uSpecularColor: {
              value: linearColor(7394047),
            },
            uReflectionStrength: {
              value: 1,
            },
            uNoiseScale: {
              value: 25,
            },
            uNoiseSpeed: {
              value: 0.5,
            },
            ...fogUniforms(OCEAN_FOG),
            uTextureMatrix: {
              value: reflectionMatrix,
            },
            uTexture: {
              value: reflectionTarget.texture,
            },
          },
        })),
        (waterMesh = new Mesh(j, waterMaterial)),
        waterMesh.position.set(0, 1.4833, -250),
        waterMesh.quaternion.set(0.7071067811865475, 0, 0, 0.7071067811865476),
        waterMesh.scale.set(181.79122924804688, 500, 1),
        (waterMesh.renderOrder = 0),
        (waterMesh.visible = !1),
        group.add(waterMesh));
    },
    createPost = () => {
      (renderer.getDrawingBufferSize(bufferSize),
        (bufferWidth = Math.max(1, Math.round(bufferSize.x))),
        (bufferHeight = Math.max(1, Math.round(bufferSize.y))),
        (sceneTarget = new WebGLRenderTarget(bufferWidth, bufferHeight, {
          depthBuffer: !0,
        })),
        (compositeTarget = new WebGLRenderTarget(bufferWidth, bufferHeight)),
        (aaTarget = new WebGLRenderTarget(bufferWidth, bufferHeight)),
        (fallbackTexture = new DataTexture(
          new Uint8Array([0, 0, 0, 0]),
          1,
          1,
          RGBAFormat,
        )),
        (fallbackTexture.needsUpdate = !0),
        (compositeMaterial = new ShaderMaterial({
          vertexShader: FULLSCREEN_UV_VERTEX,
          fragmentShader: OCEAN_COMPOSITE_FRAGMENT,
          depthTest: !1,
          depthWrite: !1,
          uniforms: {
            tDiffuse: {
              value: sceneTarget.texture,
            },
            uHUDTexture: {
              value: fallbackTexture,
            },
            uInnerRadius: {
              value: 0.22,
            },
            uOuterRadius: {
              value: 0.7,
            },
            uOpacity: {
              value: OCEAN_OPACITY,
            },
            uEnableBlur: {
              value: !1,
            },
            uTopColor: {
              value: linearColor(2673148),
            },
            uBottomColor: {
              value: linearColor(67601),
            },
            uResolution: {
              value: new Vector2(bufferWidth, bufferHeight),
            },
            uDim: {
              value: 1,
            },
            uBlur: {
              value: 0,
            },
            uBloom: {
              value: fallbackTexture,
            },
            uBloomStrength: {
              value: 0,
            },
            uSeaTint: {
              value: linearColor(930628),
            },
            uSeaTintAmt: {
              value: 0,
            },
          },
        })));
      const me = Math.max(1, Math.round(bufferWidth / 2)),
        j = Math.max(1, Math.round(bufferHeight / 2));
      ((bloomTarget = new WebGLRenderTarget(me, j)),
        (bloomScratch = new WebGLRenderTarget(me, j)),
        (bloomExtract = new ShaderMaterial({
          vertexShader: FULLSCREEN_UV_VERTEX,
          fragmentShader: BLOOM_EXTRACT_FRAGMENT,
          depthTest: !1,
          depthWrite: !1,
          uniforms: {
            tDiffuse: {
              value: sceneTarget.texture,
            },
            uThreshold: {
              value: 0.5,
            },
            uKnee: {
              value: 0.35,
            },
          },
        })),
        (bloomBlur = new ShaderMaterial({
          vertexShader: FULLSCREEN_UV_VERTEX,
          fragmentShader: BLOOM_BLUR_FRAGMENT,
          depthTest: !1,
          depthWrite: !1,
          uniforms: {
            tDiffuse: {
              value: bloomTarget.texture,
            },
            uResolution: {
              value: new Vector2(me, j),
            },
            uDirection: {
              value: new Vector2(1, 0),
            },
          },
        })),
        (aaMaterial = new ShaderMaterial({
          vertexShader: FXAA_SHADER.vertexShader,
          fragmentShader: FXAA_SHADER.fragmentShader,
          uniforms: UniformsUtils.clone(FXAA_SHADER.uniforms),
          depthTest: !1,
          depthWrite: !1,
        })),
        (aaMaterial.uniforms.tDiffuse.value = compositeTarget.texture),
        aaMaterial.uniforms.resolution.value.set(
          1 / bufferWidth,
          1 / bufferHeight,
        ),
        (tiltMaterial = new ShaderMaterial({
          vertexShader: FULLSCREEN_UV_VERTEX,
          fragmentShader: TILT_SHIFT_FRAGMENT,
          depthTest: !1,
          depthWrite: !1,
          uniforms: {
            tDiffuse: {
              value: aaTarget.texture,
            },
            resolution: {
              value: new Vector2(bufferWidth, bufferHeight),
            },
            blur: {
              value: 0,
            },
            taper: {
              value: 1.25,
            },
            start: {
              value: new Vector2(0.5, 0),
            },
            end: {
              value: new Vector2(0.5, 1),
            },
            direction: {
              value: new Vector2(1, 1),
            },
            samples: {
              value: 10,
            },
          },
        })),
        (quad = new Mesh(new PlaneGeometry(2, 2), compositeMaterial)),
        postScene.add(quad));
    },
    resizePost = () => {
      if (!sceneTarget) return;
      renderer.getDrawingBufferSize(bufferSize);
      const me = Math.max(1, Math.round(bufferSize.x)),
        j = Math.max(1, Math.round(bufferSize.y));
      if (me === bufferWidth && j === bufferHeight) return;
      ((bufferWidth = me),
        (bufferHeight = j),
        sceneTarget.setSize(bufferWidth, bufferHeight),
        compositeTarget?.setSize(bufferWidth, bufferHeight),
        aaTarget?.setSize(bufferWidth, bufferHeight),
        reflectionTarget?.setSize(
          Math.round(bufferWidth / 2),
          Math.round(bufferHeight / 2),
        ),
        compositeMaterial?.uniforms.uResolution.value.set(
          bufferWidth,
          bufferHeight,
        ),
        aaMaterial?.uniforms.resolution.value.set(
          1 / bufferWidth,
          1 / bufferHeight,
        ),
        tiltMaterial?.uniforms.resolution.value.set(bufferWidth, bufferHeight));
      const B = Math.max(1, Math.round(bufferWidth / 2)),
        fe = Math.max(1, Math.round(bufferHeight / 2));
      (bloomTarget?.setSize(B, fe),
        bloomScratch?.setSize(B, fe),
        bloomBlur?.uniforms.uResolution.value.set(B, fe));
    };
  (async () => {
    const results = await Promise.allSettled([
      loadTexture("gradient-noise.jpg", RepeatWrapping),
      loadTexture("dust.jpg", ClampToEdgeWrapping),
      loadTexture("water-normal.png", RepeatWrapping, !0),
    ]);
    if (disposed) return;
    if (results.some((result) => result.status === "rejected"))
      throw new Error("Ocean textures failed");
    const [me, j, B] = results.map((result) => result.value);
    (createGodrays(me), createDust(j), createWater(B), createPost());
    try {
      (renderer.compile(scene, camera),
        compositeMaterial &&
          aaMaterial &&
          tiltMaterial &&
          (renderPass(compositeMaterial, compositeTarget),
          renderPass(aaMaterial, aaTarget),
          renderPass(tiltMaterial, compositeTarget),
          renderer.setRenderTarget(null)));
    } catch {}
    ready = !0;
  })().catch(() => {
    if (!disposed) {
      failed = true;
      dispose();
    }
  });
  const reflectionState = {
      rWorld: new Vector3(),
      cWorld: new Vector3(),
      rot: new Matrix4(),
      normal: new Vector3(),
      view: new Vector3(),
      target: new Vector3(),
      lookAt: new Vector3(),
      q: new Vector4(),
      clip: new Vector4(),
      plane: new Plane(),
      vcam: new PerspectiveCamera(),
    },
    renderReflection = () => {
      if (!waterMesh || !reflectionTarget || !waterMesh.visible) return;
      const me = reflectionState;
      if (
        (waterMesh.updateMatrixWorld(),
        camera.updateMatrixWorld(),
        me.rWorld.setFromMatrixPosition(waterMesh.matrixWorld),
        me.cWorld.setFromMatrixPosition(camera.matrixWorld),
        me.rot.extractRotation(waterMesh.matrixWorld),
        me.normal.set(0, 0, 1).applyMatrix4(me.rot),
        me.view.subVectors(me.rWorld, me.cWorld),
        me.view.dot(me.normal) > 0)
      )
        return;
      (me.view.reflect(me.normal).negate().add(me.rWorld),
        me.rot.extractRotation(camera.matrixWorld),
        me.lookAt.set(0, 0, -1).applyMatrix4(me.rot).add(me.cWorld),
        me.target
          .subVectors(me.rWorld, me.lookAt)
          .reflect(me.normal)
          .negate()
          .add(me.rWorld),
        me.vcam.position.copy(me.view),
        me.vcam.up.set(0, 1, 0).applyMatrix4(me.rot).reflect(me.normal),
        me.vcam.lookAt(me.target),
        (me.vcam.far = camera.far),
        me.vcam.updateMatrixWorld(),
        me.vcam.projectionMatrix.copy(camera.projectionMatrix),
        reflectionMatrix.set(
          0.5,
          0,
          0,
          0.5,
          0,
          0.5,
          0,
          0.5,
          0,
          0,
          0.5,
          0.5,
          0,
          0,
          0,
          1,
        ),
        reflectionMatrix
          .multiply(me.vcam.projectionMatrix)
          .multiply(me.vcam.matrixWorldInverse),
        me.plane
          .setFromNormalAndCoplanarPoint(me.normal, me.rWorld)
          .applyMatrix4(me.vcam.matrixWorldInverse),
        me.clip.set(
          me.plane.normal.x,
          me.plane.normal.y,
          me.plane.normal.z,
          me.plane.constant,
        ));
      const j = me.vcam.projectionMatrix.elements;
      ((me.q.x = (Math.sign(me.clip.x) + j[8]) / j[0]),
        (me.q.y = (Math.sign(me.clip.y) + j[9]) / j[5]),
        (me.q.z = -1),
        (me.q.w = (1 + j[10]) / j[14]),
        me.clip.multiplyScalar(2 / me.clip.dot(me.q)),
        (j[2] = me.clip.x),
        (j[6] = me.clip.y),
        (j[10] = me.clip.z + 1 - 0.003),
        (j[14] = me.clip.w));
      const B = [waterMesh, ...godrays];
      dustMesh && B.push(dustMesh);
      const fe = B.map((be) => be.visible);
      for (const be of B) be.visible = !1;
      (renderer.setRenderTarget(reflectionTarget),
        renderer.clear(),
        renderer.render(scene, me.vcam),
        renderer.setRenderTarget(null),
        B.forEach((be, Pe) => {
          be.visible = fe[Pe];
        }));
    },
    renderPass = (me, j) => {
      quad &&
        ((quad.material = me),
        renderer.setRenderTarget(j),
        renderer.clear(),
        renderer.render(postScene, postCamera));
    },
    setDepth = (me) => {
      backgroundColor.copy(surfaceColor).lerp(depthColor, me);
      for (const j of [godrayMaterial, waterMaterial]) {
        if (!j) continue;
        const B = j.uniforms.fogFarColor?.value,
          fe = j.uniforms.fogNearColor?.value;
        (B?.copy(fogFarColor).lerp(depthColor, me),
          fe?.copy(fogNearColor).lerp(depthColor, me));
      }
      compositeMaterial &&
        (compositeMaterial.uniforms.uOpacity.value =
          OCEAN_OPACITY * clamp01(1 - me / 0.45));
    },
    setGodray = (me) => {
      godrayMaterial && (godrayMaterial.uniforms.uStrength.value = me);
    },
    setEdge = (me) => {
      tiltMaterial && (tiltMaterial.uniforms.blur.value = me);
    },
    hide = () => {
      scene.background = previousBackground;
      for (const me of godrays) me.visible = !1;
      (dustMesh && (dustMesh.visible = !1),
        waterMesh && (waterMesh.visible = !1));
    };
  function dispose() {
    if (disposed) return;
    disposed = true;
    ready = false;
    scene.background = previousBackground;
    for (const texture of textures) texture.dispose();
    textures.clear();
    for (const me of godrays) (me.geometry.dispose(), group.remove(me));
    (godrayMaterial?.dispose(),
      dustMesh && (dustMesh.geometry.dispose(), scene.remove(dustMesh)),
      dustMaterial?.dispose(),
      waterMesh && (waterMesh.geometry.dispose(), group.remove(waterMesh)),
      waterMaterial?.dispose(),
      scene.remove(group),
      reflectionTarget?.dispose(),
      sceneTarget?.dispose(),
      compositeTarget?.dispose(),
      aaTarget?.dispose(),
      compositeMaterial?.dispose(),
      aaMaterial?.dispose(),
      tiltMaterial?.dispose(),
      bloomTarget?.dispose(),
      bloomScratch?.dispose(),
      bloomExtract?.dispose(),
      bloomBlur?.dispose(),
      fallbackTexture?.dispose(),
      quad?.geometry.dispose());
  }

  return {
    get status() {
      return failed
        ? "error"
        : disposed
          ? "disposed"
          : ready
            ? "ready"
            : "loading";
    },
    update: ({ t: me, cine: j }) => {
      const B = j.coldOpen;
      if (!(ready && (B?.ocean ?? !1)) || B == null) {
        active && (hide(), (active = !1));
        return;
      }
      ((active = !0),
        (timeUniform.value = me),
        (scene.background = backgroundColor));
      for (const be of godrays) be.visible = !0;
      if (
        (waterMesh && (waterMesh.visible = camera.position.y > 60),
        dustMesh && dustMaterial)
      ) {
        const be = clamp01((B.oceanDepth - 0.12) / 0.48),
          Pe = 1 - be * be * (3 - 2 * be);
        ((dustMaterial.uniforms.uFade.value = Pe),
          (dustMesh.visible = Pe > 0.001));
      }
      (setDepth(clamp01(B.oceanDepth / 0.85)),
        setGodray(1.35 * clamp01(B.oceanGodray / 0.8)),
        setEdge(B.oceanEdge),
        (oceanFade = clamp01(B.oceanFade)));
    },
    render: ({ cine: me }) => {
      if (
        disposed ||
        !ready ||
        !me.coldOpen?.ocean ||
        !sceneTarget ||
        !compositeMaterial ||
        !aaMaterial ||
        !tiltMaterial
      )
        return !1;
      if (
        (resizePost(),
        renderReflection(),
        renderer.setRenderTarget(sceneTarget),
        renderer.clear(),
        renderer.render(scene, camera),
        bloomTarget && bloomScratch && bloomExtract && bloomBlur)
      ) {
        ((bloomExtract.uniforms.tDiffuse.value = sceneTarget.texture),
          renderPass(bloomExtract, bloomTarget));
        for (let j = 0; j < 3; j++) {
          const B = 1 + j;
          ((bloomBlur.uniforms.tDiffuse.value = bloomTarget.texture),
            bloomBlur.uniforms.uDirection.value.set(B, 0),
            renderPass(bloomBlur, bloomScratch),
            (bloomBlur.uniforms.tDiffuse.value = bloomScratch.texture),
            bloomBlur.uniforms.uDirection.value.set(0, B),
            renderPass(bloomBlur, bloomTarget));
        }
        ((compositeMaterial.uniforms.uBloom.value = bloomTarget.texture),
          (compositeMaterial.uniforms.uBloomStrength.value = 0.9 * oceanFade),
          (compositeMaterial.uniforms.uSeaTintAmt.value = 0));
      }
      return (
        renderPass(compositeMaterial, compositeTarget),
        renderPass(aaMaterial, aaTarget),
        renderPass(tiltMaterial, null),
        !0
      );
    },
    dispose,
  };
}
const SILHOUETTE_WIDTH = 512;
const SILHOUETTE_HEIGHT = 1024;
const PLANE_WIDTH = 4;
const PLANE_HEIGHT = 8;
const SILHOUETTE_VERTEX = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const SILHOUETTE_SEED_FRAGMENT = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uAlpha;
  uniform vec2 uTexel;
  // Nori's billboard samples her texture at (u, 1-v); match that so the field's UV space
  // equals the billboard plane-uv the morph shader samples.
  float A(vec2 uv) { return texture2D(uAlpha, vec2(uv.x, 1.0 - uv.y)).a; }
  void main() {
    float inC = step(0.5, A(vUv));
    float inN = step(0.5, A(vUv + vec2(0.0, uTexel.y)));
    float inS = step(0.5, A(vUv - vec2(0.0, uTexel.y)));
    float inE = step(0.5, A(vUv + vec2(uTexel.x, 0.0)));
    float inW = step(0.5, A(vUv - vec2(uTexel.x, 0.0)));
    bool boundary = (inC != inN) || (inC != inS) || (inC != inE) || (inC != inW);
    if (boundary) gl_FragColor = vec4(vUv, 0.0, 1.0);
    else gl_FragColor = vec4(-1.0, -1.0, 0.0, 0.0);
  }
`;
const SILHOUETTE_JUMP_FRAGMENT = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPrev;
  uniform vec2 uTexel;
  uniform float uStep;
  void main() {
    vec2 best = vec2(-1.0);
    float bestD = 1e20;
    float valid = 0.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 off = vec2(float(x), float(y)) * uStep * uTexel;
        vec4 s = texture2D(uPrev, vUv + off);
        if (s.a > 0.5) {
          float d = distance(vUv, s.xy);
          if (d < bestD) { bestD = d; best = s.xy; valid = 1.0; }
        }
      }
    }
    gl_FragColor = vec4(best, 0.0, valid);
  }
`;
const SILHOUETTE_DISTANCE_FRAGMENT = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uJfa;
  uniform sampler2D uAlpha;
  uniform vec2 uPlane;
  void main() {
    vec4 j = texture2D(uJfa, vUv);
    float d = (j.a > 0.5) ? length((vUv - j.xy) * uPlane) : (uPlane.x + uPlane.y);
    float a = texture2D(uAlpha, vec2(vUv.x, 1.0 - vUv.y)).a;
    float sgn = (a > 0.5) ? -1.0 : 1.0;
    gl_FragColor = vec4(sgn * d, 0.0, 0.0, 1.0);
  }
`;
function silhouetteTarget(t) {
  const e = new WebGLRenderTarget(SILHOUETTE_WIDTH, SILHOUETTE_HEIGHT, {
    type: FloatType,
    format: RGBAFormat,
    minFilter: t,
    magFilter: t,
    depthBuffer: !1,
    stencilBuffer: !1,
    wrapS: ClampToEdgeWrapping,
    wrapT: ClampToEdgeWrapping,
  });
  return (
    (e.texture.colorSpace = NoColorSpace),
    (e.texture.generateMipmaps = !1),
    e
  );
}
function createLiveSilhouette(t) {
  const e = silhouetteTarget(NearestFilter),
    n = silhouetteTarget(NearestFilter),
    r = silhouetteTarget(LinearFilter),
    i = new Scene(),
    s = new OrthographicCamera(-1, 1, 1, -1, 0, 1),
    o = new Vector2(1 / SILHOUETTE_WIDTH, 1 / SILHOUETTE_HEIGHT),
    a = {
      depthTest: !1,
      depthWrite: !1,
      toneMapped: !1,
    },
    l = new ShaderMaterial({
      ...a,
      vertexShader: SILHOUETTE_VERTEX,
      fragmentShader: SILHOUETTE_SEED_FRAGMENT,
      uniforms: {
        uAlpha: {
          value: null,
        },
        uTexel: {
          value: o,
        },
      },
    }),
    c = new ShaderMaterial({
      ...a,
      vertexShader: SILHOUETTE_VERTEX,
      fragmentShader: SILHOUETTE_JUMP_FRAGMENT,
      uniforms: {
        uPrev: {
          value: null,
        },
        uTexel: {
          value: o,
        },
        uStep: {
          value: 1,
        },
      },
    }),
    u = new ShaderMaterial({
      ...a,
      vertexShader: SILHOUETTE_VERTEX,
      fragmentShader: SILHOUETTE_DISTANCE_FRAGMENT,
      uniforms: {
        uJfa: {
          value: null,
        },
        uAlpha: {
          value: null,
        },
        uPlane: {
          value: new Vector2(PLANE_WIDTH, PLANE_HEIGHT),
        },
      },
    }),
    d = new Mesh(new PlaneGeometry(2, 2), l);
  i.add(d);
  function f(m, p) {
    d.material = m;
    const v = t.getRenderTarget();
    (t.setRenderTarget(p), t.render(i, s), t.setRenderTarget(v));
  }
  function h(m) {
    ((l.uniforms.uAlpha.value = m), f(l, e));
    let p = e,
      v = n,
      y = Math.max(SILHOUETTE_WIDTH, SILHOUETTE_HEIGHT) / 2;
    for (; y >= 1;) {
      ((c.uniforms.uPrev.value = p.texture),
        (c.uniforms.uStep.value = y),
        f(c, v));
      const x = p;
      ((p = v), (v = x), (y = Math.floor(y / 2)));
    }
    return (
      (u.uniforms.uJfa.value = p.texture),
      (u.uniforms.uAlpha.value = m),
      f(u, r),
      r.texture
    );
  }
  function _() {
    (e.dispose(),
      n.dispose(),
      r.dispose(),
      l.dispose(),
      c.dispose(),
      u.dispose(),
      d.geometry.dispose());
  }
  return {
    update: h,
    dispose: _,
  };
}
export {
  createOceanStage,
  createLiveSilhouette,
  createGlyphKit,
  updateGlyphAntialiasing,
};
