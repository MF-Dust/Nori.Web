import type { ChatLine } from "../apps/chat-runtime";

export const NORI_EMOTION_EXPRESSIONS: Readonly<Record<string, string | null>> =
  {
    happy: "07_Smile",
    excited: "01_KiraKira",
    sad: "08_Tears",
    angry: "03_Angry",
    fearful: "11_Disgust",
    disgusted: "11_Disgust",
    surprised: "14_Surprised",
    doubtful: "11_Disgust",
    dizzy: "02_Dizzy",
    serious: "12_Serious",
    neutral: null,
  };
export class NoriExpressionController {
  private current: string | null = null;
  private changedAt = 0;
  private pending: ReturnType<typeof setTimeout> | null = null;
  private idle: ReturnType<typeof setTimeout> | null = null;
  private blocks = new Set<string>();
  private blockAt = 0;
  private suppressed = false;
  private disposed = false;
  constructor(
    private swap: (previous: string | null, next: string | null) => void,
    private now = Date.now,
  ) {}
  private apply(expression: string | null) {
    if (expression === this.current) return;
    this.swap(this.current, expression);
    this.current = expression;
    this.changedAt = this.now();
  }
  private clearPending() {
    if (this.pending !== null) clearTimeout(this.pending);
    this.pending = null;
  }
  private scheduleIdle(ms: number) {
    if (this.idle !== null) clearTimeout(this.idle);
    this.idle = setTimeout(() => {
      this.idle = null;
      if (this.blocks.size && this.now() - this.blockAt <= 30000) {
        this.scheduleIdle(10000);
        return;
      }
      this.clearPending();
      if (!this.suppressed) this.apply(null);
    }, ms);
  }
  request(expression: string | null) {
    if (this.disposed || this.suppressed) return;
    this.clearPending();
    this.scheduleIdle(13000);
    if (expression === this.current) return;
    const wait = this.current ? 3000 - (this.now() - this.changedAt) : 0;
    if (wait > 0)
      this.pending = setTimeout(() => {
        this.pending = null;
        this.apply(expression);
      }, wait);
    else this.apply(expression);
  }
  blockStarted(key: string) {
    if (!this.disposed) {
      this.blocks.add(key);
      this.blockAt = this.now();
    }
  }
  blockFinished(key: string) {
    if (this.disposed) return;
    this.blocks.delete(key);
    this.blockAt = this.now();
    if (!this.blocks.size && (this.current !== null || this.pending !== null))
      this.scheduleIdle(10000);
  }
  cut(operation: string, block: number) {
    for (const key of this.blocks)
      if (
        key.startsWith(operation + ":") &&
        Number(key.slice(operation.length + 1)) > block
      )
        this.blockFinished(key);
  }
  suppress(value: boolean) {
    if (this.suppressed === value) return;
    this.suppressed = value;
    if (value) {
      this.clearPending();
      this.apply(null);
    }
  }
  reset() {
    this.clearPending();
    if (this.idle !== null) clearTimeout(this.idle);
    this.idle = null;
    this.blocks.clear();
    this.apply(null);
  }
  dispose() {
    this.disposed = true;
    this.reset();
  }
}

/** Reopening/reseeding history is silent; only newly revealed speech drives expressions. */
export class NoriEmotionObserver {
  private epoch: number | null = null;
  private lastId: string | null = null;
  private newest = 0;
  private seen = new Set<string>();
  observe(
    epoch: number,
    lines: readonly ChatLine[],
    emit: (expression: string | null) => void,
  ) {
    const key = (line: ChatLine) =>
      `${line.messageId}:${line.blockId ?? "line"}`;
    if (this.epoch !== epoch) {
      this.epoch = epoch;
      this.lastId = lines.length ? key(lines[lines.length - 1]) : null;
      this.newest = Math.max(0, ...lines.map((line) => line.createdAt ?? 0));
      this.seen = new Set(lines.slice(-512).map(key));
      return;
    }
    const previous =
      this.lastId === null
        ? -1
        : lines.findIndex((line) => key(line) === this.lastId);
    const start =
      previous >= 0
        ? previous + 1
        : lines.findIndex((line) => (line.createdAt ?? 0) > this.newest);
    for (const line of lines.slice(
      start < 0
        ? this.lastId === null && this.newest === 0
          ? 0
          : lines.length
        : start,
    )) {
      const id = key(line);
      if (this.seen.has(id)) continue;
      this.seen.add(id);
      if (this.seen.size > 512)
        this.seen.delete(this.seen.values().next().value!);
      if (
        line.sender === "agent" &&
        line.isSpeech &&
        line.emotion &&
        Object.hasOwn(NORI_EMOTION_EXPRESSIONS, line.emotion)
      )
        emit(NORI_EMOTION_EXPRESSIONS[line.emotion]);
    }
    this.newest = Math.max(
      this.newest,
      ...lines.map((line) => line.createdAt ?? 0),
    );
    if (lines.length) this.lastId = key(lines[lines.length - 1]);
  }
}
