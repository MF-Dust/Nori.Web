import { registerScanModel } from "./scan-bounds";
import { useEffect, useRef, useState } from "react";
import {
  Live2DEngine,
  createDragPlugin,
  createBlinkPlugin,
  createBreathPlugin,
  createPhysicsPlugin,
  createLipSyncPlugin,
  type Live2DSession,
} from "./engine.js";
import type { SpeechPlayer } from "../runtime/speech-player";
import {
  live2DRenderBudget,
  useGraphicsSettings,
  ResolutionHysteresis,
} from "../state/graphics-store";
import "./stage.css";
import { detectGpu } from "../runtime/graphics-detection";
import { bindNoriModel } from "./model-runtime";
import { noriIdleFromFacts, noriLipExpressionBlend } from "./idle-controller";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import {
  createCinematicFacePlugin,
  createThinkingLightPlugin,
} from "./scene-plugins";

/** NormalApp model and plugin configuration. Story choreography remains a separate boundary. */
export function NoriStage({
  frontend,
  facts,
  exclusive,
}: {
  frontend: NoriFrontendRuntime;
  facts: ReadonlySet<string>;
  exclusive(): boolean;
}) {
  const speech: SpeechPlayer = frontend.speech;
  const latest = useRef({ facts, exclusive });
  latest.current = { facts, exclusive };
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    if (!host.current) return;
    // A fresh canvas for each effect lifetime also survives StrictMode's setup/cleanup probe.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-label", "Nori");
    host.current.append(canvas);
    let unregisterScan: (() => void) | undefined;
    let unbindModel: (() => void) | undefined;
    let disposed = false,
      engine: Live2DEngine | undefined,
      session: Live2DSession | undefined;
    const resolution = new ResolutionHysteresis();
    let budgetTimer: ReturnType<typeof setTimeout> | undefined;
    let graphicsMode = useGraphicsSettings.getState().mode;
    const updateBudget = () => {
      if (!session || !host.current) return;
      clearTimeout(budgetTimer);
      const nextMode = useGraphicsSettings.getState().mode;
      if (nextMode !== graphicsMode) {
        resolution.reset();
        graphicsMode = nextMode;
      }
      const budget = live2DRenderBudget(
        useGraphicsSettings.getState().mode,
        Math.max(host.current.clientHeight, host.current.clientWidth),
        window.devicePixelRatio,
        detectGpu().tier === "low",
      );
      const stable = resolution.update(budget.resolution, performance.now());
      session.setMaxFps(budget.fps);
      session.setResolution(stable.resolution);
      host.current.dataset.live2dFps = String(budget.fps);
      host.current.dataset.live2dResolution = String(stable.resolution);
      if (stable.delay !== null)
        budgetTimer = setTimeout(updateBudget, stable.delay);
    };
    const unsubscribeGraphics = useGraphicsSettings.subscribe(updateBudget);
    const resize = new ResizeObserver(updateBudget);
    resize.observe(host.current);
    setStatus("loading");
    try {
      engine = Live2DEngine.create({ baseUrl: "/", logging: "error" });
      session = engine.createSession({
        canvas,
        render: { maxResolution: 2048 },
        camera: { viewScale: 1, offsetX: 0, offsetY: 0 },
        input: { enableDrag: false, enableTap: false, passThrough: true },
        plugins: [
          createDragPlugin({ enabled: false }),
          createBlinkPlugin({ enabled: false }),
          createBreathPlugin({ enabled: false }),
          createPhysicsPlugin({ enabled: true }),
          createLipSyncPlugin({
            enabled: true,
            getAmplitude: () => speech.level(),
            getIntensity: () => 0.4,
            getFormIntensity: () =>
              ["kneel", "kneelCalm"].includes(
                noriIdleFromFacts(latest.current.facts),
              )
                ? 0
                : 1,
            getExpressionBlend: noriLipExpressionBlend,
          }),
          createThinkingLightPlugin(
            () =>
              frontend.conversation.snapshot().connected &&
              frontend.conversation.snapshot().phase === "executing",
          ),
          createCinematicFacePlugin(frontend.scene),
        ],
      });
      updateBudget();
      void session
        .loadModel({
          dir: "/ARGNori_web/",
          modelJson: "ARGNori.model3.json",
          textureVariants: {
            corrupt: { 0: "ARGNori.4096/texture_00_corrupt.png" },
          },
        })
        .then((model) => {
          if (disposed) return;
          unregisterScan = registerScanModel(canvas, model);
          model.setIdleSequence({ group: "Idle", index: 0, loop: true });
          unbindModel = bindNoriModel({
            model,
            conversation: frontend.conversation,
            speech,
            scene: frontend.scene,
            facts: () => latest.current.facts,
            exclusive: () => latest.current.exclusive(),
            host: host.current!,
          });
          session!.start();
          setStatus("ready");
        })
        .catch((error) => {
          if (!disposed) {
            console.error("[NoriStage]", error);
            setStatus("error");
          }
        });
    } catch (error) {
      console.error("[NoriStage]", error);
      setStatus("error");
    }
    return () => {
      disposed = true;
      unsubscribeGraphics();
      unregisterScan?.();
      unbindModel?.();
      clearTimeout(budgetTimer);
      resize.disconnect();
      engine?.dispose();
      canvas.remove();
    };
  }, [frontend, speech]);
  return (
    <div className="nori-stage" ref={host} data-live2d-status={status}>
      {status === "error" && (
        <span className="nori-stage-error" role="status">
          Live2D unavailable
        </span>
      )}
    </div>
  );
}
