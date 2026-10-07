import { debugMessage, debugText } from "../i18n/debug";
import { useState } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import type { MarginalGrowthState } from "../state/marginal-growth-store";
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
  type DebugGame,
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
  marginalGrowth?: UseBoundStore<StoreApi<MarginalGrowthState>>;
  previewReaction?(reaction: (typeof DEBUG_REACTIONS)[number]): void;
  loadScenario?(game: DebugGame, scenarioId: string): Promise<void>;
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
      <h2>{debugText(title)}</h2>
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
    <Lab title={debugText("Network lab")}>
      <p>{debugText("Flaky WebSocket profile:")}{" "}{debugText(active)}</p>
      <div className="source-debug-lab-actions">
        {(["off", "mild", "moderate", "severe"] as const).map((preset) => (
          <button
            type="button"
            key={preset}
            aria-pressed={active === preset}
            onClick={() => select(preset)}
          >
            {debugText(preset[0].toUpperCase() + preset.slice(1))}
          </button>
        ))}
        <button type="button" onClick={reload}>{debugText("Apply & reload")}{" "}</button>
      </div>
      <p>{debugText("Profiles apply after reload and never alter server state.")}</p>
    </Lab>
  );
}

export function ComputeDebugLab({
  actions,
}: {
  actions?: ComputeDebugActions;
}) {
  return (
    <Lab title={debugText("Compute lab")}>
      {!actions && <p role="status">{debugText("Compute runtime is not mounted.")}</p>}
      <div className="source-debug-lab-actions">
        {COMPUTE_TARGETS.map((target) => (
          <button
            type="button"
            key={target}
            disabled={!actions}
            onClick={() =>
              actions?.grant(computeGrantToTarget(actions.current(), target))
            }
          >{debugText("Target")}{" "}{target.toExponential(0)}
          </button>
        ))}
        <button
          type="button"
          disabled={!actions?.maxAll}
          onClick={actions?.maxAll}
        >{debugText("Max all")}{" "}</button>
        <button
          type="button"
          disabled={!actions?.abdicate}
          onClick={actions?.abdicate}
        >{debugText("Abdicate")}{" "}</button>
        <button
          type="button"
          disabled={!actions?.reset}
          onClick={actions?.reset}
        >{debugText("Reset")}{" "}</button>
      </div>
      <h3>{debugText("Time travel")}</h3>
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
      <h3>{debugText("Faction coins")}</h3>
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
    <Lab title={debugText("Gesture lab")}>
      <button
        type="button"
        onClick={() =>
          setResult(
            simulateQualifyingHeadPat(frontend.headPat)
              ? "Production recognizer completed"
              : "Recognizer did not complete",
          )
        }
      >{debugText("Run qualifying pat")}{" "}</button>
      <output>{debugText(result)}</output>
      <p>{debugText("The lab exercises the recognizer only; it does not send a cartridge event or story fact.")}{" "}</p>
    </Lab>
  );
}

export function ReactionDebugLab({
  preview,
}: {
  preview?: DebugLabActions["previewReaction"];
}) {
  return (
    <Lab title={debugText("Reaction lab")}>
      <div className="source-debug-lab-actions">
        {DEBUG_REACTIONS.map((reaction) => (
          <button
            type="button"
            key={reaction}
            disabled={!preview}
            onClick={() => preview?.(reaction)}
          >
            {debugText(reaction)}
          </button>
        ))}
      </div>
      {!preview && <p role="status">{debugText("No Live2D reaction preview is mounted.")}</p>}
    </Lab>
  );
}

export function ScenarioDebugLab({
  load,
}: {
  load?: DebugLabActions["loadScenario"];
}) {
  const [status, setStatus] = useState("Select a scenario");
  const [pending, setPending] = useState<string | null>(null);
  return (
    <Lab title={debugText("Game scenarios")}>
      {(["chess", "codenames", "cakeduel"] as const).map((game) => (
        <section key={game} aria-label={debugMessage("{{game}} scenarios", { game: debugText(game === "cakeduel" ? debugText("Cake Duel") : game[0].toUpperCase() + game.slice(1)) })}>
          <h3>{game === "cakeduel" ? debugText("Cake Duel") : debugText(game[0].toUpperCase() + game.slice(1))}</h3>
          <div className="source-debug-lab-actions">
            {DEBUG_GAME_SCENARIOS.filter(
              (scenario) => scenario.game === game,
            ).map((scenario) => (
              <button
                type="button"
                key={scenario.id}
                disabled={!load || pending !== null}
                onClick={() => {
                  setPending(`${scenario.game}:${scenario.id}`);
                  setStatus(debugMessage("Loading {{id}}…", { id: scenario.id }));
                  void load?.(scenario.game, scenario.id).then(
                    () => {
                      setPending(null);
                      setStatus(debugMessage("Loaded {{id}}", { id: scenario.id }));
                    },
                    (error) => {
                      setPending(null);
                      setStatus(debugMessage("Failed: {{error}}", { error: String(error) }));
                    },
                  );
                }}
              >
                {pending === `${scenario.game}:${scenario.id}`
                  ? debugText("Loading…")
                  : debugText(scenario.label)}
              </button>
            ))}
          </div>
        </section>
      ))}
      <p role="status">{debugText(status)}</p>
    </Lab>
  );
}
