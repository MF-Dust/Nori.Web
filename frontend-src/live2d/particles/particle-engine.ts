import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Points,
  ShaderMaterial,
  type Scene,
} from "three";
import {
  DRAIN_BURST_FRAGMENT_GLSL,
  DRAIN_BURST_PRESET,
  DRAIN_BURST_VERTEX_GLSL,
  SpriteBurst,
  type ParticleAnchor,
  type SpriteBurstConfig,
} from "./drain-burst";

/**
 * Shipped `noe`: add / schedule / nextId, then an update tick that integrates
 * every live emitter and drops the ones whose sprites have all expired.
 * `drain-burst` is the only registered preset; it builds a `Bs` (`SpriteBurst`)
 * and draws it with THREE.Points using the shipped sprite GLSL.
 */
interface EffectHost {
  add: (points: DrainBurstPoints) => void;
  after: (delay: number, run: () => void) => void;
  nextId: (prefix: string) => string;
  rng: () => number;
}

class DrainBurstPoints {
  readonly burst: SpriteBurst;
  readonly object: Points;
  private readonly geometry: BufferGeometry;
  private readonly material: ShaderMaterial;
  private readonly attributes: BufferAttribute[];
  private readonly uniforms: {
    time: { value: number };
    color: { value: Color };
    baseSize: { value: number };
  };

  constructor(burst: SpriteBurst) {
    this.burst = burst;
    this.geometry = new BufferGeometry();
    this.attributes = (
      [
        ["position", burst.position, 3],
        ["aVelocity", burst.velocity, 3],
        ["aBornAt", burst.bornAt, 1],
        ["aLifespan", burst.lifespanAttr, 1],
        ["aSize", burst.sizeAttr, 1],
        ["aSeed", burst.seed, 1],
      ] as const
    ).map(([name, array, itemSize]) => {
      const attribute = new BufferAttribute(array, itemSize);
      attribute.setUsage(DynamicDrawUsage);
      this.geometry.setAttribute(name, attribute);
      return attribute;
    });
    this.uniforms = {
      time: { value: 0 },
      color: { value: new Color(burst.color.r, burst.color.g, burst.color.b) },
      baseSize: { value: burst.size },
    };
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: DRAIN_BURST_VERTEX_GLSL,
      fragmentShader: DRAIN_BURST_FRAGMENT_GLSL,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.object = new Points(this.geometry, this.material);
    this.object.frustumCulled = false;
    this.object.renderOrder = 4;
  }

  update(time: number, dt: number, anchor: ParticleAnchor) {
    this.uniforms.time.value = time;
    this.burst.update(time, dt, anchor);
    if (!this.burst.takeDirty()) return;
    for (const attribute of this.attributes) attribute.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

const effects = new Map<string, (host: EffectHost) => void>();

effects.set("drain-burst", (host) => {
  host.add(
    new DrainBurstPoints(
      new SpriteBurst({
        id: host.nextId("drain-burst"),
        ...DRAIN_BURST_PRESET,
        rng: host.rng,
      } satisfies SpriteBurstConfig),
    ),
  );
});

export class ParticleEngine {
  private readonly emitters = new Map<string, DrainBurstPoints>();
  private scheduled: Array<{ at: number; seq: number; run: () => void }> = [];
  private anchor: ParticleAnchor = {
    position: { x: 0, y: 0, z: 0 },
    size: { x: 1, y: 1 },
  };
  private currentTime = 0;
  private idCounter = 0;
  private scheduleCounter = 0;
  private disposed = false;

  constructor(private readonly scene: Scene) {}

  add(points: DrainBurstPoints) {
    if (this.disposed) {
      points.dispose();
      return;
    }
    const previous = this.emitters.get(points.burst.id);
    if (previous) {
      this.scene.remove(previous.object);
      previous.dispose();
    }
    this.emitters.set(points.burst.id, points);
    this.scene.add(points.object);
  }

  nextId(prefix: string) {
    this.idCounter += 1;
    return `${prefix}-${this.idCounter}`;
  }

  schedule(delay: number, run: () => void) {
    if (this.disposed) return;
    this.scheduled.push({
      at: this.currentTime + Math.max(0, delay),
      seq: (this.scheduleCounter += 1),
      run,
    });
    this.scheduled.sort((left, right) =>
      left.at === right.at ? left.seq - right.seq : left.at - right.at,
    );
  }

  play(name: string) {
    if (this.disposed) return;
    const build = effects.get(name);
    if (!build) return;
    const rng = Math.random;
    build({
      add: (points) => this.add(points),
      after: (delay, run) => this.schedule(delay, run),
      nextId: (prefix) => this.nextId(prefix),
      rng: () => rng(),
    });
  }

  update(time: number, dt: number, anchor: ParticleAnchor) {
    if (this.disposed) return;
    this.currentTime = Math.max(0, time);
    this.anchor.position.x = anchor.position.x;
    this.anchor.position.y = anchor.position.y;
    this.anchor.position.z = anchor.position.z;
    this.anchor.size.x = anchor.size.x;
    this.anchor.size.y = anchor.size.y;
    while (this.scheduled.length > 0 && this.scheduled[0].at <= this.currentTime)
      this.scheduled.shift()?.run();
    const finished: string[] = [];
    for (const points of this.emitters.values()) {
      points.update(this.currentTime, dt, this.anchor);
      if (points.burst.done) finished.push(points.burst.id);
    }
    for (const id of finished) this.remove(id);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.scheduled = [];
    this.idCounter = 0;
    this.scheduleCounter = 0;
    for (const id of [...this.emitters.keys()]) this.remove(id);
  }

  private remove(id: string) {
    const points = this.emitters.get(id);
    if (!points) return;
    this.scene.remove(points.object);
    points.dispose();
    this.emitters.delete(id);
  }
}
