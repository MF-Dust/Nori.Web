import { useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { LIVE2D_DEBUG_PLUGINS } from "../live2d/debug-runtime";

const PLUGIN_LABELS: Readonly<Record<string, string>> = {
  dragToLook: "Drag to Look",
  breath: "Breath",
  eyeBlink: "Eye Blink",
  physics: "Physics",
  lipSync: "Lip Sync",
  thinkingLight: "Thinking Light",
};

export function Live2DDebugTab({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const state = useSyncExternalStore(
    frontend.live2dDebug.subscribe,
    frontend.live2dDebug.snapshot,
  );
  const story = useSyncExternalStore(
    frontend.story.subscribe,
    frontend.story.snapshot,
  );
  const blocked = story !== null;
  if (!state.ready)
    return (
      <section aria-label="Live2D debug">
        <h2>Live2D</h2>
        <p role="status">Production model is not mounted.</p>
      </section>
    );
  return (
    <section aria-label="Live2D debug">
      <h2>Live2D</h2>
      {blocked && <p role="status">Production story active; controls disabled.</p>}
      <h3>Plugins</h3>
      <div className="source-debug-lab-actions">
        {LIVE2D_DEBUG_PLUGINS.map((id) => (
          <button
            type="button"
            key={id}
            aria-pressed={state.plugins[id]}
            disabled={blocked}
            onClick={() => frontend.live2dDebug.setPlugin(id, !state.plugins[id])}
          >
            {PLUGIN_LABELS[id]}
          </button>
        ))}
      </div>
      <h3>Pose</h3>
      <button
        type="button"
        aria-pressed={state.restPose}
        disabled={blocked}
        onClick={() => frontend.live2dDebug.setRestPose(!state.restPose)}
      >
        Rest Pose
      </button>
      <h3>Expressions ({state.expressions.length})</h3>
      <div className="source-debug-lab-actions">
        {state.expressions.map((expression) => (
          <button
            type="button"
            key={expression.name}
            aria-pressed={expression.active}
            disabled={blocked}
            onClick={() => frontend.live2dDebug.toggleExpression(expression.name)}
          >
            {expression.name}
          </button>
        ))}
      </div>
      <h3>Motions ({state.motions.length})</h3>
      <div className="source-debug-lab-actions">
        {state.motions.map((motion) => (
          <button
            type="button"
            key={`${motion.group}:${motion.index}`}
            disabled={blocked}
            title={motion.file}
            onClick={() =>
              frontend.live2dDebug.playMotion(motion.group, motion.index)
            }
          >
            Play {motion.group} {motion.index}
          </button>
        ))}
      </div>
      <p>
        Idle crossfade and lip-form tuning remain unavailable because the source
        runtime has no production override store for those shipped controls.
      </p>
    </section>
  );
}
