export type CakeDuelClaimName = string;

export interface CakeDuelClaimPresentation {
  claim: CakeDuelClaimName;
  cardCount: number;
}

export interface CakeDuelHudState {
  phase: string;
  isMyTurn: boolean;
  attackerIndex: number;
  boutWinners: readonly number[];
  attackingClaim?: CakeDuelClaimPresentation | null;
  blockingClaim?: CakeDuelClaimPresentation | null;
}

export interface CakeDuelHudPresentation {
  turnTranslationKey: string;
  playerWins: number;
  noriWins: number;
  activeClaim: CakeDuelClaimPresentation | null;
  activeClaimByPlayer: boolean;
}

export type CakeDuelLegalAction =
  | { type: "claim"; claimFrom: readonly CakeDuelClaimName[] }
  | { type: "pick"; pickFrom: readonly CakeDuelClaimName[] }
  | { type: "pass" }
  | { type: "challenge" }
  | { type: string; [key: string]: unknown };

export type CakeDuelTutorialGate =
  | { kind: "off" }
  | { kind: "wait" }
  | { kind: "pass" }
  | { kind: "challenge" }
  | {
      kind: "claim";
      claim: CakeDuelClaimName;
      requiredEntityIds: ReadonlySet<number>;
    };

export type CakeDuelActionPanelMode =
  | "hidden"
  | "claim"
  | "pick"
  | "block_response"
  | "response"
  | "attack_pass";

export interface CakeDuelActionPanelInput {
  gameEnded: boolean;
  isMyTurn: boolean;
  legalActions: readonly CakeDuelLegalAction[];
  selectedCount: number;
  tutorialGate: CakeDuelTutorialGate;
}

export interface CakeDuelPileLayout {
  opponentPile: "attack" | "block";
  playerPile: "attack" | "block";
  opponentSide: true;
}

export interface CakeDuelEntityCard {
  entityId: number;
  name?: CakeDuelClaimName;
}

export interface CakeDuelCakeTokenLayout {
  noriTokenIds: readonly number[];
  playerTokenIds: readonly number[];
}

export const CAKEDUEL_MAX_VISIBLE_CAKE_TOKENS = 7;
export const CAKEDUEL_ATTACK_PASS_CONFIRM_MS = 3_500;
export const CAKEDUEL_REVEALED_PILE_GAP_PX = 14;
export const CAKEDUEL_CHALLENGE_SETTLE_MS = 220;

export function findCakeDuelClaimAction(
  actions: readonly CakeDuelLegalAction[],
): Extract<CakeDuelLegalAction, { type: "claim" }> | null {
  return (actions.find((action) => action.type === "claim") as Extract<
    CakeDuelLegalAction,
    { type: "claim" }
  > | undefined) ?? null;
}

export function findCakeDuelPickAction(
  actions: readonly CakeDuelLegalAction[],
): Extract<CakeDuelLegalAction, { type: "pick" }> | null {
  return (actions.find((action) => action.type === "pick") as Extract<
    CakeDuelLegalAction,
    { type: "pick" }
  > | undefined) ?? null;
}

export function deriveCakeDuelHudPresentation(state: CakeDuelHudState): CakeDuelHudPresentation {
  const activeClaim = state.blockingClaim ?? state.attackingClaim ?? null;
  const playerIsAttacker = state.attackerIndex === 0;
  const activeClaimByPlayer = activeClaim
    ? activeClaim === state.blockingClaim
      ? !playerIsAttacker
      : playerIsAttacker
    : false;

  return {
    turnTranslationKey: `cakeduel.game.turn_${state.isMyTurn ? "you" : "nori"}_${state.phase}`,
    playerWins: state.boutWinners.filter((winner) => winner === 0).length,
    noriWins: state.boutWinners.filter((winner) => winner === 1).length,
    activeClaim,
    activeClaimByPlayer,
  };
}

/** Mirrors the shipped action-panel precedence, including tutorial gating. */
export function deriveCakeDuelActionPanelMode(input: CakeDuelActionPanelInput): CakeDuelActionPanelMode {
  if (input.gameEnded || !input.isMyTurn || input.tutorialGate.kind === "wait") return "hidden";

  const claim = findCakeDuelClaimAction(input.legalActions);
  const pick = findCakeDuelPickAction(input.legalActions);
  const canPass = input.legalActions.some((action) => action.type === "pass");
  const canChallenge = input.legalActions.some((action) => action.type === "challenge");
  const claimWithoutChallenge = claim !== null && !canChallenge;

  if (
    input.tutorialGate.kind === "challenge" ||
    (input.tutorialGate.kind === "pass" && !claimWithoutChallenge)
  ) {
    return "response";
  }
  if (pick) return "pick";
  if (claim && canChallenge) return "block_response";
  if (claim) {
    if (input.selectedCount === 0) return canPass ? "attack_pass" : "hidden";
    return "claim";
  }
  return canChallenge || canPass ? "response" : "hidden";
}

export function deriveCakeDuelPileLayout(attackerIndex: number): CakeDuelPileLayout {
  const playerIsAttacker = attackerIndex === 0;
  return {
    opponentPile: playerIsAttacker ? "block" : "attack",
    playerPile: playerIsAttacker ? "attack" : "block",
    opponentSide: true,
  };
}

/** Maps selected entity ids back to current player-hand indices in shipped order. */
export function mapCakeDuelSelectedEntityIdsToHandIndices(
  selectedEntityIds: ReadonlySet<number>,
  hand: readonly CakeDuelEntityCard[],
): number[] {
  const indices: number[] = [];
  hand.forEach((card, index) => {
    if (selectedEntityIds.has(card.entityId)) indices.push(index);
  });
  return indices;
}

export function resolveCakeDuelDefaultClaim(
  claimFrom: readonly CakeDuelClaimName[],
  selectedHandIndices: readonly number[],
  handNames: readonly CakeDuelClaimName[],
): CakeDuelClaimName {
  if (claimFrom.length === 0) return "";
  const selectedNames = selectedHandIndices
    .map((index) => handNames[index])
    .filter((name): name is CakeDuelClaimName => name !== undefined);
  return claimFrom.find((claim) => selectedNames.every((name) => name === claim)) ?? claimFrom[0];
}

export function isCakeDuelTutorialClaimSelectionReady(
  gate: CakeDuelTutorialGate,
  selectedHandIndices: readonly number[],
  hand: readonly CakeDuelEntityCard[],
): boolean {
  if (gate.kind !== "claim") return true;
  if (selectedHandIndices.length !== gate.requiredEntityIds.size) return false;
  return selectedHandIndices.every((index) => {
    const card = hand[index];
    return card !== undefined && gate.requiredEntityIds.has(card.entityId);
  });
}

/** Shipped cake rail shows at most seven tokens, with Nori's stack occupying the top first. */
export function deriveCakeDuelCakeTokenLayout(
  playerCakes: number,
  noriCakes: number,
): CakeDuelCakeTokenLayout {
  const visibleNori = Math.min(Math.max(0, noriCakes), CAKEDUEL_MAX_VISIBLE_CAKE_TOKENS);
  const visiblePlayer = Math.min(
    Math.max(0, playerCakes),
    CAKEDUEL_MAX_VISIBLE_CAKE_TOKENS - visibleNori,
  );
  return {
    noriTokenIds: Array.from({ length: visibleNori }, (_, index) => index),
    playerTokenIds: Array.from({ length: visiblePlayer }, (_, index) => noriCakes + index),
  };
}
