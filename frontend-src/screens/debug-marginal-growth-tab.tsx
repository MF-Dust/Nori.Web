import { debugText } from "../i18n/debug";
import { useSyncExternalStore } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { MarginalGrowthState } from "../state/marginal-growth-store";
import { Range } from "./debug-live2d-tab";

const SOURCES: ReadonlyArray<{ id: string; label: string }> = [
  { id: "owned", label: "Owned" },
  { id: "autoplay", label: "Autoplay" },
  { id: "manual", label: "Manual" },
];

const integer = (value: number) => Math.round(value).toLocaleString("en-US");

/**
 * Shipped Debug "Marginal Growth" panel
 * (`Debug-D6AtxpLT.js:5190-5296`), bound to the live store the Idle runtime
 * drives. It tunes the ribbon; it never renders it.
 */
export function MarginalGrowthDebugTab({
  store,
}: {
  store?: UseBoundStore<StoreApi<MarginalGrowthState>>;
}) {
  if (!store) {
    return (
      <section aria-label={debugText("Marginal growth")}>
        <h2>{debugText("Marginal growth")}</h2>
        <p role="status">{debugText("Marginal-growth store is not mounted.")}</p>
      </section>
    );
  }
  return <MarginalGrowthPanel store={store} />;
}

function MarginalGrowthPanel({
  store,
}: {
  store: UseBoundStore<StoreApi<MarginalGrowthState>>;
}) {
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const { params, phase, source } = state;
  const { setParam, setKRef, setExponent, setStepOffset, setSource } = state;
  const maxSteps = params.maxSteps;
  return (
    <section aria-label={debugText("Marginal growth")}>
      <h2>{debugText("Marginal growth")}</h2>
      <div className="source-debug-lab-actions">
        {SOURCES.map((option) => (
          <button
            type="button"
            key={option.id}
            aria-pressed={source === option.id}
            onClick={() => setSource(option.id)}
          >
            {debugText(option.label)}
          </button>
        ))}
      </div>
      <div className="source-debug-lab-actions">
        <button type="button" onClick={state.restart}>{debugText("Restart")}{" "}</button>
        <button type="button" onClick={state.reset}>{debugText("Defaults")}{" "}</button>
      </div>
      <Range
        label={debugText("kRef")}
        value={state.kRef}
        min={5}
        max={1000}
        step={1}
        onChange={setKRef}
        format={(value) => value.toFixed(1)}
      />
      <Range
        label={debugText("exp")}
        value={state.exponent}
        min={0.5}
        max={30}
        step={0.1}
        onChange={setExponent}
        format={(value) => value.toFixed(2)}
      />
      <Range
        label={debugText("step0")}
        value={state.stepOffset}
        min={0}
        max={Math.max(1, maxSteps - 1)}
        step={1}
        onChange={setStepOffset}
        format={integer}
      />
      <p>{debugText("phase")}{" "}
        <output>
          {phase.toFixed(3)}
          {source === "owned" && phase > 1 ? debugText(" (clamped)") : ""}
        </output>
      </p>
      <Range
        label={debugText("n")}
        value={params.steps}
        min={0}
        max={maxSteps}
        step={1}
        disabled={source !== "manual"}
        onChange={(value) => setParam("steps", value)}
        format={integer}
      />
      <Range
        label={debugText("width")}
        value={params.lineWidth}
        min={0.6}
        max={4}
        step={0.1}
        onChange={(value) => setParam("lineWidth", value)}
        format={(value) => value.toFixed(1)}
      />
      <Range
        label={debugText("scale")}
        value={params.renderScale}
        min={0.25}
        max={10}
        step={0.25}
        onChange={(value) => setParam("renderScale", value)}
        format={(value) => `${value.toFixed(2)}x`}
      />
      <Range
        label={debugText("alpha")}
        value={params.renderOpacity}
        min={0}
        max={1}
        step={0.05}
        onChange={(value) => setParam("renderOpacity", value)}
        format={(value) => value.toFixed(2)}
      />
      <Range
        label={debugText("blur")}
        value={params.renderBlur}
        min={0}
        max={64}
        step={0.5}
        onChange={(value) => setParam("renderBlur", value)}
        format={(value) => value.toFixed(2)}
      />
      <Range
        label={debugText("tint")}
        value={params.renderTint}
        min={0}
        max={16777215}
        step={1118481}
        onChange={(value) => setParam("renderTint", value)}
        format={(value) =>
          `#${Math.round(value).toString(16).padStart(6, "0")}`
        }
      />
    </section>
  );
}
