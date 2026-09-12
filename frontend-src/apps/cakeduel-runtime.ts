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
export type CakeDuelChallengeRevealStage = "idle" | "pause" | "revealed";

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

export type CakeDuelTransientBanner =
  | { type: "claim"; actualCards: readonly string[]; claim: string; isPlayer: boolean }
  | { type: "accepted" }
  | { type: "challenge" }
  | { type: "bout_start"; boutNumber: number }
  | {
      type: "bout_end";
      victory: boolean;
      reasonKey: string;
      reasonPlayers?: Readonly<Record<string, 0 | 1>>;
    };

export interface CakeDuelControllerSnapshot {
  mounted: boolean;
  mountPending: boolean;
  actionPending: boolean;
  route: CakeDuelRoute;
  state: CakeDuelRuntimeState;
  board: CakeDuelRuntimeBoard | null;
  banner: CakeDuelTransientBanner | null;
  challengeRevealStage: CakeDuelChallengeRevealStage;
  wolfyTauntActive: boolean;
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

// Shipped NormalApp controller timing contract.
export const CAKE_DUEL_CHALLENGE_FLIP_STAGGER_MS = 400;
export const CAKE_DUEL_CHALLENGE_PRE_REVEAL_PAUSE_MS = 1_000;
export const CAKE_DUEL_CHALLENGE_REVEAL_HOLD_MS = 3_000;
export const CAKE_DUEL_BANNER_HOLD_MS = 2_000;
const CAKE_DUEL_WOLFY_TAUNT_MS = 1_100;

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

function engineEvents(message: ArcadeServerMessage): Record<string, unknown>[] {
  const raw = message as unknown as Record<string, unknown>;
  if (raw.type !== "runtime_transition" || raw.cartridgeId !== "cakeduel") return [];
  const transition = record(raw.transition);
  if (!transition || !Array.isArray(transition.events)) return [];
  const events: Record<string, unknown>[] = [];
  for (const value of transition.events) {
    const envelope = record(value);
    if (!envelope) continue;
    const event = envelope.type === "engine" ? record(envelope.event) : envelope;
    if (event && typeof event.type === "string") events.push(event);
  }
  return events;
}

function boutEndReason(
  events: readonly Record<string, unknown>[],
  winner: 0 | 1,
): Pick<Extract<CakeDuelTransientBanner, { type: "bout_end" }>, "reasonKey" | "reasonPlayers"> {
  const challenge = events.find((event) => event.type === "challenge_made");
  if (challenge) {
    const challenger = challenge.challenger === 1 ? 1 : 0;
    if (challenge.success === true) {
      return {
        reasonKey: "cakeduel.banner.reason.caughtBluffing",
        reasonPlayers: { catcher: challenger, bluffer: challenger === 0 ? 1 : 0 },
      };
    }
    return {
      reasonKey: "cakeduel.banner.reason.wonChallenge",
      reasonPlayers: { winner: challenger === 0 ? 1 : 0 },
    };
  }
  const depletedByTransfer = events.some((event) => {
    if (event.type !== "cakes_transferred" || !Array.isArray(event.cakesAfter)) return false;
    return event.cakesAfter[0] === 0 || event.cakesAfter[1] === 0;
  });
  if (depletedByTransfer) {
    return {
      reasonKey: "cakeduel.banner.reason.stoleCakes",
      reasonPlayers: { who: winner },
    };
  }
  if (events.some((event) => event.type === "pass_made")) {
    return { reasonKey: "cakeduel.banner.reason.bothPassed" };
  }
  return { reasonKey: "cakeduel.banner.reason.mostCakes" };
}

export class CakeDuelRuntimeController {
  private readonly listeners = new Set<() => void>();
  private readonly unsubs: Array<() => void> = [];
  private pendingRequestId: string | null = null;
  private mountPending = false;
  private error: string | null = null;
  private banner: CakeDuelTransientBanner | null = null;
  private readonly bannerQueue: CakeDuelTransientBanner[] = [];
  private bannerTimer: ReturnType<typeof setTimeout> | null = null;
  private challengeRevealStage: CakeDuelChallengeRevealStage = "idle";
  private readonly pendingChallengeBanners: CakeDuelTransientBanner[] = [];
  private challengeTimer: ReturnType<typeof setTimeout> | null = null;
  private wolfyTauntActive = false;
  private wolfyTimer: ReturnType<typeof setTimeout> | null = null;
  private current: CakeDuelControllerSnapshot;

