import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import {
  SHATTER_PARAMETERS,
  ShatterRenderer,
  createFractureGraph,
  shatterDefaults,
  type ShatterParameters,
} from "../story/boot-shatter-renderer.js";
import {
  DATASEA_TUNER_PARAMETERS,
  dataseaTunerDefaults,
  dataseaTunerFrame,
  type DataseaTunerValues,
} from "../story/datasea-tuner";
import {
  createDataseaRenderer,
  type DataseaRenderer,
} from "../story/datasea-renderer";

const GRAPH_PARAMETERS = [
  "energy",
  "events",
  "chips",
  "maxPlate",
  "debris",
  "thickness",
  "gravity",
  "shock",
  "flowForce",
  "coneSpread",
  "dragQuad",
  "dragLin",
  "alignAero",
  "spinDrag",
] as const;

function useTunerGuard(frontend: NoriFrontendRuntime) {
  const story = useSyncExternalStore(
    frontend.story.subscribe,
    frontend.story.snapshot,
  );
  const [worldEpoch, setWorldEpoch] = useState(0);
  useEffect(
    () =>
      frontend.world.subscribe((_state, message) => {
        if (
          message.type === "world_joined" ||
          message.type === "world_created" ||
          message.type === "world_left"
        )
          setWorldEpoch((value) => value + 1);
      }),
    [frontend],
  );
  return { blocked: story !== null, worldEpoch };
}

