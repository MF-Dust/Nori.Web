import { memo, useEffect, useMemo, useState } from "react";
import {
  CODENAMES_CLUE_COUNT_REVEAL_DELAY_MS,
  CODENAMES_CLUE_REVEAL_DELAY_MS,
  CODENAMES_CLUE_REVEAL_STEP_MS,
  deriveCodenamesClueOverlayState,
  formatCodenamesClueCount,
  normalizeCodenamesClueWord,
  type CodenamesClue,
  type CodenamesClueHighlight,
  type CodenamesClueUiState,
} from "../apps/codenames-clue-presentation";

export interface CodenamesClueOverlayProps {
  uiState: CodenamesClueUiState;
  clueHighlight?: CodenamesClueHighlight | null;
  translate(key: string): string;
}

function useCodenamesClueReveal(clue: CodenamesClue | null, active: boolean) {
  const word = useMemo(() => (clue ? normalizeCodenamesClueWord(clue.word) : ""), [clue]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showCount, setShowCount] = useState(false);

  useEffect(() => {
    setRevealedCount(0);
    setShowCount(false);
    if (!active || !word) return;

    let interval: number | undefined;
    const delay = window.setTimeout(() => {
      let count = 0;
      interval = window.setInterval(() => {
        count += 1;
        setRevealedCount(count);
        if (count >= word.length && interval !== undefined) window.clearInterval(interval);
      }, CODENAMES_CLUE_REVEAL_STEP_MS);
    }, CODENAMES_CLUE_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(delay);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [active, word]);

  useEffect(() => {
    if (!active || !word || revealedCount < word.length) return;
    const delay = window.setTimeout(() => setShowCount(true), CODENAMES_CLUE_COUNT_REVEAL_DELAY_MS);
    return () => window.clearTimeout(delay);
  }, [active, revealedCount, word]);

  return { word, revealedCount, showCount };
}

const CodenamesClueCard = memo(function CodenamesClueCard({
  clue,
  label,
}: {
  clue: CodenamesClue;
  label: string;
}) {
  const { word, revealedCount, showCount } = useCodenamesClueReveal(clue, true);

  return (
    <div className="relative flex flex-col items-center justify-center gap-4" data-codenames-clue-card>
      <span className="text-xs uppercase tracking-[0.35em] font-semibold px-4 py-1 text-muted-foreground/70">
        {label}
      </span>
      <div
        className="relative px-10 py-6 rounded-xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsla(48,60%,92%,.98) 0%, hsla(45,50%,88%,.95) 30%, hsla(42,45%,85%,.97) 70%, hsla(40,40%,82%,.95) 100%)",
          border: "3px solid hsl(35 45% 55%)",
          boxShadow:
            "inset 0 2px 4px hsla(50,60%,95%,.9), inset 0 -2px 6px hsla(35,40%,60%,.2), 0 4px 20px -4px hsla(35,50%,30%,.4)",
        }}
      >
        <div className="relative flex min-w-[180px] min-h-[48px] items-center justify-center">
          <div className="flex items-baseline gap-0.5" aria-label={word}>
            {word.split("").map((character, index) => (
              <span
                key={`${character}-${index}`}
                className="inline-block"
                style={{
                  fontFamily: '"Fredoka", system-ui',
                  fontSize: "2.25rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "hsl(35 55% 25%)",
                  opacity: index < revealedCount ? 1 : 0,
                }}
              >
                {character}
              </span>
            ))}
          </div>
        </div>
        {showCount ? (
          <div className="mt-2 text-center text-sm font-bold text-[hsl(35_55%_25%)]" data-codenames-clue-count>
            {formatCodenamesClueCount(clue.count)}
          </div>
        ) : null}
      </div>
    </div>
  );
});

/** Source-owned clue/waiting overlay used over the recovered Codenames board. */
export const CodenamesClueOverlay = memo(function CodenamesClueOverlay({
  uiState,
  clueHighlight = null,
  translate,
}: CodenamesClueOverlayProps) {
  const activeOverlay = deriveCodenamesClueOverlayState(uiState);
  const highlight = clueHighlight;

  if (!highlight && activeOverlay.type === "off") return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      data-codenames-clue-overlay
    >
      {highlight ? (
        <CodenamesClueCard clue={highlight.clue} label={highlight.label} />
      ) : activeOverlay.type === "display" ? (
        <CodenamesClueCard
          clue={activeOverlay.clue}
          label={translate(activeOverlay.translationKey)}
        />
      ) : activeOverlay.type === "waiting" ? (
        <div className="rounded-xl border bg-card/95 px-5 py-3 text-sm font-medium text-muted-foreground shadow-sm">
          {translate(activeOverlay.translationKey)}
        </div>
      ) : null}
    </div>
  );
});
