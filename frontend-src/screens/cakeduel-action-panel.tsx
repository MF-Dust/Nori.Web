import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CircleAlert, Hand, ShieldOff, Swords, Triangle } from "lucide-react";
import {
  CAKEDUEL_ATTACK_PASS_CONFIRM_MS,
  deriveCakeDuelActionPanelMode,
  findCakeDuelClaimAction,
  findCakeDuelPickAction,
  type CakeDuelLegalAction,
  type CakeDuelTutorialGate,
} from "../apps/cakeduel-game-presentation";
import type { CakeDuelTranslate } from "./cakeduel-hud";
import { useCakeDuelLayout } from "./cakeduel-layout-context";

export type CakeDuelPlayerAction =
  | { type: "claim"; handIndices: number[]; claim: string }
  | { type: "pick"; pickIndices: number[] }
  | { type: "pass" }
  | { type: "challenge" };

export interface CakeDuelActionPanelProps {
  gameEnded: boolean;
  isMyTurn: boolean;
  legalActions: readonly CakeDuelLegalAction[];
  selectedHandIndices: readonly number[];
  selectedClaim: string;
  selectedPickIndex: number | null;
  actionPending?: boolean;
  tutorialGate?: CakeDuelTutorialGate;
  tutorialSelectionReady?: boolean;
  lastAttackPassed?: boolean;
  translate: CakeDuelTranslate;
  resolveClaimColor?: (claim: string) => string;
  onSelectClaim: (claim: string) => void;
  onSelectPickIndex: (index: number) => void;
  onAction: (action: CakeDuelPlayerAction) => void;
}

function lightenHex(color: string, amount: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgb(${Math.round(red + (255 - red) * amount)},${Math.round(
    green + (255 - green) * amount,
  )},${Math.round(blue + (255 - blue) * amount)})`;
}

function actionButtonStyle(variant: "primary" | "danger" | "muted", cardColor?: string): CSSProperties {
  if (variant === "primary") {
    const color = cardColor ?? "#FECE08";
    return {
      background: `linear-gradient(to bottom, ${color}, ${color}cc)`,
      color: "#1c1917",
      border: `1px solid ${color}88`,
      boxShadow: `0 4px 14px ${color}30, inset 0 1px 0 rgba(255,255,255,0.3)`,
    };
  }
  if (variant === "danger") {
    const color = "#F49187";
    return {
      background: `linear-gradient(to bottom, ${color}, ${color}cc)`,
      color: "#1c1917",
      border: `1px solid ${color}88`,
      boxShadow: `0 4px 14px ${color}30, inset 0 1px 0 rgba(255,255,255,0.3)`,
    };
  }
  return {
    background: "rgba(255,255,255,0.45)",
    color: "#44403c",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
  };
}

function CakeDuelActionButton({
  variant,
  cardColor,
  icon,
  label,
  sublabel,
  disabled,
  pulse = false,
  onClick,
  className = "",
}: {
  variant: "primary" | "danger" | "muted";
  cardColor?: string;
  icon?: ReactNode;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  pulse?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={disabled ? undefined : actionButtonStyle(variant, cardColor)}
      data-cakeduel-action-button={variant}
      data-pulse={pulse ? "true" : "false"}
    >
      {icon}
      <span className="flex flex-col items-start">
        <span className="whitespace-nowrap">{label}</span>
        {sublabel ? <span className="text-[9px] opacity-60 font-normal whitespace-nowrap">{sublabel}</span> : null}
      </span>
    </button>
  );
}

function ClaimPill({
  claim,
  selected,
  disabled,
  color,
  label,
  onClick,
}: {
  claim: string;
  selected: boolean;
  disabled: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="px-3 py-1 text-xs font-bold rounded-full transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      style={
        selected
          ? {
              background: color,
              color: "#1c1917",
              boxShadow: `0 2px 10px ${color}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
              border: `1.5px solid ${color}`,
            }
          : { background: lightenHex(color, 0.6), color: "#78716c", border: `1.5px solid ${color}` }
      }
      data-cakeduel-claim-pill={claim}
    >
      {label}
    </button>
  );
}

