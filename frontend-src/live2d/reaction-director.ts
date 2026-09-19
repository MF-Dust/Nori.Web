import type { Live2DModel, MotionStep } from "./engine.js";
import type { ChessReaction } from "../apps/chess-feedback";
import type { PictionaryReaction } from "../apps/pictionary-reactions";

export type CodenamesReaction =
  | "guessAlly"
  | "guessStreak"
  | "guessBystander"
  | "herClueMissed"
  | "assassin"
  | "win"
  | "loss";

export interface NoriReactionMap {
  pictionary: PictionaryReaction;
  chess: ChessReaction;
  codenames: CodenamesReaction;
}

type ReactionPriority = "minor" | "major" | "critical";
interface ReactionVariant {
  motion?: MotionStep;
  expression?: string;
  expressionSeconds?: number;
  weight?: number;
}
interface ReactionSpec {
  priority: ReactionPriority;
  chance?: number;
  variants: readonly ReactionVariant[];
}

const motion = {
  NOD: { group: "Reactions", index: 0 },
  SHAKE_HEAD: { group: "Reactions", index: 1 },
  WAKUWAKU: { group: "Reactions", index: 2 },
  ANGRY: { group: "Reactions", index: 3 },
  TROUBLED: { group: "Reactions", index: 4 },
  DIZZY: { group: "Reactions", index: 5 },
} as const;
const expression = {
  KIRAKIRA: "01_KiraKira",
  ANGRY: "03_Angry",
  SHY: "04_Shy",
  DARK: "05_Dark",
  SPEECHLESS: "06_Speechless",
  SMILE: "07_Smile",
  TEARS: "08_Tears",
  TROUBLED: "09_Troubled",
  DOUBT: "10_Doubt",
  SERIOUS: "12_Serious",
  HAPPY: "13_Happy",
  SURPRISED: "14_Surprised",
} as const;