  constructor(
    private readonly games: GameService,
    private readonly world: WorldStore,
    arcade: ArcadeClient,
  ) {
    this.current = this.computeSnapshot();
    this.unsubs.push(world.subscribe((_state, message) => {
      if (world.runtime("cakeduel")) this.mountPending = false;
      const events = engineEvents(message);
      if (events.length > 0) {
        const previousState = this.current.state;
        const nextState = parseCakeDuelRuntimeState(world.runtime("cakeduel")?.state);
        this.consumeTransientEvents(events, previousState, nextState);
      }
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
    this.clearTransientPresentation();
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
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    if (this.challengeTimer) clearTimeout(this.challengeTimer);
    if (this.wolfyTimer) clearTimeout(this.wolfyTimer);
    this.bannerTimer = null;
    this.challengeTimer = null;
    this.wolfyTimer = null;
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

  private consumeTransientEvents(
    events: readonly Record<string, unknown>[],
    previousState: CakeDuelRuntimeState,
    nextState: CakeDuelRuntimeState,
  ): void {
    if (events.some((event) => event.type === "game_started")) this.clearTransientPresentation();
    const challengePresent = events.some((event) => event.type === "challenge_made");

    for (const event of events) {
      if (event.type === "challenge_made") {
        this.enqueueBanner({ type: "challenge" });
        continue;
      }
      if (event.type === "claim_made" && !challengePresent && typeof event.claim === "string") {
        const cardIds = numberArray(event.cardIds);
        const isPlayer = event.player === 0;
        const cardList = previousState.game?.cardList ?? [];
        this.enqueueBanner({
          type: "claim",
          claim: event.claim,
          actualCards: isPlayer
            ? cardIds.map((entityId) => cardList[entityId] ?? event.claim as string)
            : cardIds.map(() => event.claim as string),
          isPlayer,
        });
        continue;
      }
      if (event.type === "pass_made" && !challengePresent) {
        this.enqueueBanner({ type: "accepted" });
        continue;
      }
      if (event.type === "wolfy_taunt") {
        this.showWolfyTaunt();
        continue;
      }
      if (event.type === "bout_started") {
        const completedBouts = nextState.game?.boutWinners.length ?? 0;
        const banner: CakeDuelTransientBanner = {
          type: "bout_start",
          boutNumber: completedBouts > 0 ? completedBouts + 1 : 1,
        };
        if (challengePresent) this.pendingChallengeBanners.push(banner);
        else this.enqueueBanner(banner);
        continue;
      }
      if (event.type === "bout_ended") {
        const winner = event.winner === 1 ? 1 : 0;
        const banner: CakeDuelTransientBanner = {
          type: "bout_end",
          victory: winner === 0,
          ...boutEndReason(events, winner),
        };
        if (challengePresent) this.pendingChallengeBanners.push(banner);
        else this.enqueueBanner(banner);
      }
    }
  }

  private enqueueBanner(message: CakeDuelTransientBanner): void {
    this.bannerQueue.push(message);
    this.advanceBannerQueue();
  }

  private advanceBannerQueue(): void {
    if (this.banner || this.bannerTimer || this.challengeRevealStage !== "idle") return;
    const next = this.bannerQueue.shift();
    if (!next) return;
    this.banner = next;
    this.bannerTimer = setTimeout(() => {
      this.banner = null;
      this.bannerTimer = null;
      if (next.type === "challenge") this.beginChallengeRevealTimeline();
      else this.advanceBannerQueue();
      this.publish();
    }, CAKE_DUEL_BANNER_HOLD_MS);
  }

  private beginChallengeRevealTimeline(): void {
    if (this.challengeTimer) clearTimeout(this.challengeTimer);
    this.challengeRevealStage = "pause";
    this.challengeTimer = setTimeout(() => {
      this.challengeTimer = null;
      this.challengeRevealStage = "revealed";
      this.publish();
      this.challengeTimer = setTimeout(() => {
        this.challengeTimer = null;
        this.challengeRevealStage = "idle";
        if (this.pendingChallengeBanners.length > 0) {
          this.bannerQueue.unshift(...this.pendingChallengeBanners.splice(0));
        }
        this.advanceBannerQueue();
        this.publish();
      }, CAKE_DUEL_CHALLENGE_REVEAL_HOLD_MS);
    }, CAKE_DUEL_CHALLENGE_PRE_REVEAL_PAUSE_MS);
  }

  private showWolfyTaunt(): void {
    this.wolfyTauntActive = true;
    if (this.wolfyTimer) clearTimeout(this.wolfyTimer);
    this.wolfyTimer = setTimeout(() => {
      this.wolfyTauntActive = false;
      this.wolfyTimer = null;
      this.publish();
    }, CAKE_DUEL_WOLFY_TAUNT_MS);
  }

  private clearTransientPresentation(): void {
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    if (this.challengeTimer) clearTimeout(this.challengeTimer);
    if (this.wolfyTimer) clearTimeout(this.wolfyTimer);
    this.bannerTimer = null;
    this.challengeTimer = null;
    this.wolfyTimer = null;
    this.banner = null;
    this.bannerQueue.length = 0;
    this.challengeRevealStage = "idle";
    this.pendingChallengeBanners.length = 0;
    this.wolfyTauntActive = false;
  }

  private publish(): void {
    this.current = this.computeSnapshot();
    for (const listener of this.listeners) listener();
  }

  private computeSnapshot(): CakeDuelControllerSnapshot {
    const runtime = this.world.runtime("cakeduel");
    const state = parseCakeDuelRuntimeState(runtime?.state);
    const game = state.game;
    const derivedRoute = deriveCakeDuelRoute(state);
    const transientRouteHold = this.banner !== null
      || this.bannerQueue.length > 0
      || this.challengeRevealStage !== "idle"
      || this.pendingChallengeBanners.length > 0;
    const route = derivedRoute === "results" && transientRouteHold ? "game" : derivedRoute;
    return {
      mounted: runtime !== undefined,
      mountPending: this.mountPending,
      actionPending: this.pendingRequestId !== null,
      route,
      state,
      board: deriveCakeDuelRuntimeBoard(state),
      banner: this.banner,
      challengeRevealStage: this.challengeRevealStage,
      wolfyTauntActive: this.wolfyTauntActive,
      winner: game?.gameEnded?.winner ?? null,
      playerWins: game?.boutWinners.filter((winner) => winner === 0).length ?? 0,
      noriWins: game?.boutWinners.filter((winner) => winner === 1).length ?? 0,
      error: this.error ?? state.lastError,
    };
  }
}
