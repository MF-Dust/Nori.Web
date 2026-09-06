import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const CORE_SIZE = 15;
const CORE_CELL_PX = 5;
const CORE_PIXEL_SIZE = CORE_SIZE * CORE_CELL_PX;
const ERASE_BLOCK_PX = 30;
const BUILD_START_MS = 340;
const BUILD_DURATION_MS = 1_520;
const ERASE_START_MS = 3_460;
const ERASE_DURATION_MS = 700;

export type IdleInitializationSoundEvent =
  | "buildTickStart"
  | "buildTickStop"
  | "charge"
  | "ignite"
  | "shine"
  | "stamp";

export interface IdleInitializationSequenceProps {
  onComplete(): void;
  onSoundEvent?: (event: IdleInitializationSoundEvent) => void;
  random?: () => number;
}

type IdleInitializationPhase =
  | "build"
  | "charge"
  | "ignite"
  | "shine"
  | "stamp"
  | "erase"
  | "done";

interface Cell {
  x: number;
  y: number;
}

const COPY = {
  en: {
    title: "Compute core initialization",
    line1: "> Mounting compute core …",
    line2: "> Calibrating alignment field …",
    line3: "> Syncing data channel …",
    ready: "Ready",
  },
  zh: {
    title: "算力核心初始化",
    line1: "> 发现可用计算资源 …",
    line2: "> 检查运行状态 …",
    line3: "> 建立同步连接 …",
    ready: "就绪",
  },
} as const;

