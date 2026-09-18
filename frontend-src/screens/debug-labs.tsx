import { useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import {
  COMPUTE_TARGETS,
  COMPUTE_TIME_STEPS,
  DEBUG_GAME_SCENARIOS,
  DEBUG_REACTIONS,
  FACTION_COIN_GRANTS,
  NETWORK_FAULT_PRESETS,
  computeGrantToTarget,
  identifyNetworkFaultPreset,
  readNetworkFaultProfile,
  simulateQualifyingHeadPat,
  writeNetworkFaultProfile,
  type NetworkFaultPreset,
} from "../runtime/debug-tools";

export interface ComputeDebugActions {
  current(): number;
  grant(amount: number): void;
  maxAll?(): void;
  abdicate?(): void;
  reset?(): void;
  advanceTime?(seconds: number): void;
  grantFactionCoins?(amount: number): void;
}

export interface DebugLabActions {
  compute?: ComputeDebugActions;
  previewReaction?(reaction: (typeof DEBUG_REACTIONS)[number]): void;
  loadScenario?(game: "codenames", scenarioId: string): Promise<void>;
}

function Lab({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function NetworkDebugLab({ reload = () => location.reload() }) {
  const [profile, setProfile] = useState(() =>
    readNetworkFaultProfile(localStorage),
  );
  const active = identifyNetworkFaultPreset(profile);
  const select = (preset: NetworkFaultPreset) => {
    const next = preset === "off" ? null : NETWORK_FAULT_PRESETS[preset];
    writeNetworkFaultProfile(localStorage, next);
    setProfile(next);
  };
  return (
    <Lab title="Network lab">
      <p>Flaky WebSocket profile: {active}</p>
      <div className="source-debug-lab-actions">
        {(["off", "mild", "moderate", "severe"] as const).map((preset) => (
          <button
            type="button"
            key={preset}
            aria-pressed={active === preset}
            onClick={() => select(preset)}
          >
            {preset[0].toUpperCase() + preset.slice(1)}
          </button>
        ))}
        <button type="button" onClick={reload}>
          Apply &amp; reload
        </button>
      </div>
      <p>Profiles apply after reload and never alter server state.</p>
    </Lab>
  );
}

export function ComputeDebugLab({
  actions,
}: {
  actions?: ComputeDebugActions;
}) {
  return (
    <Lab title="Compute lab">
      {!actions && <p role="status">Compute runtime is not mounted.</p>}
      <div className="source-debug-lab-actions">
        {COMPUTE_TARGETS.map((target) => (
          <button
            type="button"
            key={target}
            disabled={!actions}
            onClick={() =>
              actions?.grant(computeGrantToTarget(actions.current(), target))
            }
          >
            Target {target.toExponential(0)}
          </button>
        ))}
        <button
          type="button"
          disabled={!actions?.maxAll}
          onClick={actions?.maxAll}
        >
          Max all
        </button>
        <button
          type="button"
          disabled={!actions?.abdicate}
          onClick={actions?.abdicate}
        >
          Abdicate
        </button>
        <button
          type="button"
          disabled={!actions?.reset}
          onClick={actions?.reset}
        >
          Reset
        </button>
      </div>
      <h3>Time travel</h3>
      <div className="source-debug-lab-actions">
        {COMPUTE_TIME_STEPS.map((seconds) => (
          <button
            type="button"
            key={seconds}
            disabled={!actions?.advanceTime}
            onClick={() => actions?.advanceTime?.(seconds)}
          >
            +{seconds < 3_600 ? `${seconds / 60}m` : `${seconds / 3_600}h`}
          </button>
        ))}
      </div>
      <h3>Faction coins</h3>
      <div className="source-debug-lab-actions">
        {FACTION_COIN_GRANTS.map((amount) => (
          <button
            type="button"
            key={amount}
            disabled={!actions?.grantFactionCoins}
            onClick={() => actions?.grantFactionCoins?.(amount)}
          >
            +{amount.toLocaleString()}
          </button>
        ))}
      </div>
    </Lab>
  );
}

export function GestureDebugLab({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const [result, setResult] = useState("Not run");
  return (
    <Lab title="Gesture lab">
      <button
        type="button"
        onClick={() =>
          setResult(
            simulateQualifyingHeadPat(frontend.headPat)
              ? "Production recognizer completed"
              : "Recognizer did not complete",
          )
        }
      >
        Run qualifying pat
      </button>
      <output>{result}</output>
      <p>
        The lab exercises the recognizer only; it does not send a cartridge
        event or story fact.
      </p>
    </Lab>
  );
}

export function ReactionDebugLab({
  preview,
}: {
  preview?: DebugLabActions["previewReaction"];
}) {
  return (
    <Lab title="Reaction lab">
      <div className="source-debug-lab-actions">
        {DEBUG_REACTIONS.map((reaction) => (
          <button
            type="button"
            key={reaction}
            disabled={!preview}
            onClick={() => preview?.(reaction)}
          >
            {reaction}
          </button>
        ))}
      </div>
      {!preview && <p role="status">No Live2D reaction preview is mounted.</p>}
    </Lab>
  );
}

export function ScenarioDebugLab({
  load,
}: {
  load?: DebugLabActions["loadScenario"];
}) {
  const [status, setStatus] = useState("Select a scenario");
  return (
    <Lab title="Game scenarios">
      {DEBUG_GAME_SCENARIOS.map((scenario) => (
        <button
          type="button"
          key={scenario.id}
          disabled={!load}
          onClick={() => {
            setStatus(`Loading ${scenario.id}…`);
            void load?.(scenario.game, scenario.id).then(
              () => setStatus(`Loaded ${scenario.id}`),
              (error) => setStatus(`Failed: ${String(error)}`),
            );
          }}
        >
          {scenario.label}
        </button>
      ))}
      <p role="status">{status}</p>
    </Lab>
  );
}
