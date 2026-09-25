import { useEffect, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import {
  CAKE_DUEL_TELL_WEIGHTS,
  NORI_PHASE_MOODS,
  NORI_REACTION_COOLDOWNS,
  NORI_REACTIONS,
  sampleCakeDuelTell,
  type CakeDuelClaimKind,
  type NoriReactionOutcome,
  type NoriReactionPlayOptions,
  type NoriReactionResult,
  type ReactionSpec,
  type ReactionVariant,
} from "../live2d/reaction-director";

export type DebugReactionEntry =
  | {
      game: "pictionary";
      id: keyof typeof NORI_REACTIONS.pictionary;
      label: string;
    }
  | {
      game: "chess";
      id: keyof typeof NORI_REACTIONS.chess;
      label: string;
    }
  | {
      game: "codenames";
      id: keyof typeof NORI_REACTIONS.codenames;
      label: string;
    }
  | {
      game: "cakeduel";
      id: keyof typeof NORI_REACTIONS.cakeduel;
      label: string;
    };

export interface DebugReactionGroup {
  game: DebugReactionEntry["game"];
  label: string;
  entries: readonly DebugReactionEntry[];
}

/** Controls backed by the same production reaction director used by the games. */
export const DEBUG_REACTION_GROUPS: readonly DebugReactionGroup[] = [
  {
    game: "pictionary",
    label: "Pictionary",
    entries: [
      { game: "pictionary", id: "playerCorrect", label: "Player guesses correctly" },
      { game: "pictionary", id: "noriCorrectFast", label: "She solves fast (<30s)" },
      { game: "pictionary", id: "noriCorrectSlow", label: "She solves a hard one (>30s)" },
      { game: "pictionary", id: "playerWrong", label: "Player guesses wrong" },
      { game: "pictionary", id: "noriWrong", label: "Her guess is wrong" },
      { game: "pictionary", id: "skipNoriDrawing", label: "Player skips HER drawing" },
      { game: "pictionary", id: "skipPlayerDrawing", label: "Round skipped while player drew" },
      { game: "pictionary", id: "sessionGreat", label: "Session done — great score" },
      { game: "pictionary", id: "sessionOk", label: "Session done — decent score" },
      { game: "pictionary", id: "sessionPoor", label: "Session done — rough score" },
    ],
  },
  {
    game: "chess",
    label: "Chess",
    entries: [
      { game: "chess", id: "captureMinor", label: "She captures (minor piece)" },
      { game: "chess", id: "captureMajor", label: "She captures (queen/rook)" },
      { game: "chess", id: "lostMajorPiece", label: "Player captures her queen/rook" },
      { game: "chess", id: "checked", label: "Check against her" },
      { game: "chess", id: "givesCheck", label: "She gives check" },
      { game: "chess", id: "playerPromotes", label: "Player promotes" },
      { game: "chess", id: "acceptsRequest", label: "Accepts takeback / draw" },
      { game: "chess", id: "declinesRequest", label: "Declines takeback / draw" },
      { game: "chess", id: "wins", label: "She wins (checkmate)" },
      { game: "chess", id: "loses", label: "She loses (checkmated)" },
      { game: "chess", id: "draw", label: "Stalemate / draw" },
    ],
  },
  {
    game: "codenames",
    label: "Codenames",
    entries: [
      { game: "codenames", id: "guessAlly", label: "Her guess hits an ally card" },
      { game: "codenames", id: "guessStreak", label: "Her guess streak (2+)" },
      { game: "codenames", id: "guessBystander", label: "Her guess hits a bystander" },
      { game: "codenames", id: "herClueMissed", label: "Player misses on HER clue" },
      { game: "codenames", id: "assassin", label: "Assassin revealed" },
      { game: "codenames", id: "win", label: "Team wins" },
      { game: "codenames", id: "loss", label: "Team loses" },
    ],
  },
  {
    game: "cakeduel",
    label: "Cake Duel",
    entries: [
      { game: "cakeduel", id: "challenged", label: "Player challenges her (pre-reveal)" },
      { game: "cakeduel", id: "bluffCaught", label: "Her bluff is caught" },
      { game: "cakeduel", id: "vindicated", label: "She was honest, challenge fails" },
      { game: "cakeduel", id: "challengeWins", label: "Her challenge succeeds" },
      { game: "cakeduel", id: "challengeFails", label: "Her challenge fails" },
      { game: "cakeduel", id: "losesCake", label: "She loses a cake" },
      { game: "cakeduel", id: "wolfyTaunt", label: "Player's Wolfy taunts her" },
      { game: "cakeduel", id: "wins", label: "She wins the duel" },
      { game: "cakeduel", id: "loses", label: "She loses the duel" },
    ],
  },
];

export function debugReactionLabel(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (value) => value.toUpperCase());
}