/** Editor-only preview backed by the same fracture graph and renderer as BootScene. */
export function ShatterSceneTuner({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ShatterRenderer | null>(null);
  const [params, setParams] = useState<ShatterParameters>(() =>
    shatterDefaults({}),
  );
  const [progress, setProgress] = useState(0.55);
  const paramsRef = useRef(params);
  const progressRef = useRef(progress);
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { blocked, worldEpoch } = useTunerGuard(frontend);
  paramsRef.current = params;
  progressRef.current = progress;
  const graphKey = useMemo(
    () => GRAPH_PARAMETERS.map((key) => params[key]).join(":"),
    [params],
  );

  useEffect(() => {
    const element = canvas.current;
    if (!element || blocked || failure) return;
    let next: ShatterRenderer | null = null;
    try {
      next = new ShatterRenderer(
        element,
        paramsRef.current,
        createFractureGraph(paramsRef.current),
      );
      renderer.current = next;
      next.ensureBreakStage();
    } catch (error) {
      if (next) {
        if (renderer.current === next) renderer.current = null;
        try {
          next.dispose();
        } catch {
          // The original construction/render failure is the actionable error.
        }
      }
      setFailure(String(error));
      return;
    }
    const activeRenderer = next;
    let failed = false;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      if (renderer.current === activeRenderer) renderer.current = null;
      try {
        activeRenderer.dispose();
      } catch {
        // Cleanup must remain safe during story takeover and unmount.
      }
    };
    const resize = () => {
      if (failed || released) return;
      try {
        activeRenderer.resize(element.clientWidth, element.clientHeight);
        activeRenderer.render(progressRef.current, paramsRef.current);
      } catch (error) {
        failed = true;
        release();
        setFailure(String(error));
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => {
      observer.disconnect();
      release();
    };
    // Graph-affecting changes intentionally reconstruct the production renderer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphKey, blocked, worldEpoch, failure, attempt]);

  useEffect(() => {
    try {
      renderer.current?.render(progress, params);
    } catch (error) {
      setFailure(String(error));
    }
  }, [params, progress]);

  const update = (key: string, value: number) => {
    if (!Number.isFinite(value)) return;
    const metadata = SHATTER_PARAMETERS[key];
    setParams((current) => ({
      ...current,
      [key]: Math.min(metadata.max, Math.max(metadata.min, value)),
    }));
  };

  return (
    <section aria-label="Shatter scene tuner">
      <h2>Boot shatter tuner</h2>
      {blocked && (
        <p role="status">Production story active; preview released.</p>
      )}
      {failure && (
        <p role="alert">
          Shatter preview failed: {failure}
          <button
            type="button"
            onClick={() => {
              setFailure(null);
              setAttempt((value) => value + 1);
            }}
          >
            Retry shatter preview
          </button>
        </p>
      )}
      <canvas
        ref={canvas}
        data-shatter-preview
        style={{ width: "100%", height: 360, background: "#020407" }}
      />
      <label>
        Preview progress
        <input
          aria-label="Shatter preview progress"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={progress}
          onChange={(event) => setProgress(event.target.valueAsNumber)}
        />
        <output>{progress.toFixed(2)}</output>
      </label>
      <button
        type="button"
        onClick={() => {
          setParams(shatterDefaults({}));
          setProgress(0.55);
        }}
      >
        Reset shatter defaults
      </button>
      <div className="source-scene-channel-grid">
        {Object.entries(SHATTER_PARAMETERS).map(([key, metadata]) => (
          <label key={key}>
            {metadata.label}
            <input
              aria-label={`Shatter ${metadata.label}`}
              type="number"
              min={metadata.min}
              max={metadata.max}
              step={metadata.step}
              value={params[key]}
              onChange={(event) => update(key, event.target.valueAsNumber)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

/** Editor-only preview backed by the production GLB/material/postprocess path. */
export function DataseaSceneTuner({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<DataseaRenderer | null>(null);
  const valuesRef = useRef<DataseaTunerValues>(dataseaTunerDefaults());
  const [values, setValues] = useState<DataseaTunerValues>(valuesRef.current);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { blocked, worldEpoch } = useTunerGuard(frontend);
  valuesRef.current = values;

  useEffect(() => {
    const element = canvas.current;
    if (!element || blocked || failure) return;
    setStatus("loading");
    let next: DataseaRenderer;
    try {
      next = createDataseaRenderer(element);
    } catch (error) {
      setStatus("error");
      setFailure(String(error));
      return;
    }
    renderer.current = next;
    let disposed = false;
    void next.ready.then(
      () => {
        if (disposed) return;
        try {
          next.render(dataseaTunerFrame(valuesRef.current));
          setStatus("ready");
        } catch (error) {
          setStatus("error");
          setFailure(String(error));
        }
      },
      (error) => {
        if (!disposed) {
          setStatus("error");
          setFailure(String(error));
        }
      },
    );
    const resize = () => {
      if (disposed) return;
      try {
        next.resize();
        next.render(dataseaTunerFrame(valuesRef.current));
      } catch (error) {
        if (!disposed) {
          setStatus("error");
          setFailure(String(error));
        }
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => {
      disposed = true;
      observer.disconnect();
      if (renderer.current === next) renderer.current = null;
      try {
        next.dispose();
      } catch {
        // Cleanup must remain safe during story takeover and unmount.
      }
    };
  }, [attempt, blocked, failure, worldEpoch]);

  useEffect(() => {
    try {
      renderer.current?.render(dataseaTunerFrame(values));
    } catch (error) {
      setStatus("error");
      setFailure(String(error));
    }
  }, [values]);

  const update = <Key extends keyof DataseaTunerValues>(
    key: Key,
    value: DataseaTunerValues[Key],
  ) => setValues((current) => ({ ...current, [key]: value }));
  const updateNumber = (
    key: keyof typeof DATASEA_TUNER_PARAMETERS,
    value: number,
  ) => {
    if (!Number.isFinite(value)) return;
    const metadata = DATASEA_TUNER_PARAMETERS[key];
    update(key, Math.min(metadata.max, Math.max(metadata.min, value)));
  };

  return (
    <section aria-label="Datasea scene tuner">
      <h2>Datasea tuner</h2>
      {blocked && (
        <p role="status">Production story active; preview released.</p>
      )}
      {failure && (
        <p role="alert">
          Datasea preview failed: {failure}
          <button
            type="button"
            onClick={() => {
              setFailure(null);
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
          >
            Retry Datasea preview
          </button>
        </p>
      )}
      <canvas
        ref={canvas}
        data-datasea-preview
        style={{ width: "100%", height: 360, background: "#000205" }}
      />
      <p role="status">Datasea renderer: {status}</p>
      <label>
        Phase
        <select
          aria-label="Datasea phase"
          value={values.phase}
          onChange={(event) =>
            update("phase", event.target.value as DataseaTunerValues["phase"])
          }
        >
          <option value="descent">Descent</option>
          <option value="converge">Converge</option>
          <option value="cosmic">Cosmic</option>
        </select>
      </label>
      <button type="button" onClick={() => setValues(dataseaTunerDefaults())}>
        Reset Datasea defaults
      </button>
      <div className="source-scene-channel-grid">
        {Object.entries(DATASEA_TUNER_PARAMETERS).map(([key, metadata]) => (
          <label key={key}>
            {metadata.label}
            <input
              aria-label={`Datasea ${metadata.label}`}
              type="number"
              min={metadata.min}
              max={metadata.max}
              step={metadata.step}
              value={values[key as keyof typeof DATASEA_TUNER_PARAMETERS]}
              onChange={(event) =>
                updateNumber(
                  key as keyof typeof DATASEA_TUNER_PARAMETERS,
                  event.target.valueAsNumber,
                )
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}
