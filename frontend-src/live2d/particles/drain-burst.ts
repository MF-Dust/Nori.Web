/**
 * Shipped sprite burst (`Bs` in public/assets/index-CyHAbkO5.js) and the
 * Memory preset `xe("drain-burst")`. Motion is integrated in the vertex
 * shader (`position + aVelocity * age` plus the wobble). `integrate` repeats
 * that formula on the CPU so a step can be checked without WebGL.
 *
 * The shader strings keep the shipped template's CRLF so they are substrings
 * of index-CyHAbkO5.js.
 */

const shippedGlsl = (lines: readonly string[]) => lines.join("\r\n");

export const DRAIN_BURST_VERTEX_GLSL = shippedGlsl([
  "",
  "  attribute float aBornAt;",
  "  attribute float aLifespan;",
  "  attribute vec3 aVelocity;",
  "  attribute float aSize;",
  "  attribute float aSeed;",
  "  uniform float time;",
  "  uniform float baseSize;",
  "  varying float vAlpha;",
  "  varying float vSeed;",
  "",
  "  void main() {",
  "    float age = time - aBornAt;",
  "    float life = aLifespan;",
  "    float t = age / life;",
  "",
  "    if (aBornAt < 0.0 || t < 0.0 || t > 1.0) {",
  "      vAlpha = 0.0;",
  "      gl_Position = vec4(0.0, 0.0, -10000.0, 1.0);",
  "      gl_PointSize = 0.0;",
  "      return;",
  "    }",
  "",
  "    vec3 pos = position + aVelocity * age;",
  "    // Gentle wobble",
  "    pos.x += sin(time * 1.3 + aSeed * 6.28) * 0.05;",
  "    pos.y += sin(time * 0.9 + aSeed * 11.0) * 0.04;",
  "",
  "    // Fade in fast, fade out gentle",
  "    float fadeIn = smoothstep(0.0, 0.1, t);",
  "    float fadeOut = 1.0 - smoothstep(0.55, 1.0, t);",
  "    vAlpha = fadeIn * fadeOut;",
  "    vSeed = aSeed;",
  "",
  "    vec4 mv = modelViewMatrix * vec4(pos, 1.0);",
  "    gl_PointSize = aSize * baseSize * 320.0 / -mv.z;",
  "    gl_Position = projectionMatrix * mv;",
  "  }",
  "",
]);

export const DRAIN_BURST_FRAGMENT_GLSL = shippedGlsl([
  "",
  "  uniform vec3 color;",
  "  varying float vAlpha;",
  "  varying float vSeed;",
  "",
  "  void main() {",
  "    if (vAlpha <= 0.001) discard;",
  "    vec2 d = gl_PointCoord - 0.5;",
  "    float r = length(d);",
  "    if (r > 0.5) discard;",
  "    float core = exp(-r * r * 32.0);",
  "    float halo = exp(-r * r * 8.0) * 0.55;",
  "    // Tiny twinkle in core",
  "    float twinkle = 0.85 + 0.15 * sin(vSeed * 33.0);",
  "    vec3 c = color * (core * 1.3 + halo * 0.7) * twinkle;",
  "    gl_FragColor = vec4(c, (core + halo) * vAlpha);",
  "  }",
  "",
]);

/** Shipped `Gi`: every `Bs` emitter allocates this many slots. */
export const SPRITE_BURST_CAPACITY = 256;

/** Shipped `YXe`: Memory re-fires `drain-burst` on this period. */
export const DRAIN_BURST_INTERVAL_MS = 180;

/** Shipped `mode.count` for `drain-burst`. */
export const DRAIN_BURST_COUNT = 55;

export const DRAIN_BURST_PRESET = {
  mode: { kind: "burst" as const, count: DRAIN_BURST_COUNT },
  size: 0.2,
  lifespan: 1.8,
  color: { r: 1, g: 0.45, b: 0.2 },
  spawnArea: { x: 0.6, y: 0.6, z: 0.7 },
  driftY: -1.4,
  jitterXY: 1.3,
  anchorYOffset: 0.4,
};

export interface ParticleAnchor {
  position: { x: number; y: number; z: number };
  size: { x: number; y: number };
}

export interface IntegratedSprite {
  x: number;
  y: number;
  z: number;
}

type SpriteMode =
  | { kind: "burst"; count: number }
  | { kind: "ambient"; spawnRate: number };

export interface SpriteBurstConfig {
  id: string;
  mode: SpriteMode;
  size: number;
  lifespan: number;
  color: { r: number; g: number; b: number };
  spawnArea: { x: number; y: number; z: number };
  driftY: number;
  jitterXY: number;
  anchorYOffset?: number;
  rng?: () => number;
}

/** CPU twin of shipped `Bs`. Attribute buffers are the ones THREE.Points uploads. */
export class SpriteBurst {
  readonly id: string;
  readonly position: Float32Array;
  readonly velocity: Float32Array;
  readonly bornAt: Float32Array;
  readonly lifespanAttr: Float32Array;
  readonly sizeAttr: Float32Array;
  readonly seed: Float32Array;
  readonly color: { r: number; g: number; b: number };
  readonly size: number;
  done = false;
  private mode: SpriteMode;
  private lifespan: number;
  private spawnArea: { x: number; y: number; z: number };
  private driftY: number;
  private jitterXY: number;
  private anchorYOffset: number;
  private rng: () => number;
  private spawnAccumulator = 0;
  private anchor: ParticleAnchor | null = null;
  private dirty = false;

