import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { WindowScreenComponentProps } from "../state/window-types";
import type { CakeDuelBannerMessage } from "../screens/cakeduel-banner";
import { CakeDuelCardPreviewProvider } from "../screens/cakeduel-card-preview";
import { CakeDuelHelpOverlay } from "../screens/cakeduel-help-overlay";
import { CakeDuelResultsScreen } from "../screens/cakeduel-results-screen";
import { CakeDuelScreen } from "../screens/cakeduel-screen";
import { CakeDuelStartScreen } from "../screens/cakeduel-start-screen";
import type { CakeDuelTranslate } from "../screens/cakeduel-hud";
import type { CakeDuelDifficulty, CakeDuelTransientBanner } from "./cakeduel-runtime";
import { CakeDuelRuntimeController } from "./cakeduel-runtime";

export interface CakeDuelPresentationAssets {
  backgroundImage: string;
  cardBackImage: string;
  cakeImage: string;
  resolveCardFront(name: string, highResolution?: boolean): string;
  resolveCardIcon?(name: string): string;
  resolveClaimColor?(claim: string): string;
  wolfyFrames?: readonly [string, string, string, string];
}

export interface CakeDuelPresentationRuntime {
  controller: CakeDuelRuntimeController;
  translate: CakeDuelTranslate;
  assets: CakeDuelPresentationAssets;
}

function useCakeDuelController(runtime: CakeDuelPresentationRuntime) {
  return useSyncExternalStore(
    runtime.controller.subscribe,
    runtime.controller.snapshot,
    runtime.controller.snapshot,
  );
}

function useMountedCakeDuel(runtime: CakeDuelPresentationRuntime) {
  const snapshot = useCakeDuelController(runtime);
  useEffect(() => runtime.controller.ensureMounted(), [runtime.controller]);
  return snapshot;
}

function cakeDuelPlayerLabel(player: 0 | 1, translate: CakeDuelTranslate): string {
  return translate(player === 0 ? "cakeduel.game.you" : "cakeduel.game.nori");
}

function presentCakeDuelBanner(
  banner: CakeDuelTransientBanner | null,
  translate: CakeDuelTranslate,
): CakeDuelBannerMessage | null {
  if (!banner || banner.type !== "bout_end") return banner;
  const values: Record<string, string | number> = {};
  for (const [key, player] of Object.entries(banner.reasonPlayers ?? {})) {
    values[key] = cakeDuelPlayerLabel(player, translate);
  }
  return {
    type: "bout_end",
    victory: banner.victory,
    reason: translate(banner.reasonKey, values),
  };
}

