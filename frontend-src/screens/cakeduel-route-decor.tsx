import { memo, useMemo, type CSSProperties, type ReactNode } from "react";
import { CAKEDUEL_PALETTE } from "../apps/cakeduel-card-presentation";

const HERO_CARDS = [
  { card: "defender", x: -100, y: 12, rotate: -22, delayMs: 350 },
  { card: "soldier", x: -48, y: -8, rotate: -10, delayMs: 250 },
  { card: "archer", x: 48, y: -8, rotate: 10, delayMs: 300 },
  { card: "wizard", x: 100, y: 12, rotate: 22, delayMs: 400 },
] as const;

const DECORATIVE_STYLES = `
@keyframes cakeduel-route-particle-start {
  0%, 100% { opacity: .15; transform: translate(0, 0) scale(.8); }
  50% { opacity: .4; transform: translate(var(--cd-drift-x), var(--cd-drift-y)) scale(1.2); }
}
@keyframes cakeduel-route-particle-win {
  0% { opacity: 0; transform: translate(0, 0) scale(.5) rotate(0deg); }
  25% { opacity: .7; }
  100% { opacity: 0; transform: translate(var(--cd-drift-x), var(--cd-drift-y)) scale(.3) rotate(360deg); }
}
@keyframes cakeduel-route-particle-loss {
  0% { opacity: 0; transform: translate(0, 0) scale(.5); }
  25% { opacity: .55; }
  100% { opacity: 0; transform: translate(var(--cd-drift-x), var(--cd-drift-y)) scale(.3); }
}
@keyframes cakeduel-route-hero-card {
  from { opacity: 0; transform: translateY(30px) scale(.5); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes cakeduel-route-hero-center {
  from { opacity: 0; transform: translateY(20px) scale(.7) rotate(-4deg); }
  to { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
}
@keyframes cakeduel-route-outcome {
  from { opacity: 0; transform: translateY(-40px) scale(.3) rotate(-15deg); }
  to { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
}
@keyframes cakeduel-route-divider {
  from { opacity: 0; transform: scaleX(0); }
  to { opacity: 1; transform: scaleX(1); }
}
@keyframes cakeduel-route-entry {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes cakeduel-route-shimmer {
  0% { transform: translateX(-100%); }
  60% { transform: translateX(200%); }
  100% { transform: translateX(200%); }
}
`;

type ParticleMode = "start" | "victory" | "defeat";

interface ParticleSpec {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  color: string;
  star: boolean;
}

function makeParticle(index: number, mode: ParticleMode): ParticleSpec {
  const hash = (seed: number) => {
    const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
    return value - Math.floor(value);
  };
  const victory = mode === "victory";
  const defeat = mode === "defeat";
  const drift = 10 + hash(6) * 30;
  const direction = hash(7) > 0.5 ? 1 : -1;
  const colors = victory
    ? [CAKEDUEL_PALETTE.gold, CAKEDUEL_PALETTE.peach, CAKEDUEL_PALETTE.pink, CAKEDUEL_PALETTE.peachLight, "#fff"]
    : defeat
      ? [CAKEDUEL_PALETTE.sky, CAKEDUEL_PALETTE.brownLight, CAKEDUEL_PALETTE.peach, CAKEDUEL_PALETTE.creamDark]
      : [CAKEDUEL_PALETTE.peach, CAKEDUEL_PALETTE.peachLight, CAKEDUEL_PALETTE.pink, CAKEDUEL_PALETTE.gold];
  return {
    id: index,
    x: 5 + hash(1) * 90,
    y: victory ? 80 + hash(2) * 30 : defeat ? -10 - hash(2) * 20 : 5 + hash(2) * 90,
    size: mode === "start" ? 3 + hash(3) * 5 : 4 + hash(3) * 8,
    delay: hash(4) * (mode === "start" ? 5 : 1.5),
    duration: mode === "start" ? 4 + hash(5) * 4 : 3 + hash(5) * 4,
    driftX: mode === "start" ? drift * 0.4 : drift * direction,
    driftY: mode === "start" ? -drift : victory ? -drift * 12 : drift * 10,
    color: colors[index % colors.length],
    star: victory && index % 3 === 0,
  };
}

export const CakeDuelAmbientParticles = memo(function CakeDuelAmbientParticles({
  mode,
}: {
  mode: ParticleMode;
}) {
  const count = mode === "start" ? 12 : 18;
  const particles = useMemo(
    () => Array.from({ length: count }, (_, index) => makeParticle(index, mode)),
    [count, mode],
  );
  const animationName = mode === "start"
    ? "cakeduel-route-particle-start"
    : mode === "victory"
      ? "cakeduel-route-particle-win"
      : "cakeduel-route-particle-loss";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" data-cakeduel-route-particles={mode}>
      <style>{DECORATIVE_STYLES}</style>
      {particles.map((particle) => {
        const style: CSSProperties & Record<"--cd-drift-x" | "--cd-drift-y", string> = {
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          borderRadius: particle.star ? 2 : "50%",
          rotate: particle.star ? "45deg" : undefined,
          opacity: mode === "start" ? 0.35 : 0,
          animation: `${animationName} ${particle.duration}s ${particle.delay}s ease-${mode === "start" ? "in-out" : "out"} infinite`,
          "--cd-drift-x": `${particle.driftX}px`,
          "--cd-drift-y": `${particle.driftY}px`,
        };
        return <span key={particle.id} className="absolute" style={style} />;
      })}
    </div>
  );
});

