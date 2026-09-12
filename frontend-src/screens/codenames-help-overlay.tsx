import { memo, useEffect } from "react";
import type { CodenamesTranslate } from "../apps/codenames-chat";

export interface CodenamesHelpOverlayProps {
  open: boolean;
  translate: CodenamesTranslate;
  onClose(): void;
}

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
        className="absolute inset-0 cursor-default bg-[rgba(16,24,14,.55)] backdrop-blur-[10px]"
        onClick={onClose}
        aria-label={translate("codenames.help.close")}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={translate("codenames.help.title")}
        className="relative w-full max-w-[560px] max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-amber-300/30 bg-emerald-950 shadow-2xl"
      >
        <div className="relative px-7 pt-6 pb-7">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-bold text-stone-100">{translate("codenames.help.title")}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={translate("codenames.help.close")}
              className="shrink-0 rounded-full p-1.5 text-amber-300 transition-colors hover:bg-white/10"
            >
              ×
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {HELP_SECTIONS.slice(0, 3).map(([title, body]) => (
              <section key={title}>
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-amber-400">
                  {translate(title)}
                </h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-stone-100">{translate(body)}</p>
              </section>
            ))}

            <section>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-amber-400">
                {translate("codenames.help.search.title")}
              </h3>
              <div className="mt-2 space-y-2 rounded-xl border border-emerald-700/40 bg-black/30 px-3 py-2.5">
                {SEARCH_ROWS.map(([kind, name, effect]) => (
                  <div key={kind} className="flex items-center gap-3">
                    <div
                      className={`h-8 w-12 shrink-0 rounded-md border ${
                        kind === "treasure"
                          ? "bg-[var(--codenames-agent-bg)] border-[var(--codenames-agent-border)]"
                          : kind === "monster"
                            ? "bg-[var(--codenames-assassin-bg)] border-[var(--codenames-assassin-border)]"
                            : "bg-[var(--codenames-bystander-bg)] border-[var(--codenames-bystander-border)]"
                      }`}
                    />
                    <span className="w-16 shrink-0 text-[13px] font-semibold text-amber-200">
                      {translate(name)}
                    </span>
                    <span className="min-w-0 flex-1 text-[13.5px] text-stone-100">
                      {translate(effect)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-amber-400">
                {translate(HELP_SECTIONS[3][0])}
              </h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-stone-100">
                {translate(HELP_SECTIONS[3][1])}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
});
