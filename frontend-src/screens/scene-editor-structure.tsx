import type { SceneProject } from "../story/scene-project";

function uniqueId(prefix: string, entries: { id: string }[]) {
  let suffix = 1;
  while (entries.some((entry) => entry.id === `${prefix}${suffix}`)) suffix++;
  return `${prefix}${suffix}`;
}
function Field({
  label,
  value,
  numeric,
  onChange,
}: {
  label: string;
  value: string | number | undefined;
  numeric?: boolean;
  onChange(value: string | number | undefined): boolean;
}) {
  return (
    <label>
      {label}
      <input
        aria-label={label}
        key={String(value)}
        type={numeric ? "number" : "text"}
        step={numeric ? "any" : undefined}
        defaultValue={value ?? ""}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        onBlur={(event) => {
          const input = event.currentTarget;
          const next = numeric
            ? input.value === ""
              ? undefined
              : input.valueAsNumber
            : input.value;
          if (!onChange(next)) input.value = String(value ?? "");
        }}
      />
    </label>
  );
}

/** Structural edits pass through the same validator as file import, before any preview starts. */
export function SceneEditorStructure({
  project,
  disabled,
  onChange,
}: {
  project: SceneProject;
  disabled: boolean;
  onChange(project: SceneProject): boolean;
}) {
  const duration = project.phases.reduce(
    (total, phase) => total + phase.duration,
    0,
  );
  const phase = (
    index: number,
    patch: Partial<SceneProject["phases"][number]>,
  ) =>
    onChange({
      ...project,
      phases: project.phases.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    });
  const audio = (
    index: number,
    patch: Partial<SceneProject["audio"][number]>,
  ) =>
    onChange({
      ...project,
      audio: project.audio.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    });
  const move = (index: number, delta: number) => {
    const phases = [...project.phases];
    [phases[index], phases[index + delta]] = [
      phases[index + delta],
      phases[index],
    ];
    onChange({ ...project, phases });
  };
  return (
    <details className="source-scene-structure">
      <summary>Phases and audio tracks</summary>
      <fieldset disabled={disabled}>
        <legend>Timeline structure</legend>
        <Field
          label="Scene project name"
          value={project.name}
          onChange={(value) =>
            onChange({ ...project, name: String(value ?? "") })
          }
        />
        <p>
          {duration.toFixed(2)} seconds before input waits. Audio positions use
          this timeline. Source offset selects where playback starts within the
          audio file.
        </p>
        <div className="source-scene-entries">
          {project.phases.map((entry, index) => (
            <fieldset key={entry.id}>
              <legend>Phase {index + 1}</legend>
              <Field
                label={`Phase ${index + 1} ID`}
                value={entry.id}
                onChange={(value) => phase(index, { id: String(value ?? "") })}
              />
              <Field
                label={`Phase ${index + 1} duration`}
                numeric
                value={entry.duration}
                onChange={(value) =>
                  phase(index, { duration: value as number })
                }
              />
              <label>
                <input
                  aria-label={`Phase ${index + 1} input gate`}
                  type="checkbox"
                  checked={entry.pauseAtStart ?? false}
                  onChange={(event) =>
                    phase(index, { pauseAtStart: event.target.checked })
                  }
                />
                Input gate
              </label>
              <div className="source-scene-editor-controls">
                <button
                  type="button"
                  aria-label={`Move ${entry.id} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Earlier
                </button>
                <button
                  type="button"
                  aria-label={`Move ${entry.id} later`}
                  disabled={index === project.phases.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Later
                </button>
                <button
                  type="button"
                  aria-label={`Remove phase ${entry.id}`}
                  disabled={project.phases.length <= 1}
                  onClick={() =>
                    onChange({
                      ...project,
                      phases: project.phases.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </fieldset>
          ))}
        </div>
        <button
          type="button"
          disabled={project.phases.length >= 64 || duration >= 600}
          onClick={() =>
            onChange({
              ...project,
              phases: [
                ...project.phases,
                {
                  id: uniqueId("phase", project.phases),
                  duration: Math.min(1, 600 - duration),
                  to: {},
                },
              ],
            })
          }
        >
          Add phase
        </button>
        <h3>Audio tracks</h3>
        <div className="source-scene-entries">
          {project.audio.map((entry, index) => (
            <fieldset key={entry.id}>
              <legend>Track {index + 1}</legend>
              <Field
                label={`Track ${index + 1} ID`}
                value={entry.id}
                onChange={(value) => audio(index, { id: String(value ?? "") })}
              />
              <Field
                label={`Track ${index + 1} source`}
                value={entry.src}
                onChange={(value) => audio(index, { src: String(value ?? "") })}
              />
              {(
                [
                  "at",
                  "until",
                  "srcStart",
                  "gain",
                  "fadeIn",
                  "fadeOut",
                ] as const
              ).map((key) => (
                <Field
                  key={key}
                  label={`Track ${index + 1} ${key}`}
                  value={entry[key]}
                  numeric
                  onChange={(value) => audio(index, { [key]: value })}
                />
              ))}
              <label>
                Track bus
                <select
                  aria-label={`Track ${index + 1} bus`}
                  value={entry.kind ?? "music"}
                  onChange={(event) =>
                    audio(index, {
                      kind: event.target.value as "music" | "sfx" | "voice",
                    })
                  }
                >
                  <option value="music">Music</option>
                  <option value="sfx">Sound effects</option>
                  <option value="voice">Voice</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  aria-label={`Track ${index + 1} loop`}
                  checked={entry.loop ?? false}
                  onChange={(event) =>
                    audio(index, { loop: event.target.checked })
                  }
                />
                Loop
              </label>
              <button
                type="button"
                aria-label={`Remove track ${entry.id}`}
                onClick={() =>
                  onChange({
                    ...project,
                    audio: project.audio.filter((_, i) => i !== index),
                  })
                }
              >
                Remove track
              </button>
            </fieldset>
          ))}
        </div>
        <button
          type="button"
          disabled={project.audio.length >= 32}
          onClick={() =>
            onChange({
              ...project,
              audio: [
                ...project.audio,
                {
                  id: uniqueId("track", project.audio),
                  src: "/audio/cult/drone.ogg",
                  at: 0,
                  until: duration,
                  gain: 0.5,
                  kind: "music",
                },
              ],
            })
          }
        >
          Add audio track
        </button>
      </fieldset>
    </details>
  );
}
