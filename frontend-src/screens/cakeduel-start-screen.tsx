import { memo, useMemo } from "react";
import { BookOpen, Swords } from "lucide-react";
import { CAKEDUEL_PALETTE } from "../apps/cakeduel-card-presentation";
import type { CakeDuelDifficulty } from "../apps/cakeduel-runtime";
import { useElementSize } from "../hooks/use-element-size";
import type { CakeDuelTranslate } from "./cakeduel-hud";

const DIFFICULTIES: readonly CakeDuelDifficulty[] = ["soldier", "wizard", "assassin"];
const DIFFICULTY_COLORS: Record<CakeDuelDifficulty, string> = {
  soldier: "#C8872A",
  wizard: "#F49187",
  assassin: "#5B4A6A",
};

export interface CakeDuelStartScreenProps {
  difficulty: CakeDuelDifficulty;
  mounted: boolean;
  pending?: boolean;
  backgroundImage: string;
  translate: CakeDuelTranslate;
  resolveCardIcon: (name: string) => string;
  onDifficultyChange: (difficulty: CakeDuelDifficulty) => void;
  onStart: () => void;
  onTutorial: () => void;
  onHelp: () => void;
}

/** Source-owned StartScreen-DwCccaJ0.js route. */
export const CakeDuelStartScreen = memo(function CakeDuelStartScreen({
  difficulty,
  mounted,
  pending = false,
  backgroundImage,
  translate,
  resolveCardIcon,
  onDifficultyChange,
  onStart,
  onTutorial,
  onHelp,
}: CakeDuelStartScreenProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const compact = size.height > 0 && size.height < 520;
  const interpolation = Math.min(1, Math.max(0, (size.height - 400) / 240));
  const disabled = !mounted || pending;
  const titleStyle = useMemo(() => ({
    fontFamily: "'Lilita One', sans-serif",
    fontSize: 26 + 16 * interpolation,
    background: `linear-gradient(180deg, ${CAKEDUEL_PALETTE.cream} 0%, ${CAKEDUEL_PALETTE.gold} 45%, ${CAKEDUEL_PALETTE.peach} 75%, ${CAKEDUEL_PALETTE.peachDeep} 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    filter: `drop-shadow(0 2px 0 ${CAKEDUEL_PALETTE.peachDeep}) drop-shadow(0 4px 10px rgba(60,40,20,0.55))`,
  }), [interpolation]);

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden" data-cakeduel-screen="start">
      <img src={backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${CAKEDUEL_PALETTE.sky}60 0%, transparent 70%), linear-gradient(180deg, ${CAKEDUEL_PALETTE.sky}80 0%, ${CAKEDUEL_PALETTE.sky}50 40%, ${CAKEDUEL_PALETTE.peach}30 100%)`,
          boxShadow: "inset 0 0 100px 30px rgba(40,60,80,0.5)",
        }}
      />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4" style={{ gap: 6 + 6 * interpolation }}>
        <h1 className="text-center leading-none" style={titleStyle}>{translate("cakeduel.title")}</h1>
        <div
          className="w-full max-w-[310px] rounded-2xl overflow-hidden backdrop-blur-md"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.40) 50%, rgba(255,255,255,0.55))",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          <div className={compact ? "px-4 pt-2.5 pb-3.5 space-y-2" : "px-5 pt-4 pb-5 space-y-3"}>
            <div className="text-center text-[11px] font-semibold uppercase tracking-widest" style={{ color: CAKEDUEL_PALETTE.brownLight }}>
              {translate("cakeduel.start.difficulty")}
            </div>
            <div className="flex gap-2">
              {DIFFICULTIES.map((item) => {
                const selected = item === difficulty;
                const color = DIFFICULTY_COLORS[item];
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onDifficultyChange(item)}
                    className="flex-1 rounded-xl px-1 py-1.5 flex flex-col items-center gap-0.5"
                    style={{
                      border: selected ? `2px solid ${color}` : "2px solid rgba(255,255,255,0.2)",
                      background: selected ? `${color}26` : "rgba(255,255,255,0.15)",
                      color: CAKEDUEL_PALETTE.brown,
                    }}
                  >
                    <img src={resolveCardIcon(item)} alt="" draggable={false} style={{ width: compact ? 28 : 36, height: compact ? 28 : 36, objectFit: "contain" }} />
                    <span className="text-xs font-extrabold">{translate(`cakeduel.start.difficulty_${item}`)}</span>
                    <span className="text-[9px] font-bold uppercase opacity-60">{translate(`cakeduel.start.difficulty_${item}_caption`)}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={onStart}
              className="w-full rounded-xl flex items-center justify-center gap-2 px-4 py-2 font-extrabold disabled:opacity-50"
              style={{ background: `linear-gradient(180deg, ${CAKEDUEL_PALETTE.peachLight}, ${CAKEDUEL_PALETTE.peach})`, color: CAKEDUEL_PALETTE.brown }}
            >
              <Swords size={18} /> {translate("cakeduel.start.startGame")}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={onTutorial}
                className="flex-1 rounded-xl flex items-center justify-center gap-2 px-4 py-2 font-extrabold disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.35)", border: `1.5px solid ${CAKEDUEL_PALETTE.sky}`, color: CAKEDUEL_PALETTE.brown }}
              >
                <BookOpen size={16} /> {translate("cakeduel.start.tutorial")}
              </button>
              <button
                type="button"
                onClick={onHelp}
                aria-label={translate("cakeduel.help.button")}
                className="shrink-0 rounded-xl px-3 py-2 font-extrabold"
                style={{ background: "rgba(255,255,255,0.35)", border: `1.5px solid ${CAKEDUEL_PALETTE.sky}`, color: CAKEDUEL_PALETTE.brown }}
              >?</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