function ClaimControls({
  claimFrom,
  selectedClaim,
  selectedHandIndices,
  actionPending,
  tutorialGate,
  tutorialSelectionReady,
  translate,
  resolveClaimColor,
  onSelectClaim,
  onSubmit,
}: {
  claimFrom: readonly string[];
  selectedClaim: string;
  selectedHandIndices: readonly number[];
  actionPending: boolean;
  tutorialGate: CakeDuelTutorialGate;
  tutorialSelectionReady: boolean;
  translate: CakeDuelTranslate;
  resolveClaimColor: (claim: string) => string;
  onSelectClaim: (claim: string) => void;
  onSubmit: () => void;
}) {
  const tutorialClaim = tutorialGate.kind === "claim" ? tutorialGate.claim : null;
  const ready = selectedClaim !== "" && selectedHandIndices.length > 0 && tutorialSelectionReady;
  return (
    <>
      {claimFrom.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-stone-500/70 mr-1">
            {translate("cakeduel.game.action.claimAs")}
          </span>
          {claimFrom.map((claim) => (
            <ClaimPill
              key={claim}
              claim={claim}
              selected={selectedClaim === claim}
              disabled={actionPending || (tutorialClaim !== null && claim !== tutorialClaim)}
              color={resolveClaimColor(claim)}
              label={translate(`cakeduel.cards.${claim}`)}
              onClick={() => onSelectClaim(claim)}
            />
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-center">
        <CakeDuelActionButton
          variant="primary"
          cardColor={selectedClaim ? resolveClaimColor(selectedClaim) : undefined}
          icon={<Swords className="h-4 w-4" />}
          label={
            ready
              ? translate("cakeduel.game.action.playCards", {
                  count: selectedHandIndices.length,
                  card: translate(`cakeduel.cards.${selectedClaim}`),
                })
              : translate("cakeduel.game.action.submitClaim")
          }
          disabled={actionPending || !ready}
          pulse={tutorialClaim !== null && ready}
          onClick={onSubmit}
          className="max-w-[280px]"
        />
      </div>
    </>
  );
}

/** Source-owned Cake Duel claim/pick/pass/challenge action dock. */
export const CakeDuelActionPanel = memo(function CakeDuelActionPanel({
  gameEnded,
  isMyTurn,
  legalActions,
  selectedHandIndices,
  selectedClaim,
  selectedPickIndex,
  actionPending = false,
  tutorialGate = { kind: "off" },
  tutorialSelectionReady = true,
  lastAttackPassed = false,
  translate,
  resolveClaimColor = () => "#FECE08",
  onSelectClaim,
  onSelectPickIndex,
  onAction,
}: CakeDuelActionPanelProps) {
  const layout = useCakeDuelLayout();
  const mode = deriveCakeDuelActionPanelMode({
    gameEnded,
    isMyTurn,
    legalActions,
    selectedCount: selectedHandIndices.length,
    tutorialGate,
  });
  const claimAction = useMemo(() => findCakeDuelClaimAction(legalActions), [legalActions]);
  const pickAction = useMemo(() => findCakeDuelPickAction(legalActions), [legalActions]);
  const canPass = legalActions.some((action) => action.type === "pass");
  const canChallenge = legalActions.some((action) => action.type === "challenge");
  const [confirmPass, setConfirmPass] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (mode !== "attack_pass") setConfirmPass(false);
  }, [mode]);

  const submitClaim = useCallback(() => {
    if (!selectedClaim) return;
    onAction({ type: "claim", handIndices: [...selectedHandIndices], claim: selectedClaim });
  }, [onAction, selectedClaim, selectedHandIndices]);

  const submitPassAttack = useCallback(() => {
    if (!confirmPass) {
      setConfirmPass(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmPass(false), CAKEDUEL_ATTACK_PASS_CONFIRM_MS);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
    setConfirmPass(false);
    onAction({ type: "pass" });
  }, [confirmPass, onAction]);

  if (mode === "hidden") return null;

  const tutorialResponse =
    tutorialGate.kind === "pass" || tutorialGate.kind === "challenge" ? tutorialGate.kind : null;
  const tutorialClaimActive = tutorialGate.kind === "claim";
  const controls = claimAction ? (
    <ClaimControls
      claimFrom={claimAction.claimFrom}
      selectedClaim={selectedClaim}
      selectedHandIndices={selectedHandIndices}
      actionPending={actionPending}
      tutorialGate={tutorialGate}
      tutorialSelectionReady={tutorialSelectionReady}
      translate={translate}
      resolveClaimColor={resolveClaimColor}
      onSelectClaim={onSelectClaim}
      onSubmit={submitClaim}
    />
  ) : null;

  return (
    <div className="flex justify-center z-20 pb-1" data-cakeduel-action-panel={mode}>
      <div
        className={`rounded-2xl backdrop-blur-md ${layout.compact ? "px-4 py-2" : "px-5 py-3"}`}
        style={{
          minWidth: 280,
          maxWidth: 600,
          background: "linear-gradient(180deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0.58) 100%)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        {mode === "claim" && controls ? <div className="flex flex-col gap-2.5">{controls}</div> : null}

        {mode === "pick" && pickAction ? (
          <div className="flex flex-col gap-2.5">
            <div className="text-center text-[10px] uppercase tracking-widest text-stone-500/70">
              {translate("cakeduel.game.action.pickHint")}
            </div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {pickAction.pickFrom.map((claim, index) => (
                <ClaimPill
                  key={`${index}:${claim}`}
                  claim={claim}
                  selected={selectedPickIndex === index}
                  disabled={actionPending}
                  color={resolveClaimColor(claim)}
                  label={translate(`cakeduel.cards.${claim}`)}
                  onClick={() => onSelectPickIndex(index)}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <CakeDuelActionButton
                variant="primary"
                cardColor={selectedPickIndex != null ? resolveClaimColor(pickAction.pickFrom[selectedPickIndex] ?? "") : undefined}
                icon={<Hand className="h-4 w-4" />}
                label={translate("cakeduel.game.action.confirmPick")}
                disabled={actionPending || selectedPickIndex == null}
                onClick={() => {
                  if (selectedPickIndex != null) onAction({ type: "pick", pickIndices: [selectedPickIndex] });
                }}
              />
            </div>
          </div>
        ) : null}

        {mode === "response" ? (
          <div className="flex flex-col gap-2">
            <div className="text-center text-[10px] uppercase tracking-widest text-stone-500/70">
              {translate("cakeduel.game.action.respondHint")}
            </div>
            <div className="flex items-center justify-center gap-2.5">
              {canPass ? (
                <CakeDuelActionButton
                  variant="muted"
                  icon={<ShieldOff className="h-4 w-4" />}
                  label={translate("cakeduel.game.action.letPass")}
                  sublabel={translate("cakeduel.game.action.letPassHint")}
                  disabled={actionPending || tutorialResponse === "challenge"}
                  pulse={tutorialResponse === "pass"}
                  onClick={() => onAction({ type: "pass" })}
                />
              ) : null}
              {canChallenge ? (
                <CakeDuelActionButton
                  variant="danger"
                  icon={<CircleAlert className="h-4 w-4" />}
                  label={translate("cakeduel.game.action.callBluff")}
                  sublabel={translate("cakeduel.game.action.callBluffHint")}
                  disabled={actionPending || tutorialResponse === "pass"}
                  pulse={tutorialResponse === "challenge"}
                  onClick={() => onAction({ type: "challenge" })}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {mode === "block_response" ? (
          <div className="flex flex-col gap-2.5">
            <div className="text-center text-[10px] uppercase tracking-widest text-stone-500/70">
              {translate("cakeduel.game.action.respondHint")}
            </div>
            <div className="flex items-center justify-center gap-2.5">
              {canPass ? (
                <CakeDuelActionButton
                  variant="muted"
                  icon={<ShieldOff className="h-4 w-4" />}
                  label={translate("cakeduel.game.action.letPass")}
                  sublabel={translate("cakeduel.game.action.letPassHint")}
                  disabled={actionPending || tutorialClaimActive}
                  onClick={() => onAction({ type: "pass" })}
                />
              ) : null}
              {canChallenge ? (
                <CakeDuelActionButton
                  variant="danger"
                  icon={<CircleAlert className="h-4 w-4" />}
                  label={translate("cakeduel.game.action.callBluff")}
                  sublabel={translate("cakeduel.game.action.callBluffHint")}
                  disabled={actionPending || tutorialClaimActive}
                  onClick={() => onAction({ type: "challenge" })}
                />
              ) : null}
            </div>
            {selectedHandIndices.length > 0 && controls ? (
              <div className="border-t border-stone-300/40 pt-2 flex flex-col gap-2">{controls}</div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-500/70">
                <Triangle className="h-2.5 w-2.5 rotate-180 fill-current" />
                {translate("cakeduel.game.action.orPlayFromHand")}
                <Triangle className="h-2.5 w-2.5 rotate-180 fill-current" />
              </div>
            )}
          </div>
        ) : null}

        {mode === "attack_pass" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center">
              <CakeDuelActionButton
                variant={confirmPass ? "danger" : "muted"}
                icon={<ShieldOff className="h-4 w-4" />}
                label={translate(
                  confirmPass ? "cakeduel.game.action.passAttackConfirm" : "cakeduel.game.action.passAttack",
                )}
                sublabel={translate(
                  lastAttackPassed
                    ? "cakeduel.game.action.passAttackEndsBout"
                    : "cakeduel.game.action.passAttackHint",
                )}
                disabled={actionPending}
                pulse={tutorialResponse === "pass"}
                onClick={submitPassAttack}
              />
            </div>
            {tutorialResponse !== "pass" ? (
              <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-500/70">
                <Triangle className="h-2.5 w-2.5 rotate-180 fill-current" />
                {translate("cakeduel.game.action.orPlayFromHand")}
                <Triangle className="h-2.5 w-2.5 rotate-180 fill-current" />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
});
