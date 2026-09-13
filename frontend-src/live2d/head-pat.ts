/** Head-width normalized gesture sampling, independent of the renderer. */
export class HeadPat {
  private sample: { time: number; x: number; y: number } | null = null;
  private fired = false;
  progress = 0;
  velocity = 0;
  pressing = false;
  enabled = true;
  start(time: number, x: number, y: number) {
    this.end();
    if (!this.enabled || ![time, x, y].every(Number.isFinite)) return;
    this.sample = { time, x, y };
  }
  move(time: number, x: number, y: number) {
    const previous = this.sample;
    if (!this.enabled || !previous || ![time, x, y].every(Number.isFinite)) return false;
    const dt = time - previous.time, dx = x - previous.x, dy = y - previous.y;
    if (dt <= 0) return false;
    this.sample = { time, x, y };
    this.pressing = dt > 0 && dt <= 250 && Math.abs(dx) >= Math.abs(dy) && Math.abs(dx * 1000 / dt) >= .05;
    if (!this.pressing) { this.velocity = 0; return false; }
    const weight = Math.max(.05, 1 - Math.exp(-dt / 80));
    this.velocity += (dx * 1000 / dt - this.velocity) * weight;
    this.progress = Math.min(1000, this.progress + dt);
    if (this.progress < 1000 || this.fired) return false;
    this.fired = true;
    return true;
  }
  end() { this.sample = null; this.pressing = false; this.progress = 0; this.fired = false; this.velocity = 0; }
}