function currentCopy() {
  if (typeof document === "undefined") return COPY.zh;
  const language = (document.documentElement.lang || navigator.language || "zh-CN").toLowerCase();
  return language.startsWith("en") ? COPY.en : COPY.zh;
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createCoreBuildOrder(random: () => number): Cell[] {
  const key = (x: number, y: number) => `${x}:${y}`;
  const center = Math.floor(CORE_SIZE / 2);
  const visited = new Set<string>([key(center, center)]);
  const order: Cell[] = [{ x: center, y: center }];
  const frontier: Cell[] = [];
  const directions: readonly Cell[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  const addFrontier = (cell: Cell) => {
    for (const direction of directions) {
      const x = cell.x + direction.x;
      const y = cell.y + direction.y;
      if (x < 0 || y < 0 || x >= CORE_SIZE || y >= CORE_SIZE) continue;
      if (visited.has(key(x, y))) continue;
      if (frontier.some((candidate) => candidate.x === x && candidate.y === y)) continue;
      frontier.push({ x, y });
    }
  };

  addFrontier(order[0]);
  while (order.length < CORE_SIZE * CORE_SIZE && frontier.length > 0) {
    const index = Math.floor(random() * frontier.length);
    const [next] = frontier.splice(index, 1);
    if (!next || visited.has(key(next.x, next.y))) continue;
    visited.add(key(next.x, next.y));
    order.push(next);
    addFrontier(next);
  }
  return order;
}

function resizeFullscreenCanvas(canvas: HTMLCanvasElement) {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width, height, context };
}

export function IdleInitializationSequence({
  onComplete,
  onSoundEvent,
  random = Math.random,
}: IdleInitializationSequenceProps) {
  const coreCanvasRef = useRef<HTMLCanvasElement>(null);
  const wipeCanvasRef = useRef<HTMLCanvasElement>(null);
  const completedRef = useRef(false);
  const [phase, setPhase] = useState<IdleInitializationPhase>("build");
  const [titleVisible, setTitleVisible] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [status, setStatus] = useState("");
  const copy = useMemo(currentCopy, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const frames = new Set<number>();
    let cancelled = false;
    const schedule = (callback: () => void, milliseconds: number) => {
      const timer = setTimeout(() => {
        if (!cancelled) callback();
      }, milliseconds);
      timers.push(timer);
    };
    const frame = (callback: FrameRequestCallback) => {
      const id = requestAnimationFrame((time) => {
        frames.delete(id);
        if (!cancelled) callback(time);
      });
      frames.add(id);
      return id;
    };

    const coreCanvas = coreCanvasRef.current;
    const wipeCanvas = wipeCanvasRef.current;
    if (!coreCanvas || !wipeCanvas) return;
    coreCanvas.width = CORE_PIXEL_SIZE;
    coreCanvas.height = CORE_PIXEL_SIZE;
    const coreContext = coreCanvas.getContext("2d");
    if (coreContext) {
      coreContext.imageSmoothingEnabled = false;
      coreContext.clearRect(0, 0, CORE_PIXEL_SIZE, CORE_PIXEL_SIZE);
    }
    const wipe = resizeFullscreenCanvas(wipeCanvas);
    wipe.context?.fillRect(0, 0, wipe.width, wipe.height);

    const buildOrder = createCoreBuildOrder(random);
    const buildStartedAt = performance.now() + BUILD_START_MS;
    let drawnCells = 0;
    const drawBuild = (timestamp: number) => {
      if (!coreContext) return;
      const elapsed = timestamp - buildStartedAt;
      const normalized = Math.max(0, Math.min(1, elapsed / BUILD_DURATION_MS));
      const eased = 1 - (1 - normalized) ** 1.7;
      const target = Math.min(buildOrder.length, Math.floor(eased * buildOrder.length));
      while (drawnCells < target) {
        const cell = buildOrder[drawnCells];
        const distance = Math.hypot(cell.x - 7, cell.y - 7) / 10;
        const alpha = Math.max(0.55, 1 - distance * 0.25);
        coreContext.fillStyle = `rgba(103, 232, 249, ${alpha})`;
        coreContext.fillRect(
          cell.x * CORE_CELL_PX,
          cell.y * CORE_CELL_PX,
          CORE_CELL_PX,
          CORE_CELL_PX,
        );
        drawnCells += 1;
      }
      if (normalized < 1) frame(drawBuild);
    };

    onSoundEvent?.("buildTickStart");
    schedule(() => {
      setTitleVisible(true);
      frame(drawBuild);
    }, BUILD_START_MS);
    schedule(() => setVisibleLineCount(1), 720);
    schedule(() => setVisibleLineCount(2), 1_260);
    schedule(() => setVisibleLineCount(3), 1_840);
    schedule(() => onSoundEvent?.("buildTickStop"), 1_900);
    schedule(() => {
      setPhase("charge");
      onSoundEvent?.("charge");
    }, 2_020);
    schedule(() => setVisibleLineCount(4), 2_360);
    schedule(() => {
      setPhase("ignite");
      onSoundEvent?.("ignite");
    }, 2_380);
    schedule(() => {
      setPhase("shine");
      onSoundEvent?.("shine");
    }, 2_760);
    schedule(() => setVisibleLineCount(5), 2_860);
    schedule(() => {
      setPhase("stamp");
      setStatus(copy.ready);
      onSoundEvent?.("stamp");
    }, 3_080);

    schedule(() => {
      setPhase("erase");
      const { width, height, context } = resizeFullscreenCanvas(wipeCanvas);
      if (!context) return;
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "#000";
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "destination-out";
      const columns = Math.ceil(width / ERASE_BLOCK_PX);
      const rows = Math.ceil(height / ERASE_BLOCK_PX);
      const cells = shuffled(
        Array.from({ length: columns * rows }, (_, index) => ({
          x: (index % columns) * ERASE_BLOCK_PX,
          y: Math.floor(index / columns) * ERASE_BLOCK_PX,
        })),
        random,
      );
      const eraseStartedAt = performance.now();
      let erased = 0;
      const erase = (timestamp: number) => {
        const progress = Math.max(0, Math.min(1, (timestamp - eraseStartedAt) / ERASE_DURATION_MS));
        const target = Math.min(cells.length, Math.ceil(progress * cells.length));
        while (erased < target) {
          const cell = cells[erased];
          context.clearRect(cell.x, cell.y, ERASE_BLOCK_PX, ERASE_BLOCK_PX);
          erased += 1;
        }
        if (progress < 1) {
          frame(erase);
          return;
        }
        schedule(() => {
          setPhase("done");
          if (completedRef.current) return;
          completedRef.current = true;
          onComplete();
        }, 40);
      };
      frame(erase);
    }, ERASE_START_MS);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
      onSoundEvent?.("buildTickStop");
    };
  }, [copy.ready, onComplete, onSoundEvent, random]);

  const lines = [
    copy.line1,
    copy.line2,
    copy.line3,
    "◓  • • • • •",
    "●  SYSTEM CORE — ONLINE",
  ];
  const contentHidden = phase === "erase" || phase === "done";
  const coreScale = phase === "charge" ? 1.08 : phase === "ignite" ? 1.18 : phase === "shine" ? 1.25 : 1;
  const coreBrightness = phase === "ignite" || phase === "shine" || phase === "stamp" ? 1.8 : 1;
  const coreShadow =
    phase === "shine" || phase === "stamp"
      ? "0 0 10px #67e8f9, 0 0 34px rgba(34,211,238,.95), 0 0 70px rgba(34,211,238,.55)"
      : phase === "ignite"
        ? "0 0 24px rgba(34,211,238,.85)"
        : "0 0 12px rgba(34,211,238,.5)";

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 overflow-hidden font-mono text-cyan-200">
      <canvas ref={wipeCanvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div
        className="absolute inset-0 transition-opacity duration-75"
        style={{ opacity: contentHidden ? 0 : 1 }}
      >
        <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-cyan-400/10" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/10" />
        <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 border border-cyan-400/15" />
        <div className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 border border-dashed border-cyan-400/10" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="relative grid place-items-center transition-transform duration-200"
            style={{ transform: `scale(${coreScale})` }}
          >
            <span className="absolute -left-8 top-1/2 h-px w-5 bg-cyan-300/60" />
            <span className="absolute -right-8 top-1/2 h-px w-5 bg-cyan-300/60" />
            <span className="absolute left-1/2 -top-8 h-5 w-px bg-cyan-300/60" />
            <span className="absolute left-1/2 -bottom-8 h-5 w-px bg-cyan-300/60" />
            <canvas
              ref={coreCanvasRef}
              className="block [image-rendering:pixelated]"
              style={{
                width: CORE_PIXEL_SIZE,
                height: CORE_PIXEL_SIZE,
                filter: `brightness(${coreBrightness})`,
                boxShadow: coreShadow,
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="absolute left-[max(28px,7vw)] top-[max(28px,8vh)] max-w-[min(560px,82vw)]">
          <div
            className="text-[11px] uppercase tracking-[0.34em] text-cyan-300 transition-all duration-200"
            style={{
              opacity: titleVisible ? 0.82 : 0,
              transform: titleVisible ? "translateY(0)" : "translateY(4px)",
            }}
          >
            {copy.title}
          </div>
          <div className="mt-5 space-y-2 text-[11px] leading-5 tracking-[0.08em] text-cyan-200/70">
            {lines.map((line, index) => (
              <div
                key={line}
                className="transition-all duration-150"
                style={{
                  opacity: visibleLineCount > index ? 1 : 0,
                  transform: visibleLineCount > index ? "translateX(0)" : "translateX(-4px)",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        <div
          className="absolute bottom-[max(28px,8vh)] right-[max(28px,7vw)] border border-cyan-300/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] text-cyan-100 transition-all duration-150"
          style={{
            opacity: status ? 1 : 0,
            transform: status ? "translateY(0)" : "translateY(4px)",
            boxShadow: status ? "0 0 18px rgba(34,211,238,.22)" : "none",
          } as CSSProperties}
        >
          {status}
        </div>
      </div>
    </div>
  );
}
