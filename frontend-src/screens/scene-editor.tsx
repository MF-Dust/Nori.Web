import { useEffect, useMemo, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import type { StoryClockState } from "../story/story-clock";
import { SCENE_EDITOR_SAMPLE, type SceneProject } from "../story/scene-project";
import {
  parseSceneProject,
  readSceneProjectFile,
  sceneProjectFilename,
  serializeSceneProject,
} from "../story/scene-project-io";
import { ScenePreview } from "../story/scene-preview";
import { STORY_ORDER } from "../story/story-director";
import { SceneEditorChannels } from "./scene-editor-channels";
import { SceneEditorStructure } from "./scene-editor-structure";
import "./scene-editor.css";

const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
export function SceneEditor({ frontend }: { frontend: NoriFrontendRuntime }) {
  const [text, setText] = useState(() =>
    serializeSceneProject(SCENE_EDITOR_SAMPLE),
  );
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<SceneProject | null>(null);
  const [clockState, setClockState] = useState<StoryClockState | null>(null);
  const [importing, setImporting] = useState(false);
  const control = useRef<ScenePreview | null>(null);
  const importVersion = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const downloads = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const parsed = useMemo(() => {
    try {
      return parseSceneProject(text);
    } catch {
      return null;
    }
  }, [text]);
  useEffect(
    () => () => {
      importVersion.current++;
      downloads.current.forEach((timer, url) => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      });
      downloads.current.clear();
    },
    [],
  );
  useEffect(() => {
    if (!project) return;
    // Recheck after React commits, before acquiring a layer over any production scene.
    if (frontend.story.snapshot()) {
      setError("A production story is active");
      setProject(null);
      return;
    }
    const preview = new ScenePreview(project, frontend.scene, frontend.audio);
    control.current = preview;
    let frame = 0,
      stopped = false;
    const world = frontend.world.snapshot().worldId;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      preview.dispose();
      if (control.current === preview) control.current = null;
      setClockState(preview.snapshot());
      setProject(null);
    };
    const unsubscribe = frontend.world.subscribe((state, event) => {
      if (
        state.worldId !== world ||
        event.type === "world_joined" ||
        event.type === "world_created" ||
        event.type === "world_left"
      )
        stop();
    });
    const unsubscribeStory = frontend.story.subscribe(() => {
      if (frontend.story.snapshot()) stop();
    });
    const visibility = () => {
      if (!stopped)
        setClockState(preview.setHidden(document.hidden, performance.now()));
    };
    document.addEventListener("visibilitychange", visibility);
    visibility();
    // A rejected unlock from an old preview must not replace the next project's errors.
    void frontend.audio.unlock().catch((reason) => {
      if (!stopped) setError(message(reason));
    });
    const render = (now: number) => {
      if (stopped) return;
      const state = preview.advance(now);
      setClockState(state);
      if (state.complete && !preview.paused) stop();
      else frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      unsubscribe();
      unsubscribeStory();
      document.removeEventListener("visibilitychange", visibility);
      preview.dispose();
      if (control.current === preview) control.current = null;
    };
  }, [project, frontend]);
  function apply(next: SceneProject) {
    try {
      setText(serializeSceneProject(next));
      setError(null);
      return true;
    } catch (reason) {
      setError(message(reason));
      return false;
    }
  }
  function play() {
    try {
      if (frontend.story.snapshot())
        throw Error("A production story is active");
      const next = parseSceneProject(text);
      importVersion.current++;
      setError(null);
      setClockState(null);
      setProject(next);
    } catch (reason) {
      setError(message(reason));
    }
  }
  async function importFile(file: File) {
    const version = ++importVersion.current;
    setImporting(true);
    setError(null);
    try {
      const next = await readSceneProjectFile(file);
      if (version === importVersion.current) apply(next);
    } catch (reason) {
      if (version === importVersion.current) setError(message(reason));
    } finally {
      if (version === importVersion.current) setImporting(false);
    }
  }
  function exportFile() {
    let url: string | undefined;
    try {
      const next = parseSceneProject(text);
      url = URL.createObjectURL(
        new Blob([serializeSceneProject(next)], {
          type: "application/json;charset=utf-8",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = sceneProjectFilename(next.name);
      document.body.append(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
      }
      const downloadUrl = url;
      const timer = setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
        downloads.current.delete(downloadUrl);
      }, 1000);
      downloads.current.set(url, timer);
      setError(null);
    } catch (reason) {
      if (url) URL.revokeObjectURL(url);
      setError(message(reason));
    }
  }
  function seek(time: number) {
    const preview = control.current;
    if (preview) setClockState(preview.seek(time, performance.now()));
  }
  const busy = !!project || importing;
  return (
    <div className="source-scene-editor">
      <h2>Scene editor</h2>
      <p>
        Preview camera, model, light and audio phases. Changes stay in this
        window; preview never submits story completion facts.
      </p>
      <div className="source-scene-editor-controls">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          Import project
        </button>
        <button type="button" disabled={importing} onClick={exportFile}>
          Export project
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label="Import scene project file"
          hidden
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void importFile(file);
          }}
        />
        {importing && <span role="status">Reading project…</span>}
      </div>
      <label>
        Project JSON
        <textarea
          aria-label="Scene project JSON"
          value={text}
          spellCheck={false}
          disabled={busy}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
        />
      </label>
      {parsed && (
        <SceneEditorStructure
          project={parsed}
          disabled={busy}
          onChange={apply}
        />
      )}
      {parsed && (
        <SceneEditorChannels
          project={parsed}
          disabled={busy}
          onChange={apply}
        />
      )}
      <div className="source-scene-editor-controls">
        <button type="button" disabled={busy} onClick={play}>
          Play preview
        </button>
        <button
          type="button"
          disabled={!project}
          onClick={() => {
            const preview = control.current;
            if (preview)
              setClockState(
                preview.setPaused(!preview.paused, performance.now()),
              );
          }}
        >
          {clockState?.complete && project
            ? "Restart preview"
            : control.current?.paused
              ? "Resume preview"
              : "Pause preview"}
        </button>
        <button
          type="button"
          disabled={!project || !clockState?.parkedAt}
          onClick={() => {
            const preview = control.current;
            if (preview) setClockState(preview.wake(performance.now()));
          }}
        >
          Continue phase
        </button>
        <button
          type="button"
          disabled={!project}
          onClick={() => {
            control.current?.dispose();
            setClockState(control.current?.snapshot() ?? null);
            control.current = null;
            setProject(null);
          }}
        >
          Stop preview
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            apply(SCENE_EDITOR_SAMPLE);
            setClockState(null);
          }}
        >
          Reset project
        </button>
      </div>
      <div className="source-scene-timeline">
        <label>
          Preview position
          <input
            type="range"
            aria-label="Scene preview position"
            min={0}
            max={clockState?.duration ?? 1}
            step={0.01}
            value={clockState?.time ?? 0}
            disabled={!project}
            onChange={(event) => seek(event.target.valueAsNumber)}
          />
        </label>
        <p>
          Seeking pauses playback. Gates at the selected time remain pending;
          later gates are rearmed. Scrubbing never completes a production story.
        </p>
        {project && (
          <div className="source-scene-phase-buttons">
            {project.phases.map((phase, index) => {
              const start = project.phases
                .slice(0, index)
                .reduce((sum, item) => sum + item.duration, 0);
              return (
                <button
                  type="button"
                  key={phase.id}
                  aria-label={`Seek to ${phase.id}`}
                  aria-pressed={clockState?.phase === phase.id}
                  onClick={() => {
                    const preview = control.current;
                    if (preview)
                      setClockState(
                        preview.seekPhase(phase.id, performance.now()),
                      );
                  }}
                >
                  {phase.id} · {start.toFixed(2)} s
                  {phase.pauseAtStart ? " · input" : ""}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {clockState && (
        <p role="status" data-scene-preview-phase={clockState.phase}>
          {clockState.phase} · {clockState.time.toFixed(2)} /{" "}
          {clockState.duration.toFixed(2)} s ·{" "}
          {project
            ? clockState.complete
              ? "Complete — inspection paused"
              : clockState.parkedAt
                ? "Waiting for input"
                : clockState.playing
                  ? "Playing"
                  : "Paused"
            : clockState.complete
              ? "Complete"
              : "Stopped"}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <details>
        <summary>Production scene registration</summary>
        <ul>
          {STORY_ORDER.map((scene) => (
            <li key={scene.id}>
              <code>{scene.id}</code> ·{" "}
              {scene.id === "cult-flash"
                ? "Registered"
                : "Cinematic restoration pending"}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