  constructor(config: SpriteBurstConfig) {
    this.id = config.id;
    this.mode = config.mode;
    this.size = config.size;
    this.lifespan = config.lifespan;
    this.color = config.color;
    this.spawnArea = config.spawnArea;
    this.driftY = config.driftY;
    this.jitterXY = config.jitterXY;
    this.anchorYOffset = config.anchorYOffset ?? 0;
    this.rng = config.rng ?? Math.random;
    this.position = new Float32Array(SPRITE_BURST_CAPACITY * 3);
    this.velocity = new Float32Array(SPRITE_BURST_CAPACITY * 3);
    this.bornAt = new Float32Array(SPRITE_BURST_CAPACITY);
    this.lifespanAttr = new Float32Array(SPRITE_BURST_CAPACITY);
    this.sizeAttr = new Float32Array(SPRITE_BURST_CAPACITY);
    this.seed = new Float32Array(SPRITE_BURST_CAPACITY);
    for (let index = 0; index < SPRITE_BURST_CAPACITY; index += 1) {
      this.bornAt[index] = -1;
      this.seed[index] = this.rng();
    }
  }

  takeDirty() {
    const dirty = this.dirty;
    this.dirty = false;
    return dirty;
  }

  update(time: number, dt: number, anchor: ParticleAnchor) {
    this.anchor = anchor;
    if (this.mode.kind === "ambient") {
      this.spawnAccumulator += this.mode.spawnRate * dt;
      while (this.spawnAccumulator >= 1) {
        this.spawn(time);
        this.spawnAccumulator -= 1;
      }
      return;
    }
    if (this.spawnAccumulator < 0.5) {
      for (
        let index = 0;
        index < this.mode.count && index < SPRITE_BURST_CAPACITY;
        index += 1
      )
        this.spawn(time);
      this.spawnAccumulator = 1;
    }
    let alive = false;
    for (let index = 0; index < SPRITE_BURST_CAPACITY; index += 1) {
      if (
        this.bornAt[index] >= 0 &&
        time - this.bornAt[index] < this.lifespanAttr[index]
      ) {
        alive = true;
        break;
      }
    }
    if (!alive) this.done = true;
  }

  /**
   * Shipped vertex displacement at `time`: `position + aVelocity * age`,
   * then the two sine wobbles. Dead slots are omitted, matching the shader's discard.
   */
  integrate(time: number): IntegratedSprite[] {
    const sprites: IntegratedSprite[] = [];
    for (let index = 0; index < SPRITE_BURST_CAPACITY; index += 1) {
      const born = this.bornAt[index];
      const life = this.lifespanAttr[index];
      const age = time - born;
      const t = age / life;
      if (born < 0 || t < 0 || t > 1) continue;
      const seed = this.seed[index];
      sprites.push({
        x:
          this.position[index * 3] +
          this.velocity[index * 3] * age +
          Math.sin(time * 1.3 + seed * 6.28) * 0.05,
        y:
          this.position[index * 3 + 1] +
          this.velocity[index * 3 + 1] * age +
          Math.sin(time * 0.9 + seed * 11.0) * 0.04,
        z:
          this.position[index * 3 + 2] + this.velocity[index * 3 + 2] * age,
      });
    }
    return sprites;
  }

  private spawn(time: number) {
    if (!this.anchor) return;
    let slot = -1;
    let oldest = -1;
    for (let index = 0; index < SPRITE_BURST_CAPACITY; index += 1) {
      const born = this.bornAt[index];
      if (born < 0) {
        slot = index;
        break;
      }
      const age = time - born;
      if (age > oldest) {
        oldest = age;
        slot = index;
      }
    }
    if (slot < 0) return;
    const anchor = this.anchor;
    const halfX = (anchor.size.x * this.spawnArea.x) / 2;
    const halfY = (anchor.size.y * this.spawnArea.y) / 2;
    const halfZ = this.spawnArea.z / 2;
    this.position[slot * 3] =
      anchor.position.x + (this.rng() * 2 - 1) * halfX;
    this.position[slot * 3 + 1] =
      anchor.position.y +
      this.anchorYOffset +
      (this.rng() * 2 - 1) * halfY;
    this.position[slot * 3 + 2] =
      anchor.position.z + (this.rng() * 2 - 1) * halfZ;
    this.velocity[slot * 3] = (this.rng() * 2 - 1) * this.jitterXY;
    this.velocity[slot * 3 + 1] =
      this.driftY + (this.rng() * 0.4 - 0.2) * this.jitterXY;
    this.velocity[slot * 3 + 2] = (this.rng() * 2 - 1) * this.jitterXY * 0.5;
    this.bornAt[slot] = time;
    this.lifespanAttr[slot] = this.lifespan * (0.7 + this.rng() * 0.6);
    this.sizeAttr[slot] = 0.4 + this.rng() * 0.8;
    this.seed[slot] = this.rng();
    this.dirty = true;
  }
}

/**
 * Plays due after `elapsedSeconds` inside the drain window, including the
 * burst at the opening frame. A tiny epsilon covers the ulp lost when the
 * scene clock subtracts the 28.7s drain marker.
 */
export function drainBurstPlays(elapsedSeconds: number) {
  if (!(elapsedSeconds >= 0)) return 0;
  return (
    1 +
    Math.floor((elapsedSeconds * 1000 + 1e-6) / DRAIN_BURST_INTERVAL_MS)
  );
}

/** One burst spawn plus a shader integrate, with no WebGL context. */
export function stepDrainBurst(
  dt: number,
  rng: () => number = Math.random,
  anchor: ParticleAnchor = {
    position: { x: 0, y: -0.6, z: 0 },
    size: { x: 4, y: 8 },
  },
) {
  const burst = new SpriteBurst({
    id: "drain-burst-1",
    ...DRAIN_BURST_PRESET,
    rng,
  });
  burst.update(0, 0, anchor);
  return {
    count: burst.integrate(0).length,
    spawned: burst.integrate(0),
    moved: burst.integrate(dt),
  };
}
