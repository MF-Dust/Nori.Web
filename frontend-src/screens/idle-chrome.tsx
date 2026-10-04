import { useIdleCue } from "./idle-cue-context";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { IdleIcon } from "./idle-icon";

type Side = "top" | "bottom" | "left" | "right";
type HostProps = {
  ref?: Ref<HTMLElement>;
  onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
};

const THRESHOLDS = [5, 25, 75, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1250, 1500, 1750, 2000, 2500];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX"];
const BADGE_COLORS = ["#f8fafc", "#4ade80", "#38bdf8", "#c084fc", "#fb923c"];
const OUTLINE = "1px 0 0 #050811, -1px 0 0 #050811, 0 1px 0 #050811, 0 -1px 0 #050811, 1px 1px 0 #050811, -1px -1px 0 #050811, 1px -1px 0 #050811, -1px 1px 0 #050811";

function assignRef(ref: Ref<HTMLElement> | undefined, node: HTMLElement | null) {
  if (typeof ref === "function") ref(node);
  else if (ref && typeof ref === "object") ref.current = node;
}

export function PixelTooltip({
  content,
  side = "top",
  offset = 6,
  className = "",
  children,
}: {
  content: ReactNode;
  side?: Side;
  offset?: number;
  className?: string;
  children: ReactElement<HostProps>;
}) {
  const anchor = useRef<HTMLElement | null>(null);
  const tip = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);
  const measure = () => {
    const host = anchor.current?.getBoundingClientRect();
    const box = tip.current?.getBoundingClientRect();
    if (!host || !box) return;
    const margin = 8;
    let left = 0;
    let top = 0;
    if (side === "left" || side === "right") {
      left = side === "left" ? host.left - box.width - offset : host.right + offset;
      top = host.top + host.height / 2 - box.height / 2;
      if (side === "left" && left < margin) left = host.right + offset;
      if (side === "right" && left + box.width > window.innerWidth - margin) left = host.left - box.width - offset;
      left = Math.max(margin, Math.min(window.innerWidth - box.width - margin, left));
      top = Math.max(margin, Math.min(window.innerHeight - box.height - margin, top));
    } else {
      top = side === "top" ? host.top - box.height - offset : host.bottom + offset;
      left = host.left + host.width / 2 - box.width / 2;
      if (side === "top" && top < margin) top = host.bottom + offset;
      if (side === "bottom" && top + box.height > window.innerHeight - margin) top = host.top - box.height - offset;
      top = Math.max(margin, Math.min(window.innerHeight - box.height - margin, top));
      left = Math.max(margin, Math.min(window.innerWidth - box.width - margin, left));
    }
    setPlace({ left, top });
  };
  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    measure();
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [open, content, side, offset]);
  useEffect(() => {
    if (!open) return;
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, side, offset]);
  if (!isValidElement(children)) return children;
  const host = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      anchor.current = node;
      assignRef(children.props.ref, node);
    },
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      setOpen(true);
      children.props.onMouseEnter?.(event);
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      setOpen(false);
      children.props.onMouseLeave?.(event);
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      setOpen(true);
      children.props.onFocus?.(event);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      setOpen(false);
      children.props.onBlur?.(event);
    },
  });
  return (
    <>
      {host}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={tip}
              className={`pixel-tooltip${className ? ` ${className}` : ""}`}
              style={{ position: "fixed", left: place?.left ?? -9999, top: place?.top ?? -9999, visibility: place ? "visible" : "hidden" }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

const HEADING = {
  amber: { text: "text-[var(--px-amber)]", square: "bg-[var(--px-amber)]", line: "bg-[var(--px-amber)]/40", pulse: true },
  cyan: { text: "text-[var(--px-cyan)]", square: "bg-[var(--px-cyan)]", line: "bg-[var(--px-cyan)]/40", pulse: true },
  muted: { text: "text-[var(--px-white)]", square: "bg-[var(--px-white)]", line: "bg-[var(--px-line)]", pulse: false },
} as const;

export function PixelHeading({ tone = "amber", children }: { tone?: keyof typeof HEADING; children: ReactNode }) {
  const style = HEADING[tone];
  return (
    <div className={`pixel-ascii pixel-fs-xs pixel-tsh-1 flex shrink-0 items-center gap-1.5 uppercase tracking-[0.25em] ${style.text}`}>
      <span aria-hidden="true" className={`inline-block size-2 ${style.square}${style.pulse ? " pixel-pulse" : ""}`} />
      <span>{children}</span>
      <span aria-hidden="true" className={`ml-1 h-[2px] flex-1 ${style.line}`} />
    </div>
  );
}

export function PixelSeparator() {
  return <span aria-hidden="true" className="size-1 bg-[var(--px-stroke)]" />;
}

function mix(from: string, to: string, amount: number) {
  const read = (hex: string) => [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  const left = read(from);
  const right = read(to);
  return `#${left.map((channel, index) => Math.round(channel + ((right[index] ?? channel) - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
}

export function thresholdLabel(threshold: number) {
  const index = THRESHOLDS.indexOf(threshold);
  return index < 0 ? "" : ROMAN[index] ?? "";
}

export function thresholdColor(threshold: number) {
  const index = THRESHOLDS.indexOf(threshold);
  const scaled = ((index < 0 ? 0 : index) / Math.max(1, THRESHOLDS.length - 1)) * (BADGE_COLORS.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(BADGE_COLORS.length - 1, lower + 1);
  return mix(BADGE_COLORS[lower] ?? BADGE_COLORS[0], BADGE_COLORS[upper] ?? BADGE_COLORS[0], scaled - lower);
}

export function ThresholdBadge({ threshold }: { threshold: number }) {
  const label = thresholdLabel(threshold);
  if (!label) return null;
  return (
    <span className="pixel-num pointer-events-none absolute bottom-0 right-0.5 leading-none" style={{ color: thresholdColor(threshold), fontSize: 18, textShadow: OUTLINE }}>
      {label}
    </span>
  );
}

export function FactionMarks({ tier, color }: { tier: number; color: string }) {
  return (
    <span className="pointer-events-none absolute bottom-1 right-1 flex flex-col items-center gap-px">
      {Array.from({ length: Math.max(1, tier) }, (_, index) => (
        <span
          key={index}
          style={{
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: `8px solid ${color}`,
            filter: "drop-shadow(1px 1px 0 #050811) drop-shadow(-1px -1px 0 #050811)",
          }}
        />
      ))}
    </span>
  );
}

export function MementoGlass({ name, claimed = false }: { name: string; claimed?: boolean }) {
  const glow = "#38bdf8";
  return (
    <div
      className="memento-glass relative overflow-hidden"
      style={{
        background: claimed ? "rgba(203, 224, 228, 0.55)" : "rgba(202, 245, 241, 0.88)",
        border: `1px solid ${claimed ? "rgba(254, 254, 254, 0.22)" : "rgba(254, 254, 254, 0.55)"}`,
        boxShadow: claimed
          ? "0 3px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.28)"
          : `0 4px 16px rgba(0,0,0,0.30), 0 0 18px ${glow}45, inset 0 1px 0 rgba(255,255,255,0.6)`,
        padding: "8%",
      }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.5) 70%, transparent 100%)" }} />
      {!claimed ? <span aria-hidden="true" className="memento-breathe pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 56%, rgba(255,255,255,0.6), transparent 70%)" }} /> : null}
      <div className="relative size-full" style={{ color: claimed ? "rgba(14, 116, 144, 0.6)" : "#0E7490" }}>
        <IdleIcon name={name} className="size-full" />
      </div>
    </div>
  );
}

export function IdleSlot({
  tooltip,
  tooltipClassName,
  purchased = false,
  locked = false,
  affordable = true,
  bloom = false,
  borderColor,
  tintClass = "",
  testId,
  label,
  onClick,
  children,
}: {
  tooltip: ReactNode;
  tooltipClassName?: string;
  purchased?: boolean;
  locked?: boolean;
  affordable?: boolean;
  bloom?: boolean;
  borderColor?: string;
  tintClass?: string;
  testId?: string;
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const cue = useIdleCue();
  const enabled = !purchased && !locked && affordable;
  const showBorder = enabled && !bloom;
  const style: CSSProperties = {};
  if (showBorder) {
    style.borderColor = borderColor ?? "var(--px-grey)";
    style.boxShadow = "inset 2px 2px 0 0 rgba(255,255,255,0.09), inset -2px -2px 0 0 rgba(0,0,0,0.5)";
  }
  return (
    <PixelTooltip content={tooltip} className={tooltipClassName}>
      <button
        type="button"
        data-test={testId}
        aria-label={label}
        aria-disabled={!enabled}
        onClick={enabled ? () => {
          if (!bloom) cue("idle-upgrade-buy");
          onClick?.();
        } : undefined}
        style={style}
        className={[
          "relative aspect-square p-1",
          bloom ? "border-0 bg-transparent p-0" : "flex items-center justify-center border-2 border-[var(--px-stroke)] bg-[var(--px-void)]",
          "transition-transform duration-75",
          enabled ? `hover:-translate-y-[2px] active:translate-y-px ${bloom ? "" : "bg-[var(--px-panel)]"} ${tintClass}` : bloom ? "cursor-default" : `cursor-default opacity-40 ${tintClass}`,
        ].join(" ")}
      >
        {children}
      </button>
    </PixelTooltip>
  );
}
