import { useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { StoryClock, type StoryClockState } from "../story/story-clock";
import { StoryAudio } from "../story/story-audio";
import { SCENE_EDITOR_SAMPLE, sceneProjectSchema, projectScene, type SceneProject } from "../story/scene-project";
import { STORY_ORDER } from "../story/story-director";

export function SceneEditor({ frontend }: { frontend: NoriFrontendRuntime }) {
  const [text, setText] = useState(() => JSON.stringify(SCENE_EDITOR_SAMPLE, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<SceneProject | null>(null);
  const [clockState, setClockState] = useState<StoryClockState | null>(null);
  const control = useRef<{ clock: StoryClock; audio: StoryAudio; paused: boolean } | null>(null);
  useEffect(() => {
    if (!project) return;
    const lease = frontend.scene.acquire();
    const clock = new StoryClock(project.phases), audio = new StoryAudio(frontend.audio, project.audio);
    const current = { clock, audio, paused: false }; control.current = current;
    let frame = 0, stopped = false;
    const world = frontend.world.snapshot().worldId;
    const stop = () => { if (!stopped) { stopped = true; setProject(null); } };
    const unsubscribe = frontend.world.subscribe(state => { if (state.worldId !== world) stop(); });
    const unsubscribeStory = frontend.story.subscribe(() => { if (frontend.story.snapshot()) stop(); });
    const visibility = () => {
      if (document.hidden || current.paused) clock.suspend(performance.now());
      else clock.resume(performance.now());
      audio.sync(clock.snapshot());
    };
    document.addEventListener("visibilitychange", visibility);
    visibility();
    const render = (now: number) => {
      if (stopped) return;
      const state = clock.advance(now);
      setClockState(state);
      lease.set({ ...projectScene(project, state.time, state.parkedAt), active: true, lerp: 1 });
      audio.sync(state);
      if (state.complete) stop();
      else frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      stopped = true; cancelAnimationFrame(frame); unsubscribe(); unsubscribeStory(); document.removeEventListener("visibilitychange", visibility);
      audio.dispose(); clock.dispose(); lease.release(); control.current = null;
    };
  }, [project, frontend]);
  function play() {
    try {
      if (frontend.story.snapshot()) throw Error("A production story is active");
      if (text.length > 100_000) throw Error("Project exceeds 100 KB");
      const next = sceneProjectSchema.parse(JSON.parse(text));
      setError(null); setClockState(null); setProject(next);
      void frontend.audio.unlock().catch(reason => setError(String(reason)));
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
  }
  return <div className="source-scene-editor">
    <h2>Scene editor</h2>
    <p>Preview camera, model, light and audio phases. Changes stay in this window; preview never submits story completion facts.</p>
    <label>Project JSON<textarea aria-label="Scene project JSON" value={text} spellCheck={false} disabled={!!project} onChange={event => setText(event.target.value)} /></label>
    <div className="source-scene-editor-controls">
      <button type="button" disabled={!!project} onClick={play}>Play preview</button>
      <button type="button" disabled={!project || !!clockState?.parkedAt} onClick={() => {
        const current = control.current; if (!current) return;
        current.paused = !current.paused;
        if (current.paused) current.clock.suspend(performance.now());
        else if (!document.hidden) current.clock.resume(performance.now());
        current.audio.sync(current.clock.snapshot()); setClockState(current.clock.snapshot());
      }}>{control.current?.paused ? "Resume preview" : "Pause preview"}</button>
      <button type="button" disabled={!project || !clockState?.parkedAt} onClick={() => {
        if (clockState?.parkedAt) control.current?.clock.wake(clockState.parkedAt, performance.now());
      }}>Continue phase</button>
      <button type="button" disabled={!project} onClick={() => setProject(null)}>Stop preview</button>
      <button type="button" disabled={!!project} onClick={() => { setText(JSON.stringify(SCENE_EDITOR_SAMPLE, null, 2)); setError(null); }}>Reset project</button>
    </div>
    {clockState && <p role="status" data-scene-preview-phase={clockState.phase}>{clockState.phase} · {clockState.time.toFixed(2)} / {clockState.duration.toFixed(2)} s · {project ? clockState.parkedAt ? "Waiting for input" : clockState.playing ? "Playing" : "Paused" : clockState.complete ? "Complete" : "Stopped"}</p>}
    {error && <p role="alert">{error}</p>}
    <details><summary>Production scene registration</summary><ul>{STORY_ORDER.map(scene => <li key={scene.id}><code>{scene.id}</code> · {scene.id === "cult-flash" ? "Registered" : "Cinematic restoration pending"}</li>)}</ul></details>
  </div>;
}
