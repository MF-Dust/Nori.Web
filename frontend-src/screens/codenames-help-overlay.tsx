import { memo, useEffect, type CSSProperties } from "react";
import type { CodenamesTranslate } from "../apps/codenames-chat";

export interface CodenamesHelpOverlayProps {
  open: boolean;
  translate: CodenamesTranslate;
  onClose(): void;
}

const HELP_COLORS = {
  canopy: "#1a2418",
  undergrowth: "#243320",
  moss: "#4a5a40",
  gold: "#d4a853",
  goldLight: "#f0d78c",
  cream: "#f5f0e6",
} as const;

const HELP_SECTIONS = [
  ["codenames.help.goal.title", "codenames.help.goal.body"],
  ["codenames.help.maps.title", "codenames.help.maps.body"],
  ["codenames.help.hints.title", "codenames.help.hints.body"],
  ["codenames.help.rounds.title", "codenames.help.rounds.body"],
] as const;

const SEARCH_ROWS = [
  ["treasure", "codenames.cards.treasure", "codenames.help.search.treasure"],
  ["berry", "codenames.cards.berry", "codenames.help.search.berry"],
  ["monster", "codenames.cards.monster", "codenames.help.search.monster"],
] as const;

function helpLabelStyle(): CSSProperties {
  return {
    color: HELP_COLORS.gold,
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
  };
}

function helpBodyStyle(): CSSProperties {
  return {
    color: HELP_COLORS.cream,
    fontFamily: "'Crimson Pro', serif",
  };
}

function SearchCard({ kind }: { kind: (typeof SEARCH_ROWS)[number][0] }) {
  const style: CSSProperties =
    kind === "treasure"
      ? {
          background:
            "linear-gradient(145deg, oklch(0.78 0.12 80) 0%, oklch(0.65 0.14 70) 50%, oklch(0.52 0.12 60) 100%)",
          border: "2px solid hsl(38 50% 48% / .7)",
        }
      : kind === "monster"
        ? {
            background:
              "linear-gradient(170deg, hsl(195 35% 28%) 0%, hsl(200 40% 20%) 50%, hsl(205 45% 14%) 100%)",
            border: "2px solid hsl(190 35% 35%)",
          }
        : {
            background: "linear-gradient(145deg, hsl(12 65% 65%) 0%, hsl(5 55% 55%) 55%, hsl(2 50% 45%) 100%)",
            border: "2px solid hsl(15 40% 55% / .6)",
          };
  return <div className="h-[45px] w-[72px] shrink-0 rounded-xl" style={style} aria-hidden="true" />;
}

/** Source-owned help sheet matching the shipped Codenames help content and dismissal behavior. */
export const CodenamesHelpOverlay = memo(function CodenamesHelpOverlay({
  open,
  translate,
  onClose,
}: CodenamesHelpOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" data-codenames-help-overlay>
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        style={{
          background: "rgba(16, 24, 14, 0.55)",
          backdropFilter: "blur(10px) saturate(110%)",
          WebkitBackdropFilter: "blur(10px) saturate(110%)",
        }}
        onClick={onClose}
        aria-label={translate("codenames.help.close")}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={translate("codenames.help.title")}
        className="relative w-full max-w-[560px] max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl"
        style={{
          background: `linear-gradient(170deg, ${HELP_COLORS.undergrowth} 0%, ${HELP_COLORS.canopy} 70%)`,
          border: `1px solid ${HELP_COLORS.gold}50`,
          boxShadow: `0 18px 48px rgba(0,0,0,0.55), inset 0 1px 0 ${HELP_COLORS.goldLight}20`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-2 rounded-xl border border-dashed"
          style={{ borderColor: `${HELP_COLORS.gold}45` }}
        />
        <div className="relative px-7 pt-6 pb-7">
          <div className="flex items-start justify-between">
            <h2
              className="leading-none"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 700,
                fontSize: 24,
                color: HELP_COLORS.cream,
                textShadow: `0 0 24px ${HELP_COLORS.gold}40`,
              }}
            >
              {translate("codenames.help.title")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={translate("codenames.help.close")}
              className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/10"
              style={{ color: HELP_COLORS.gold }}
            >
              ×
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {HELP_SECTIONS.slice(0, 3).map(([title, body]) => (
              <section key={title}>
                <h3 className="text-[11px] uppercase tracking-[0.2em]" style={helpLabelStyle()}>
                  {translate(title)}
                </h3>
                <p className="mt-1 text-[13.5px] leading-relaxed" style={helpBodyStyle()}>
                  {translate(body)}
                </p>
              </section>
            ))}

            <section>
              <h3 className="text-[11px] uppercase tracking-[0.2em]" style={helpLabelStyle()}>
                {translate("codenames.help.search.title")}
              </h3>
              <div
                className="mt-2 space-y-2 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(0,0,0,0.28)", border: `1px solid ${HELP_COLORS.moss}60` }}
              >
                {SEARCH_ROWS.map(([kind, name, effect]) => (
                  <div key={kind} className="flex items-center gap-3">
                    <SearchCard kind={kind} />
                    <span
                      className="w-16 shrink-0 text-[13px]"
                      style={{
                        color: HELP_COLORS.goldLight,
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {translate(name)}
                    </span>
                    <span className="min-w-0 flex-1 text-[13.5px]" style={helpBodyStyle()}>
                      {translate(effect)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[11px] uppercase tracking-[0.2em]" style={helpLabelStyle()}>
                {translate(HELP_SECTIONS[3][0])}
              </h3>
              <p className="mt-1 text-[13.5px] leading-relaxed" style={helpBodyStyle()}>
                {translate(HELP_SECTIONS[3][1])}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
});
