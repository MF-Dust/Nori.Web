import { memo, useEffect, useRef, useState } from "react";

const WOLFY_FRAME_TIMELINE = [
  { frame: 0, at: 0 },
  { frame: 1, at: 100 },
  { frame: 2, at: 300 },
  { frame: 3, at: 400 },
] as const;
const WOLFY_FRAME_CYCLE_MS = 1_100;

function rgba(hex: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export interface CakeDuelWolfyTauntProps {
  active: boolean;
  frameImages: readonly [string, string, string, string];
  accentColor?: string;
}

/** Source-owned Wolfy taunt strip, including the shipped 1100ms four-frame cycle. */
export const CakeDuelWolfyTaunt = memo(function CakeDuelWolfyTaunt({
  active,
  frameImages,
  accentColor = "#F49187",
}: CakeDuelWolfyTauntProps) {
  const [frame, setFrame] = useState(0);
  const startedAt = useRef(0);
  const animationFrame = useRef(0);

  useEffect(() => {
    if (!active) {
      setFrame(0);
      return;
    }
    startedAt.current = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - startedAt.current) % WOLFY_FRAME_CYCLE_MS;
      let nextFrame = 0;
      for (const keyframe of WOLFY_FRAME_TIMELINE) {
        if (elapsed >= keyframe.at) nextFrame = keyframe.frame;
      }
      setFrame(nextFrame);
      animationFrame.current = requestAnimationFrame(tick);
    };
    animationFrame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
      data-cakeduel-wolfy-taunt
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full flex justify-center items-end">
        <div
          className="absolute inset-0 border-y border-white/10"
          style={{
            background: `linear-gradient(to right, ${rgba(accentColor, 0.15)}, ${rgba(
              accentColor,
              0.85,
            )}, ${rgba(accentColor, 0.85)}, ${rgba(accentColor, 0.15)})`,
          }}
        />
        <img
          src={frameImages[frame]}
          alt=""
          draggable={false}
          className="relative h-28 w-auto"
          data-cakeduel-wolfy-frame={frame}
        />
      </div>
    </div>
  );
});

export interface CakeDuelActionErrorProps {
  message: string | null;
}

export const CakeDuelActionError = memo(function CakeDuelActionError({
  message,
}: CakeDuelActionErrorProps) {
  if (!message) return null;
  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-xl border border-red-600/40 bg-red-900/80 px-4 py-2 text-xs text-red-200 shadow-lg backdrop-blur-sm"
      data-cakeduel-action-error
    >
      {message}
    </div>
  );
});
