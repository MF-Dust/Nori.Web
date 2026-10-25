import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Users, X } from "lucide-react";
import type { MultiplayerManager, MultiplayerSessionSnapshot } from "../multiplayer/manager";
import type { BuiltInGame } from "../services/games";
import { useMultiplayerSettings } from "../state/multiplayer-settings-store";
import "./multiplayer-panel.css";

export interface MultiplayerRuntime {
  manager: MultiplayerManager;
  translate: (key: string, values?: Readonly<Record<string, string | number>>) => string;
}

type Translate = MultiplayerRuntime["translate"];

/** Re-renders once a second while any of the given deadlines is pending. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function clock(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Whose turn the clock counts, from this browser's point of view. */
function turnLabel(session: MultiplayerSessionSnapshot, now: number, t: Translate): string | null {
  if (session.phase !== "connected" || session.turnDeadline === null) return null;
  const left = clock(session.turnDeadline - now);
  return t(session.role === "guest" ? "multiplayer.clock.yours" : "multiplayer.clock.theirs", { time: left });
}

function CodeBox({ label, code, t }: { label: string; code: string; t: Translate }) {
  const [copied, setCopied] = useState(false);
  return (
    <label className="mp-code">
      <span>{label}</span>
      <textarea readOnly value={code} rows={3} onFocus={(event) => event.currentTarget.select()} />
      <button type="button" onClick={() => {
        void navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
      }}>{t(copied ? "multiplayer.copied" : "multiplayer.copy")}</button>
    </label>
  );
}

function Lobby({ game, runtime, session, now, onClose }: {
  game: BuiltInGame; runtime: MultiplayerRuntime; session: MultiplayerSessionSnapshot; now: number; onClose(): void;
}) {
  const { manager, translate: t } = runtime;
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const run = (work: () => Promise<void>) => {
    setBusy(true);
    void work().catch(() => {}).finally(() => setBusy(false));
  };
  const idle = session.phase === "idle" || session.phase === "ended" || session.phase === "error";
  const route = session.phase === "connected"
    ? t(`multiplayer.route.${session.route}`) + (session.rttMs !== null ? ` · ${session.rttMs} ms` : "")
    : null;
  const turn = turnLabel(session, now, t);
  const grace = session.graceUntil !== null && session.graceUntil > now ? clock(session.graceUntil - now) : null;
  const forfeit = manager.canForfeit(game);
  return (
    <div className="mp-panel" role="dialog" aria-label={t("multiplayer.title")}>
      <header>
        <strong>{t("multiplayer.title")}</strong>
        <button type="button" aria-label={t("multiplayer.close")} onClick={onClose}><X className="size-4" /></button>
      </header>
      <p role="status" className="mp-status">
        {t(`multiplayer.phase.${session.phase}`, { role: session.role ? t(`multiplayer.role.${session.role}`) : "" })}
        {route && <span className="mp-route">{route}</span>}
        {session.peerName && session.phase === "connected" && <span className="mp-peer">{session.peerName}</span>}
      </p>
      {turn && <p className="mp-clock" role="timer">{turn}</p>}
      {session.error && <p role="alert" className="mp-error">{session.error}</p>}
      {grace && <p className="mp-hint" role="timer">{t("multiplayer.grace", { time: grace })}</p>}
      {(idle || session.phase === "peerLost") && (
        <div className="mp-actions">
          <button type="button" disabled={busy} onClick={() => run(() => manager.host(game))}>
            {t(session.phase === "peerLost" ? "multiplayer.reinvite" : "multiplayer.host")}
          </button>
          {session.phase !== "peerLost" && <>
            <label className="mp-code">
              <span>{t("multiplayer.inviteInput")}</span>
              <textarea rows={3} value={input} placeholder="NORI-MP1.…" onChange={(event) => setInput(event.target.value)} />
            </label>
            <button type="button" disabled={busy || !input.trim()} onClick={() => run(async () => { await manager.join(game, input); setInput(""); })}>{t("multiplayer.join")}</button>
          </>}
        </div>
      )}
      {session.phase === "inviting" && session.inviteCode && (
        <div className="mp-actions">
          <CodeBox label={t("multiplayer.inviteCode")} code={session.inviteCode} t={t} />
          {session.transport === "webrtc" && <>
            <label className="mp-code">
              <span>{t("multiplayer.replyInput")}</span>
              <textarea rows={3} value={input} placeholder="NORI-MP1.…" onChange={(event) => setInput(event.target.value)} />
            </label>
            <button type="button" disabled={busy || !input.trim()} onClick={() => run(async () => { await manager.acceptReply(game, input); setInput(""); })}>{t("multiplayer.connect")}</button>
          </>}
        </div>
      )}
      {session.phase === "replying" && session.replyCode && (
        <div className="mp-actions"><CodeBox label={t("multiplayer.replyCode")} code={session.replyCode} t={t} /></div>
      )}
      {session.phase === "connected" && session.role === "guest" && <p className="mp-hint">{t("multiplayer.guestHint")}</p>}
      {session.phase === "connected" && session.role === "host" && <p className="mp-hint">{t("multiplayer.hostHint")}</p>}
      {forfeit && (
        <button type="button" className="mp-leave" onClick={() => { if (window.confirm(t("multiplayer.forfeitConfirm"))) manager.forfeit(game); }}>
          {t("multiplayer.forfeit")}
        </button>
      )}
      {!idle && (
        <button type="button" className="mp-leave" onClick={() => manager.leave(game)}>
          {t(session.role === "host" && (session.phase === "peerLost" || session.graceUntil !== null) ? "multiplayer.takeover" : "multiplayer.leave")}
        </button>
      )}
    </div>
  );
}

/**
 * Wraps a game window. With multiplayer disabled in Settings it renders the game
 * untouched. Children remount when a guest session swaps in mirrored controllers
 * and when the opponent label changes (labels are read while rendering).
 */
export function MultiplayerGameFrame({ game, runtime, children }: { game: BuiltInGame; runtime?: MultiplayerRuntime; children: ReactNode }) {
  const enabled = useMultiplayerSettings((state) => state.enabled);
  const manager = runtime?.manager;
  const session = useSyncExternalStore(
    manager?.subscribe ?? noopSubscribe,
    () => manager?.snapshot(game) ?? null,
    () => manager?.snapshot(game) ?? null,
  );
  const [open, setOpen] = useState(false);
  const ticking = !!session && (session.turnDeadline !== null || session.graceUntil !== null);
  const now = useNow(ticking);
  if (!runtime || !session || !manager) return <>{children}</>;
  const live = manager.isLive(game);
  const show = enabled || live;
  const opponent = manager.opponentName(game) ?? "";
  const turn = turnLabel(session, now, runtime.translate);
  const pill = turn
    ?? (session.phase === "peerLost" ? runtime.translate("multiplayer.phase.peerLost")
      : session.phase === "connected" ? runtime.translate(`multiplayer.role.${session.role ?? "host"}`)
        : runtime.translate("multiplayer.button"));
  return (
    <div className="mp-frame">
      <div className="mp-frame-content" key={`${session.epoch}:${opponent}`}>{children}</div>
      {show && (
        <button
          type="button"
          className={`mp-toggle ${session.phase === "connected" ? "is-connected" : ""} ${session.phase === "peerLost" ? "is-lost" : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Users className="size-4" aria-hidden="true" />
          <span>{pill}</span>
        </button>
      )}
      {show && open && <Lobby game={game} runtime={runtime} session={session} now={now} onClose={() => setOpen(false)} />}
    </div>
  );
}

const noopSubscribe = () => () => {};
