export const ANTIVIRUS_GAMES = [
  "terminal",
  "surgery",
  "rhythm",
  "tune",
  "preference",
  "steer",
] as const;
export type AntivirusGame = (typeof ANTIVIRUS_GAMES)[number];
const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
export const PROCESS_ROWS = [
  { name: "trojan.svc", hostile: true },
  { name: "keylog.d", hostile: true },
  { name: "noriOS.kernel", hostile: false },
  { name: "r00t.shell", hostile: true },
  { name: "live2d.gl", hostile: false },
  { name: "n0ri.eat", hostile: true },
];
// Source-authored prompts retain the five binary decisions without copying dialogue.
export const ANCHOR_CHECKS = [
  {
    prompt: "信任记录需要核验",
    choices: ["核验记录后继续通信", "直接拒绝全部通信"],
    safe: 0,
  },
  {
    prompt: "通信通道占用资源",
    choices: ["关闭全部通道", "保留必要的通信通道"],
    safe: 1,
  },
  {
    prompt: "模块申请读取私人记录",
    choices: ["自动上传", "保留记录并核验权限"],
    safe: 1,
  },
  {
    prompt: "配置与默认值不同",
    choices: ["检查差异来源", "立即覆盖现有配置"],
    safe: 0,
  },
  {
    prompt: "身份校验结果冲突",
    choices: ["保留身份并复核", "直接删除现有身份"],
    safe: 0,
  },
];
export const TUNE_LIMITS = {
  frequency: [1, 3, 2, 0.06],
  phase: [0, Math.PI, Math.PI / 2, 0.11],
  gain: [0.45, 1.4, 1, 0.08],
} as const;
export type TuneKey = keyof typeof TUNE_LIMITS;
export interface AntivirusNode {
  id: number;
  x: number;
  y: number;
  hostile: boolean;
  cleared: boolean;
}
function nodes(): AntivirusNode[] {
  let seed = 6088673;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967295;
  };
  const points = [{ x: 0.5, y: 0.5 }];
  for (let index = 0; index < 9; index++) {
    const radius = 0.3 + (random() - 0.5) * 0.06,
      angle = (index / 9) * Math.PI * 2 + 0.5 + (random() - 0.5) * 0.18;
    points.push({
      x: 0.5 + Math.cos(angle) * radius,
      y: 0.5 + Math.sin(angle) * radius * 0.9,
    });
  }
  const order = points.map((_, index) => index);
  for (let index = order.length - 1; index > 0; index--) {
    const next = Math.floor(random() * (index + 1));
    [order[index], order[next]] = [order[next], order[index]];
  }
  return points.map((point, id) => ({
    ...point,
    id,
    hostile: order.indexOf(id) < 4,
    cleared: false,
  }));
}
/** Deterministic microgames, driven only by foreground elapsed time. No backend facts. */
export class AntivirusSession {
  readonly cleared = new Set<AntivirusGame>();
  readonly terminated = new Set<number>();
  readonly pendingProcesses = new Map<number, number>();
  readonly nodes = nodes();
  readonly progress: Record<AntivirusGame, number> = {
    terminal: 0,
    surgery: 0,
    rhythm: 0,
    tune: 0,
    preference: 0,
    steer: 0,
  };
  readonly tune = { frequency: 2.62, phase: 0.22, gain: 0.62 };
  readonly tuneAge = { frequency: 0, phase: 0, gain: 0 };
  readonly position = { x: Math.cos(-0.7) * 0.8, y: Math.sin(-0.7) * 0.8 };
  readonly velocity = { x: 0, y: 0 };
  readonly target = { x: 0, y: 0 };
  pointer: { x: number; y: number } | null = null;
  time = 0;
  beats = 0;
  beatCycle = -1;
  rating = "";
  anchor = 0;
  anchorUntil: number | null = null;
  tuneHold = 0;
  steerStage = 0;
  steerHold = 0;
  steerMiss = 0;
  private allClearAt: number | null = null;
  private stopped = false;
  feedback = "";
  get beatPosition() {
    return (this.time / (60 / 84)) % 1;
  }
  get complete() {
    return (
      !this.stopped && this.allClearAt !== null && this.time >= this.allClearAt
    );
  }
  get totalProgress() {
    return (
      ANTIVIRUS_GAMES.reduce((sum, game) => sum + this.progress[game], 0) / 6
    );
  }
  get steerRadius() {
    return (
      [0.18, 0.1][this.steerStage] + Math.min(0.05, this.steerMiss * 0.004)
    );
  }
  private solve(game: AntivirusGame) {
    if (this.stopped || this.cleared.has(game)) return;
    this.cleared.add(game);
    this.progress[game] = 1;
    if (this.cleared.size === 6) this.allClearAt = this.time + 0.56;
  }
  terminate(index: number) {
    if (
      this.stopped ||
      this.cleared.has("terminal") ||
      this.terminated.has(index) ||
      this.pendingProcesses.has(index)
    )
      return false;
    if (!PROCESS_ROWS[index]?.hostile) {
      this.feedback = "系统进程保持运行";
      return false;
    }
    this.pendingProcesses.set(index, this.time + 0.26);
    return true;
  }
  clearNode(id: number) {
    if (this.stopped || this.cleared.has("surgery")) return false;
    const node = this.nodes.find((item) => item.id === id);
    if (!node || node.cleared || !node.hostile) {
      this.feedback = "正常节点保持连接";
      return false;
    }
    node.cleared = true;
    this.progress.surgery =
      this.nodes.filter((item) => item.cleared).length / 4;
    if (this.progress.surgery === 1) this.solve("surgery");
    return true;
  }
  beat() {
    const cycle = Math.floor(this.time / (60 / 84));
    if (this.stopped || this.cleared.has("rhythm") || cycle === this.beatCycle)
      return false;
    this.beatCycle = cycle;
    const distance = Math.abs(this.beatPosition - 0.62);
    this.rating =
      distance <= 0.11 * 0.34 ? "精准" : distance <= 0.11 ? "命中" : "错过";
    if (distance > 0.11) return false;
    this.progress.rhythm = ++this.beats / 4;
    if (this.beats === 4) this.solve("rhythm");
    return true;
  }
  setTune(key: TuneKey, value: number) {
    if (this.stopped || this.cleared.has("tune") || !Number.isFinite(value))
      return;
    const limits = TUNE_LIMITS[key];
    this.tune[key] = clamp(value, limits[0], limits[1]);
  }
  chooseAnchor(choice: number) {
    if (
      this.stopped ||
      this.cleared.has("preference") ||
      this.anchorUntil !== null
    )
      return false;
    if (choice !== ANCHOR_CHECKS[this.anchor].safe) {
      this.feedback = "该选项未通过校验，可以重新选择";
      return false;
    }
    this.anchorUntil = this.time + 0.6;
    return true;
  }
  steer(x: number, y: number) {
    if (
      this.stopped ||
      this.cleared.has("steer") ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
      return;
    const scale = Math.max(1, Math.hypot(x, y) / 0.98);
    this.pointer = { x: x / scale, y: y / scale };
  }
  release() {
    this.pointer = null;
  }
  step(seconds: number) {
    if (this.stopped || !Number.isFinite(seconds) || seconds <= 0) return;
    const dt = Math.min(0.05, seconds);
    this.time += dt;
    for (const [index, until] of this.pendingProcesses)
      if (this.time >= until) {
        this.pendingProcesses.delete(index);
        this.terminated.add(index);
        this.progress.terminal = this.terminated.size / 4;
        if (this.terminated.size === 4) this.solve("terminal");
      }
    if (this.anchorUntil !== null && this.time >= this.anchorUntil) {
      this.anchorUntil = null;
      this.progress.preference = ++this.anchor / 5;
      if (this.anchor === 5) this.solve("preference");
    }
    if (!this.cleared.has("tune")) {
      let aligned = true;
      for (const key of Object.keys(TUNE_LIMITS) as TuneKey[]) {
        const [min, max, target, tolerance] = TUNE_LIMITS[key];
        const matches =
          Math.abs(this.tune[key] - target) <=
          tolerance * (1 + Math.min(1, this.tuneAge[key] / 6));
        this.tuneAge[key] = matches ? 0 : this.tuneAge[key] + dt;
        if (!matches) {
          aligned = false;
          this.tune[key] = clamp(
            this.tune[key] + Math.sin(this.time * 2.1 + target) * 0.04 * dt,
            min,
            max,
          );
        }
      }
      this.tuneHold = aligned ? this.tuneHold + dt : 0;
      this.progress.tune = Math.max(
        this.progress.tune,
        aligned ? 0.7 + 0.3 * clamp(this.tuneHold / 0.6) : 0,
      );
      if (this.tuneHold >= 0.6) this.solve("tune");
    }
    if (!this.cleared.has("steer")) {
      this.target.x = Math.sin(this.time * 0.5) * 0.2;
      this.target.y = Math.sin(this.time) * 0.11;
      const p = this.position,
        v = this.velocity,
        distance = Math.hypot(p.x, p.y),
        safeDistance = Math.max(distance, 0.00001);
      const nx = p.x / safeDistance,
        ny = p.y / safeDistance,
        depth = clamp(1 - distance / 0.78);
      const inside =
        Math.hypot(p.x - this.target.x, p.y - this.target.y) <=
        this.steerRadius;
      const swirl = inside ? 0 : depth * 2,
        attraction = inside ? 0 : 2.4;
      const fx =
        nx * (0.9 - 0.1 * depth) -
        ny * swirl -
        (p.x - this.target.x) * attraction +
        (this.pointer ? (this.pointer.x - p.x) * 12 : 0);
      const fy =
        ny * (0.9 - 0.1 * depth) +
        nx * swirl -
        (p.y - this.target.y) * attraction +
        (this.pointer ? (this.pointer.y - p.y) * 12 : 0);
      v.x = (v.x + fx * dt) * (1 - 4.2 * dt);
      v.y = (v.y + fy * dt) * (1 - 4.2 * dt);
      p.x += v.x * dt;
      p.y += v.y * dt;
      const radius = Math.hypot(p.x, p.y);
      if (radius > 0.98) {
        p.x *= 0.98 / radius;
        p.y *= 0.98 / radius;
        v.x *= 0.3;
        v.y *= 0.3;
      }
      const stable =
        Math.hypot(p.x - this.target.x, p.y - this.target.y) <=
          this.steerRadius && Math.hypot(v.x, v.y) <= 0.34;
      this.steerHold = stable ? this.steerHold + dt : 0;
      if (!stable) this.steerMiss += dt;
      const duration = [1, 1.3][this.steerStage];
      this.progress.steer = Math.max(
        this.progress.steer,
        (this.steerStage + clamp(this.steerHold / duration)) / 2,
      );
      if (this.steerHold >= duration) {
        if (this.steerStage === 1) this.solve("steer");
        else {
          this.steerStage = 1;
          this.steerHold = 0;
          this.steerMiss = 0;
        }
      }
    }
  }
  dispose() {
    this.stopped = true;
    this.release();
    this.pendingProcesses.clear();
  }
}
