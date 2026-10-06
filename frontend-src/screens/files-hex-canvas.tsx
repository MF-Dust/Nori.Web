import { useEffect, useRef } from "react";

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function recoveredByte(seed: number, index: number): number {
  let value = (seed * 2654435761 + index * 40503) >>> 0;
  value = ((value ^ (value >>> 15)) * 739982445) >>> 0;
  return (value ^ (value >>> 12)) & 255;
}

function hex(value: number): string {
  return value.toString(16).toUpperCase().padStart(2, "0");
}

/** FilesScreen's Le: stable recovered bytes, 125ms changing encrypted bytes. */
export function FilesHexCanvas({ seed, pct, stalled, paused = false, cols = 8, rows = 7, className }: {
  seed: string; pct: number; stalled: boolean; paused?: boolean;
  cols?: number; rows?: number; className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ pct, stalled, paused });
  const dirty = useRef(true);
  state.current = { pct, stalled, paused };
  dirty.current = true;
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const cells = cols * rows;
    const bytes = new Array<number>(cells).fill(0);
    const numericSeed = hashSeed(seed);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fraction = () => Math.max(0, Math.min(1, state.current.pct / 100));
    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const cellWidth = (width - 16) / cols;
      const cellHeight = (height - 14) / rows;
      const resolved = Math.round(fraction() * cells);
      context.clearRect(0, 0, width, height);
      context.font = `600 ${Math.min(11, cellHeight * 0.72).toFixed(1)}px ui-monospace,Menlo,Consolas,monospace`;
      context.textBaseline = "middle";
      context.textAlign = "center";
      for (let index = 0; index < cells; index++) {
        context.fillStyle = index < resolved ? "rgba(132,196,206,0.66)" : state.current.stalled ? "rgba(190,160,96,0.42)" : "rgba(140,172,182,0.30)";
        context.fillText(hex(index < resolved ? recoveredByte(numericSeed, index) : bytes[index]), 8 + cellWidth * (index % cols + 0.5), 7 + cellHeight * (Math.floor(index / cols) + 0.5));
      }
      if (fraction() > 0.001) {
        const y = 7 + cellHeight * Math.min(rows, resolved / cols);
        const colour = state.current.stalled ? "241,178,74" : "119,198,212";
        const gradient = context.createLinearGradient(0, y - 3, 0, y + 3);
        gradient.addColorStop(0, `rgba(${colour},0)`);
        gradient.addColorStop(0.5, `rgba(${colour},0.85)`);
        gradient.addColorStop(1, `rgba(${colour},0)`);
        context.fillStyle = gradient;
        context.fillRect(6, y - 2, width - 12, 3);
      }
    };
    const resize = () => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    let frame = 0;
    let lastTick = 0;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (!state.current.paused && !reduceMotion.matches && !document.hidden && fraction() < 1 && time - lastTick >= 125) {
        lastTick = time;
        for (let index = Math.round(fraction() * cells); index < cells; index++) bytes[index] = (bytes[index] + 1 + ((index * 73 + (bytes[index] << 3)) & 7)) & 255;
        draw();
        dirty.current = false;
      } else if (dirty.current) {
        draw();
        dirty.current = false;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [seed, cols, rows]);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