export interface CakeDuelHeroFanProps {
  scale: number;
  cardBackImage: string;
  resolveCardFront(name: string, highResolution?: boolean): string;
  overlayImage?: string;
  overlaySizePx?: number;
}

export const CakeDuelHeroFan = memo(function CakeDuelHeroFan({
  scale,
  cardBackImage,
  resolveCardFront,
  overlayImage,
  overlaySizePx,
}: CakeDuelHeroFanProps) {
  const overlaySize = overlaySizePx ?? 80 * scale;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height: 160 * scale }}
      data-cakeduel-route-hero
    >
      {HERO_CARDS.map(({ card, x, y, rotate, delayMs }) => (
        <div
          key={card}
          className="absolute"
          style={{ transform: `translate(${x * scale}px, ${y * scale}px) rotate(${rotate}deg)` }}
        >
          <img
            src={resolveCardFront(card, false)}
            alt=""
            draggable={false}
            className="rounded-lg object-cover"
            style={{
              width: 72 * scale,
              height: 99 * scale,
              border: `2px solid ${CAKEDUEL_PALETTE.cream}`,
              boxShadow: "0 4px 16px rgba(60,40,20,0.25)",
              animation: `cakeduel-route-hero-card 560ms ${delayMs}ms cubic-bezier(.23,1,.32,1) both`,
            }}
          />
        </div>
      ))}
      <img
        src={cardBackImage}
        alt=""
        draggable={false}
        className="relative z-10 rounded-xl object-cover"
        style={{
          width: 88 * scale,
          height: 121 * scale,
          border: `3px solid ${CAKEDUEL_PALETTE.cream}`,
          boxShadow: "0 8px 32px rgba(60,40,20,0.35), 0 2px 8px rgba(60,40,20,0.2)",
          animation: "cakeduel-route-hero-center 620ms 100ms cubic-bezier(.23,1,.32,1) both",
        }}
      />
      {overlayImage ? (
        <img
          src={overlayImage}
          alt=""
          draggable={false}
          className="absolute left-1/2 top-1/2 z-20 drop-shadow-xl"
          style={{
            width: overlaySize,
            height: overlaySize,
            marginLeft: -overlaySize / 2,
            marginTop: -overlaySize / 2,
            objectFit: "contain",
            animation: "cakeduel-route-outcome 620ms 400ms cubic-bezier(.23,1,.32,1) both",
          }}
        />
      ) : null}
    </div>
  );
});

export const CakeDuelRouteDivider = memo(function CakeDuelRouteDivider({
  compact,
  image,
}: {
  compact: boolean;
  image: string;
}) {
  return (
    <div
      className={compact ? "flex items-center gap-2 w-full" : "flex items-center gap-2 w-full my-1"}
      style={{ animation: "cakeduel-route-divider 400ms 500ms ease-out both" }}
      data-cakeduel-route-divider
    >
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${CAKEDUEL_PALETTE.peach}80)` }} />
      <img src={image} alt="" draggable={false} className={compact ? "w-7 h-7 drop-shadow-md" : "w-9 h-9 drop-shadow-md"} />
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${CAKEDUEL_PALETTE.peach}80, transparent)` }} />
    </div>
  );
});

export interface CakeDuelRoutePrimaryButtonProps {
  compact: boolean;
  disabled?: boolean;
  fontSize?: number;
  shimmerDelaySec?: number;
  entryDelaySec?: number;
  children: ReactNode;
  icon?: ReactNode;
  onClick(): void;
}

export const CakeDuelRoutePrimaryButton = memo(function CakeDuelRoutePrimaryButton({
  compact,
  disabled = false,
  fontSize = 20,
  shimmerDelaySec = 0,
  entryDelaySec,
  children,
  icon,
  onClick,
}: CakeDuelRoutePrimaryButtonProps) {
  const button = (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${compact ? "py-2 px-4" : "py-3 px-6"} w-full rounded-xl relative overflow-hidden transition-transform hover:scale-[1.03] active:scale-[.97] disabled:opacity-50 disabled:hover:scale-100`}
      style={{
        background: `linear-gradient(135deg, ${CAKEDUEL_PALETTE.peach} 0%, #e09050 50%, ${CAKEDUEL_PALETTE.peachDeep} 100%)`,
        border: `2px solid ${CAKEDUEL_PALETTE.peachDeep}`,
        color: CAKEDUEL_PALETTE.cream,
        fontFamily: "'Lilita One', sans-serif",
        fontSize,
        letterSpacing: "0.03em",
        boxShadow: `0 6px 24px ${CAKEDUEL_PALETTE.peach}50, inset 0 2px 0 ${CAKEDUEL_PALETTE.peachLight}40, inset 0 -2px 0 ${CAKEDUEL_PALETTE.peachDeep}40`,
      }}
      data-cakeduel-route-primary
    >
      <span
        className="absolute inset-0"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
          animation: `cakeduel-route-shimmer 5s ${shimmerDelaySec}s linear infinite`,
        }}
      />
      <span className="relative flex items-center justify-center gap-2">{icon}{children}</span>
    </button>
  );

  if (entryDelaySec === undefined) return button;
  return (
    <div
      className="w-full"
      style={{ animation: `cakeduel-route-entry 400ms ${entryDelaySec}s ease-out both` }}
      data-cakeduel-route-entry
    >
      {button}
    </div>
  );
});
