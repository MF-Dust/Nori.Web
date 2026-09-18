import { useState } from "react";
import {
  NORI_MODEL_EXPRESSIONS,
  NORI_MODEL_MOTIONS,
} from "../live2d/model-catalog";
import type { SceneProject, SceneProjectPatch } from "../story/scene-project";

type NumericKey = {
  [K in keyof SceneProjectPatch]-?: Exclude<
    SceneProjectPatch[K],
    null | undefined
  > extends number
    ? K
    : never;
}[keyof SceneProjectPatch];
const channels: Array<{
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
  automatic?: boolean;
}> = [
  { key: "plankton", label: "Plankton", min: 0, max: 4, step: 0.01 },
  { key: "burst", label: "Wake burst", min: 0, max: 1, step: 0.01 },
  { key: "burstAge", label: "Wake burst age", min: 0, max: 600, step: 0.01 },
  {
    key: "fov",
    label: "Field of view",
    min: 10,
    max: 120,
    step: 1,
    automatic: true,
  },
  {
    key: "cameraFar",
    label: "Camera far plane",
    min: 1,
    max: 2000,
    step: 1,
    automatic: true,
  },
  {
    key: "noriDolly",
    label: "Model dolly",
    min: -100,
    max: 100,
    step: 0.1,
    automatic: true,
  },
  { key: "fogNear", label: "Fog near", min: 0, max: 1000, step: 0.1 },
  { key: "fogFar", label: "Fog far", min: 0.1, max: 2000, step: 0.1 },
  {
    key: "manifoldEnv",
    label: "Manifold environment",
    min: 0,
    max: 1,
    step: 0.01,
    automatic: true,
  },
  {
    key: "voidEnv",
    label: "Void environment",
    min: 0,
    max: 1,
    step: 0.01,
    automatic: true,
  },
  { key: "alertLoop", label: "Alert intensity", min: 0, max: 1, step: 0.01 },
  { key: "alertClock", label: "Alert clock", min: 0, max: 600, step: 0.1 },
  ...(
    [
      "darkness",
      "noriTint",
      "memoryComputeDrain",
      "noriReveal",
      "redLight",
      "shake",
      "whiteFlash",
    ] as const
  ).map((key) => ({ key, label: key, min: 0, max: 1, step: 0.01 })),
  { key: "noriDim", label: "Model dim", min: 0, max: 4, step: 0.01 },
  { key: "vignette", label: "Vignette", min: 0, max: 5, step: 0.01 },
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.1 },
  {
    key: "eyeOpen",
    label: "Eye open",
    min: 0,
    max: 1,
    step: 0.01,
    automatic: true,
  },
  {
    key: "mouthOpen",
    label: "Mouth open",
    min: 0,
    max: 1,
    step: 0.01,
    automatic: true,
  },
];

