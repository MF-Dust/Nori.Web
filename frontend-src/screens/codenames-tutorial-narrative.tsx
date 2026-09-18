import type { CodenamesTutorialInstruction } from "../apps/codenames-tutorial";

export function CodenamesTutorialNarrative({ instruction }: { instruction: CodenamesTutorialInstruction | null }) {
  if (!instruction) return null;
  return <aside className="source-codenames-tutorial" data-codenames-tutorial={instruction.step} data-actor={instruction.actor}
    aria-live="polite" aria-atomic="true">
    <div className="source-codenames-tutorial-heading">
      <span>{instruction.actor === "nori" ? "Nori" : instruction.actor === "player" ? "Guide" : "Map"}</span>
      <small>{instruction.step} / {instruction.total}</small>
    </div>
    <strong>{instruction.title}</strong>
    <p>{instruction.body}</p>
    <progress max={instruction.total} value={instruction.step} aria-label={`${instruction.step} / ${instruction.total}`} />
  </aside>;
}
