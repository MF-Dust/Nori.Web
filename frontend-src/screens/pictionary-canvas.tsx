import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type PointerEvent } from "react";
import {
  chooseDrawingSample, drawingSampleStrokes, loadPictionaryDrawings, normalizeDrawingStroke,
  PICTIONARY_COLORS, PICTIONARY_ERASER_WIDTH, PICTIONARY_PEN_WIDTH,
  type DrawingPoint, type DrawingStroke,
} from "../apps/pictionary-model";
import type { PictionaryRenderer } from "./pictionary-renderer";
import type { DrawingSnapshot } from "../apps/pictionary-runtime";

export interface PictionaryCanvasHandle {
  clear(): void;
  undo(): void;
  snapshot(): DrawingSnapshot | null;
}
export interface PictionaryCanvasProps {
  roundId: string; drawingId: string; redrawEpoch: number;
  active: boolean; drawer: "player" | "agent";
  color: string; eraser: boolean;
  onStroke(stroke: DrawingStroke): void;
  onChange(): void;
  startSoundLoop?: (cue: string) => () => void;
}
export const PictionaryCanvas = forwardRef<PictionaryCanvasHandle, PictionaryCanvasProps>(function PictionaryCanvas(props, handle) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const renderer = useRef<PictionaryRenderer | null>(null);
  const strokes = useRef<DrawingStroke[]>([]);
  const draft = useRef<{ pointer: number; points: DrawingPoint[]; color: string; width: number } | null>(null);
  const base = useRef({ width: 0, height: 0 });
  const revision = useRef(0);
  const lastPreview = useRef(0);
  const latest = useRef(props);
  latest.current = props;
  const scratch = useRef<{ stop: () => void; timer: ReturnType<typeof setTimeout> } | null>(null);
  const stopScratch = () => {
    if (!scratch.current) return;
    clearTimeout(scratch.current.timer); scratch.current.stop(); scratch.current = null;
  };
  const touchScratch = () => {
    const start = latest.current.startSoundLoop;
    if (!start) return;
    const stop = scratch.current?.stop ?? start("partygames-pictionary-pen-scratch");
    if (scratch.current) clearTimeout(scratch.current.timer);
    scratch.current = { stop, timer: setTimeout(stopScratch, 180) };
  };
  useEffect(() => stopScratch, []);
  const [error, setError] = useState<string | null>(null);
  const render = () => {
    const target = canvas.current;
    if (!target || !renderer.current) return;
    const { width, height } = target.getBoundingClientRect();
    if (!width || !height) return;
    if (!base.current.width) base.current = { width, height };
    renderer.current.render(width, height, base.current, strokes.current, draft.current);
  };
  const changed = () => { revision.current++; render(); latest.current.onChange(); };
  useImperativeHandle(handle, () => ({
    clear() {
      if (!latest.current.active || latest.current.drawer !== "player") return;
      strokes.current = []; draft.current = null; stopScratch(); changed();
    },
    undo() {
      if (!latest.current.active || latest.current.drawer !== "player") return;
      strokes.current.pop(); draft.current = null; stopScratch(); changed();
    },
    snapshot() {
      const source = canvas.current;
      if (!source || !renderer.current || !source.width || !source.height) return null;
      render();
      const target = document.createElement("canvas"), scale = 256 / Math.max(source.width, source.height);
      target.width = Math.max(1, Math.round(source.width * scale));
      target.height = Math.max(1, Math.round(source.height * scale));
      const ctx = target.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, target.width, target.height);
      ctx.drawImage(source, 0, 0, target.width, target.height);
      return { revision: revision.current, image: target.toDataURL("image/png").split(",")[1], width: target.width, height: target.height };
    },
  }));
  useEffect(() => {
    const host = surface.current;
    if (!host) return;
    const target = document.createElement("canvas");
    target.setAttribute("aria-label", latest.current.drawer === "player" ? "Drawing canvas" : "Nori drawing");
    target.dataset.renderer = "loading";
    host.append(target); canvas.current = target;
    let disposed = false;
    let owned: typeof renderer.current = null;
    const observer = new ResizeObserver(render);
    observer.observe(host);
    void import("./pictionary-renderer").then(module => disposed ? null : module.createPictionaryRenderer(target)).then(value => {
      if (!value) return;
      if (disposed) { value.dispose(); return; }
      owned = renderer.current = value;
      target.dataset.renderer = "pixi";
      render();
    }).catch(reason => { if (!disposed) { target.dataset.renderer = "error"; setError(String(reason)); } });
    return () => {
      disposed = true; observer.disconnect(); owned?.dispose(); target.remove();
      if (canvas.current === target) { canvas.current = null; renderer.current = null; }
    };
  }, []);
  useEffect(() => {
    canvas.current?.setAttribute("aria-label", props.drawer === "player" ? "Drawing canvas" : "Nori drawing");
  }, [props.drawer]);
  useEffect(() => {
    strokes.current = []; draft.current = null; stopScratch(); revision.current = 0; lastPreview.current = 0; setError(null); render();
  }, [props.roundId]);
  useEffect(() => {
    if (!props.active) { draft.current = null; stopScratch(); render(); }
  }, [props.active]);
  useEffect(() => {
    if (props.drawer !== "agent" || !props.active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const used = new Set<number>();
    const schedule = (callback: () => void, ms: number) => {
      if (!cancelled) timer = setTimeout(() => { if (!cancelled) callback(); }, ms);
    };
    void loadPictionaryDrawings().then(index => {
      const drawSample = () => {
        if (cancelled) return;
        const sample = chooseDrawingSample(index, props.drawingId, used);
        if (!sample) { setError("No drawing sample available"); return; }
        const prepared = drawingSampleStrokes(sample);
        strokes.current = [];
        const drawStroke = (index: number) => {
          if (cancelled) return;
          if (index >= prepared.length) { schedule(drawSample, 10_000); return; }
          const source = prepared[index];
          const current = { ...source, points: source.points.slice(0, 1) };
          strokes.current.push(current);
          let point = 1;
          const extend = () => {
            if (cancelled) return;
            if (point < source.points.length) {
              current.points.push(source.points[point++]); touchScratch(); render(); schedule(extend, 15); return;
            }
            stopScratch();
            const dimensions = base.current;
            const length = source.points.slice(1).reduce((sum, next, point) => sum + Math.hypot(
              (next.x - source.points[point].x) * dimensions.width,
              (next.y - source.points[point].y) * dimensions.height), 0);
            const fraction = Math.min(1, length / Math.max(1, Math.hypot(dimensions.width, dimensions.height)));
            schedule(() => drawStroke(index + 1), Math.max(0, Math.floor(300 + fraction * 1700 + 1700 * .15 * (Math.random() - .5))));
          };
          extend();
        };
        drawStroke(0);
      };
      drawSample();
    }).catch(reason => { if (!cancelled) setError(String(reason)); });
    return () => { cancelled = true; if (timer !== null) clearTimeout(timer); stopScratch(); };
  }, [props.roundId, props.drawingId, props.redrawEpoch, props.drawer, props.active]);
  const point = (event: PointerEvent<HTMLDivElement>): DrawingPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width * base.current.width,
      y: (event.clientY - bounds.top) / bounds.height * base.current.height,
    };
  };
  function finish(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const current = draft.current;
    if (!current || current.pointer !== event.pointerId) return;
    draft.current = null;
    stopScratch();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && props.active && props.drawer === "player") {
      const normalized = normalizeDrawingStroke(current.points, base.current.width, base.current.height, current.color, current.width);
      if (normalized) { strokes.current.push(normalized); props.onStroke(normalized); changed(); }
    }
    render();
  }
  return <div className="source-pictionary-canvas">
    <div ref={surface} style={{ width: "100%", height: "100%", touchAction: "none" }}
      onPointerDown={event => {
        if (!renderer.current || !props.active || props.drawer !== "player" || event.button !== 0 || draft.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        draft.current = { pointer: event.pointerId, points: [point(event)], color: props.eraser ? "#ffffff" : props.color || PICTIONARY_COLORS[0], width: props.eraser ? PICTIONARY_ERASER_WIDTH : PICTIONARY_PEN_WIDTH };
        touchScratch();
      }}
      onPointerMove={event => { if (draft.current?.pointer === event.pointerId) { draft.current.points.push(point(event)); touchScratch(); render();
        if (Date.now() - lastPreview.current >= 1000) { lastPreview.current = Date.now(); revision.current++; latest.current.onChange(); } } }}
      onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)} />
    {error && <p role="alert">{error}</p>}
  </div>;
});
