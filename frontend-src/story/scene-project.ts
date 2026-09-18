import { z } from "zod";
import { NoriSceneStore, type NoriSceneState } from "../state/nori-scene";

const defaultScene = new NoriSceneStore().snapshot();
const unit = z.number().finite().min(0).max(1);
const coordinate = z.number().finite().min(-100).max(100);
const angle = z
  .number()
  .finite()
  .min(-Math.PI * 2)
  .max(Math.PI * 2);
const vector = z
  .object({
    x: coordinate,
    y: coordinate,
    z: z.number().finite().min(0.1).max(100),
  })
  .strict();
const rotation = z.object({ x: angle, y: angle, z: angle }).strict();
const patch = z
  .object({
    plankton: z.number().finite().min(0).max(4).optional(),
    burst: unit.optional(),
    burstAge: z.number().finite().min(0).max(600).optional(),
    coldOpen: z
      .object({
        ocean: z.boolean(),
        oceanFade: unit,
        oceanDepth: unit,
        oceanGodray: unit,
        oceanEdge: z.number().finite().min(0).max(4),
        glyphDraw: unit,
        glyphGlow: unit,
        morph: unit,
        noriForm: unit,
        noriWash: unit,
      })
      .strict()
      .nullable()
      .optional(),
    camera: vector.nullable().optional(),
    cameraRot: rotation.nullable().optional(),
    fov: z.number().finite().min(10).max(120).nullable().optional(),
    cameraFar: z.number().finite().min(1).max(2000).nullable().optional(),
    noriDolly: coordinate.nullable().optional(),
    manifoldEnv: unit.nullable().optional(),
    voidEnv: unit.nullable().optional(),
    fogNear: z.number().finite().min(0).max(1000).optional(),
    fogFar: z.number().finite().min(0.1).max(2000).optional(),
    alertLoop: unit.optional(),
    alertClock: z.number().finite().min(0).max(600).optional(),
    darkness: unit.optional(),
    noriTint: unit.optional(),
    noriDim: z.number().finite().min(0).max(4).optional(),
    noriReveal: unit.optional(),
    redLight: unit.optional(),
    shake: unit.optional(),
    whiteFlash: unit.optional(),
    vignette: z.number().finite().min(0).max(5).optional(),
    blur: z.number().finite().min(0).max(20).optional(),
    eyeOpen: unit.nullable().optional(),
    mouthOpen: unit.nullable().optional(),
    noriRestPose: z.boolean().optional(),
    noriSleep: z.boolean().optional(),
    noriSmile: z.boolean().nullable().optional(),
    noriExpression: z.string().trim().min(1).max(80).nullable().optional(),
    noriIdleMotion: z
      .object({
        group: z.string().trim().min(1).max(80),
        index: z.number().int().min(0).max(255),
      })
      .strict()
      .nullable()
      .optional(),
    noriTexture: z.literal("corrupt").nullable().optional(),
    corruptVoice: z.boolean().optional(),
    chatMode: z.enum(["normal", "bubbles", "hidden"]).optional(),
    bgm: z
      .enum(["auto", "silent", "bgm1", "bgm_manifold", "bgm_void"])
      .optional(),
  })
  .strict();
