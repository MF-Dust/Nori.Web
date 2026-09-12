import type { ArcadeClient } from "../runtime/arcade-client";
import type { ArcadeServerMessage, JsonValue } from "../runtime/protocol";
import type { WorldStore } from "../runtime/world-store";
import type { GameService } from "../services/games";
import type {
  CakeDuelClaimPresentation,
  CakeDuelLegalAction,
} from "./cakeduel-game-presentation";

export type CakeDuelRoute = "start" | "game" | "results";
export type CakeDuelDifficulty = "soldier" | "wizard" | "assassin";

export type CakeDuelPlayerCommandAction =
  | { type: "claim"; handIndices: number[]; claim: string }
  | { type: "pick"; pickIndices: number[] }
  | { type: "pass" }
  | { type: "challenge" }
  | { type: "concede" };

export interface CakeDuelRuntimeClaim {
  claim: string;
  cardIds: number[];
}

export interface CakeDuelRuntimePlayer {
  hand: number[];
  handLimit: number;
  claimBlacklist: string[];
  cakes: number;
  lastAttackingClaim: string | null;
}

export interface CakeDuelRuntimeGame {
  frame: number;
  phase: string;
  lastAttackPassed: boolean;
  gameEnded: { winner: number } | null;
  deck: number[];
  discard: number[];
  attackingClaim: CakeDuelRuntimeClaim | null;
  blockingClaim: CakeDuelRuntimeClaim | null;
  players: [CakeDuelRuntimePlayer, CakeDuelRuntimePlayer];
  boutWinners: number[];
  attackerIndex: number;
  cardList: string[];
  config: { roundsToWin: number };
}

export interface CakeDuelRuntimeState {
  settings: { difficulty: CakeDuelDifficulty; roundsToWin: number };
  game: CakeDuelRuntimeGame | null;
  tutorial: Record<string, JsonValue> | null;
  lastError: string | null;
}

export interface CakeDuelRuntimeZoneCard {
  entityId: number;
  name?: string;
  revealedName?: string | null;
  flipDelayMs?: number;
}

export interface CakeDuelRuntimeBoard {
  view: {
    phase: string;
    attackerIndex: number;
    boutWinners: readonly number[];
    gameEnded: boolean;
    attackingClaim: CakeDuelClaimPresentation | null;
    blockingClaim: CakeDuelClaimPresentation | null;
    me: { cakes: number };
    opponent: { cakes: number };
  };
  zones: {
    playerHand: readonly CakeDuelRuntimeZoneCard[];
    opponentHand: readonly CakeDuelRuntimeZoneCard[];
    attackPile: readonly CakeDuelRuntimeZoneCard[];
    blockPile: readonly CakeDuelRuntimeZoneCard[];
    deckTop: readonly CakeDuelRuntimeZoneCard[];
    deckCount: number;
  };
  isMyTurn: boolean;
  legalActions: readonly CakeDuelLegalAction[];
  lastAttackPassed: boolean;
}

export interface CakeDuelControllerSnapshot {
  mounted: boolean;
  mountPending: boolean;
  actionPending: boolean;
  route: CakeDuelRoute;
  state: CakeDuelRuntimeState;
  board: CakeDuelRuntimeBoard | null;
  winner: number | null;
  playerWins: number;
  noriWins: number;
  error: string | null;
}

const DEFAULT_STATE: CakeDuelRuntimeState = {
  settings: { difficulty: "soldier", roundsToWin: 3 },
  game: null,
  tutorial: null,
  lastError: null,
};

