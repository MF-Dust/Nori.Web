import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import type { NoriSceneState, NoriSceneStore } from "../state/nori-scene";
import "./debug-screen.css";
import { SceneEditor } from "./scene-editor";
import { CorruptionPreview } from "../story/corruption-preview";
import {
  NetworkDebugLab,
  ComputeDebugLab,
  GestureDebugLab,
  ReactionDebugLab,
  ScenarioDebugLab,
  type DebugLabActions,
} from "./debug-labs";
import { DataseaSceneTuner, ShatterSceneTuner } from "./scene-advanced-tuners";
import { GlitchDebugLab } from "./glitch-debug-lab";
import { Live2DDebugTab } from "./debug-live2d-tab";
import { PatDebugTab } from "./debug-pat-tab";
import { DebugReactionsTab } from "./debug-reactions-tab";
import {
  AudioDebugTab,
  InjectTalkDebugTab,
  NoriContextDebugTab,
  NotificationsDebugTab,
} from "./debug-system-tabs";

const tabs = [
  { id: "connection", label: "Connection" },
  { id: "live2d", label: "Live2D" },
  { id: "scene", label: "Scene" },
  { id: "audio", label: "Audio" },
  { id: "facts", label: "Facts" },
  { id: "editor", label: "Scene editor" },
  { id: "corruption", label: "Corruption" },
  { id: "glitch", label: "Glitch" },
  { id: "network", label: "Network lab" },
  { id: "compute", label: "Compute lab" },
  { id: "gesture", label: "Gesture lab" },
  { id: "pat", label: "Pat" },
  { id: "reaction", label: "Reaction lab" },
  { id: "reactions", label: "Reactions" },
  { id: "scenarios", label: "Game scenarios" },
  { id: "notifications", label: "Notifications" },
  { id: "inject-talk", label: "Inject Talk" },
  { id: "nori-context", label: "Nori Context" },
  { id: "shatter-tuner", label: "Shatter tuner" },
  { id: "datasea-tuner", label: "Datasea tuner" },
] as const;
/** Session-scoped developer tools. Never persists scene overrides or fabricates story facts. */
export function DebugScreen({
  frontend,
  actions,
}: {
  frontend: NoriFrontendRuntime;
  actions?: DebugLabActions;
}) {
  const [tab, setTab] = useState<string>("connection");
  const [visited, setVisited] = useState(() => new Set(["connection"]));
  const scene = useSyncExternalStore(
    frontend.scene.subscribe,
    frontend.scene.snapshot,
  );
  const [world, setWorld] = useState(() => frontend.world.snapshot());
  useEffect(() => {
    setWorld(frontend.world.snapshot());
    return frontend.world.subscribe((state) => setWorld(state));
  }, [frontend]);
  const chat = useSyncExternalStore(
    frontend.conversation.subscribe,
    frontend.conversation.snapshot,
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const override = useRef<ReturnType<NoriSceneStore["acquire"]> | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => {
    const release = () => {
      clearTimeout(reactionTimer.current);
      override.current?.release();
      override.current = null;
    };
    const offWorld = frontend.world.subscribe((_state, event) => {
      if (["world_joined", "world_created", "world_left"].includes(event.type))
        release();
    });
    const offStory = frontend.story.subscribe(() => {
      if (frontend.story.snapshot()) release();
    });
    return () => {
      offWorld();
      offStory();
      release();
    };
  }, [frontend]);
  useEffect(() => {
    override.current?.release();
    override.current = null;
  }, [world.worldId]);
  function set(patch: Partial<NoriSceneState>) {
    if (frontend.story.snapshot()) {
      setError("A production story is active");
      return;
    }
    clearTimeout(reactionTimer.current);
    reactionTimer.current = undefined;
    override.current ??= frontend.scene.acquire();
    override.current.set(patch);
  }
  const facts = [...frontend.world.facts()]
    .filter((value) => value.toLowerCase().includes(search.toLowerCase()))
    .sort();
  function range(
    key:
      | "darkness"
      | "redLight"
      | "noriTint"
      | "noriDim"
      | "noriReveal"
      | "vignette"
      | "blur"
      | "whiteFlash"
      | "shake",
    max = 1,
  ) {
    return (
      <label key={key}>
        {key}
        <input
          type="range"
          min="0"
          max={max}
          step="0.01"
          value={scene[key]}
          onChange={(event) => set({ [key]: Number(event.target.value) })}
        />
        <output>{scene[key].toFixed(2)}</output>
      </label>
    );
  }
  return (
    <section className="source-debug" aria-label="Debug">
      <nav aria-label="Debug tabs">
        {tabs.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={tab === item.id}
            onClick={() => {
              setTab(item.id);
              setVisited((previous) => new Set([...previous, item.id]));
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="source-debug-panels">
        {error && <p role="alert">{error}</p>}
        {tab === "editor" && <SceneEditor frontend={frontend} />}
        {tab === "corruption" && <CorruptionPreview frontend={frontend} />}
        {tab === "glitch" && <GlitchDebugLab frontend={frontend} />}
        {tab === "live2d" && <Live2DDebugTab frontend={frontend} />}
        {tab === "network" && <NetworkDebugLab />}
        {tab === "compute" && <ComputeDebugLab actions={actions?.compute} />}
        {tab === "gesture" && <GestureDebugLab frontend={frontend} />}
        {tab === "pat" && <PatDebugTab frontend={frontend} />}
        {tab === "reaction" && (
          <ReactionDebugLab
            preview={(reaction) => {
              if (frontend.story.snapshot()) {
                setError("A production story is active");
                return;
              }
              const expressions = {
                happy: "13_Happy",
                serious: "12_Serious",
                surprised: "14_Surprised",
                angry: "03_Angry",
                sad: "08_Tears",
              };
              set({ active: true, noriExpression: expressions[reaction] });
              reactionTimer.current = setTimeout(() => {
                override.current?.release();
                override.current = null;
                reactionTimer.current = undefined;
              }, 3000);
            }}
          />
        )}
        {tab === "reactions" && <DebugReactionsTab frontend={frontend} />}
        {tab === "scenarios" && (
          <ScenarioDebugLab load={actions?.loadScenario} />
        )}
        {tab === "shatter-tuner" && <ShatterSceneTuner frontend={frontend} />}
        {tab === "datasea-tuner" && <DataseaSceneTuner frontend={frontend} />}
        {tab === "notifications" && <NotificationsDebugTab frontend={frontend} />}
        {tab === "inject-talk" && <InjectTalkDebugTab frontend={frontend} />}
        {tab === "nori-context" && <NoriContextDebugTab frontend={frontend} />}
        {visited.has("connection") && (
          <div hidden={tab !== "connection"}>
            <h2>Connection</h2>
            <dl>
              <dt>World</dt>
              <dd>{world.worldId ?? "Not joined"}</dd>
              <dt>Chat</dt>
              <dd>{chat.connected ? "Connected" : "Disconnected"}</dd>
              <dt>Turn</dt>
              <dd>{chat.phase}</dd>
              <dt>Presentation</dt>
              <dd>{chat.mode}</dd>
              <dt>Pending command</dt>
              <dd>{String(chat.pending)}</dd>
            </dl>
            {frontend.speechError && <p role="alert">{frontend.speechError}</p>}
            <h3>Cartridges</h3>
            <table>
              <thead>
                <tr>
                  <th>Cartridge</th>
                  <th>Head</th>
                  <th>Visible</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "chat",
                  "chess",
                  "codenames",
                  "cakeduel",
                  "pictionary",
                  "manifold",
                ].map((id) => {
                  const runtime = frontend.world.runtime(id);
                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{runtime?.headVersion ?? "—"}</td>
                      <td>{runtime?.visibleVersion ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {visited.has("scene") && (
          <div hidden={tab !== "scene"}>
            <h2>Scene</h2>
            <button
              type="button"
              onClick={() => {
                override.current?.release();
                override.current = null;
              }}
            >
              Release overrides
            </button>
            <div className="source-debug-camera">
              {(["x", "y", "z"] as const).map((axis) => (
                <label key={axis}>
                  Camera {axis}
                  <input
                    type="number"
                    step="0.1"
                    min={axis === "z" ? 0.1 : -100}
                    max="1000"
                    value={scene.camera?.[axis] ?? (axis === "z" ? 7.4 : 0)}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isFinite(value))
                        set({
                          camera: {
                            ...(scene.camera ?? { x: 0, y: 0, z: 7.4 }),
                            [axis]: value,
                          },
                          lerp: 1,
                        });
                    }}
                  />
                </label>
              ))}
            </div>
            {range("darkness")}
            {range("redLight")}
            {range("noriTint")}
            {range("noriDim")}
            {range("noriReveal")}
            {range("vignette", 5)}
            {range("blur", 20)}
            {range("whiteFlash")}
            {range("shake")}
            <label>
              Chat mode
              <select
                value={scene.chatMode}
                onChange={(event) =>
                  set({
                    chatMode: event.target.value as NoriSceneState["chatMode"],
                  })
                }
              >
                {["normal", "bubbles", "hidden"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Model texture
              <select
                value={scene.noriTexture ?? "default"}
                onChange={(event) =>
                  set({
                    noriTexture:
                      event.target.value === "corrupt" ? "corrupt" : null,
                  })
                }
              >
                <option>default</option>
                <option>corrupt</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={scene.noriRestPose}
                onChange={(event) =>
                  set({ noriRestPose: event.target.checked })
                }
              />
              Rest pose
            </label>
          </div>
        )}
        {tab === "audio" && (
          <AudioDebugTab frontend={frontend} setScene={set} />
        )}
        {visited.has("facts") && (
          <div hidden={tab !== "facts"}>
            <h2>Facts</h2>
            <input
              aria-label="Filter facts"
              placeholder="Filter facts"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <p>{facts.length} facts</p>
            <ul>
              {facts.map((fact) => (
                <li key={fact}>
                  <code>{fact}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