/** Binds source-owned start/game/results routes to the recovered cartridge controller. */
export function createCakeDuelProductionWindowBinding(
  runtime: CakeDuelPresentationRuntime,
): ProductionWindowBinding {
  const icon = runtime.assets.resolveCardIcon ?? ((name: string) => runtime.assets.resolveCardFront(name, false));

  function StartRoute({ navigate }: WindowScreenComponentProps) {
    const snapshot = useMountedCakeDuel(runtime);
    const [difficulty, setDifficulty] = useState<CakeDuelDifficulty>(snapshot.state.settings.difficulty);
    const initialized = useRef(false);
    const [helpOpen, setHelpOpen] = useState(false);

    useEffect(() => {
      if (initialized.current || !snapshot.mounted) return;
      initialized.current = true;
      setDifficulty(snapshot.state.settings.difficulty);
    }, [snapshot.mounted, snapshot.state.settings.difficulty]);

    useEffect(() => {
      if (snapshot.route === "game") navigate("game");
    }, [navigate, snapshot.route]);

    return (
      <>
        <CakeDuelStartScreen
          difficulty={difficulty}
          mounted={snapshot.mounted}
          pending={snapshot.actionPending || snapshot.mountPending}
          backgroundImage={runtime.assets.backgroundImage}
          translate={runtime.translate}
          resolveCardIcon={icon}
          onDifficultyChange={setDifficulty}
          onStart={() => runtime.controller.startNormal(difficulty)}
          onTutorial={() => runtime.controller.startTutorial()}
          onHelp={() => setHelpOpen(true)}
        />
        <CakeDuelHelpOverlay
          open={helpOpen}
          translate={runtime.translate}
          resolveCardIcon={icon}
          onClose={() => setHelpOpen(false)}
        />
      </>
    );
  }

  function GameRoute({ navigate }: WindowScreenComponentProps) {
    const snapshot = useMountedCakeDuel(runtime);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
    const [handOrder, setHandOrder] = useState<number[]>([]);
    const [selectedClaim, setSelectedClaim] = useState("");
    const [selectedPickIndex, setSelectedPickIndex] = useState<number | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);
    const tutorialResetIssued = useRef(false);

    useEffect(() => {
      if (snapshot.route === "start") {
        navigate("start");
        return;
      }
      if (snapshot.route !== "results") return;
      if (snapshot.state.tutorial) {
        if (!tutorialResetIssued.current && !snapshot.actionPending) {
          tutorialResetIssued.current = true;
          runtime.controller.reset();
        }
        return;
      }
      navigate("results");
    }, [navigate, snapshot.actionPending, snapshot.route, snapshot.state.tutorial]);

    const board = snapshot.board;
    useEffect(() => {
      if (!board) return;
      const validIds = new Set(board.zones.playerHand.map((card) => card.entityId));
      setSelectedIds((current) => {
        const next = new Set([...current].filter((id) => validIds.has(id)));
        return next.size === current.size ? current : next;
      });
      setHandOrder((current) => {
        const retained = current.filter((id) => validIds.has(id));
        const retainedSet = new Set(retained);
        const appended = board.zones.playerHand.map((card) => card.entityId).filter((id) => !retainedSet.has(id));
        return [...retained, ...appended];
      });
    }, [board]);

    const toggleHandEntity = useCallback((entityId: number) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(entityId)) next.delete(entityId);
        else next.add(entityId);
        return next;
      });
    }, []);

    if (!snapshot.mounted || !board) {
      return (
        <CakeDuelScreen
          stage={snapshot.mounted ? "empty" : "loading"}
          backgroundImage={runtime.assets.backgroundImage}
          translate={runtime.translate}
          actionError={snapshot.error}
          onBackToStart={() => navigate("start")}
        />
      );
    }

    return (
      <CakeDuelCardPreviewProvider>
        <CakeDuelScreen
          stage="game"
          backgroundImage={runtime.assets.backgroundImage}
          translate={runtime.translate}
          banner={presentCakeDuelBanner(snapshot.banner, runtime.translate)}
          wolfyTaunt={snapshot.wolfyTauntActive && runtime.assets.wolfyFrames
            ? { frameImages: runtime.assets.wolfyFrames }
            : null}
          actionError={snapshot.error}
          gameBoard={{
            view: board.view,
            zones: {
              ...board.zones,
              playerHand: board.zones.playerHand.map((card) => ({
                ...card,
                name: card.name ?? "",
              })),
            },
            isMyTurn: board.isMyTurn,
            legalActions: board.legalActions,
            selectedHandEntityIds: selectedIds,
            handOrderEntityIds: handOrder,
            selectedClaim,
            selectedPickIndex,
            actionPending: snapshot.actionPending,
            lastAttackPassed: board.lastAttackPassed,
            translate: runtime.translate,
            cardBackImage: runtime.assets.cardBackImage,
            cakeImage: runtime.assets.cakeImage,
            resolveCardFront: runtime.assets.resolveCardFront,
            resolveClaimColor: runtime.assets.resolveClaimColor,
            onHelp: () => setHelpOpen(true),
            onToggleHandEntity: toggleHandEntity,
            onReorderHandEntityIds: (entityIds) => setHandOrder([...entityIds]),
            onSelectClaim: setSelectedClaim,
            onSelectPickIndex: setSelectedPickIndex,
            onAction: (action) => runtime.controller.play(action),
          }}
        />
        <CakeDuelHelpOverlay
          open={helpOpen}
          translate={runtime.translate}
          resolveCardIcon={icon}
          onClose={() => setHelpOpen(false)}
        />
      </CakeDuelCardPreviewProvider>
    );
  }

  function ResultsRoute({ navigate }: WindowScreenComponentProps) {
    const snapshot = useMountedCakeDuel(runtime);
    const resetIssued = useRef(false);

    useEffect(() => {
      if (snapshot.route === "game") navigate("game");
      if (resetIssued.current && snapshot.route === "start") navigate("start");
    }, [navigate, snapshot.route]);

    return (
      <CakeDuelResultsScreen
        winner={snapshot.winner}
        playerWins={snapshot.playerWins}
        noriWins={snapshot.noriWins}
        roundsToWin={snapshot.state.settings.roundsToWin}
        pending={snapshot.actionPending}
        backgroundImage={runtime.assets.backgroundImage}
        translate={runtime.translate}
        onPlayAgain={() => {
          if (resetIssued.current) return;
          resetIssued.current = true;
          runtime.controller.reset();
        }}
      />
    );
  }

  return {
    screens: {
      start: { component: StartRoute, transition: "fade" },
      game: { component: GameRoute, transition: "slide-left" },
      results: { component: ResultsRoute, transition: "slide-up" },
    },
  };
}
