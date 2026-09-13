import { z } from "zod";
import type { ArcadeClient } from "./arcade-client";
import { EventRpcClient } from "./event-rpc";
import type { WindowRect } from "../state/window-types";

export const chipStatusSchema = z.object({
  capacity: z.number().int().positive(),
  heat: z.number().int().nonnegative(),
  coolEveryMs: z.number().int().positive(),
  nextCoolAtMs: z.number().positive().optional(),
  serverNowMs: z.number().positive(),
});
const resultSchema = z.object({
  kind: z.enum(["readout", "unsupported", "fried"]),
  text: z.string().min(1),
});
export type ChipStatus = z.infer<typeof chipStatusSchema>;
export function chipCharge(
  status: ChipStatus | null,
  receivedAt: number,
  now: number,
) {
  if (!status) return { charges: 0, capacity: 0, nextChargeInMs: 0 };
  const deadline =
    status.nextCoolAtMs === undefined
      ? undefined
      : status.nextCoolAtMs + receivedAt - status.serverNowMs;
  const cooled =
    deadline !== undefined && now >= deadline
      ? Math.min(
          status.heat,
          1 + Math.floor((now - deadline) / status.coolEveryMs),
        )
      : 0;
  const heat = status.heat - cooled;
  return {
    charges: Math.max(0, status.capacity - heat),
    capacity: status.capacity,
    nextChargeInMs:
      heat && deadline !== undefined
        ? Math.max(0, deadline + cooled * status.coolEveryMs - now)
        : 0,
  };
}
export interface ChipTarget extends WindowRect {
  instanceId: string;
  appId: string;
  windowType: string;
  title: string;
  contentKey: string;
}
export function chipAvailability(
  appId: string,
  upgraded: boolean,
): "ready" | "low_power" | "unscannable" {
  if (["mail", "files", "preview", "nori"].includes(appId)) return "ready";
  if (["browser", "signal", "terminal"].includes(appId))
    return upgraded ? "ready" : "low_power";
  return "unscannable";
}
export interface ChipSnapshot {
  phase: "idle" | "picking" | "scanning";
  target: ChipTarget | null;
  fried: boolean;
  status: ChipStatus | null;
  receivedAt: number;
  readout: { text: string; receivedAt: number } | null;
}
/** Owns status skew correction, scan epoch fencing and connection teardown. */
export class ChipController {
  private state: ChipSnapshot = {
    phase: "idle",
    target: null,
    fried: false,
    status: null,
    receivedAt: 0,
    readout: null,
  };
  private listeners = new Set<() => void>();
  private rpc: EventRpcClient;
  private unsubscribe: Array<() => void> = [];
  private epoch = 0;
  private statusRevision = 0;
  private disposed = false;
  private timers = new Map<ReturnType<typeof setTimeout>, () => void>();
  private worldId: string | null = null;
  private enabled = false;
  readonly contentKeys = new Map<string, string>();
  constructor(
    private arcade: ArcadeClient,
    private failedText: () => string,
  ) {
    this.rpc = new EventRpcClient(arcade, 5000);
    this.unsubscribe.push(
      arcade.onMessage((message) => {
        if (
          message.type === "event" &&
          message.channel === "manifold.chip.status.changed"
        ) {
          this.statusRevision++;
          this.consumeStatus(message.payload);
        }
      }),
    );
    this.unsubscribe.push(
      arcade.onState((state) => {
        if (state === "open") void this.refresh();
        else {
          this.statusRevision++;
          this.cancel(true);
          this.update({ status: null });
        }
      }),
    );
  }
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  setContentKey = (id: string, key: string | null) => {
    if (key) this.contentKeys.set(id, key);
    else this.contentKeys.delete(id);
  };
  private update(patch: Partial<ChipSnapshot>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  configure(worldId: string | null, enabled: boolean) {
    const changed = worldId !== this.worldId;
    if (changed) {
      this.cancel(true);
      this.statusRevision++;
      this.update({ status: null });
    }
    this.worldId = worldId;
    this.enabled = enabled;
    if (!enabled) this.cancel();
    if (changed && worldId) void this.refresh();
  }
  private consumeStatus(raw: unknown) {
    const result = chipStatusSchema.safeParse(raw);
    if (result.success)
      this.update({ status: result.data, receivedAt: Date.now() });
  }
  async refresh() {
    if (this.disposed || this.arcade.connectionState !== "open") return;
    const revision = ++this.statusRevision;
    try {
      const status = await this.rpc.call("manifold.chip.status");
      if (revision === this.statusRevision) this.consumeStatus(status);
    } catch {
      /* Reconnect and artifact changes retry status. */
    }
  }
  toggle(): boolean {
    if (this.state.phase === "picking") {
      this.cancel();
      return true;
    }
    if (
      !this.enabled ||
      this.state.phase !== "idle" ||
      chipCharge(this.state.status, this.state.receivedAt, Date.now())
        .charges <= 0
    )
      return false;
    this.update({ phase: "picking" });
    return true;
  }
  cancel(clearReadout = false) {
    this.epoch++;
    for (const [timer, resolve] of this.timers) {
      clearTimeout(timer);
      resolve();
    }
    this.timers.clear();
    this.update({
      phase: "idle",
      target: null,
      fried: false,
      ...(clearReadout ? { readout: null } : {}),
    });
  }
  readout(text: string) {
    this.update({ readout: { text, receivedAt: Date.now() } });
  }
  private delay(ms: number) {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        resolve();
      }, ms);
      this.timers.set(timer, resolve);
    });
  }
  async scan(target: ChipTarget) {
    if (!this.enabled || this.state.phase !== "picking") return;
    const epoch = ++this.epoch;
    this.update({ phase: "scanning", target, fried: false });
    const minimum = this.delay(1400);
    try {
      const { appId, windowType, contentKey, title } = target;
      const [raw] = await Promise.all([
        this.rpc.call("manifold.chip.scan", {
          appId,
          windowType,
          contentKey,
          title,
        }),
        minimum,
      ]);
      if (epoch !== this.epoch || this.disposed) return;
      const result = resultSchema.parse(raw);
      if (result.kind === "fried") {
        this.update({ fried: true });
        await this.delay(700);
      }
      if (epoch !== this.epoch || this.disposed) return;
      this.readout(result.text);
    } catch {
      await minimum;
      if (epoch !== this.epoch || this.disposed) return;
      this.readout(this.failedText());
    }
    if (epoch === this.epoch && !this.disposed) {
      this.update({ phase: "idle", target: null, fried: false });
      void this.refresh();
    }
  }
  dispose() {
    this.cancel(true);
    this.disposed = true;
    this.statusRevision++;
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.rpc.dispose();
    this.listeners.clear();
    this.contentKeys.clear();
  }
}
