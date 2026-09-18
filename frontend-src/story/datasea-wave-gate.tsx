import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import {
  DATASEA_GAME_COMPONENTS,
  type DataseaGameApi,
} from "./datasea-games-original.js";
import "./datasea-wave-gate.css";

export const DATASEA_GAMES = [
  ["steady", "稳态", 400, 300],
  ["resonance", "共振", 400, 420],
  ["current", "逆流", 380, 380],
  ["relay", "中继", 460, 420],
  ["echo", "应答", 360, 360],
  ["denoise", "降噪", 400, 340],
  ["discern", "辨认", 500, 400],
  ["ripple", "波纹", 380, 412],
  ["sweep", "扫描", 320, 440],
  ["unknot", "解结", 400, 380],
  ["lure", "引航", 580, 460],
  ["balance", "平衡", 420, 400],
] as const;
const WAVES = [
  [5, 8, 9, 3],
  [6, 4, 0, 11],
  [2, 10, 1, 7],
] as const;
const POSITIONS = [
  { x: 0.06, y: 0.16 },
  { x: 0.66, y: 0.14 },
  { x: 0.08, y: 0.55 },
  { x: 0.68, y: 0.54 },
] as const;
// Only the shipped cadence and line lengths are retained; narrative text is intentionally absent.
const BREAKS = [
  [
    [0.9, 1.2, 4],
    [0.6, 1.6, 12],
    [0.8, 1.8, 20],
    [0.6, 1.8, 18],
    [1.2, 1.6, 13],
    [0.8, 1.6, 13],
  ],
  [
    [0.9, 2, 26],
    [0.7, 2.2, 31],
    [0.8, 1.8, 18],
    [1.4, 1.2, 2],
    [0.8, 1.8, 14],
    [0.7, 2.4, 41],
    [1, 1.8, 20],
    [0.6, 1.8, 20],
    [0.8, 1.4, 10],
    [0.6, 1.4, 8],
  ],
] as const;
let topZ = 1000;
const clampPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
) => ({
  x: Math.max(8, Math.min(window.innerWidth - width - 8, x)),
  y: Math.max(56, Math.min(window.innerHeight - height - 8, y)),
});

export function DataseaGameWindow({
  gameIndex,
  order,
  solved,
  api,
}: {
  gameIndex: number;
  order: number;
  solved: boolean;
  api: DataseaGameApi;
}) {
  const [id, title, width, height] = DATASEA_GAMES[gameIndex],
    point = POSITIONS[order];
  const initial = useMemo(
    () =>
      clampPosition(
        point.x * window.innerWidth,
        point.y * window.innerHeight,
        width,
        height,
      ),
    [point, width, height],
  );
  const [position, setPosition] = useState(initial),
    [zIndex, setZIndex] = useState(() => ++topZ),
    [entered, setEntered] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    let frame = 0;
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setPosition((value) => clampPosition(value.x, value.y, width, height)),
      );
    };
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, [width, height]);
  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    setZIndex(++topZ);
    drag.current = {
      dx: event.clientX - position.x,
      dy: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current)
      setPosition(
        clampPosition(
          event.clientX - drag.current.dx,
          event.clientY - drag.current.dy,
          width,
          height,
        ),
      );
  };
  const Game = DATASEA_GAME_COMPONENTS[id];
  return (
    <section
      className="datasea-wave-window datasea-game-window"
      data-game={id}
      data-solved={solved || undefined}
      style={{
        left: position.x,
        top: position.y,
        width,
        height,
        zIndex,
        opacity: solved ? 0 : entered ? 1 : 0,
        transform: solved ? "scale(.94)" : entered ? "scale(1)" : "scale(.9)",
        transitionDelay: solved ? "0ms" : `${order * 140}ms`,
        pointerEvents: solved ? "none" : undefined,
      }}
      onPointerDown={() => setZIndex(++topZ)}
    >
      <div
        className="datasea-wave-titlebar"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <span aria-disabled="true" title="Closes automatically when cleared" />
        <strong>{title}</strong>
        {solved && <em>已清除</em>}
      </div>
      <div
        className="datasea-wave-body datasea-game datasea-game-original"
        data-game={id}
        data-solved={String(solved)}
      >
        <Game api={api} />
      </div>
    </section>
  );
}