export function debugReactionSpec(entry: DebugReactionEntry): ReactionSpec {
  return (NORI_REACTIONS[entry.game] as Readonly<Record<string, ReactionSpec>>)[
    entry.id
  ];
}

export function playDebugReaction(
  frontend: Pick<NoriFrontendRuntime, "reactions">,
  entry: DebugReactionEntry,
  options: NoriReactionPlayOptions = {},
): NoriReactionResult {
  return frontend.reactions.playSpec(debugReactionSpec(entry), options);
}

function variantText(variant: ReactionVariant) {
  const parts: string[] = [];
  if (variant.motion)
    parts.push(`${variant.motion.group}[${variant.motion.index ?? 0}]`);
  if (variant.expression)
    parts.push(
      `${variant.expression.replace(/^\d+_/, "")} ${variant.expressionSeconds ?? 3}s`,
    );
  return parts.join(" + ") || "(empty)";
}

const outcomeCopy: Record<NoriReactionOutcome, string> = {
  played: "Played",
  no_model: "No Live2D model mounted",
  blocked: "Blocked by the current presentation state",
  unknown_reaction: "Unknown reaction",
  skipped_chance: "No reaction (lost the roll)",
  skipped_cooldown: "Skipped by the motion cooldown",
};

function tellSample(count: number) {
  const lines: string[] = [];
  for (const kind of ["bluff", "honest"] as const) {
    const totals = { none: 0, confident: 0, nervous: 0 };
    for (let i = 0; i < count; i++) totals[sampleCakeDuelTell(kind)]++;
    const percent = (value: number) => `${((value / count) * 100).toFixed(1)}%`;
    lines.push(
      `${kind.padEnd(6)} none ${percent(totals.none)} confident ${percent(totals.confident)} nervous ${percent(totals.nervous)}`,
    );
  }
  lines.push("");
  lines.push(
    `design bluff: confident ${CAKE_DUEL_TELL_WEIGHTS.bluff.confident} nervous ${CAKE_DUEL_TELL_WEIGHTS.bluff.nervous}`,
  );
  lines.push(
    `       honest: confident ${CAKE_DUEL_TELL_WEIGHTS.honest.confident} nervous ${CAKE_DUEL_TELL_WEIGHTS.honest.nervous}`,
  );
  return lines.join("\n");
}

