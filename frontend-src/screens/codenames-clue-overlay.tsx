import { memo, useEffect, useMemo, useState } from "react";
import {
  CODENAMES_BOARD_OVERLAY_DURATION_MS,
  CODENAMES_BOARD_OVERLAY_PRESENTATION,
  CODENAMES_CLUE_COUNT_REVEAL_DELAY_MS,
  CODENAMES_CLUE_REVEAL_DELAY_MS,
  CODENAMES_CLUE_REVEAL_STEP_MS,
  deriveCodenamesClueOverlayState,
  formatCodenamesClueCount,
  normalizeCodenamesClueWord,
  type CodenamesBoardOverlayType,
  type CodenamesClue,
  type CodenamesClueHighlight,
  type CodenamesClueUiState,
} from "../apps/codenames-clue-presentation";

export interface CodenamesClueDisplayProps {
  uiState: CodenamesClueUiState;
  translate(key: string): string;
}

export interface CodenamesClueOverlayProps {
  activeOverlay?: CodenamesBoardOverlayType | null;
  clueHighlight?: CodenamesClueHighlight | null;
  onDismissOverlay?: () => void;
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

function ClueCountSeal({ count, compact = false }: { count: CodenamesClue["count"]; compact?: boolean }) {
  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 ${compact ? "w-10 h-10" : "w-16 h-16"}`}
      style={{
        background:
          "radial-gradient(ellipse 80% 70% at 30% 25%, hsl(8 65% 50%) 0%, hsl(5 60% 42%) 40%, hsl(2 55% 35%) 100%)",
        border: compact ? "1.5px solid hsl(0 40% 28%)" : "2px solid hsl(0 50% 30%)",
        boxShadow: compact
          ? "inset 1px 2px 4px hsla(10,60%,55%,.35), inset -1px -2px 5px hsla(0,40%,18%,.4), 0 2px 6px -1px hsla(0,35%,20%,.4)"
          : "inset 2px 3px 6px hsla(10,70%,65%,.4), inset -2px -3px 8px hsla(0,50%,20%,.5), 0 3px 12px -2px hsla(0,40%,20%,.5)",
      }}
      data-codenames-clue-count
    >
      <div
        className={compact ? "absolute inset-1.5 rounded-full" : "absolute inset-2 rounded-full"}
        style={{ border: compact ? "1px solid hsla(0,35%,25%,.35)" : "1.5px solid hsla(0,40%,25%,.4)" }}
      />
      <span
        className="relative z-10"
        style={{
          fontFamily: '"Fredoka", system-ui',
          fontSize: compact ? "1.1rem" : "1.75rem",
          fontWeight: 700,
          color: compact ? "hsl(45 85% 90%)" : "hsl(45 90% 92%)",
          textShadow: "0 1px 0 hsla(0,50%,25%,.5)",
        }}
      >
        {formatCodenamesClueCount(count)}
      </span>
    </div>
  );
}

function CodenamesCompactClue({ clue, label }: { clue: CodenamesClue; label: string }) {
  return (
    <div className="relative flex items-center gap-4" data-codenames-compact-clue>
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 hidden @[820px]/game:block">
        <span className="text-[10px] uppercase tracking-[0.3em] font-semibold whitespace-nowrap text-muted-foreground/60">
          {label}
        </span>
      </div>
      <div
        className="relative px-5 py-2 rounded-lg"
        style={{
          background: "linear-gradient(135deg, hsla(48,50%,93%,.95) 0%, hsla(45,40%,88%,.9) 100%)",
          border: "2px solid hsl(35 40% 60%)",
          boxShadow: "inset 0 1px 2px hsla(50,50%,98%,.8), 0 2px 8px -2px hsla(35,40%,30%,.25)",
        }}
      >
        <span
          style={{
            fontFamily: '"Fredoka", system-ui',
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "hsl(35 50% 28%)",
            textShadow: "0 1px 0 hsla(45,50%,90%,.8)",
          }}
        >
          {normalizeCodenamesClueWord(clue.word)}
        </span>
      </div>
      <div
        className="w-1 h-4 rounded-full"
        style={{
          background: "linear-gradient(to bottom, hsl(145 40% 50%), hsl(145 35% 40%))",
          opacity: 0.6,
        }}
      />
      <ClueCountSeal count={clue.count} compact />
    </div>
  );
}

/** Waiting/current-clue content placed in the center column of the shipped header. */
export const CodenamesClueDisplay = memo(function CodenamesClueDisplay({
  uiState,
  translate,
}: CodenamesClueDisplayProps) {
  const presentation = deriveCodenamesClueOverlayState(uiState);
  if (presentation.type === "waiting") {
    return <span className="text-sm text-muted-foreground">{translate(presentation.translationKey)}</span>;
  }
  if (presentation.type === "display") {
    return <CodenamesCompactClue clue={presentation.clue} label={translate(presentation.translationKey)} />;
  }
  return null;
});

const CodenamesClueReveal = memo(function CodenamesClueReveal({
  clue,
  label,
}: {
  clue: CodenamesClue;
  label: string;
}) {
  const { word, revealedCount, showCount } = useCodenamesClueReveal(clue, true);
  return (
    <div className="relative flex flex-col items-center justify-center gap-4" data-codenames-clue-reveal>
      <span className="text-xs uppercase tracking-[0.35em] font-semibold px-4 py-1 text-muted-foreground/70">
        {label}
      </span>
      <div className="relative flex items-center gap-4">
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
                    textShadow: "0 2px 0 hsla(45,50%,85%,.8), 0 -1px 0 hsla(35,40%,40%,.1)",
                    opacity: index < revealedCount ? 1 : 0,
                  }}
                >
                  {character}
                </span>
              ))}
            </div>
          </div>
        </div>
        {showCount ? <ClueCountSeal count={clue.count} /> : null}
      </div>
      <div className="flex items-center gap-2 mt-1" style={{ opacity: 0.5 }} aria-hidden="true">
        <div
          className="w-12 h-[2px] rounded-full"
          style={{ background: "linear-gradient(to right, transparent, hsl(145 40% 45%), hsl(145 35% 35%))" }}
        />
        <div className="w-2 h-2 rounded-full" style={{ background: "hsl(145 45% 40%)" }} />
        <div
          className="w-12 h-[2px] rounded-full"
          style={{ background: "linear-gradient(to left, transparent, hsl(145 40% 45%), hsl(145 35% 35%))" }}
        />
      </div>
    </div>
  );
});

/** Board-cover overlay for turn/result announcements and newly-given clue highlights. */
export const CodenamesClueOverlay = memo(function CodenamesClueOverlay({
  activeOverlay = null,
  clueHighlight = null,
  onDismissOverlay,
  translate,
}: CodenamesClueOverlayProps) {
  useEffect(() => {
    if (!activeOverlay || !onDismissOverlay) return;
    const timeout = window.setTimeout(onDismissOverlay, CODENAMES_BOARD_OVERLAY_DURATION_MS[activeOverlay]);
    return () => window.clearTimeout(timeout);
  }, [activeOverlay, onDismissOverlay]);

  if (!activeOverlay && !clueHighlight) return null;
  const overlay = activeOverlay ? CODENAMES_BOARD_OVERLAY_PRESENTATION[activeOverlay] : null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-lg" data-codenames-board-overlay>
      <div className="absolute inset-0 bg-background/90 backdrop-blur-[3px]" />
      {overlay ? (
        <div
          className="relative w-full h-full flex items-center justify-center text-center"
          style={{ background: overlay.background }}
        >
          <div className="flex max-w-[320px] flex-col items-center gap-3">
            <div
              className="text-[10px] tracking-[0.25em] px-4 py-1.5 rounded-full uppercase font-semibold"
              style={{ color: overlay.accentColor, border: `1.5px solid ${overlay.accentColor}` }}
            >
              {translate(`${overlay.translationKeyBase}.badge`)}
            </div>
            <h1 className="text-3xl font-bold" style={{ color: overlay.accentColor }}>
              {translate(`${overlay.translationKeyBase}.title`)}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: overlay.accentColor }}>
              {translate(`${overlay.translationKeyBase}.subtitle`)}
            </p>
          </div>
        </div>
      ) : clueHighlight ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <CodenamesClueReveal clue={clueHighlight.clue} label={clueHighlight.label} />
        </div>
      ) : null}
    </div>
  );
});
