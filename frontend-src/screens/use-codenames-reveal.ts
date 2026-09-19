import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { GameCartridgeController } from "../apps/game-cartridge-controller";
import type { CodenamesState } from "../apps/codenames-model";
import { codenamesReveals, waitForCodenamesAnimation, type CodenamesReveal } from "../apps/codenames-reveal";
import type { CodenamesBoardCardAnimation } from "./codenames-board";
import type { CodenamesFlyingCardState } from "./codenames-flying-card";

function flight(root: HTMLElement | null, reveal: CodenamesReveal): CodenamesFlyingCardState | null {
  const source = root?.querySelector(`[data-${reveal.type}-source]`)?.getBoundingClientRect();
  const target = root?.querySelector(`[data-card-cell="${reveal.cell}"] .game-card-btn`)?.getBoundingClientRect();
  if (!source || !target || !target.width || !target.height) return null;
  const rect = ({ left, top, width, height }: DOMRect) => ({ left, top, width, height });
  let targetRect = rect(target);
  if (reveal.type === "bystander") {
    const scale = target.width / 160, size = 46 * scale, gap = 4 * scale;
    targetRect = { left: target.right - gap - size - (reveal.slot === 1 ? size + gap : 0), top: target.top + gap, width: size, height: size };
  }
  return { ...reveal, sourceRect: rect(source), targetRect };
}
const landingCue = {
  agent: "boardgames-codenames-agent-card-land",
  assassin: "boardgames-codenames-assassin-reveal",
  bystander: "boardgames-codenames-bystander-card-land",
};
export function useCodenamesReveal(controller: GameCartridgeController<CodenamesState>, root: RefObject<HTMLElement | null>, playSound?: (cue: string) => void) {
  const [cardAnimation, setCardAnimation] = useState<CodenamesBoardCardAnimation | null>(null);
  const [flyingCard, setFlyingCard] = useState<CodenamesFlyingCardState | null>(null);
  const sound = useRef(playSound); sound.current = playSound;
  const landed = useRef<(() => void) | null>(null);
  const onFlyingCardLanded = useCallback(() => landed.current?.(), []);
  useEffect(() => controller.setTransitionPresenter(async (previous, next, signal) => {
    if (!previous.gameState || !next.gameState) return;
    const cancel = () => { setCardAnimation(null); setFlyingCard(null); landed.current?.(); };
    signal.addEventListener("abort", cancel, { once: true });
    try {
      for (const reveal of codenamesReveals(previous.gameState, next.gameState)) {
        if (signal.aborted) break;
        sound.current?.("boardgames-codenames-card-shake-suspense");
        setCardAnimation({ cell: reveal.cell, phase: "shake" });
        await waitForCodenamesAnimation(2000, signal);
        if (signal.aborted) break;
        const card = flight(root.current, reveal);
        setCardAnimation(null);
        if (card) {
          await new Promise<void>(resolve => {
            // WAAPI completion is primary; a hidden/reduced-motion page still has a bounded fallback.
            const finish = () => { clearTimeout(timer); landed.current = null; resolve(); };
            const timer = setTimeout(finish, 700);
            landed.current = finish; setFlyingCard(card);
          });
          setFlyingCard(null);
        }
        if (!signal.aborted) sound.current?.(landingCue[reveal.type]);
      }
    } finally {
      signal.removeEventListener("abort", cancel);
    }
  }), [controller, root]);
  return { cardAnimation, flyingCard, onFlyingCardLanded };
}
