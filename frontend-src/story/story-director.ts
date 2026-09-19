export interface StoryDefinition {
  id: string;
  trigger: string;
  sentinel: string;
}
export interface StoryInstance extends StoryDefinition {
  instance: number;
}
export const STORY_ORDER: readonly StoryDefinition[] = [
  { id: "boot", trigger: "session.ready", sentinel: "boot.completed" },
  {
    id: "nori-corruption-climax",
    trigger: "corrupt.armed",
    sentinel: "virus.cleared",
  },
  { id: "cult-flash", trigger: "cult.unpacked", sentinel: "arg.cult_truth" },
  { id: "memory", trigger: "arg.memory.start", sentinel: "arg.memory.shown" },
  {
    id: "datasea",
    trigger: "arg.finale.started",
    sentinel: "arg.finale.shown",
  },
  {
    id: "farewell",
    trigger: "arg.farewell.started",
    sentinel: "arg.farewell.shown",
  },
  { id: "ending", trigger: "arg.ending.started", sentinel: "arg.ending.shown" },
];
/** Original priority, sentinel acknowledgement/retry and world fencing, independent of rendering. */
export class StoryDirector {
  private current: StoryInstance | null = null;
  private serial = 0;
  private world: string | null = null;
  private facts: ReadonlySet<string> = new Set();
  private completed = new Set<string>();
  private listeners = new Set<() => void>();
  private epoch = 0;
  private finishing = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;
  constructor(
    private supported: ReadonlySet<string>,
    private emit: (fact: string) => Promise<unknown>,
  ) {}
  snapshot = () => this.current;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  sync(world: string | null, facts: ReadonlySet<string>, replacement = false) {
    if (this.disposed) return;
    if (replacement || world !== this.world) {
      this.epoch++;
      clearTimeout(this.timer);
      this.current = null;
      this.finishing = false;
      this.completed.clear();
      this.world = world;
    }
    this.facts = facts;
    if (this.current && facts.has(this.current.sentinel) && !this.finishing)
      this.current = null;
    if (!this.current && world) {
      const next = STORY_ORDER.find(
        (item) =>
          facts.has(item.trigger) &&
          !facts.has(item.sentinel) &&
          !this.completed.has(item.id),
      );
      // Do not skip an earlier unrecovered scene or record completion on its behalf.
      this.current =
        next && this.supported.has(next.id)
          ? { ...next, instance: ++this.serial }
          : null;
    }
    this.listeners.forEach((listener) => listener());
  }
  complete = (expected = this.current, onAcknowledged?: () => void) => {
    if (
      !expected ||
      expected !== this.current ||
      this.finishing ||
      this.disposed
    )
      return;
    const scene = this.current,
      epoch = this.epoch;
    this.finishing = true;
    const attempt = async () => {
      try {
        await this.emit(scene.sentinel);
        if (this.disposed || epoch !== this.epoch || this.current !== scene)
          return;
        this.completed.add(scene.id);
        this.timer = setTimeout(() => {
          this.finishing = false;
          this.current = null;
          this.sync(this.world, this.facts);
        }, 1500);
        // Reload/handoff belongs after server acknowledgement, never after a
        // stale world response. A consumer failure must not resubmit the fact.
        try {
          onAcknowledged?.();
        } catch (error) {
          console.error("[StoryDirector] acknowledgement handoff", error);
        }
      } catch {
        if (!this.disposed && epoch === this.epoch)
          this.timer = setTimeout(attempt, 2000);
      }
    };
    void attempt();
  };
  dispose() {
    this.disposed = true;
    this.epoch++;
    clearTimeout(this.timer);
    this.listeners.clear();
    this.current = null;
  }
}
