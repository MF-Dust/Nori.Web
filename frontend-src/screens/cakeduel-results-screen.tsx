import { memo } from "react";
import { RotateCcw } from "lucide-react";
import { CAKEDUEL_PALETTE } from "../apps/cakeduel-card-presentation";
import { useElementSize } from "../hooks/use-element-size";
import type { CakeDuelTranslate } from "./cakeduel-hud";

export interface CakeDuelResultsScreenProps {
  winner: number | null;
  playerWins: number;
  noriWins: number;
  roundsToWin: number;
  pending?: boolean;
  backgroundImage: string;
  translate: CakeDuelTranslate;
  onPlayAgain(): void;
}

function ScoreDots({ wins, total, color }: { wins: number; total: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: Math.max(total, wins) }, (_, index) => (
        <span
          key={index}
          className="rounded-full"
          style={{
            width: 10,
            height: 10,
            background: index < wins ? color : `${CAKEDUEL_PALETTE.brown}30`,
            boxShadow: index < wins ? `0 0 6px ${color}80` : "none",
          }}
        />
      ))}
    </div>
  );
}

/** Source-owned ResultsScreen-Bwv4Qh4p.js route. */
export const CakeDuelResultsScreen = memo(function CakeDuelResultsScreen({
  winner,
  playerWins,
  noriWins,
  roundsToWin,
  pending = false,
  backgroundImage,
  translate,
  onPlayAgain,
}: CakeDuelResultsScreenProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const compact = size.height > 0 && size.height < 520;
  const interpolation = Math.min(1, Math.max(0, (size.height - 400) / 240));
  const victory = winner === 0;
  const title = translate(
    winner === 0
      ? "cakeduel.results.youWin"
      : winner === 1
        ? "cakeduel.results.noriWins"
        : "cakeduel.results.noWinner",
  );

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden" data-cakeduel-screen="results">
      <img src={backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div
        className="absolute inset-0"
        style={{
          background: victory
            ? `radial-gradient(ellipse 70% 60% at 50% 45%, ${CAKEDUEL_PALETTE.gold}40 0%, transparent 70%), linear-gradient(180deg, ${CAKEDUEL_PALETTE.sky}70 0%, ${CAKEDUEL_PALETTE.sky}40 40%, ${CAKEDUEL_PALETTE.peach}30 100%)`
            : `radial-gradient(ellipse 70% 60% at 50% 45%, ${CAKEDUEL_PALETTE.sky}50 0%, transparent 70%), linear-gradient(180deg, ${CAKEDUEL_PALETTE.sky}60 0%, ${CAKEDUEL_PALETTE.brownLight}30 60%, ${CAKEDUEL_PALETTE.brown}40 100%)`,
          boxShadow: "inset 0 0 100px 30px rgba(40,60,80,0.5)",
        }}
      />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4" style={{ gap: 6 + 6 * interpolation }}>
        <h1
          className="text-center leading-none"
          style={{
            fontFamily: "'Lilita One', sans-serif",
            fontSize: 26 + 12 * interpolation,
            background: victory
              ? `linear-gradient(180deg, ${CAKEDUEL_PALETTE.cream} 0%, ${CAKEDUEL_PALETTE.gold} 45%, ${CAKEDUEL_PALETTE.peach} 75%, ${CAKEDUEL_PALETTE.peachDeep} 100%)`
              : "linear-gradient(180deg, #ffffff 0%, #d0ccc8 45%, #9a9490 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: victory
              ? `drop-shadow(0 2px 0 ${CAKEDUEL_PALETTE.peachDeep}) drop-shadow(0 4px 10px rgba(200,160,20,0.5))`
              : "drop-shadow(0 2px 0 #6a6460) drop-shadow(0 4px 10px rgba(60,55,50,0.45))",
          }}
        >{title}</h1>

        <div
          className="w-full max-w-[280px] rounded-2xl overflow-hidden backdrop-blur-md"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.40) 50%, rgba(255,255,255,0.55))",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          <div className={compact ? "px-4 pt-2.5 pb-3.5 space-y-2" : "px-5 pt-4 pb-5 space-y-3"}>
            <div className="flex items-center justify-center gap-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CAKEDUEL_PALETTE.brownLight }}>{translate("cakeduel.results.playerLabel")}</span>
                <ScoreDots wins={playerWins} total={roundsToWin} color={CAKEDUEL_PALETTE.gold} />
              </div>
              <span className="text-xs font-bold" style={{ color: CAKEDUEL_PALETTE.brownLight }}>vs</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CAKEDUEL_PALETTE.brownLight }}>{translate("cakeduel.results.noriLabel")}</span>
                <ScoreDots wins={noriWins} total={roundsToWin} color={CAKEDUEL_PALETTE.pink} />
              </div>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={onPlayAgain}
              className="w-full rounded-xl flex items-center justify-center gap-2 px-4 py-2 font-extrabold disabled:opacity-50"
              style={{ background: `linear-gradient(180deg, ${CAKEDUEL_PALETTE.peachLight}, ${CAKEDUEL_PALETTE.peach})`, color: CAKEDUEL_PALETTE.brown }}
            >
              <RotateCcw size={18} /> {translate("cakeduel.results.playAgain")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
