import { Zap } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  type IdlePresentationModel,
  type IdlePresentationSnapshot,
  type IdleSkillDefinition,
} from "../apps/idle";
import { formatDesktopCompute } from "../state/compute-runtime";

const UNIVERSAL_SKILL_TINT = "#67e8f9";

function formatScalar(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function describeSkill(skill: IdleSkillDefinition): string {
  const effect = skill.effect;
  const cooldown = typeof skill.cooldownSec === "number" ? `冷却 ${skill.cooldownSec} 秒` : "";
  const duration =
    typeof skill.durationSec === "number"
      ? skill.durationSec <= 0
        ? "瞬发"
        : `持续 ${Math.round(skill.durationSec)} 秒`
      : "";
  if (!effect) return skill.description ?? [duration, cooldown].filter(Boolean).join("，");

  const kind = effect.kind;
  if (kind === "prodBuff" && typeof effect.magnitude === "number") {
    const targets: Record<string, string> = {
      all: "全部算力源",
      accel: "加速算力源",
      decel: "减速算力源",
      flagship: "旗舰算力源",
    };
    const target = typeof effect.target === "string" ? effect.target : "all";
    return `${targets[target] ?? "全部算力源"}产出 ×${formatScalar(effect.magnitude)}${duration ? `，${duration}` : ""}${cooldown ? `，${cooldown}` : ""}`;
  }
  if (kind === "clickBuff" && typeof effect.magnitude === "number") {
    return `点击收益 ×${formatScalar(effect.magnitude)}${duration ? `，${duration}` : ""}${cooldown ? `，${cooldown}` : ""}`;
  }
  if (kind === "lump" && typeof effect.seconds === "number") {
    return `立即结算 ${formatScalar(effect.seconds)} 秒的产出${cooldown ? `，${cooldown}` : ""}`;
  }
  return skill.description ?? [duration, cooldown].filter(Boolean).join("，");
}

function SkillButton({
  runtime,
  snapshot,
  skill,
  tint,
  reserveBar,
}: {
  runtime: Pick<IdlePresentationModel, "fireSkill">;
  snapshot: IdlePresentationSnapshot;
  skill: IdleSkillDefinition;
  tint: string;
  reserveBar: boolean;
}) {
  const cooldown = Math.max(0, snapshot.state.skillCooldownSec[skill.id] ?? 0);
  const activeBuff = snapshot.state.activeSkillBuffs.find((buff) => buff.id === skill.id);
  const active = activeBuff != null;
  const [gains, setGains] = useState<{ id: number; text: string }[]>([]);
  const nextGainId = useRef(0);

  const fire = useCallback(() => {
    if (cooldown > 0) return;
    const gained = runtime.fireSkill(skill.id);
    if (gained <= 0) return;
    const id = nextGainId.current++;
    setGains((current) => [...current.slice(-5), { id, text: `+${formatDesktopCompute(gained)}` }]);
    window.setTimeout(() => {
      setGains((current) => current.filter((item) => item.id !== id));
    }, 1_000);
  }, [cooldown, runtime, skill.id]);

  const cooldownTotal = Math.max(0, skill.cooldownSec ?? 0);
  const cooldownRatio = cooldownTotal > 0 ? Math.min(1, cooldown / cooldownTotal) : 0;
  const duration = activeBuff?.durationSec ?? skill.durationSec ?? 0;
  const remaining = activeBuff?.remainingSec;
  const activeRatio =
    active && duration > 0 && typeof remaining === "number"
      ? Math.max(0, Math.min(1, remaining / duration))
      : active
        ? 1
        : 0;

  return (
    <div className="relative flex w-12 flex-col items-center" title={`${skill.name ?? skill.id}\n${describeSkill(skill)}`}>
      <button
        type="button"
        onClick={fire}
        disabled={cooldown > 0}
        className="relative size-11 overflow-hidden border-2 bg-black/65 disabled:cursor-not-allowed"
        style={{
          borderColor: active ? tint : `${tint}88`,
          color: tint,
          boxShadow: active ? `0 0 12px ${tint}66, inset 0 0 10px ${tint}22` : undefined,
        }}
        aria-label={skill.name ?? skill.id}
      >
        <span className="absolute inset-0 grid place-items-center text-[12px] font-semibold">
          {skill.icon ? skill.icon.slice(0, 2).toUpperCase() : <Zap className="size-4" />}
        </span>
        {cooldownRatio > 0 ? (
          <span
            className="absolute inset-x-0 bottom-0 bg-black/70"
            style={{ height: `${cooldownRatio * 100}%` }}
          />
        ) : null}
        {cooldown > 0 ? (
          <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-white">
            {Math.ceil(cooldown)}
          </span>
        ) : null}
      </button>

      {reserveBar ? (
        <div className="mt-1 h-1 w-11 overflow-hidden border border-white/10 bg-black/60">
          {active ? (
            <div
              className="h-full origin-left"
              style={{ width: `${activeRatio * 100}%`, background: tint }}
            />
          ) : null}
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2">
        {gains.map((gain, index) => (
          <div
            key={gain.id}
            className="absolute left-1/2 whitespace-nowrap text-[10px] font-semibold"
            style={{ color: tint, transform: `translate(-50%, ${-index * 12}px)` }}
          >
            {gain.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdleSkillBar({
  runtime,
  snapshot,
}: {
  runtime: Pick<IdlePresentationModel, "fireSkill">;
  snapshot: IdlePresentationSnapshot;
}) {
  const skills = useMemo(
    () =>
      snapshot.skills.filter(
        (skill) =>
          skill.scope === "universal" || skill.scope === snapshot.state.affiliatedFaction,
      ),
    [snapshot.skills, snapshot.state.affiliatedFaction],
  );
  const factionTints = useMemo(
    () => Object.fromEntries(snapshot.factions.map((faction) => [faction.id, faction.accent])),
    [snapshot.factions],
  );
  const reserveBar = skills.some((skill) =>
    snapshot.state.activeSkillBuffs.some((buff) => buff.id === skill.id),
  );

  if (skills.length === 0) return null;

  return (
    <div
      className="flex items-start gap-2.5 border-2 border-white/15 bg-black/65 px-3 py-1.5"
      style={{
        boxShadow:
          "inset -2px -2px 0 rgba(0,0,0,.55), inset 2px 2px 0 rgba(103,232,249,.10), 3px 3px 0 rgba(0,0,0,.5)",
      }}
    >
      {skills.map((skill) => (
        <SkillButton
          key={skill.id}
          runtime={runtime}
          snapshot={snapshot}
          skill={skill}
          tint={
            skill.scope === "universal"
              ? UNIVERSAL_SKILL_TINT
              : factionTints[skill.scope ?? ""] ?? UNIVERSAL_SKILL_TINT
          }
          reserveBar={reserveBar}
        />
      ))}
    </div>
  );
}
