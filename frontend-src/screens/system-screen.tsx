import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import type { WindowComponentProps } from "../state/window-types";
import type { createSourceTranslate } from "../i18n/translate";
import { ABOUT_CONTRIBUTORS } from "../apps/system-presentation-data";

export function SystemAlert({
  close,
  setTitle,
  title,
  message,
  code,
  translate: t,
}: WindowComponentProps & {
  translate: ReturnType<typeof createSourceTranslate>;
}) {
  const heading = typeof title === "string" ? title : t("appError.title");
  // setTitle's window callback changes when the managed window updates. Do not
  // write the same title back on every render.
  const lastTitle = useRef<string | null>(null);
  useEffect(() => {
    if (lastTitle.current !== heading) {
      lastTitle.current = heading;
      setTitle(heading);
    }
  }, [heading, setTitle]);
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex flex-1 items-start gap-3 px-5 pt-5">
        <TriangleAlert className="mt-0.5 size-6 shrink-0 text-amber-500" />
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-semibold">{heading}</div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {typeof message === "string" ? message : t("appError.message")}
          </p>
          {typeof code === "string" && (
            <p className="pt-0.5 font-mono text-[11px] text-muted-foreground/60">
              {code}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end border-t border-border/50 px-4 py-3">
        <button
          autoFocus
          type="button"
          onClick={close}
          className="rounded-md bg-primary px-5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("appError.ok")}
        </button>
      </div>
    </div>
  );
}
function AboutRoll() {
  const heading =
    "text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1.5";
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div>
        <p className={heading}>NoriOS was created by</p>
        <p className="text-xs leading-5">Nori</p>
      </div>
      {ABOUT_CONTRIBUTORS.map((group) => (
        <div key={group.heading}>
          <p className={heading}>{group.heading}</p>
          {group.names.map((name) => (
            <p key={name} className="text-xs leading-5">
              {name}
            </p>
          ))}
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground/60">
        Thank you for running NoriOS.
      </p>
    </div>
  );
}
export function AboutScreen() {
  const scroll = useRef<HTMLDivElement>(null),
    paused = useRef(false);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    const element = scroll.current;
    if (!element || reduced) return;
    let frame = 0,
      position = element.scrollTop;
    const tick = () => {
      if (paused.current || document.hidden) position = element.scrollTop;
      else {
        position += 0.3;
        const half = element.scrollHeight / 2;
        if (half && position >= half) position -= half;
        element.scrollTop = position;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
      <div className="flex shrink-0 flex-col items-center pb-2 pt-8">
        <img
          src="/icon.png"
          alt="NoriOS"
          className="mb-3 h-20 w-20 invert dark:invert-0"
          draggable={false}
        />
        <h1 className="text-2xl font-semibold tracking-tight">NoriOS</h1>
      </div>
      <div
        ref={scroll}
        tabIndex={0}
        aria-label="NoriOS credits"
        onPointerEnter={() => {
          paused.current = true;
        }}
        onPointerLeave={() => {
          paused.current = false;
        }}
        onFocus={() => {
          paused.current = true;
        }}
        onBlur={() => {
          paused.current = false;
        }}
        className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
      >
        <AboutRoll />
        {!reduced && (
          <div aria-hidden="true">
            <AboutRoll />
          </div>
        )}
      </div>
    </div>
  );
}
