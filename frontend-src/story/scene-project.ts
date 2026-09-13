import { z } from "zod";
import { NoriSceneStore, type NoriSceneState } from "../state/nori-scene";

const defaultScene = new NoriSceneStore().snapshot();
const unit = z.number().finite().min(0).max(1);
const vector = z.object({ x: z.number().finite().min(-100).max(100), y: z.number().finite().min(-100).max(100), z: z.number().finite().min(.1).max(100) });
const patch = z.object({
  camera: vector.nullable().optional(), darkness: unit.optional(), noriTint: unit.optional(), noriDim: unit.optional(),
  noriReveal: unit.optional(), redLight: unit.optional(), shake: unit.optional(), whiteFlash: unit.optional(),
  vignette: z.number().finite().min(0).max(5).optional(), blur: z.number().finite().min(0).max(20).optional(),
  eyeOpen: unit.nullable().optional(), mouthOpen: unit.nullable().optional(),
  noriRestPose: z.boolean().optional(), noriSleep: z.boolean().optional(), noriSmile: z.boolean().nullable().optional(),
  noriTexture: z.literal("corrupt").nullable().optional(), corruptVoice: z.boolean().optional(),
  chatMode: z.enum(["normal", "bubbles", "hidden"]).optional(),
  bgm: z.enum(["auto", "silent", "bgm1", "bgm_manifold", "bgm_void"]).optional(),
}).strict();
export const sceneProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  initial: patch,
  phases: z.array(z.object({ id: z.string().min(1).max(80), duration: z.number().finite().min(0).max(120), pauseAtStart: z.boolean().optional(), to: patch }).strict()).min(1).max(64),
  audio: z.array(z.object({
    id: z.string().min(1).max(80), src: z.string().regex(/^\/audio\/[\w/-]+\.(?:ogg|m4a|mp3|wav)$/),
    at: z.number().finite().min(0), until: z.number().finite().min(0),
    gain: unit.optional(), fadeIn: z.number().finite().min(0).max(30).optional(), fadeOut: z.number().finite().min(0).max(30).optional(),
    loop: z.boolean().optional(), kind: z.enum(["music", "sfx", "voice"]).optional(),
  }).strict()).max(32).default([]),
}).strict().superRefine((project, context) => {
  const duration = project.phases.reduce((total, phase) => total + phase.duration, 0);
  if (duration > 600 || duration <= 0) context.addIssue({ code: "custom", message: "Duration must be between 0 and 600 seconds" });
  for (const entries of [project.phases, project.audio])
    if (new Set(entries.map(item => item.id)).size !== entries.length) context.addIssue({ code: "custom", message: "Phase and audio IDs must be unique" });
  if (project.audio.some(track => track.until <= track.at || track.until > duration))
    context.addIssue({ code: "custom", message: "Audio intervals must fit within the project" });
});
export type SceneProject = z.infer<typeof sceneProjectSchema>;
export const SCENE_EDITOR_SAMPLE: SceneProject = {
  name: "Camera and light study", initial: { darkness: 0, bgm: "silent" },
  phases: [
    { id: "dim", duration: 2, to: { darkness: .65 } },
    { id: "inspect", duration: 0, pauseAtStart: true, to: {} },
    { id: "restore", duration: 2, to: { darkness: 0 } },
  ], audio: [],
};

/** Pure projection. Discrete values change at phase entry; numbers blend to the endpoint. */
export function projectScene(project: SceneProject, time: number, parkedAt: string | null = null): Partial<NoriSceneState> {
  let result: Record<string, unknown> = { ...defaultScene, ...project.initial };
  let start = 0;
  for (const phase of project.phases) {
    if (time < start || phase.id === parkedAt) break;
    const progress = phase.duration === 0 ? 1 : Math.min(1, Math.max(0, (time - start) / phase.duration));
    const smooth = progress * progress * (3 - 2 * progress);
    for (const [key, value] of Object.entries(phase.to)) {
      const previous = result[key];
      if (typeof value === "number") result[key] = (typeof previous === "number" ? previous : 0) + (value - (typeof previous === "number" ? previous : 0)) * smooth;
      else if (key === "camera" && value && previous) {
        const from = previous as { x: number; y: number; z: number }, to = value as typeof from;
        result[key] = { x: from.x + (to.x - from.x) * smooth, y: from.y + (to.y - from.y) * smooth, z: from.z + (to.z - from.z) * smooth };
      } else result[key] = value;
    }
    if (progress < 1) break;
    start += phase.duration;
  }
  return result as Partial<NoriSceneState>;
}
