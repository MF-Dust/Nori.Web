import { useEffect, useState, type ReactNode } from "react";
import { isRecoveredFile, type FilesRecoveredFile } from "../apps/files";
import {
  getEffectiveDesktopCompute,
  type DesktopComputeState,
} from "../state/compute-runtime";

export interface QfrDockRuntime {
  computeState(): DesktopComputeState;
  facts(): ReadonlySet<string>;
  subscribe?: (listener: () => void) => () => void;
  suspended?: () => boolean;
}

export interface QfrDockViewProps {
  files: readonly FilesRecoveredFile[];
  facts: ReadonlySet<string>;
  computeState: DesktopComputeState;
  suspended?: boolean;
}

function useRuntimeVersion(runtime: QfrDockRuntime): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!runtime.subscribe) return;
    return runtime.subscribe(() => setVersion((value) => value + 1));
  }, [runtime]);
  return version;
}

function compactCompute(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  if (Math.abs(value) < 1_000) return String(Math.round(value));
  return value.toExponential(2).replace("e+", "e");
}

function qfrHints(facts: ReadonlySet<string>, atCap: boolean): string[] {
  const rows: string[] = [];
  if (atCap) rows.push("compute limit reached · recovery growth paused");
  else rows.push("compute growth active");

  if (facts.has("arg.seal_released")) rows.push("authentication branch released");
  else if (facts.has("recover.seal_config")) rows.push("authentication branch detected");

  if (facts.has("arg.gestures_complete")) rows.push("over-limit interaction branch released");
  else if (facts.has("recover.overclock_log")) rows.push("over-limit interaction pattern detected");

  if (facts.has("arg.honeypot_access")) rows.push("external compute channel active");
  else if (facts.has("driftnet.bounty.read")) rows.push("external compute source detected");

  if (facts.has("cult.unpacked")) rows.push("cognitive parasite branch released");
  else if (facts.has("cult.zip.downloaded")) rows.push("protected archive branch detected");

  return rows;
}

export function QfrDockView({
  files,
  facts,
  computeState,
  suspended = false,
}: QfrDockViewProps) {
  const effective = getEffectiveDesktopCompute(computeState);
  const thresholds = [...new Set(
    files
      .map((file) => file.threshold)
      .filter((threshold): threshold is number => typeof threshold === "number" && Number.isFinite(threshold)),
  )].sort((left, right) => left - right);

  const recovered = files.filter(isRecoveredFile).length;
  const complete = files.length > 0 && recovered === files.length;
  const atCap = Number.isFinite(effective.cap) && effective.compute >= effective.cap;
  const status = suspended ? "SUSP" : complete ? "DONE" : "RUN";
  const nextThreshold = thresholds.find((threshold) => threshold > effective.compute);
  const hints = qfrHints(facts, atCap);

  return (
    <aside
      className={`qfr-dock${suspended ? " qfr-suspended" : ""} border-t border-emerald-400/20 bg-[#03100d] px-3 py-2 font-mono text-[11px] text-emerald-200`}
      aria-label="QUANTUM FILE RECOVERY 9000"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
        <div className="truncate text-emerald-300">
          QUANTUM FILE RECOVERY 9000 · RSRCH-COLD-VOL
        </div>
        <div className="font-semibold text-emerald-100">{status}</div>

        <div className="truncate text-emerald-200/70">
          qfr.recover · {recovered}/{files.length} files
        </div>
        <div className="tabular-nums text-emerald-200/80">
          q {compactCompute(effective.compute)}
        </div>

        <div className="col-span-2 grid gap-0.5 border-t border-emerald-300/10 pt-1 text-emerald-100/70">
          {hints.slice(0, 3).map((hint) => <div key={hint} className="truncate">{hint}</div>)}
          {nextThreshold != null ? (
            <div className="truncate text-cyan-200/80">
              next reconstruction threshold · {compactCompute(nextThreshold)}
            </div>
          ) : null}
          {effective.draining ? (
            <div className="truncate text-amber-200/80">
              compute drain active · effective cap {compactCompute(effective.cap)}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function QfrDock({ files, runtime }: { files: readonly FilesRecoveredFile[]; runtime: QfrDockRuntime }) {
  useRuntimeVersion(runtime);
  return (
    <QfrDockView
      files={files}
      facts={runtime.facts()}
      computeState={runtime.computeState()}
      suspended={runtime.suspended?.() ?? false}
    />
  );
}

export function createQfrColdVolumeDockRenderer(runtime: QfrDockRuntime) {
  return (files: readonly FilesRecoveredFile[]): ReactNode => <QfrDock files={files} runtime={runtime} />;
}