const CARD_TYPE: Readonly<Record<string, "physical" | "magical" | "blocker" | "unclaimable">> = {
  soldier: "physical",
  archer: "physical",
  wizard: "magical",
  defender: "blocker",
  scientist: "blocker",
  wolfy: "unclaimable",
};
const BLOCKS: Readonly<Record<string, "physical" | "magical">> = {
  defender: "physical",
  scientist: "magical",
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
    : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseClaim(value: unknown): CakeDuelRuntimeClaim | null {
  const source = record(value);
  if (!source || typeof source.claim !== "string") return null;
  return { claim: source.claim, cardIds: numberArray(source.cardIds) };
}

function parsePlayer(value: unknown): CakeDuelRuntimePlayer {
  const source = record(value) ?? {};
  return {
    hand: numberArray(source.hand),
    handLimit: numberValue(source.handLimit, 4),
    claimBlacklist: stringArray(source.claimBlacklist),
    cakes: numberValue(source.cakes),
    lastAttackingClaim: typeof source.lastAttackingClaim === "string" ? source.lastAttackingClaim : null,
  };
}

function parseGame(value: unknown): CakeDuelRuntimeGame | null {
  const source = record(value);
  if (!source) return null;
  const players = Array.isArray(source.players) ? source.players : [];
  const ended = record(source.gameEnded);
  const config = record(source.config) ?? {};
  return {
    frame: numberValue(source.frame),
    phase: typeof source.phase === "string" ? source.phase : "attack",
    lastAttackPassed: source.lastAttackPassed === true,
    gameEnded: ended && typeof ended.winner === "number" ? { winner: ended.winner } : null,
    deck: numberArray(source.deck),
    discard: numberArray(source.discard),
    attackingClaim: parseClaim(source.attackingClaim),
    blockingClaim: parseClaim(source.blockingClaim),
    players: [parsePlayer(players[0]), parsePlayer(players[1])],
    boutWinners: numberArray(source.boutWinners),
    attackerIndex: numberValue(source.attackerIndex),
    cardList: stringArray(source.cardList),
    config: { roundsToWin: numberValue(config.roundsToWin, 3) },
  };
}

export function parseCakeDuelRuntimeState(state: Record<string, JsonValue> | undefined): CakeDuelRuntimeState {
  if (!state) return DEFAULT_STATE;
  const settings = record(state.settings) ?? {};
  const rawDifficulty = settings.difficulty;
  const difficulty: CakeDuelDifficulty =
    rawDifficulty === "wizard" || rawDifficulty === "assassin" ? rawDifficulty : "soldier";
  const tutorial = record(state.tutorial) as Record<string, JsonValue> | null;
  return {
    settings: {
      difficulty,
      roundsToWin: numberValue(settings.roundsToWin, 3),
    },
    game: parseGame(state.game),
    tutorial,
    lastError: typeof state.lastError === "string" ? state.lastError : null,
  };
}

export function deriveCakeDuelRoute(state: CakeDuelRuntimeState): CakeDuelRoute {
  if (!state.game) return "start";
  return state.game.gameEnded ? "results" : "game";
}

function phasingPlayer(game: CakeDuelRuntimeGame): number | null {
  if (game.phase === "attack") return game.attackerIndex;
  if (game.phase === "block") return 1 - game.attackerIndex;
  if (game.phase === "review") return game.attackerIndex;
  return null;
}

function claimOptions(game: CakeDuelRuntimeGame): string[] {
  if (game.phase === "attack") {
    const player = game.players[game.attackerIndex] ?? game.players[0];
    return [...new Set(game.cardList)].filter((name) => {
      const type = CARD_TYPE[name];
      return (type === "physical" || type === "magical") && !player.claimBlacklist.includes(name);
    });
  }
  if (game.phase === "block" && game.attackingClaim) {
    const attackType = CARD_TYPE[game.attackingClaim.claim];
    const player = game.players[1 - game.attackerIndex] ?? game.players[0];
    return Object.entries(BLOCKS)
      .filter(([, blocked]) => blocked === attackType)
      .map(([name]) => name)
      .filter((name) => !player.claimBlacklist.includes(name));
  }
  return [];
}

export function deriveCakeDuelPlayerLegalActions(game: CakeDuelRuntimeGame): CakeDuelLegalAction[] {
  if (game.gameEnded || phasingPlayer(game) !== 0) return [];
  const hand = game.players[0].hand;
  const claims = claimOptions(game);
  const actions: CakeDuelLegalAction[] = [];
  if ((game.phase === "attack" || game.phase === "block") && hand.length > 0 && claims.length > 0) {
    actions.push({ type: "claim", claimFrom: claims });
  }
  if (game.phase === "attack") actions.push({ type: "pass" }, { type: "concede" });
  if (game.phase === "block" || game.phase === "review") {
    actions.push({ type: "pass" }, { type: "challenge" }, { type: "concede" });
  }
  return actions;
}

function cardName(game: CakeDuelRuntimeGame, entityId: number): string | undefined {
  return game.cardList[entityId];
}

function claimPresentation(claim: CakeDuelRuntimeClaim | null): CakeDuelClaimPresentation | null {
  return claim ? { claim: claim.claim, cardCount: claim.cardIds.length } : null;
}

export function deriveCakeDuelRuntimeBoard(state: CakeDuelRuntimeState): CakeDuelRuntimeBoard | null {
  const game = state.game;
  if (!game) return null;
  const player = game.players[0];
  const opponent = game.players[1];
  const toHiddenPile = (claim: CakeDuelRuntimeClaim | null): CakeDuelRuntimeZoneCard[] =>
    claim?.cardIds.map((entityId) => ({ entityId })) ?? [];
  return {
    view: {
      phase: game.phase,
      attackerIndex: game.attackerIndex,
      boutWinners: game.boutWinners,
      gameEnded: game.gameEnded !== null,
      attackingClaim: claimPresentation(game.attackingClaim),
      blockingClaim: claimPresentation(game.blockingClaim),
      me: { cakes: player.cakes },
      opponent: { cakes: opponent.cakes },
    },
    zones: {
      playerHand: player.hand.map((entityId) => ({ entityId, name: cardName(game, entityId) ?? "" })),
      opponentHand: opponent.hand.map((entityId) => ({ entityId })),
      attackPile: toHiddenPile(game.attackingClaim),
      blockPile: toHiddenPile(game.blockingClaim),
      deckTop: game.deck.slice(0, 4).map((entityId) => ({ entityId })),
      deckCount: game.deck.length,
    },
    isMyTurn: phasingPlayer(game) === 0,
    legalActions: deriveCakeDuelPlayerLegalActions(game),
    lastAttackPassed: game.lastAttackPassed,
  };
}

export class CakeDuelRuntimeController {
  private readonly listeners = new Set<() => void>();
  private readonly unsubs: Array<() => void> = [];
  private pendingRequestId: string | null = null;
  private mountPending = false;
  private error: string | null = null;
  private current: CakeDuelControllerSnapshot;

  constructor(
    private readonly games: GameService,
    private readonly world: WorldStore,
    arcade: ArcadeClient,
  ) {
    this.current = this.computeSnapshot();
    this.unsubs.push(world.subscribe(() => {
      if (world.runtime("cakeduel")) this.mountPending = false;
      this.publish();
    }));
    this.unsubs.push(arcade.onMessage((message) => this.onArcadeMessage(message)));
  }

  snapshot = (): CakeDuelControllerSnapshot => this.current;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  ensureMounted(): void {
    if (this.world.runtime("cakeduel") || this.mountPending) return;
    try {
      this.mountPending = true;
      this.error = null;
      this.games.mount("cakeduel");
      this.publish();
    } catch (error) {
      this.mountPending = false;
      this.error = error instanceof Error ? error.message : String(error);
      this.publish();
    }
  }

  startNormal(difficulty: CakeDuelDifficulty): void {
    this.dispatch({ type: "startGame", mode: "normal", difficulty });
  }

  startTutorial(): void {
    this.dispatch({ type: "startGame", mode: "tutorial" });
  }

  reset(): void {
    this.dispatch({ type: "reset" });
  }

  play(action: CakeDuelPlayerCommandAction): void {
    this.dispatch({ type: "play", action: action as unknown as JsonValue });
  }

  clearError(): void {
    if (!this.error) return;
    this.error = null;
    this.publish();
  }

  dispose(): void {
    for (const unsubscribe of this.unsubs.splice(0)) unsubscribe();
    this.listeners.clear();
  }

  private dispatch(cmd: { type: string; [key: string]: JsonValue }): void {
    if (this.pendingRequestId) return;
    try {
      this.error = null;
      this.pendingRequestId = this.games.dispatch("cakeduel", cmd);
      this.publish();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.publish();
    }
  }

  private onArcadeMessage(message: ArcadeServerMessage): void {
    const raw = message as unknown as Record<string, unknown>;
    if (raw.type !== "dispatch_ack" || raw.cartridgeId !== "cakeduel") return;
    if (typeof raw.requestId !== "string" || raw.requestId !== this.pendingRequestId) return;
    this.pendingRequestId = null;
    if (raw.success !== true) {
      this.error = typeof raw.error === "string" ? raw.error : "Cake Duel action failed";
    }
    this.publish();
  }

  private publish(): void {
    this.current = this.computeSnapshot();
    for (const listener of this.listeners) listener();
  }

  private computeSnapshot(): CakeDuelControllerSnapshot {
    const runtime = this.world.runtime("cakeduel");
    const state = parseCakeDuelRuntimeState(runtime?.state);
    const game = state.game;
    return {
      mounted: runtime !== undefined,
      mountPending: this.mountPending,
      actionPending: this.pendingRequestId !== null,
      route: deriveCakeDuelRoute(state),
      state,
      board: deriveCakeDuelRuntimeBoard(state),
      winner: game?.gameEnded?.winner ?? null,
      playerWins: game?.boutWinners.filter((winner) => winner === 0).length ?? 0,
      noriWins: game?.boutWinners.filter((winner) => winner === 1).length ?? 0,
      error: this.error ?? state.lastError,
    };
  }
}
