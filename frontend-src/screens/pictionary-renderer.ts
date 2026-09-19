import { Application, Graphics } from "pixi.js";
import type { DrawingPoint, DrawingStroke } from "../apps/pictionary-model";

/** The drawing surface owns one Pixi renderer; export uses the same rendered pixels. */
export async function createPictionaryRenderer(canvas: HTMLCanvasElement) {
  const app = new Application();
  try {
    await app.init({
      canvas,
      width: 1,
      height: 1,
      preference: "webgl",
      backgroundColor: 0xffffff,
      antialias: true,
      autoStart: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preserveDrawingBuffer: true,
    });
  } catch (error) {
    if (app.renderer) app.destroy(false, { children: true });
    else app.stage.destroy({ children: true });
    throw error;
  }
  const ink = new Graphics();
  app.stage.addChild(ink);
  let disposed = false;
  return {
    render(
      width: number,
      height: number,
      base: { width: number; height: number },
      strokes: readonly DrawingStroke[],
      draft: { points: DrawingPoint[]; color: string; width: number } | null,
    ) {
      if (disposed || width <= 0 || height <= 0) return;
      if (app.screen.width !== width || app.screen.height !== height)
        app.renderer.resize(width, height);
      ink.clear();
      const paint = (
        points: readonly DrawingPoint[],
        color: string,
        penWidth: number,
        normalized: boolean,
      ) => {
        if (points.length < 2) return;
        const xScale = normalized ? width : width / Math.max(1, base.width);
        const yScale = normalized ? height : height / Math.max(1, base.height);
        ink.moveTo(points[0].x * xScale, points[0].y * yScale);
        for (const point of points.slice(1))
          ink.lineTo(point.x * xScale, point.y * yScale);
        ink.stroke({
          color,
          width: (penWidth * width) / Math.max(1, base.width),
          cap: "round",
          join: "round",
        });
      };
      for (const stroke of strokes)
        paint(stroke.points, stroke.color, stroke.width, true);
      if (draft) paint(draft.points, draft.color, draft.width, false);
      app.render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      app.destroy(false, {
        children: true,
        texture: true,
        textureSource: true,
      });
    },
  };
}

export type PictionaryRenderer = Awaited<
  ReturnType<typeof createPictionaryRenderer>
>;
