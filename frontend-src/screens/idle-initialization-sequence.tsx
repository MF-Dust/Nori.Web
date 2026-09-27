import { useEffect, useRef } from "react";

export type IdleInitializationSoundEvent =
  | "buildTickStart" | "buildTickStop" | "charge" | "ignite" | "shine" | "stamp";

export interface IdleInitializationSequenceProps {
  onComplete(): void;
  onSoundEvent?: (event: IdleInitializationSoundEvent) => void;
  random?: () => number;
}

const CORE = [
  ".......C.......", "......CCC......", ".....CCbCC.....",
  "....CCbbbCC....", "...CCbbWbbCC...", "..CCbbWWWbbCC..",
  ".CCbbWWMWWbbCC.", "CCbbWWMMMWWbbCC", ".CCbbWWMWWbbCC.",
  "..CCbbWWWbbCC..", "...CCbbWbbCC...", "....CCbbbCC....",
  ".....CCbCC.....", "......CCC......", ".......C.......",
];
const FONT = '"Fusion Pixel 12px Proportional SC", "Press Start 2P", monospace';
const colors: Record<string, string> = { C: "#0e7490", b: "#142648", W: "#67e8f9", M: "#f8fafc" };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (v: number) => 1 - (1 - v) ** 3;
const quant = (value: number, steps: number) => Math.floor(value * steps) / steps;
const easeInBack = (value: number) => 2.70158 * value ** 3 - 1.70158 * value ** 2;
const easeOutBack = (value: number) => {
  const shifted = value - 1;
  return 1 + 2.70158 * shifted ** 3 + 1.70158 * shifted ** 2;
};
const hash = (v: number) => {
  const n = Math.sin(v * 12.9898) * 43758.5453;
  return n - Math.floor(n);
};
const pixels = CORE.flatMap((line, y) => [...line].flatMap((kind, x) => {
  if (kind === ".") return [];
  const distance = Math.abs(x - 7) + Math.abs(y - 7);
  const jitter = hash(x * 31 + y * 17 + 5);
  const priority = kind === "M" ? .94 + jitter * .06 : (7 - distance) / 7 * .82 + jitter * .18;
  return [{ x, y, kind, at: Math.floor((.38 + 1.34 * priority) * 12) / 12 }];
}));

function copy() {
  const language = (document.documentElement.lang || navigator.language || "zh-CN").toLowerCase();
  return language.startsWith("en")
    ? { title: "Compute core initialization", lines: ["> Discovering compute resources …", "> Checking runtime state …", "> Establishing sync channel …"], ready: "Ready" }
    : { title: "算力核心初始化", lines: ["> 发现可用计算资源 …", "> 检查运行状态 …", "> 建立同步连接 …"], ready: "就绪" };
}