export const NORI_REACTIONS: {
  readonly [Game in keyof NoriReactionMap]: Readonly<
    Record<NoriReactionMap[Game], ReactionSpec>
  >;
} = {
  pictionary: {
    playerCorrect: {
      priority: "minor",
      chance: 0.6,
      variants: [
        { motion: motion.NOD },
        {
          motion: motion.NOD,
          expression: expression.KIRAKIRA,
          expressionSeconds: 2.5,
        },
        { expression: expression.SMILE, expressionSeconds: 2.5 },
      ],
    },
    noriCorrectFast: {
      priority: "minor",
      chance: 0.6,
      variants: [
        { motion: motion.NOD },
        { expression: expression.HAPPY, expressionSeconds: 2.5 },
      ],
    },
    noriCorrectSlow: {
      priority: "major",
      chance: 0.75,
      variants: [
        {
          motion: motion.WAKUWAKU,
          expression: expression.HAPPY,
          expressionSeconds: 3,
        },
        { motion: motion.WAKUWAKU },
      ],
    },
    playerWrong: {
      priority: "minor",
      chance: 0.15,
      variants: [
        { motion: motion.SHAKE_HEAD },
        { expression: expression.TROUBLED, expressionSeconds: 2.5 },
      ],
    },
    noriWrong: {
      priority: "minor",
      chance: 0.15,
      variants: [
        { motion: motion.SHAKE_HEAD },
        { expression: expression.DOUBT, expressionSeconds: 2.5 },
      ],
    },
    skipNoriDrawing: {
      priority: "major",
      chance: 0.85,
      variants: [
        { motion: motion.ANGRY },
        { expression: expression.ANGRY, expressionSeconds: 3 },
      ],
    },
    skipPlayerDrawing: {
      priority: "major",
      chance: 0.85,
      variants: [
        { motion: motion.TROUBLED },
        { expression: expression.TROUBLED, expressionSeconds: 3 },
      ],
    },
    sessionGreat: {
      priority: "critical",
      variants: [
        {
          motion: motion.WAKUWAKU,
          expression: expression.KIRAKIRA,
          expressionSeconds: 5,
        },
        {
          motion: motion.WAKUWAKU,
          expression: expression.HAPPY,
          expressionSeconds: 5,
        },
      ],
    },
    sessionOk: {
      priority: "critical",
      variants: [
        {
          motion: motion.NOD,
          expression: expression.KIRAKIRA,
          expressionSeconds: 5,
        },
        { motion: motion.NOD },
      ],
    },
    sessionPoor: {
      priority: "critical",
      chance: 0.85,
      variants: [
        { motion: motion.DIZZY },
        {
          motion: motion.TROUBLED,
          expression: expression.TEARS,
          expressionSeconds: 5,
        },
      ],
    },
  },
  chess: {
    captureMinor: {
      priority: "minor",
      chance: 0.5,
      variants: [
        {
          motion: motion.NOD,
          expression: expression.KIRAKIRA,
          expressionSeconds: 2.5,
        },
        { motion: motion.NOD },
        { expression: expression.SMILE, expressionSeconds: 2.5 },
      ],
    },
    captureMajor: {
      priority: "major",
      chance: 0.75,
      variants: [
        {
          motion: motion.WAKUWAKU,
          expression: expression.HAPPY,
          expressionSeconds: 3,
        },
        {
          motion: motion.NOD,
          expression: expression.KIRAKIRA,
          expressionSeconds: 3,
        },
      ],
    },
    lostMajorPiece: {
      priority: "major",
      chance: 0.75,
      variants: [
        {
          motion: motion.TROUBLED,
          expression: expression.SURPRISED,
          expressionSeconds: 3,
        },
        { motion: motion.SHAKE_HEAD },
        { expression: expression.SURPRISED, expressionSeconds: 3 },
      ],
    },
    checked: {
      priority: "minor",
      chance: 0.67,
      variants: [
        { expression: expression.SURPRISED, expressionSeconds: 2.5 },
        { expression: expression.TROUBLED, expressionSeconds: 2.5 },
      ],
    },
    givesCheck: {
      priority: "minor",
      chance: 0.5,
      variants: [
        { motion: motion.NOD },
        { expression: expression.SERIOUS, expressionSeconds: 2.5 },
      ],
    },
    playerPromotes: {
      priority: "minor",
      chance: 0.67,
      variants: [
        { expression: expression.SURPRISED, expressionSeconds: 2.5 },
        { expression: expression.SPEECHLESS, expressionSeconds: 2.5 },
      ],
    },
    acceptsRequest: {
      priority: "major",
      variants: [
        {
          motion: motion.NOD,
          expression: expression.KIRAKIRA,
          expressionSeconds: 2.5,
        },
        { motion: motion.NOD },
      ],
    },
    declinesRequest: {
      priority: "major",
      variants: [
        { motion: motion.SHAKE_HEAD },
        {
          motion: motion.TROUBLED,
          expression: expression.SHY,
          expressionSeconds: 2.5,
        },
      ],
    },
    wins: {
      priority: "critical",
      variants: [
        {
          motion: motion.WAKUWAKU,
          expression: expression.KIRAKIRA,
          expressionSeconds: 5,
        },
        {
          motion: motion.NOD,
          expression: expression.KIRAKIRA,
          expressionSeconds: 5,
        },
      ],
    },
    loses: {
      priority: "critical",
      chance: 0.8,
      variants: [
        {
          motion: motion.TROUBLED,
          expression: expression.TEARS,
          expressionSeconds: 5,
        },
        { motion: motion.DIZZY },
      ],
    },
    draw: {
      priority: "critical",
      chance: 0.75,
      variants: [
        { expression: expression.SPEECHLESS, expressionSeconds: 5 },
        {
          motion: motion.TROUBLED,
          expression: expression.SPEECHLESS,
          expressionSeconds: 5,
        },
      ],
    },
  },
  codenames: {
    guessAlly: {
      priority: "minor",
      chance: 0.5,
      variants: [
        { motion: motion.NOD },
        { expression: expression.SMILE, expressionSeconds: 2.5 },
      ],
    },
    guessStreak: {
      priority: "major",
      chance: 0.75,
      variants: [
        {
          motion: motion.WAKUWAKU,
          expression: expression.HAPPY,
          expressionSeconds: 3,
        },
        {
          motion: motion.NOD,
          expression: expression.KIRAKIRA,
          expressionSeconds: 3,
        },
      ],
    },
    guessBystander: {
      priority: "minor",
      chance: 0.67,
      variants: [
        { expression: expression.TROUBLED, expressionSeconds: 3 },
        { expression: expression.SHY, expressionSeconds: 3 },
      ],
    },
    herClueMissed: {
      priority: "major",
      chance: 0.75,
      variants: [
        {
          motion: motion.TROUBLED,
          expression: expression.TEARS,
          expressionSeconds: 4,
        },
        { motion: motion.SHAKE_HEAD },
        { expression: expression.TROUBLED, expressionSeconds: 4 },
      ],
    },
    assassin: {
      priority: "critical",
      variants: [
        {
          motion: motion.TROUBLED,
          expression: expression.DARK,
          expressionSeconds: 5,
        },
        { motion: motion.DIZZY },
      ],
    },
    win: {
      priority: "critical",
      variants: [
        {
          motion: motion.WAKUWAKU,
          expression: expression.KIRAKIRA,
          expressionSeconds: 5,
        },
        {
          motion: motion.WAKUWAKU,
          expression: expression.HAPPY,
          expressionSeconds: 5,
        },
      ],
    },
    loss: {
      priority: "critical",
      chance: 0.8,
      variants: [
        {
          motion: motion.TROUBLED,
          expression: expression.TEARS,
          expressionSeconds: 5,
        },
        { motion: motion.DIZZY },
      ],
    },
  },
};