/** Edits the same validated project as the JSON view; never writes directly to the scene. */
export function SceneEditorChannels({
  project,
  disabled,
  onChange,
}: {
  project: SceneProject;
  disabled: boolean;
  onChange: (project: SceneProject) => boolean;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const index = project.phases.findIndex((phase) => phase.id === selection);
  const target = index < 0 ? project.initial : project.phases[index].to;
  function update(
    key: keyof SceneProjectPatch,
    value: SceneProjectPatch[keyof SceneProjectPatch],
  ) {
    const next = { ...target, [key]: value };
    if (value === undefined) delete next[key];
    return onChange(
      index < 0
        ? { ...project, initial: next }
        : {
            ...project,
            phases: project.phases.map((phase, i) =>
              i === index ? { ...phase, to: next } : phase,
            ),
          },
    );
  }
  return (
    <details className="source-scene-channels">
      <summary>Camera and environment channels</summary>
      <fieldset disabled={disabled}>
        <legend>Project overrides</legend>
        <label>
          Editing target
          <select
            aria-label="Scene channel target"
            value={index}
            onChange={(event) =>
              setSelection(
                project.phases[Number(event.target.value)]?.id ?? null,
              )
            }
          >
            <option value={-1}>Initial state</option>
            {project.phases.map((phase, i) => (
              <option value={i} key={phase.id}>
                {phase.id}
              </option>
            ))}
          </select>
        </label>
        <p>
          Numbers apply on blur or Enter. Empty fields inherit the previous
          phase; Auto returns nullable channels to scene defaults.
        </p>
        <div className="source-scene-channel-grid">
          {channels.map((channel) => (
            <div className="source-scene-channel" key={channel.key}>
              <label>
                {channel.label}
                <input
                  type="number"
                  aria-label={`Scene ${channel.label}`}
                  key={`${index}:${channel.key}:${target[channel.key]}`}
                  min={channel.min}
                  max={channel.max}
                  step={channel.step}
                  defaultValue={target[channel.key] ?? ""}
                  placeholder={
                    target[channel.key] === null ? "Auto" : "Inherit"
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  onBlur={(event) => {
                    const input = event.currentTarget;
                    const value =
                      input.value === "" ? undefined : input.valueAsNumber;
                    if (!update(channel.key, value))
                      input.value = String(target[channel.key] ?? "");
                  }}
                />
              </label>
              {channel.automatic && (
                <button
                  type="button"
                  aria-label={`Auto ${channel.label}`}
                  onClick={() => update(channel.key, null)}
                >
                  Auto
                </button>
              )}
              <button
                type="button"
                aria-label={`Inherit ${channel.label}`}
                onClick={() => update(channel.key, undefined)}
              >
                Inherit
              </button>
            </div>
          ))}
        </div>
        <div className="source-scene-channel-grid">
          {(
            ["noriRestPose", "noriSleep", "noriSmile", "corruptVoice"] as const
          ).map((key) => (
            <label key={key}>
              {key}
              <select
                aria-label={`Scene ${key}`}
                value={
                  target[key] === undefined
                    ? "inherit"
                    : target[key] === null
                      ? "auto"
                      : String(target[key])
                }
                onChange={(event) =>
                  update(
                    key,
                    event.target.value === "inherit"
                      ? undefined
                      : event.target.value === "auto"
                        ? null
                        : event.target.value === "true",
                  )
                }
              >
                <option value="inherit">Inherit</option>
                {key === "noriSmile" && <option value="auto">Auto</option>}
                <option value="true">On</option>
                <option value="false">Off</option>
              </select>
            </label>
          ))}
          {(
            [
              { key: "chatMode", values: ["normal", "bubbles", "hidden"] },
              {
                key: "bgm",
                values: ["auto", "silent", "bgm1", "bgm_manifold", "bgm_void"],
              },
              { key: "noriTexture", values: ["default", "corrupt"] },
            ] as const
          ).map(({ key, values }) => (
            <label key={key}>
              {key}
              <select
                aria-label={`Scene ${key}`}
                value={
                  target[key] === undefined
                    ? "inherit"
                    : (target[key] ?? "default")
                }
                onChange={(event) =>
                  update(
                    key,
                    event.target.value === "inherit"
                      ? undefined
                      : event.target.value === "default"
                        ? null
                        : (event.target.value as SceneProjectPatch[typeof key]),
                  )
                }
              >
                <option value="inherit">Inherit</option>
                {values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {(["camera", "cameraRot"] as const).map((key) => (
          <fieldset key={key} className="source-scene-vector">
            <legend>
              {key === "camera"
                ? "Camera position"
                : "Camera rotation in radians"}
            </legend>
            <select
              aria-label={`Scene ${key} mode`}
              value={
                target[key] === undefined
                  ? "inherit"
                  : target[key] === null
                    ? "auto"
                    : "explicit"
              }
              onChange={(event) =>
                update(
                  key,
                  event.target.value === "inherit"
                    ? undefined
                    : event.target.value === "auto"
                      ? null
                      : { x: 0, y: 0, z: key === "camera" ? 8 : 0 },
                )
              }
            >
              <option value="inherit">Inherit</option>
              <option value="auto">Auto</option>
              <option value="explicit">Explicit</option>
            </select>
            {target[key] && (
              <div className="source-scene-vector-fields">
                {(["x", "y", "z"] as const).map((axis) => (
                  <label key={axis}>
                    {axis}
                    <input
                      type="number"
                      aria-label={`Scene ${key} ${axis}`}
                      step="any"
                      key={`${index}:${key}:${axis}:${target[key]?.[axis]}`}
                      defaultValue={target[key]?.[axis]}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      onBlur={(event) => {
                        const vector = target[key];
                        if (!vector) return;
                        if (
                          !update(key, {
                            ...vector,
                            [axis]: event.currentTarget.valueAsNumber,
                          })
                        )
                          event.currentTarget.value = String(vector[axis]);
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ))}
        <fieldset className="source-scene-vector">
          <legend>Model expression and motion</legend>
          <label>
            Expression
            <select
              aria-label="Scene model expression"
              value={
                target.noriExpression === undefined
                  ? "inherit"
                  : (target.noriExpression ?? "auto")
              }
              onChange={(event) =>
                update(
                  "noriExpression",
                  event.target.value === "inherit"
                    ? undefined
                    : event.target.value === "auto"
                      ? null
                      : NORI_MODEL_EXPRESSIONS.find((name) => name === event.target.value),
                )
              }
            >
              <option value="inherit">Inherit</option>
              <option value="auto">Auto</option>
              {NORI_MODEL_EXPRESSIONS.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Idle motion
            <select
              aria-label="Scene model idle motion"
              value={
                target.noriIdleMotion === undefined
                  ? "inherit"
                  : target.noriIdleMotion
                    ? `${target.noriIdleMotion.group}:${target.noriIdleMotion.index}`
                    : "auto"
              }
              onChange={(event) => {
                const value = event.target.value;
                const [group, index] = value.split(":");
                update(
                  "noriIdleMotion",
                  value === "inherit"
                    ? undefined
                    : value === "auto"
                      ? null
                      : { group: group as keyof typeof NORI_MODEL_MOTIONS, index: Number(index) },
                );
              }}
            >
              <option value="inherit">Inherit</option>
              <option value="auto">Auto</option>
              {Object.entries(NORI_MODEL_MOTIONS).flatMap(([group, count]) =>
                Array.from({ length: count }, (_, index) => (
                  <option key={`${group}:${index}`} value={`${group}:${index}`}>
                    {group} {index}
                  </option>
                )),
              )}
            </select>
          </label>
        </fieldset>
        <fieldset className="source-scene-vector">
          <legend>Ocean and glyph</legend>
          <label>
            Cold open mode
            <select
              aria-label="Scene cold open mode"
              value={
                target.coldOpen === undefined
                  ? "inherit"
                  : target.coldOpen === null
                    ? "off"
                    : "explicit"
              }
              onChange={(event) =>
                update(
                  "coldOpen",
                  event.target.value === "inherit"
                    ? undefined
                    : event.target.value === "off"
                      ? null
                      : {
                          ocean: true,
                          oceanFade: 1,
                          oceanDepth: 0,
                          oceanGodray: 0.8,
                          oceanEdge: 0,
                          glyphDraw: 0,
                          glyphGlow: 0,
                          morph: 0,
                          noriForm: 0,
                          noriWash: 0,
                        },
                )
              }
            >
              <option value="inherit">Inherit</option>
              <option value="off">Off</option>
              <option value="explicit">Explicit</option>
            </select>
          </label>
          {target.coldOpen && (
            <>
              <label>
                Ocean enabled
                <input
                  type="checkbox"
                  aria-label="Scene ocean enabled"
                  checked={target.coldOpen.ocean}
                  onChange={(event) =>
                    update("coldOpen", {
                      ...target.coldOpen!,
                      ocean: event.target.checked,
                    })
                  }
                />
              </label>
              <div className="source-scene-channel-grid">
                {(
                  [
                    "oceanFade",
                    "oceanDepth",
                    "oceanGodray",
                    "oceanEdge",
                    "glyphDraw",
                    "glyphGlow",
                    "morph",
                    "noriForm",
                    "noriWash",
                  ] as const
                ).map((key) => (
                  <label key={key}>
                    {key}
                    <input
                      type="number"
                      aria-label={`Scene ${key}`}
                      min={0}
                      max={key === "oceanEdge" ? 4 : 1}
                      step={0.01}
                      key={`${index}:${key}:${target.coldOpen![key]}`}
                      defaultValue={target.coldOpen![key]}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      onBlur={(event) => {
                        const cold = target.coldOpen!;
                        if (
                          !update("coldOpen", {
                            ...cold,
                            [key]: event.currentTarget.valueAsNumber,
                          })
                        )
                          event.currentTarget.value = String(cold[key]);
                      }}
                    />
                  </label>
                ))}
              </div>
            </>
          )}
        </fieldset>
      </fieldset>
    </details>
  );
}