/** Window-sized canvas keeps the core, labels and block reveal on one coordinate system. */
export function IdleInitializationSequence({ onComplete, onSoundEvent, random }: IdleInitializationSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const completed = useRef(false);
  const callback = useRef(onComplete);
  callback.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const strings = copy();
    const blockOrder = new Map<number, number>();
    const played = new Set<string>();
    let width = 0, height = 0, frame = 0, origin: number | null = null;
    const resize = () => {
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const cue = (id: string, event: IdleInitializationSoundEvent) => {
      if (played.has(id)) return;
      played.add(id); onSoundEvent?.(event);
    };
    const draw = (now: number) => {
      origin ??= now;
      const time = Math.max(0, (now - origin) / 1000 - .34);
      const x = width / 2, y = height / 2, coreY = y - 74;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#050811"; ctx.fillRect(0, 0, width, height);
      if (time >= .06) cue("seed", "buildTickStart");
      if (time >= 1.86) cue("charge", "charge");
      if (time >= 2.28) cue("ignite", "ignite");
      if (time >= 2.46) cue("shine", "shine");
      if (time >= 2.62) cue("stamp", "stamp");
      if (time >= 3.18) cue("exit", "buildTickStop");
      if (time >= .06 && time < .38 && quant(time * 6, 6) % (1 / 3) < 1 / 6) {
        ctx.fillStyle = "#67e8f9"; ctx.fillRect(x - 5.5, coreY - 5.5, 11, 11);
      }
      if (time >= .22) {
        ctx.textAlign = "center"; ctx.font = "15px " + FONT;
        ctx.fillStyle = "#67e8f9"; ctx.shadowColor = "#062c3d";
        ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
        ctx.fillText(strings.title, x, coreY - 152);
        ctx.shadowColor = "transparent"; ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
        ctx.fillStyle = "#0e7490"; ctx.fillRect(x - 66, coreY - 142, 132, 2);
      }
      const charge = span(time, 1.86, 2.28);
      const ignite = span(time, 2.28, 2.70);
      const scale = 1 - .1 * easeInBack(charge) + .16 * (easeOutBack(ignite) - ease(ignite));
      ctx.save(); ctx.translate(x, coreY); ctx.scale(scale, scale);
      for (const pixel of pixels) {
        if (time < pixel.at) continue;
        let color = colors[pixel.kind];
        if (time - pixel.at < 1 / 12) color = "#f8fafc";
        else if (time >= 2.28) color = { C: "#22d3ee", b: "#0e7490", W: "#d6fbff" }[pixel.kind] ?? color;
        else if (time >= 1.86 && pixel.kind === "b") color = "#0d1b33";
        else if (time >= 1.86 && pixel.kind === "M") color = quant(time * 18, 18) % (2 / 18) < 1 / 18 ? "#fcd34d" : "#f8fafc";
        ctx.fillStyle = color;
        ctx.fillRect((pixel.x - 7.5) * 11, (pixel.y - 7.5) * 11, 11, 11);
      }
      ctx.restore();
      if (time >= 2.28 && time < 2.28 + 2 / 24) {
        ctx.fillStyle = "rgba(248,250,252,.92)"; ctx.fillRect(0, 0, width, height);
      }
      const ring = span(time, 2.32, 3);
      if (ring > 0 && ring < 1) {
        const radius = Math.floor((20 + (1 - 2 ** (-10 * ring)) * 300) / 4) * 4;
        ctx.strokeStyle = "rgba(103,232,249," + ((1 - ring) * .85) + ")";
        ctx.lineWidth = Math.max(2, 10 * (1 - ring));
        ctx.beginPath(); ctx.moveTo(x, coreY - radius); ctx.lineTo(x + radius, coreY);
        ctx.lineTo(x, coreY + radius); ctx.lineTo(x - radius, coreY); ctx.closePath(); ctx.stroke();
      }
      ctx.textAlign = "left"; ctx.font = "13px " + FONT;
      [.52, 1.02, 1.46].forEach((at, index) => {
        if (time < at) return;
        const cps = index === 2 ? 26 : 24;
        const count = Math.max(1, Math.floor(quant(time - at, 15) * cps * (.85 + .3 * hash(index * 7 + Math.floor(time * 5)))));
        ctx.fillStyle = "rgba(103,232,249,.72)";
        ctx.fillText(strings.lines[index].slice(0, count), x - 150, y + 86 + index * 22);
      });
      const stamp = span(time, 2.62, 2.96);
      if (stamp > 0) {
        ctx.save(); ctx.translate(x, y + 202);
        const size = 1.9 - .9 * ease(stamp);
        ctx.scale(size, size); ctx.globalAlpha = clamp(stamp * 3);
        ctx.font = "34px " + FONT; ctx.textAlign = "center";
        ctx.fillStyle = "#062c3d"; ctx.fillText(strings.ready, 3, 3);
        ctx.fillStyle = "#67e8f9"; ctx.fillText(strings.ready, 0, 0); ctx.restore();
      }
      const wipe = ease(span(time, 3.18, 3.72));
      if (wipe > 0) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "#000";
        const columns = Math.ceil(width / 30), rows = Math.ceil(height / 30);
        for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
          const id = row * columns + column;
          if (!blockOrder.has(id)) blockOrder.set(id, random ? random() : hash(column * 13 + row * 57 + 3));
          if (blockOrder.get(id)! < wipe) ctx.fillRect(column * 30, row * 30, 30, 30);
        }
        ctx.globalCompositeOperation = "source-over";
      }
      if (time >= 3.72) ctx.clearRect(0, 0, width, height);
      if (time < 3.82) frame = requestAnimationFrame(draw);
      else if (!completed.current) { completed.current = true; callback.current(); }
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); onSoundEvent?.("buildTickStop"); };
  }, [onSoundEvent, random]);

  return <canvas ref={canvasRef} className="pointer-events-auto absolute inset-0 z-[35] h-full w-full" aria-label="算力核心初始化" />;
}
