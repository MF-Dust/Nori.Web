import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Gamepad2,
  Users,
  TvMinimal,
} from "lucide-react";
import type { createSourceTranslate } from "../i18n/translate";
import { CREDITS_MOTES } from "../apps/system-presentation-data";
import "../styles/credits.css";

const rows = [
  {
    id: "steam",
    icon: Gamepad2,
    href: "https://store.steampowered.com/app/4996280/I_NORI/",
  },
  { id: "qq", icon: Users, copy: "1041616195" },
  { id: "qq2", icon: Users, copy: "1107531061" },
  {
    id: "bilibili",
    icon: TvMinimal,
    href: "https://space.bilibili.com/326505494",
  },
] as const;
export function CreditsScreen({
  translate: t,
  onOpened,
}: {
  translate: ReturnType<typeof createSourceTranslate>;
  onOpened(): void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    onOpened();
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, [onOpened]);
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      if (!alive.current) return;
      setCopied(value);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      /* A rejected clipboard request must not display a false success. */
    }
  }
  return (
    <div className="credits-root relative h-full w-full select-none overflow-x-hidden overflow-y-auto">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {CREDITS_MOTES.map((mote, index) => (
          <span
            key={index}
            className="credits-mote"
            style={
              Object.fromEntries(
                Object.entries(mote).map(([key, value]) => [`--${key}`, value]),
              ) as CSSProperties
            }
          />
        ))}
      </div>
      <div
        className="credits-hero relative w-full"
        style={{ aspectRatio: "1232 / 560" }}
      >
        <img
          src="/assets/steam-capsule-CWHqT-l6.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>
      <div className="relative -mt-4 px-7 pb-6">
        <div
          className="credits-reveal"
          style={{ "--reveal-delay": "150ms" } as CSSProperties}
        >
          <h1 className="credits-heading text-[22px] font-semibold tracking-wide">
            {t("credits.heading")}
          </h1>
          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-[var(--credits-dim)]">
            {t("credits.thanks")}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="credits-reveal my-5 h-px w-full"
          style={
            {
              "--reveal-delay": "350ms",
              background:
                "linear-gradient(to right, transparent, rgba(125,227,255,0.3), transparent)",
            } as CSSProperties
          }
        />
        <div className="flex flex-col gap-2.5">
          {rows.map((row, index) => {
            const Icon = row.icon;
            const done = "copy" in row && copied === row.copy;
            return (
              <div
                key={row.id}
                className="credits-row credits-reveal flex items-center gap-3 rounded-xl px-4 py-3"
                style={
                  {
                    "--reveal-delay": `${450 + index * 100}ms`,
                  } as CSSProperties
                }
              >
                <Icon className="size-5 shrink-0 text-[var(--credits-accent)] opacity-80" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2 text-[13px] font-medium">
                    {t(`credits.${row.id}Label`)}
                    {"copy" in row && (
                      <span className="text-[14px] tracking-[0.08em] text-[var(--credits-accent)]">
                        {row.copy}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[var(--credits-dim)] [text-wrap:pretty]">
                    {t(`credits.${row.id}Hint`)}
                  </div>
                </div>
                {"href" in row ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noreferrer"
                    className="credits-action flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] no-underline"
                  >
                    <ExternalLink className="size-3.5" />
                    {t(`credits.${row.id}Action`)}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => void copy(row.copy)}
                    className="credits-action flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px]"
                  >
                    {done ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {t(done ? "credits.copied" : "credits.copy")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div
          className="credits-reveal mt-6 text-center text-[11px] uppercase tracking-[0.28em] text-[rgba(190,224,244,0.4)]"
          style={{ "--reveal-delay": "900ms" } as CSSProperties}
        >
          © 2026 Nori Labs
        </div>
      </div>
    </div>
  );
}
