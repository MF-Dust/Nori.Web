import { useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import {
  NORI_REACTIONS,
  type NoriReactionOutcome,
  type NoriReactionResult,
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
    };

export interface DebugReactionGroup {
  game: DebugReactionEntry["game"];
  label: string;
  entries: readonly DebugReactionEntry[];
}

/** Controls backed by the production reaction director mounted on NoriFrontendRuntime. */
export const DEBUG_REACTION_GROUPS: readonly DebugReactionGroup[] = [
  {
    game: "pictionary",
    label: "Pictionary",
    entries: [
      {
        game: "pictionary",
        id: "playerCorrect",
        label: "Player guesses correctly",
      },
      {
        game: "pictionary",
        id: "noriCorrectFast",
        label: "She solves fast (<30s)",
      },
      {
        game: "pictionary",
        id: "noriCorrectSlow",
        label: "She solves a hard one (>30s)",
      },
      { game: "pictionary", id: "playerWrong", label: "Player guesses wrong" },
      { game: "pictionary", id: "noriWrong", label: "Her guess is wrong" },
      {
        game: "pictionary",
        id: "skipNoriDrawing",
        label: "Player skips HER drawing",
      },
      {
        game: "pictionary",
        id: "skipPlayerDrawing",
        label: "Round skipped while player drew",
      },
      {
        game: "pictionary",
        id: "sessionGreat",
        label: "Session done — great score",
      },
      {
        game: "pictionary",
        id: "sessionOk",
        label: "Session done — decent score",
      },
      {
        game: "pictionary",
        id: "sessionPoor",
        label: "Session done — rough score",
      },
    ],
  },
  {
    game: "chess",
    label: "Chess",
    entries: [
      {
        game: "chess",
        id: "captureMinor",
        label: "She captures (minor piece)",
      },
      { game: "chess", id: "captureMajor", label: "She captures (queen/rook)" },
      {
        game: "chess",
        id: "lostMajorPiece",
        label: "Player captures her queen/rook",
      },
      { game: "chess", id: "checked", label: "Check against her" },
      { game: "chess", id: "givesCheck", label: "She gives check" },
      { game: "chess", id: "playerPromotes", label: "Player promotes" },
      { game: "chess", id: "acceptsRequest", label: "Accepts takeback / draw" },
      {
        game: "chess",
        id: "declinesRequest",
        label: "Declines takeback / draw",
      },
      { game: "chess", id: "wins", label: "She wins (checkmate)" },
      { game: "chess", id: "loses", label: "She loses (checkmated)" },
      { game: "chess", id: "draw", label: "Stalemate / draw" },
    ],
  },
  {
    game: "codenames",
    label: "Codenames",
    entries: [
      {
        game: "codenames",
        id: "guessAlly",
        label: "Her guess hits an ally card",
      },
      { game: "codenames", id: "guessStreak", label: "Her guess streak (2+)" },
      {
        game: "codenames",
        id: "guessBystander",
        label: "Her guess hits a bystander",
      },
      {
        game: "codenames",
        id: "herClueMissed",
        label: "Player misses on HER clue",
      },
      { game: "codenames", id: "assassin", label: "Assassin revealed" },
      { game: "codenames", id: "win", label: "Team wins" },
      { game: "codenames", id: "loss", label: "Team loses" },
    ],
  },
];

export function debugReactionLabel(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (value) => value.toUpperCase());
}

export function playDebugReaction(
  frontend: Pick<NoriFrontendRuntime, "reactions">,
  entry: DebugReactionEntry,
): NoriReactionResult {
  switch (entry.game) {
    case "pictionary":
      return frontend.reactions.play("pictionary", entry.id);
    case "chess":
      return frontend.reactions.play("chess", entry.id);
    case "codenames":
      return frontend.reactions.play("codenames", entry.id);
  }
}

const outcomeCopy: Record<NoriReactionOutcome, string> = {
  played: "Played",
  no_model: "No Live2D model mounted",
  blocked: "Blocked by the current presentation state",
  unknown_reaction: "Unknown reaction",
  skipped_chance: "No reaction (lost the roll)",
  skipped_cooldown: "Skipped by the motion cooldown",
};

export function DebugReactionsTab({
  frontend,
}: {
  frontend: Pick<NoriFrontendRuntime, "reactions">;
}) {
  const [result, setResult] = useState<{
    entry: DebugReactionEntry;
    outcome: NoriReactionOutcome;
  } | null>(null);

  return (
    <section aria-label="Reactions">
      <h2>Reactions</h2>
      <p>
        These controls use the production chance, variant selection,
        presentation gate, and motion cooldown.
      </p>
      {DEBUG_REACTION_GROUPS.map((group) => (
        <section key={group.game} aria-label={`${group.label} reactions`}>
          <h3>{group.label}</h3>
          <div className="source-debug-lab-actions">
            {group.entries.map((entry) => (
              <button
                type="button"
                key={entry.id}
                onClick={() => {
                  const next = playDebugReaction(frontend, entry);
                  setResult({ entry, outcome: next.outcome });
                }}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </section>
      ))}
      <section aria-label="Unavailable reaction controls">
        <h3>Unavailable from the source runtime</h3>
        <p>
          Cake Duel reactions, forced variants, cooldown bypass, phase moods,
          and claim-tell sampling do not have production bindings yet.
        </p>
      </section>
      <p role="status">
        {result
          ? `${result.entry.label}: ${outcomeCopy[result.outcome]}`
          : "Select a reaction"}
      </p>
    </section>
  );
}
