import {
  Live2DEngine,
  createBlinkPlugin,
  createBreathPlugin,
  createPhysicsPlugin,
  type Live2DModel,
  type Live2DSession,
} from "../live2d/engine.js";

/** Dedicated Finale model. The desktop ARGNori model does not contain these expressions. */
export class FarewellActor {
  readonly canvas = document.createElement("canvas");
  private engine: Live2DEngine;
  private session: Live2DSession;
  private model: Live2DModel | null = null;
  private expression: string | null = null;
  private idle = -1;
  private disposed = false;
  constructor() {
    this.canvas.width = 720;
    this.canvas.height = 1440;
    this.canvas.style.cssText =
      "position:fixed;left:-200vw;top:0;width:720px;height:1440px;pointer-events:none";
    this.engine = Live2DEngine.create({ baseUrl: "/", logging: "error" });
    this.session = this.engine.createSession({
      canvas: this.canvas,
      render: { maxResolution: 2048, premultipliedAlpha: true },
      camera: { viewScale: 1 },
      input: { enableDrag: false, enableTap: false, passThrough: true },
      plugins: [
        createBlinkPlugin({ enabled: false }),
        createBreathPlugin({ enabled: false }),
        createPhysicsPlugin({ enabled: true }),
      ],
    });
  }
  async load() {
    const model = await this.session.loadModel({
      dir: "/Nori_web/",
      modelJson: "Nori.model3.json",
    });
    if (this.disposed) return false;
    this.model = model;
    this.setCue("Finale_Default", 2);
    this.session.start();
    return true;
  }
  setCue(expression: string, idle: number) {
    if (!this.model) return;
    if (expression !== this.expression) {
      this.expression = expression;
      this.model.setExpression(expression);
    }
    if (idle !== this.idle) {
      this.idle = idle;
      const step = { group: "Idle", index: idle, loop: true, fadeIn: 0.8 };
      this.model.setIdleSequence(step);
      this.model.startMotion({ steps: step });
    }
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.session.destroy();
    this.engine.dispose();
    this.canvas.remove();
  }
}
