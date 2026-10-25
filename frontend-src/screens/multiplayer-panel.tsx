import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Users, X } from "lucide-react";
import type { MultiplayerManager } from "../multiplayer/manager";
import type { BuiltInGame } from "../services/games";
import { useMultiplayerSettings } from "../state/multiplayer-settings-store";
import "./multiplayer-panel.css";

export interface MultiplayerRuntime {
  manager: MultiplayerManager;
  translate: (key: string, values?: Readonly<Record<string, string | number>>) => string;
}

function CodeBox({ label, code, t }: { label: string; code: string; t: MultiplayerRuntime["translate"] }) {
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

function Lobby({ game, runtime, onClose }: { game: BuiltInGame; runtime: MultiplayerRuntime; onClose(): void }) {
  const { manager, translate: t } = runtime;
  const session = useSyncExternalStore(manager.subscribe, () => manager.snapshot(game), () => manager.snapshot(game));
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
  return (
    <div className="mp-panel" role="dialog" aria-label={t("multiplayer.title")}>
      <header>
        <strong>{t("multiplayer.title")}</strong>
        <button type="button" aria-label={t("multiplayer.close")} onClick={onClose}><X className="size-4" /></button>
      </header>
      <p role="status" className="mp-status">
        {t(`multiplayer.phase.${session.phase}`, { role: session.role ? t(`multiplayer.role.${session.role}`) : "" })}
        {route && <span className="mp-route">{route}</span>}
      </p>
      {session.error && <p role="alert" className="mp-error">{session.error}</p>}
      {idle && (
        <div className="mp-actions">
          <button type="button" disabled={busy} onClick={() => run(() => manager.host(game))}>{t("multiplayer.host")}</button>
          <label className="mp-code">
            <span>{t("multiplayer.inviteInput")}</span>
            <textarea rows={3} value={input} placeholder="NORI-MP1.…" onChange={(event) => setInput(event.target.value)} />
          </label>
          <button type="button" disabled={busy || !input.trim()} onClick={() => run(async () => { await manager.join(game, input); setInput(""); })}>{t("multiplayer.join")}</button>
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
      {!idle && <button type="button" className="mp-leave" onClick={() => manager.leave(game)}>{t("multiplayer.leave")}</button>}
    </div>
  );
}

/**
 * Wraps a game window. With multiplayer disabled in Settings it renders the game
 * untouched. Children remount when a guest session swaps in mirrored controllers.
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
  if (!runtime || !session) return <>{children}</>;
  const live = session.phase === "connected" || session.phase === "connecting" || session.phase === "inviting" || session.phase === "replying";
  const show = enabled || live;
  return (
    <div className="mp-frame">
      <div className="mp-frame-content" key={session.epoch}>{children}</div>
      {show && (
        <button
          type="button"
          className={`mp-toggle ${session.phase === "connected" ? "is-connected" : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Users className="size-4" aria-hidden="true" />
          <span>{session.phase === "connected" ? runtime.translate(`multiplayer.role.${session.role ?? "host"}`) : runtime.translate("multiplayer.button")}</span>
        </button>
      )}
      {show && open && <Lobby game={game} runtime={runtime} onClose={() => setOpen(false)} />}
    </div>
  );
}

const noopSubscribe = () => () => {};
