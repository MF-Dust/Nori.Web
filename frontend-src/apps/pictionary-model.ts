import { z } from "zod";

export const PICTIONARY_NEXT_ROUND_DELAY_MS = 5000;
export const PICTIONARY_PEN_WIDTH = 6;
export const PICTIONARY_ERASER_WIDTH = 54;
export const PICTIONARY_COLORS = ["#363636", "#4A5568", "#9B6B5B", "#B8956B", "#5B7B6B", "#7B4B5B"] as const;
const rolesSchema = z.object({ drawer: z.enum(["player", "agent"]), guesser: z.enum(["player", "agent"]) });
const historySchema = z.object({
  word: z.string(), drawingId: z.string().optional(), roles: rolesSchema,
  elapsedMs: z.number(), outcome: z.enum(["solved", "skipped", "unfinished"]),
});
export const pictionaryStateSchema = z.object({
  settings: z.object({
    sessionDurationMs: z.number().positive(), roundTimeLimitMs: z.number().positive().optional(),
    inferenceMode: z.enum(["fast", "harder"]), locale: z.string(),
  }),
  gameState: z.object({
    phase: z.enum(["PLAYING", "RESULTS"]), score: z.object({ solved: z.number(), skipped: z.number() }),
    round: z.object({
      roundId: z.string(), startedAtMs: z.number(), word: z.string(), drawingId: z.string(),
      pinyin: z.array(z.array(z.string())).optional(), roles: rolesSchema,
      status: z.enum(["active", "solved", "skipped", "unfinished"]),
      noriRedrawEpoch: z.number().default(0), solvedAtMs: z.number().optional(),
      lastGuess: z.object({ by: z.enum(["player", "agent"]), text: z.string(), atMs: z.number(), correct: z.boolean() }).optional(),
    }),
    history: z.array(historySchema),
  }).nullable(),
});
export type PictionaryState = z.infer<typeof pictionaryStateSchema>;
export type PictionaryGame = NonNullable<PictionaryState["gameState"]>;
export interface DrawingPoint { x: number; y: number }
export interface DrawingStroke { points: DrawingPoint[]; color: string; width: number }
export type DrawingSample = Array<[number[], number[]]>;
export type DrawingIndex = Record<string, DrawingSample[]>;

export function pictionaryElapsed(game: PictionaryGame, now: number): number {
  const completed = game.history.reduce((sum, item) => sum + item.elapsedMs, 0);
  return completed + (game.phase === "PLAYING" && game.round.status === "active" ? Math.max(0, now - game.round.startedAtMs) : 0);
}
export function pictionaryNextRoundAt(game: PictionaryGame): number | null {
  if (game.phase !== "PLAYING" || !["solved", "skipped"].includes(game.round.status)) return null;
  const last = game.history.at(-1);
  const ended = game.round.solvedAtMs ?? (last ? game.round.startedAtMs + last.elapsedMs : null);
  return ended === null ? null : ended + PICTIONARY_NEXT_ROUND_DELAY_MS;
}
export function pictionarySummary(game: PictionaryGame) {
  const solved = game.history.filter(item => item.outcome === "solved");
  const skipped = game.history.filter(item => item.outcome === "skipped").length;
  const attempted = solved.length + skipped;
  return {
    solved: solved.length, skipped, attempted,
    unfinished: game.history.filter(item => item.outcome === "unfinished").length,
    accuracy: attempted ? Math.round(solved.length / attempted * 100) : 0,
    bestTime: solved.length ? Math.min(...solved.map(item => item.elapsedMs)) : null,
    avgTime: solved.length ? solved.reduce((sum, item) => sum + item.elapsedMs, 0) / solved.length : null,
    durationMs: game.history.reduce((sum, item) => sum + item.elapsedMs, 0),
  };
}
export function normalizeDrawingStroke(points: readonly DrawingPoint[], width: number, height: number, color: string, penWidth: number): DrawingStroke | null {
  if (points.length < 2 || width <= 0 || height <= 0) return null;
  const stride = Math.max(1, Math.ceil(points.length / 128));
  const normalized = points.filter((_, index) => index % stride === 0).map(point => ({
    x: Math.max(0, Math.min(1, point.x / width)), y: Math.max(0, Math.min(1, point.y / height)),
  }));
  return normalized.length < 2 ? null : { points: normalized, color, width: penWidth };
}
export function smoothDrawing(points: readonly DrawingPoint[], iterations = 2): DrawingPoint[] {
  let result = [...points];
  for (let step = 0; step < iterations && result.length >= 3; step++) {
    const next = [result[0]];
    for (let index = 0; index < result.length - 1; index++) {
      const a = result[index], b = result[index + 1];
      next.push({ x: .75 * a.x + .25 * b.x, y: .75 * a.y + .25 * b.y },
        { x: .25 * a.x + .75 * b.x, y: .25 * a.y + .75 * b.y });
    }
    next.push(result[result.length - 1]); result = next;
  }
  return result;
}
export function drawingSampleStrokes(sample: DrawingSample): DrawingStroke[] {
  return sample.map(([xs, ys]) => ({
    // Shipped Quick Draw coordinates are 0..255, inset by 16% on each edge.
    points: smoothDrawing(xs.slice(0, ys.length).map((x, index) => ({
      x: .16 + Math.max(0, Math.min(255, x)) / 255 * .68,
      y: .16 + Math.max(0, Math.min(255, ys[index])) / 255 * .68,
    }))),
    color: PICTIONARY_COLORS[0], width: PICTIONARY_PEN_WIDTH,
  })).filter(stroke => stroke.points.length >= 2);
}
let drawingsPromise: Promise<DrawingIndex> | null = null;
export function loadPictionaryDrawings(): Promise<DrawingIndex> {
  return drawingsPromise ??= fetch("/pictionary/drawings.json").then(async response => {
    if (!response.ok) throw new Error("Unable to load drawing samples: " + response.status);
    const data: unknown = await response.json();
    const parsed = z.record(z.array(z.array(z.tuple([z.array(z.number()), z.array(z.number())])))).parse(data);
    return Object.fromEntries(Object.entries(parsed).map(([key, samples]) => [key.toLowerCase(), samples]));
  }).catch(error => { drawingsPromise = null; throw error; });
}
export function chooseDrawingSample(index: DrawingIndex, word: string, used: Set<number>, random = Math.random): DrawingSample | null {
  const key = word.trim().toLowerCase();
  const samples = index[key] ?? index[Object.keys(index).find(candidate => candidate.includes(key) || key.includes(candidate)) ?? ""];
  if (!samples?.length) return null;
  let choices = samples.map((_, sample) => sample).filter(sample => !used.has(sample));
  if (!choices.length) { used.clear(); choices = samples.map((_, sample) => sample); }
  const selected = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
  used.add(selected);
  return samples[selected];
}
