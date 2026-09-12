import { memo, useMemo } from "react";
import { BookOpen, Swords } from "lucide-react";
import { CAKEDUEL_PALETTE } from "../apps/cakeduel-card-presentation";
import type { CakeDuelDifficulty } from "../apps/cakeduel-runtime";
import { useElementSize } from "../hooks/use-element-size";
import type { CakeDuelTranslate } from "./cakeduel-hud";
import {
  CakeDuelAmbientParticles,
  CakeDuelHeroFan,
  CakeDuelRouteDivider,
  CakeDuelRoutePrimaryButton,
} from "./cakeduel-route-decor";

const DIFFICULTIES: readonly CakeDuelDifficulty[] = ["soldier", "wizard", "assassin"];
const DIFFICULTY_COLORS: Record<CakeDuelDifficulty, string> = {
  soldier: "#C8872A",
  wizard: "#F49187",
  assassin: "#5B4A6A",
};

function rgba(hex: string, alpha: number): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export interface CakeDuelStartScreenProps {
  difficulty: CakeDuelDifficulty;
  mounted: boolean;
  pending?: boolean;
  backgroundImage: string;
  cardBackImage: string;
  cakeImage: string;
  translate: CakeDuelTranslate;
  resolveCardFront: (name: string, highResolution?: boolean) => string;
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
  cardBackImage,
  cakeImage,
  translate,
  resolveCardFront,
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
  const heroScale = 0.55 + 0.45 * interpolation;
  const titleStyle = useMemo(() => ({
    marginTop: 4 + 4 * interpolation,
    marginBottom: 6 + 10 * interpolation,
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
        }}
      />
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 100px 30px rgba(40,60,80,0.5)" }} />
      <CakeDuelAmbientParticles mode="start" />

      <div
        className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4"
        style={{ gap: 6 + 6 * interpolation }}
      >
        <div className="flex flex-col items-center" data-cakeduel-start-hero>
          <CakeDuelHeroFan
            scale={heroScale}
            cardBackImage={cardBackImage}
            resolveCardFront={resolveCardFront}
          />
          <h1 className="text-center leading-none" style={titleStyle}>{translate("cakeduel.title")}</h1>
        </div>

        <div
          className="w-full max-w-[310px] rounded-2xl relative overflow-hidden backdrop-blur-md"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.40) 50%, rgba(255,255,255,0.55) 100%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)",
          }}
          data-cakeduel-start-panel
        >
          <div className={compact ? "relative px-4 pt-2.5 pb-3.5 space-y-2" : "relative px-5 pt-4 pb-5 space-y-3"}>
            <CakeDuelRouteDivider compact={compact} image={cakeImage} />

            <div className="space-y-1.5">
              <div
                className="text-[11px] font-semibold uppercase tracking-widest text-center"
                style={{ color: CAKEDUEL_PALETTE.brownLight, fontFamily: "'Nunito', sans-serif" }}
              >
                {translate("cakeduel.start.difficulty")}
              </div>
              <div className="flex gap-2">
                {DIFFICULTIES.map((item) => {
                  const selected = item === difficulty;
                  const color = DIFFICULTY_COLORS[item];
                  const iconSize = compact ? 28 : 36;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onDifficultyChange(item)}
                      className="flex-1 flex flex-col items-center gap-0.5 rounded-xl overflow-hidden transition-transform hover:scale-[1.03] active:scale-[.97]"
                      style={{
                        padding: compact ? "4px 4px 5px" : "6px 4px 8px",
                        background: selected
                          ? `linear-gradient(135deg, ${rgba(color, 0.3)} 0%, ${rgba(color, 0.15)} 100%)`
                          : "rgba(255,255,255,0.15)",
                        border: selected ? `2px solid ${rgba(color, 0.7)}` : "2px solid rgba(255,255,255,0.2)",
                        boxShadow: selected
                          ? `0 2px 12px ${rgba(color, 0.25)}, inset 0 1px 0 rgba(255,255,255,0.3)`
                          : "none",
                      }}
                      data-cakeduel-difficulty={item}
                      data-selected={selected || undefined}
                    >
                      <img
                        src={resolveCardIcon(item)}
                        alt=""
                        draggable={false}
                        style={{
                          width: iconSize,
                          height: iconSize,
                          marginBottom: compact ? 2 : 4,
                          objectFit: "contain",
                          transform: selected ? "scale(1.1)" : undefined,
                          filter: selected
                            ? `drop-shadow(0 2px 4px ${rgba(color, 0.5)})`
                            : "grayscale(0.6) brightness(0.8)",
                          transition: "transform 180ms cubic-bezier(.2,.8,.2,1), filter 180ms ease",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: selected ? 800 : 700,
                          fontSize: compact ? 12 : 13,
                          lineHeight: 1.1,
                          color: selected ? CAKEDUEL_PALETTE.brown : CAKEDUEL_PALETTE.brownLight,
                        }}
                      >
                        {translate(`cakeduel.start.difficulty_${item}`)}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: 700,
                          fontSize: 9,
                          color: selected ? CAKEDUEL_PALETTE.brown : CAKEDUEL_PALETTE.brownLight,
                          opacity: selected ? 0.7 : 0.5,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {translate(`cakeduel.start.difficulty_${item}_caption`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <CakeDuelRoutePrimaryButton
              compact={compact}
              disabled={disabled}
              fontSize={compact ? 16 : 20}
              icon={<Swords className="h-5 w-5" />}
              onClick={onStart}
            >
              {translate("cakeduel.start.startGame")}
            </CakeDuelRoutePrimaryButton>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={onTutorial}
                className={`${compact ? "py-1.5" : "py-2"} flex-1 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[.98] disabled:opacity-50`}
                style={{
                  background: "rgba(255,255,255,0.35)",
                  border: `1.5px solid ${rgba(CAKEDUEL_PALETTE.sky, 0.55)}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px ${rgba(CAKEDUEL_PALETTE.sky, 0.2)}`,
                  color: CAKEDUEL_PALETTE.brown,
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: compact ? 13 : 14,
                }}
              >
                <BookOpen className="h-4 w-4" /> {translate("cakeduel.start.tutorial")}
              </button>
              <button
                type="button"
                onClick={onHelp}
                aria-label={translate("cakeduel.help.button")}
                className={`${compact ? "py-1.5" : "py-2"} shrink-0 px-3 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
                style={{
                  background: "rgba(255,255,255,0.35)",
                  border: `1.5px solid ${rgba(CAKEDUEL_PALETTE.sky, 0.55)}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px ${rgba(CAKEDUEL_PALETTE.sky, 0.2)}`,
                  color: CAKEDUEL_PALETTE.brown,
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: compact ? 13 : 14,
                }}
              >?</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
