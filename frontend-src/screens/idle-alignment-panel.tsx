import { Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  IDLE_MANIFOLD_UNLOCKED_FACT,
  type IdleAlignment,
  type IdleAlignmentDefinition,
  type IdlePresentationModel,
  type IdlePresentationSnapshot,
} from "../apps/idle";
import { formatDesktopCompute } from "../state/compute-runtime";

const ALIGNMENT_TONES = {
  none: "#67e8f9",
  accelerate: "#f87171",
  decelerate: "#a3e635",
  equilibrium: "#a5f3fc",
} as const;

interface AlignmentAvailability {
  redacted: boolean;
  paradigmLocked: boolean;
  ready: boolean;
  committable: boolean;
}

function alignmentAvailability(
  alignment: IdleAlignmentDefinition,
  snapshot: IdlePresentationSnapshot,
): AlignmentAvailability {
  const facts = snapshot.state.facts;
  const redacted = alignment.unlockFact != null && !facts[alignment.unlockFact];
  const paradigmLocked =
    !!facts[IDLE_MANIFOLD_UNLOCKED_FACT] && alignment.unlockFact == null;
  const ready =
    alignment.unlockFact != null
      ? !!facts[alignment.unlockFact]
      : snapshot.state.compute >= alignment.cost;
  return {
    redacted,
    paradigmLocked,
    ready,
    committable: !redacted && !paradigmLocked && ready,
  };
}

function firstAlignment(
  alignments: readonly IdleAlignmentDefinition[],
  snapshot: IdlePresentationSnapshot,
): string {
  return (
    alignments.find((alignment) => alignmentAvailability(alignment, snapshot).committable)?.id ??
    alignments[0]?.id ??
    ""
  );
}

export function IdleAlignmentPanel({
  runtime,
  snapshot,
}: {
  runtime: Pick<IdlePresentationModel, "buyProof">;
  snapshot: IdlePresentationSnapshot;
}) {
  const [selectedId, setSelectedId] = useState(() => firstAlignment(snapshot.alignments, snapshot));
  const selected =
    snapshot.alignments.find((alignment) => alignment.id === selectedId) ?? snapshot.alignments[0];

  useEffect(() => {
    if (selected && snapshot.alignments.some((alignment) => alignment.id === selectedId)) return;
    setSelectedId(firstAlignment(snapshot.alignments, snapshot));
  }, [selected, selectedId, snapshot]);

  const availability = useMemo(
    () => (selected ? alignmentAvailability(selected, snapshot) : null),
    [selected, snapshot],
  );

  if (!selected || !availability) return null;

  const tone = availability.redacted ? "#64748b" : ALIGNMENT_TONES[selected.id];
  const status = availability.redacted ? (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <Lock className="size-3" /> 尚未解锁
    </span>
  ) : availability.paradigmLocked ? (
    <span className="text-slate-400">此立场已封闭</span>
  ) : selected.unlockFact ? (
    <span style={{ color: tone }}>已满足条件</span>
  ) : (
    <span className="text-amber-200">{formatDesktopCompute(selected.cost)} 算力</span>
  );
  const actionLabel = availability.redacted
    ? "尚未解锁"
    : availability.paradigmLocked
      ? "此立场已封闭"
      : `选择「${selected.short}」`;

  return (
    <section
      data-test="alignment-panel"
      className="border-2 bg-black/90 text-white shadow-2xl"
      style={{ borderColor: tone }}
    >
      <div className="grid grid-cols-3 gap-1 px-2 pt-2">
        {snapshot.alignments.map((alignment) => {
          const item = alignmentAvailability(alignment, snapshot);
          const itemTone = item.redacted ? "#64748b" : ALIGNMENT_TONES[alignment.id];
          const active = alignment.id === selected.id;
          return (
            <button
              type="button"
              key={alignment.id}
              onClick={() => setSelectedId(alignment.id)}
              className="flex min-w-0 items-center justify-center gap-1 border-2 px-1 py-1.5 text-[10px]"
              style={{
                color: itemTone,
                borderColor: active ? itemTone : "#111827",
                background: active ? `${itemTone}18` : "rgba(255,255,255,.025)",
                boxShadow: active
                  ? `inset 2px 2px 0 ${itemTone}22, inset -2px -2px 0 rgba(0,0,0,.45)`
                  : "inset -2px -2px 0 rgba(0,0,0,.45), inset 2px 2px 0 rgba(255,255,255,.08)",
              }}
            >
              {item.redacted ? <Lock className="size-3 shrink-0" /> : null}
              <span className="truncate">{item.redacted ? "???" : alignment.short}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 px-2.5 py-3">
        <div className="flex items-start gap-2">
          <span
            className="min-w-0 flex-1 text-[18px] font-semibold leading-none"
            style={{
              color: tone,
              filter:
                !availability.redacted && selected.id === "equilibrium"
                  ? "drop-shadow(0 0 2px rgba(165,243,252,.7)) drop-shadow(0 0 8px rgba(34,211,238,.45))"
                  : undefined,
            }}
          >
            {availability.redacted ? "？？？" : selected.proofName}
          </span>
          <span className="shrink-0 text-[10px]">{status}</span>
        </div>

        <div
          className={`text-[10px] leading-snug ${availability.redacted ? "opacity-50" : "opacity-80"}`}
          style={availability.redacted ? { wordBreak: "break-all" } : undefined}
        >
          {availability.redacted
            ? "？？？？？？？？？？？？？？？？？？？？？？？？？？？？"
            : selected.description}
        </div>
        <div
          className={`border-l-2 pl-2 text-[10px] italic leading-snug ${
            availability.redacted ? "opacity-40" : "opacity-60"
          }`}
          style={{
            borderColor: availability.redacted ? "#334155" : `${tone}99`,
            ...(availability.redacted ? { wordBreak: "break-all" as const } : {}),
          }}
        >
          {availability.redacted ? "？？？？？？？？？？？？……" : selected.flavor}
        </div>
      </div>

      <div className="border-t-2 border-white/10 px-2.5 pb-2.5 pt-2">
        <button
          type="button"
          disabled={!availability.committable}
          onClick={() => runtime.buyProof(selected.id as IdleAlignment)}
          className="w-full border-2 px-2 py-2 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: tone, color: tone }}
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