export function DataseaWaveGate({
  wake,
  frontend,
  hit,
}: {
  wake: () => void;
  frontend: NoriFrontendRuntime;
  hit?: (gameId: string, intensity: number) => void;
}) {
  const [wave, setWave] = useState(0),
    [solved, setSolved] = useState<ReadonlySet<number>>(() => new Set());
  const [breakState, setBreakState] = useState<{
    landed: number;
    typing: boolean;
    fading: boolean;
  } | null>(null);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set()),
    finishedWave = useRef(-1),
    wakeRef = useRef(wake);
  wakeRef.current = wake;
  const later = (delay: number, callback: () => void) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
  };
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    [],
  );
  useEffect(() => {
    const spawned = WAVES[wave].map((_, index) =>
      setTimeout(
        () =>
          frontend.audio.playCue("cutscenes-wave-spawn", {
            pitch: 1 + index * 0.04,
          }),
        index * 140,
      ),
    );
    return () => spawned.forEach(clearTimeout);
  }, [frontend, wave]);
  const clearWave = () => {
    if (finishedWave.current >= wave) return;
    finishedWave.current = wave;
    frontend.audio.playCue("cutscenes-wave-surge");
    if (wave === WAVES.length - 1) {
      later(1400, () => wakeRef.current());
      return;
    }
    const cadence = BREAKS[wave];
    let elapsed = 900;
    cadence.forEach(([gap, dots], index) => {
      elapsed += gap * 1000;
      later(elapsed, () =>
        setBreakState({ landed: index, typing: true, fading: false }),
      );
      elapsed += dots * 1000;
      later(elapsed, () => {
        frontend.audio.playCue("cutscenes-datasea-message-land");
        setBreakState({ landed: index + 1, typing: false, fading: false });
      });
    });
    later(elapsed + 2600, () =>
      setBreakState((state) => state && { ...state, fading: true }),
    );
    later(elapsed + 3200, () => {
      setBreakState(null);
      setSolved(new Set());
      setWave((value) => value + 1);
    });
  };
  const apis = WAVES[wave].map((gameIndex) => ({
    onProgress: () => {},
    onSolved: () =>
      setSolved((current) => {
        if (current.has(gameIndex) || finishedWave.current >= wave)
          return current;
        frontend.audio.playCue("cutscenes-microgame-solve-finale");
        const next = new Set(current);
        next.add(gameIndex);
        if (next.size === 4) queueMicrotask(clearWave);
        return next;
      }),
    hit: (intensity = 1) => {
      hit?.(DATASEA_GAMES[gameIndex][0], intensity);
      frontend.audio.playCue("cutscenes-microgame-hit", {
        volume: 0.6 + 0.4 * Math.max(0, Math.min(1, intensity)),
      });
    },
  }));
  const cadence = wave < BREAKS.length ? BREAKS[wave] : null;
  return (
    <div
      className="datasea-wave-gate datasea-waves"
      aria-label={`Signal wave ${wave + 1} of ${WAVES.length}`}
    >
      {!breakState &&
        finishedWave.current < wave &&
        WAVES[wave].map((gameIndex, order) => (
          <DataseaGameWindow
            key={`${wave}-${gameIndex}`}
            gameIndex={gameIndex}
            order={order}
            solved={solved.has(gameIndex)}
            api={apis[order]}
          />
        ))}
      {breakState && cadence && (
        <div
          className="datasea-wave-transmission datasea-wave-break"
          data-fading={breakState.fading || undefined}
          role="status"
          aria-label={`Transmission ${breakState.landed} of ${cadence.length}`}
        >
          {cadence.slice(0, breakState.landed).map((line, index) => (
            <span
              key={index}
              style={{ width: `${Math.min(100, 18 + line[2] * 1.8)}%` }}
            />
          ))}
          {breakState.typing && (
            <i>
              <b />
              <b />
              <b />
            </i>
          )}
        </div>
      )}
    </div>
  );
}
