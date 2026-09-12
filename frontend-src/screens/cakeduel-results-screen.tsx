import { memo } from "react";
import { RotateCcw } from "lucide-react";
import { CAKEDUEL_PALETTE } from "../apps/cakeduel-card-presentation";
import { useElementSize } from "../hooks/use-element-size";
import type { CakeDuelTranslate } from "./cakeduel-hud";
import {
  CakeDuelAmbientParticles,
  CakeDuelHeroFan,
  CakeDuelRouteDivider,
  CakeDuelRoutePrimaryButton,
} from "./cakeduel-route-decor";

export interface CakeDuelResultsScreenProps {
  winner: number | null;
  playerWins: number;
  noriWins: number;
  roundsToWin: number;
  pending?: boolean;
  backgroundImage: string;
  cardBackImage: string;
  cakeImage: string;
  trophyImage: string;
  translate: CakeDuelTranslate;
  resolveCardFront: (name: string, highResolution?: boolean) => string;
  onPlayAgain(): void;
}

function ScoreDots({ wins, slots, color }: { wins: number; slots: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: slots }, (_, index) => (
        <span
          key={index}
          className="rounded-full"
          style={{
            width: 10,
            height: 10,
            background: index < wins ? color : `${CAKEDUEL_PALETTE.brown}30`,
            boxShadow: index < wins ? `0 0 6px ${color}80` : "none",
            transform: "scale(1)",
            transition: `transform 320ms ${600 + index * 80}ms cubic-bezier(.2,.8,.2,1)`,
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
  cardBackImage,
  cakeImage,
  trophyImage,
  translate,
  resolveCardFront,
  onPlayAgain,
}: CakeDuelResultsScreenProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const compact = size.height > 0 && size.height < 520;
  const interpolation = Math.min(1, Math.max(0, (size.height - 400) / 240));
  const heroScale = 0.55 + 0.45 * interpolation;
  const outcomeOverlaySize = 48 + 32 * interpolation;
  const victory = winner === 0;
  const scoreSlots = Math.max(roundsToWin, playerWins, noriWins);
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
        }}
      />
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 100px 30px rgba(40,60,80,0.5)" }} />
      <CakeDuelAmbientParticles mode={victory ? "victory" : "defeat"} />

      <div
        className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4"
        style={{ gap: 6 + 6 * interpolation }}
      >
        <div className="flex flex-col items-center" data-cakeduel-results-hero>
          <CakeDuelHeroFan
            scale={heroScale}
            cardBackImage={cardBackImage}
            resolveCardFront={resolveCardFront}
            overlayImage={victory ? trophyImage : cakeImage}
            overlaySizePx={outcomeOverlaySize}
          />
          <h1
            className="text-center leading-none"
            style={{
              marginTop: 6 + 6 * interpolation,
              marginBottom: 12 + 20 * interpolation,
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
        </div>

        <div
          className="w-full max-w-[280px] rounded-2xl relative overflow-hidden backdrop-blur-md"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.40) 50%, rgba(255,255,255,0.55) 100%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)",
          }}
          data-cakeduel-results-panel
        >
          <div className={compact ? "relative px-4 pt-2.5 pb-3.5 space-y-2" : "relative px-5 pt-4 pb-5 space-y-3"}>
            <CakeDuelRouteDivider compact={compact} image={cakeImage} />
            <div className="flex items-center justify-center gap-4 w-full" style={{ fontFamily: "'Nunito', sans-serif" }}>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CAKEDUEL_PALETTE.brownLight }}>
                  {translate("cakeduel.results.playerLabel")}
                </span>
                <ScoreDots wins={playerWins} slots={scoreSlots} color={CAKEDUEL_PALETTE.gold} />
              </div>
              <span className="text-xs font-bold" style={{ color: CAKEDUEL_PALETTE.brownLight, fontFamily: "'Lilita One', sans-serif" }}>vs</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CAKEDUEL_PALETTE.brownLight }}>
                  {translate("cakeduel.results.noriLabel")}
                </span>
                <ScoreDots wins={noriWins} slots={scoreSlots} color={CAKEDUEL_PALETTE.pink} />
              </div>
            </div>
            <CakeDuelRouteDivider compact={compact} image={cakeImage} />
            <CakeDuelRoutePrimaryButton
              compact={compact}
              disabled={pending}
              fontSize={compact ? 15 : 18}
              shimmerDelaySec={1.5}
              entryDelaySec={0.7}
              icon={<RotateCcw className="h-5 w-5" />}
              onClick={onPlayAgain}
            >
              {translate("cakeduel.results.playAgain")}
            </CakeDuelRoutePrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
});