const COOLDOWN: Readonly<Record<ReactionPriority, number>> = {
  minor: 7_000,
  major: 2_500,
  critical: 0,
};

export type NoriReactionOutcome =
  | "played"
  | "no_model"
  | "blocked"
  | "unknown_reaction"
  | "skipped_chance"
  | "skipped_cooldown";

export interface NoriReactionResult {
  outcome: NoriReactionOutcome;
  variant: ReactionVariant | null;
}

/** Source-owned form of the shipped semantic reaction director. */
export class NoriReactionDirector {
  private model: Live2DModel | null = null;
  private blocked = false;
  private lastMotionAt = Number.NEGATIVE_INFINITY;
  private activeExpression: {
    model: Live2DModel;
    name: string;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  constructor(
    private readonly clock: () => number = () => performance.now(),
    private readonly random: () => number = Math.random,
  ) {}

  bindModel(model: Live2DModel) {
    this.interrupt();
    this.model = model;
    return () => {
      if (this.model === model) {
        this.interrupt();
        this.model = null;
      }
    };
  }

  setBlocked(blocked: boolean) {
    this.blocked = blocked;
    if (blocked) this.interrupt();
  }

  /** Cancels only the expression currently owned by this director. */
  interrupt() {
    const active = this.activeExpression;
    if (!active) return;
    this.activeExpression = null;
    clearTimeout(active.timer);
    active.model.removeExpression(active.name);
  }

  reset() {
    this.interrupt();
    this.lastMotionAt = Number.NEGATIVE_INFINITY;
  }

  dispose() {
    this.interrupt();
    this.model = null;
    this.blocked = true;
    this.lastMotionAt = Number.NEGATIVE_INFINITY;
  }

  play<Game extends keyof NoriReactionMap>(
    game: Game,
    reaction: NoriReactionMap[Game],
  ): NoriReactionResult {
    const model = this.model;
    if (!model) return { outcome: "no_model", variant: null };
    if (this.blocked) return { outcome: "blocked", variant: null };
    const library = NORI_REACTIONS[game] as Readonly<
      Record<string, ReactionSpec>
    >;
    const spec = library?.[reaction];
    if (!spec) return { outcome: "unknown_reaction", variant: null };
    if ((spec.chance ?? 1) < 1 && this.random() >= (spec.chance ?? 1))
      return { outcome: "skipped_chance", variant: null };

    const total = spec.variants.reduce(
      (sum, variant) => sum + (variant.weight ?? 1),
      0,
    );
    let pick = this.random() * total;
    let variant = spec.variants[0];
    for (const candidate of spec.variants) {
      variant = candidate;
      pick -= candidate.weight ?? 1;
      if (pick < 0) break;
    }
    const now = this.clock();
    if (
      variant.motion &&
      now - this.lastMotionAt < COOLDOWN[spec.priority]
    )
      return { outcome: "skipped_cooldown", variant: null };
    if (variant.motion) {
      model.startMotion({ steps: variant.motion });
      this.lastMotionAt = now;
    }
    if (variant.expression) {
      this.interrupt();
      const active = {
        model,
        name: variant.expression,
        timer: undefined as unknown as ReturnType<typeof setTimeout>,
      };
      model.addExpression(active.name);
      active.timer = setTimeout(() => {
        if (this.activeExpression !== active) return;
        this.activeExpression = null;
        active.model.removeExpression(active.name);
      }, (variant.expressionSeconds ?? 3) * 1_000);
      this.activeExpression = active;
    }
    return { outcome: "played", variant };
  }
}