export type SceneProjectPatch = z.infer<typeof patch>;
export const sceneProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    initial: patch,
    phases: z
      .array(
        z
          .object({
            id: z.string().trim().min(1).max(80),
            duration: z.number().finite().min(0).max(120),
            pauseAtStart: z.boolean().optional(),
            to: patch,
          })
          .strict(),
      )
      .min(1)
      .max(64),
    audio: z
      .array(
        z
          .object({
            id: z.string().trim().min(1).max(80),
            src: z.string().regex(/^\/audio\/[\w/-]+\.(?:ogg|m4a|mp3|wav)$/),
            at: z.number().finite().min(0),
            until: z.number().finite().min(0),
            gain: unit.optional(),
            srcStart: z.number().finite().min(0).max(3600).optional(),
            fadeIn: z.number().finite().min(0).max(30).optional(),
            fadeOut: z.number().finite().min(0).max(30).optional(),
            loop: z.boolean().optional(),
            kind: z.enum(["music", "sfx", "voice"]).optional(),
          })
          .strict(),
      )
      .max(32)
      .default([]),
  })
  .strict()
  .superRefine((project, context) => {
    const duration = project.phases.reduce(
      (total, phase) => total + phase.duration,
      0,
    );
    if (duration > 600 || duration <= 0)
      context.addIssue({
        code: "custom",
        message: "Duration must be between 0 and 600 seconds",
      });
    for (const entries of [project.phases, project.audio])
      if (new Set(entries.map((item) => item.id)).size !== entries.length)
        context.addIssue({
          code: "custom",
          message: "Phase and audio IDs must be unique",
        });
    if (
      project.audio.some(
        (track) => track.until <= track.at || track.until > duration,
      )
    )
      context.addIssue({
        code: "custom",
        message: "Audio intervals must fit within the project",
      });
    let fog = { fogNear: defaultScene.fogNear, fogFar: defaultScene.fogFar };
    for (const target of [
      project.initial,
      ...project.phases.map((phase) => phase.to),
    ]) {
      fog = {
        fogNear: target.fogNear ?? fog.fogNear,
        fogFar: target.fogFar ?? fog.fogFar,
      };
      if (fog.fogNear >= fog.fogFar) {
        context.addIssue({
          code: "custom",
          message: "Fog near must remain below fog far at every phase endpoint",
        });
        break;
      }
    }
  });
export type SceneProject = z.infer<typeof sceneProjectSchema>;
export const SCENE_EDITOR_SAMPLE: SceneProject = {
  name: "Camera and light study",
  initial: { darkness: 0, bgm: "silent" },
  phases: [
    { id: "dim", duration: 2, to: { darkness: 0.65 } },
    { id: "inspect", duration: 0, pauseAtStart: true, to: {} },
    { id: "restore", duration: 2, to: { darkness: 0 } },
  ],
  audio: [],
};

/** Pure projection. Discrete/automatic values switch at entry; explicit numbers blend. */
export function projectScene(
  project: SceneProject,
  time: number,
  parkedAt: string | null = null,
  inspectionPhase: string | null = null,
): Partial<NoriSceneState> {
  let result: Record<string, unknown> = { ...defaultScene, ...project.initial };
  let start = 0;
  for (const phase of project.phases) {
    if (time < start || phase.id === parkedAt) break;
    const progress =
      phase.duration === 0
        ? 1
        : Math.min(1, Math.max(0, (time - start) / phase.duration));
    const smooth = progress * progress * (3 - 2 * progress);
    for (const [key, value] of Object.entries(phase.to)) {
      const previous = result[key];
      if (
        typeof value === "number" &&
        (typeof previous === "number" ||
          key === "eyeOpen" ||
          key === "mouthOpen")
      ) {
        const from = typeof previous === "number" ? previous : 0;
        result[key] = from + (value - from) * smooth;
      } else if (key === "coldOpen" && value && previous) {
        const from = previous as Record<string, unknown>;
        result[key] = Object.fromEntries(
          Object.entries(value).map(([channel, next]) => [
            channel,
            typeof next === "number" && typeof from[channel] === "number"
              ? (from[channel] as number) +
                (next - (from[channel] as number)) * smooth
              : next,
          ]),
        );
      } else if (
        (key === "camera" || key === "cameraRot") &&
        value &&
        previous
      ) {
        const from = previous as { x: number; y: number; z: number },
          to = value as typeof from;
        result[key] = {
          x: from.x + (to.x - from.x) * smooth,
          y: from.y + (to.y - from.y) * smooth,
          z: from.z + (to.z - from.z) * smooth,
        };
      } else result[key] = value;
    }
    if (progress < 1 || phase.id === inspectionPhase) break;
    start += phase.duration;
  }
  return result as Partial<NoriSceneState>;
}