export function DebugReactionsTab({
  frontend,
}: {
  frontend: Pick<NoriFrontendRuntime, "reactions">;
}) {
  const [respectCooldown, setRespectCooldown] = useState(false);
  const [clock, setClock] = useState(0);
  const [result, setResult] = useState<{
    label: string;
    outcome: NoriReactionOutcome;
    variant: ReactionVariant | null;
  } | null>(null);
  const [tell, setTell] = useState<{
    kind: CakeDuelClaimKind;
    tell: "none" | "confident" | "nervous";
  } | null>(null);
  const [sample, setSample] = useState("");

  useEffect(() => {
    if (!respectCooldown) return;
    const timer = window.setInterval(() => setClock((value) => value + 1), 250);
    return () => window.clearInterval(timer);
  }, [respectCooldown]);

  const cooldown = frontend.reactions.cooldownRemaining("minor");
  void clock;

  const run = (
    entry: DebugReactionEntry,
    options: NoriReactionPlayOptions,
  ) => {
    const next = playDebugReaction(frontend, entry, options);
    setResult({
      label: entry.label,
      outcome: next.outcome,
      variant: next.variant,
    });
  };

  const claim = (kind: CakeDuelClaimKind) => {
    const next = frontend.reactions.playCakeDuelTell(kind);
    setTell({ kind, tell: next.tell });
  };

  return (
    <section aria-label="Reactions">
      <h2>Reactions</h2>
      <h3>Engine</h3>
      <label>
        <input
          type="checkbox"
          checked={respectCooldown}
          onChange={(event) => setRespectCooldown(event.target.checked)}
        />
        Respect motion cooldown
      </label>
      <p>
        Roll keeps production chance and weighted variant selection. Numbered
        buttons force one exact variant and bypass chance/cooldown.
      </p>
      {respectCooldown && (
        <p>
          {cooldown > 0
            ? `Minor motions blocked for ${(cooldown / 1000).toFixed(1)}s (minor ${NORI_REACTION_COOLDOWNS.minor / 1000}s / major ${NORI_REACTION_COOLDOWNS.major / 1000}s / critical always)`
            : "Motion budget ready"}
        </p>
      )}
      {result && (
        <p role="status">
          {result.label}: {outcomeCopy[result.outcome]}
          {result.variant ? ` → ${variantText(result.variant)}` : ""}
        </p>
      )}

      {DEBUG_REACTION_GROUPS.map((group) => (
        <section key={group.game} aria-label={`${group.label} reactions`}>
          <h3>{group.label}</h3>
          {group.entries.map((entry) => {
            const spec = debugReactionSpec(entry);
            return (
              <div key={entry.id}>
                <div className="source-debug-lab-actions">
                  <span>
                    {entry.label} · {spec.priority} · reacts{" "}
                    {Math.round((spec.chance ?? 1) * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      run(entry, { ignoreCooldown: !respectCooldown })
                    }
                  >
                    Roll
                  </button>
                </div>
                <div className="source-debug-lab-actions">
                  {spec.variants.map((variant, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() =>
                        run(entry, {
                          ignoreChance: true,
                          ignoreCooldown: true,
                          variantIndex: index,
                        })
                      }
                    >
                      {index + 1}· {variantText(variant)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      <section aria-label="Phase moods">
        <h3>Phase moods (persistent)</h3>
        <div className="source-debug-lab-actions">
          {NORI_PHASE_MOODS.map((mood) => (
            <button
              type="button"
              key={mood.id}
              aria-pressed={frontend.reactions.mood() === mood.expression}
              onClick={() => {
                frontend.reactions.setMood(mood.expression);
                setClock((value) => value + 1);
              }}
            >
              {mood.label}
            </button>
          ))}
          <button
            type="button"
            disabled={!frontend.reactions.mood()}
            onClick={() => {
              frontend.reactions.clearMood();
              setClock((value) => value + 1);
            }}
          >
            Clear mood
          </button>
        </div>
        <p>
          {frontend.reactions.mood()
            ? `Active mood: ${frontend.reactions.mood()}`
            : "No active mood"}
        </p>
      </section>

      <section aria-label="Cake Duel tell">
        <h3>Cake Duel acting (tell layer)</h3>
        <p>
          Claim tells use the shipped soft correlation: nervous weakly signals
          bluff and confident weakly signals honest.
        </p>
        <div className="source-debug-lab-actions">
          <button type="button" onClick={() => claim("bluff")}>
            Claim (bluffing)
          </button>
          <button type="button" onClick={() => claim("honest")}>
            Claim (honest)
          </button>
          <button type="button" onClick={() => setSample(tellSample(2000))}>
            Sample 2000
          </button>
        </div>
        {tell && (
          <p>
            {tell.kind} claim →{" "}
            {tell.tell === "none"
              ? "no tell"
              : tell.tell === "confident"
                ? "confident (Smile 2.5s)"
                : "nervous (Troubled 2.5s)"}
          </p>
        )}
        {sample && <pre>{sample}</pre>}
      </section>
    </section>
  );
}
