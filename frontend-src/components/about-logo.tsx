import { useEffect, useRef } from "react";
import "./about-logo.css";

/** Original Oge: ±6° spring tilt, masked sheen and halo. */
export function AboutLogo({ reduced }: { reduced: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 });
  const frame = useRef(0),
    previousTime = useRef(0);
  const animate = (time: number) => {
    const state = motion.current;
    const dt = Math.min(
      0.032,
      Math.max(0.001, (time - previousTime.current) / 1000),
    );
    previousTime.current = time;
    for (const [axis, velocity, target] of [
      ["x", "vx", "targetX"],
      ["y", "vy", "targetY"],
    ] as const) {
      state[velocity] +=
        (180 * (state[target] - state[axis]) - 18 * state[velocity]) * dt;
      state[axis] += state[velocity] * dt;
    }
    host.current?.style.setProperty("--tilt-x", `${state.x}deg`);
    host.current?.style.setProperty("--tilt-y", `${state.y}deg`);
    if (
      Math.abs(state.x - state.targetX) +
        Math.abs(state.y - state.targetY) +
        Math.abs(state.vx) +
        Math.abs(state.vy) >
      0.01
    )
      frame.current = requestAnimationFrame(animate);
    else frame.current = 0;
  };
  const target = (x: number, y: number) => {
    if (reduced) return;
    motion.current.targetX = x;
    motion.current.targetY = y;
    if (!frame.current) {
      previousTime.current = performance.now();
      frame.current = requestAnimationFrame(animate);
    }
  };
  useEffect(() => {
    if (reduced) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      host.current?.style.removeProperty("--tilt-x");
      host.current?.style.removeProperty("--tilt-y");
    }
    return () => cancelAnimationFrame(frame.current);
  }, [reduced]);
  return (
    <div
      ref={host}
      className="about-logo"
      data-reduced={reduced || undefined}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        target(
          (0.5 - (event.clientY - rect.top) / rect.height) * 12,
          ((event.clientX - rect.left) / rect.width - 0.5) * 12,
        );
      }}
      onPointerLeave={() => target(0, 0)}
    >
      <div className="about-logo-halo" aria-hidden="true" />
      <div className="about-logo-hover" aria-hidden="true" />
      <img
        src="/icon.png"
        alt="NoriOS"
        draggable={false}
        className="invert dark:invert-0"
      />
      {!reduced && (
        <div className="about-logo-mask" aria-hidden="true">
          <div className="about-logo-sheen" />
        </div>
      )}
    </div>
  );
}
