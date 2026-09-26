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
      note?: string;
    }
  | {
      game: "chess";
      id: keyof typeof NORI_REACTIONS.chess;
      label: string;
      note?: string;
    }
  | {
      game: "codenames";
      id: keyof typeof NORI_REACTIONS.codenames;
      label: string;
      note?: string;
    }
  | {
      game: "cakeduel";
      id: keyof typeof NORI_REACTIONS.cakeduel;
      label: string;
      note?: string;
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
      { game: "pictionary", id: "playerWrong", label: "Player guesses wrong", note: "Low chance replaces the old every-5th counter." },
      { game: "pictionary", id: "noriWrong", label: "Her guess is wrong" },
      { game: "pictionary", id: "skipNoriDrawing", label: "Player skips HER drawing", note: "She put work into that." },
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
      { game: "chess", id: "checked", label: "Check against her", note: "Expression only — cheap, no motion." },
      { game: "chess", id: "givesCheck", label: "She gives check" },
      { game: "chess", id: "playerPromotes", label: "Player promotes" },
      { game: "chess", id: "acceptsRequest", label: "Accepts takeback / draw", note: "Direct response to the player — always reacts." },
      { game: "chess", id: "declinesRequest", label: "Declines takeback / draw", note: "Direct response to the player — always reacts." },
      { game: "chess", id: "wins", label: "She wins (checkmate)" },
      { game: "chess", id: "loses", label: "She loses (checkmated)", note: "Sometimes takes it in silence — stoic is also a read." },
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
      { game: "codenames", id: "herClueMissed", label: "Player misses on HER clue", note: "She feels responsible for the bad clue." },
      { game: "codenames", id: "assassin", label: "Assassin revealed", note: "The one moment that always lands." },
      { game: "codenames", id: "win", label: "Team wins" },
      { game: "codenames", id: "loss", label: "Team loses" },
    ],
  },
  {
    game: "cakeduel",
    label: "Cake Duel",
    entries: [
      { game: "cakeduel", id: "challenged", label: "Player challenges her (pre-reveal)", note: "Sampled from public info only — must be uninformative about the truth." },
      { game: "cakeduel", id: "bluffCaught", label: "Her bluff is caught", note: "Embarrassed, not angry." },
      { game: "cakeduel", id: "vindicated", label: "She was honest, challenge fails", note: "Vindicated smug." },
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

/** Shipped `dl`: priority, roll chance and how many outs the spec can land on. */
function specHint(spec: { priority: string; chance?: number; variants: readonly unknown[] }) {
  return `${spec.priority} · reacts ${Math.round((spec.chance ?? 1) * 100)}% · ${spec.variants.length} outs`;
}

/** Shipped outcome line: the label is dropped only for the missing-model case. */
function outcomeLine(
  label: string,
  outcome: NoriReactionOutcome,
  variant: ReactionVariant | null,
) {
  switch (outcome) {
    case "played":
      return `${label} → ${variantText(variant as ReactionVariant)}`;
    case "skipped_chance":
      return `${label} → no reaction (lost the roll)`;
    case "skipped_cooldown":
      return `${label} → skipped (motion cooldown)`;
    case "no_model":
      return "No Live2D model mounted";
    default:
      return outcome;
  }
}

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
    `design  bluff: confident ${CAKE_DUEL_TELL_WEIGHTS.bluff.confident} nervous ${CAKE_DUEL_TELL_WEIGHTS.bluff.nervous}`,
  );
  lines.push(
    `        honest: confident ${CAKE_DUEL_TELL_WEIGHTS.honest.confident} nervous ${CAKE_DUEL_TELL_WEIGHTS.honest.nervous}`,
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
  // The shipped tab reads the model off a reactive store. The source director
  // only reports presence, so this refreshes on a tab re-render.
  const model = frontend.reactions.hasModel();
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
        Roll = fire like the game would: no-reaction roll, then a
        weight-sampled out. Numbered buttons force one exact out.
      </p>
      {respectCooldown && (
        <p>
          {cooldown > 0
            ? `Minor motions blocked for ${(cooldown / 1000).toFixed(1)}s (minor ${NORI_REACTION_COOLDOWNS.minor / 1000}s / major ${NORI_REACTION_COOLDOWNS.major / 1000}s / critical always)`
            : "Motion budget ready"}
        </p>
      )}
      {result && <p role="status">{outcomeLine(result.label, result.outcome, result.variant)}</p>}
      {!model && <p role="alert">No Live2D model mounted.</p>}

      {DEBUG_REACTION_GROUPS.map((group) => (
        <section key={group.game} aria-label={`${group.label} reactions`}>
          <h3>{group.label}</h3>
          {group.entries.map((entry) => {
            const spec = debugReactionSpec(entry);
            return (
              <div key={entry.id}>
                <div className="source-debug-lab-actions">
                  <span>{entry.label}</span>
                  <button
                    type="button"
                    disabled={!model}
                    onClick={() =>
                      run(entry, { ignoreCooldown: !respectCooldown })
                    }
                  >
                    Roll
                  </button>
                </div>
                <p className="source-debug-hint">{specHint(spec)}</p>
                <div className="source-debug-lab-actions">
                  {spec.variants.map((variant, index) => (
                    <button
                      type="button"
                      key={index}
                      disabled={!model}
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
                {entry.note && <p className="source-debug-note">{entry.note}</p>}
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
              disabled={!model}
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
            disabled={!model || !frontend.reactions.mood()}
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
            : "No active mood"}{" "}
          — moods hold until cleared and layer with one-shot reactions.
        </p>
      </section>

      <section aria-label="Cake Duel tell">
        <h3>Cake Duel acting (tell layer)</h3>
        <p>
          On claim, a micro-expression is sampled with a soft correlation to the
          truth: nervous weakly signals bluff, confident weakly signals honest.
        </p>
        <div className="source-debug-lab-actions">
          <button
            type="button"
            disabled={!model}
            onClick={() => claim("bluff")}
          >
            Claim (bluffing)
          </button>
          <button
            type="button"
            disabled={!model}
            onClick={() => claim("honest")}
          >
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
