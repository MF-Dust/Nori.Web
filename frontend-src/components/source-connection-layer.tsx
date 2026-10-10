import { useEffect, useRef, useState, type ReactNode } from "react";
import { createSourceTranslate } from "../i18n/translate";
import type { ArcadeClient, ArcadeConnectionState } from "../runtime/arcade-client";
import "./source-asset-boot-gate.css";
import "./source-connection-layer.css";

const GROUP_ONE = "1041616195";
const GROUP_TWO = "1107531061";
const GATED = new Set(["overloaded", "soft_closed", "closed"]);

function Spinner({ size = 16 }: { size?: number }) {
  return <span className="source-sys-spinner" style={{ width: size, height: size }} />;
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="source-connection-overlay">
      <div className="source-connection-card">
        <div className="source-connection-card-body">{children}</div>
      </div>
    </div>
  );
}

export function SourceConnectionLayer({
  arcade,
  locale,
}: {
  arcade: ArcadeClient;
  locale: string;
}) {
  const t = createSourceTranslate(locale);
  const [state, setState] = useState<ArcadeConnectionState>(arcade.connectionState);
  const [seenOpen, setSeenOpen] = useState(arcade.connectionState === "open");
  const [reconnected, setReconnected] = useState(false);
  const wasOpen = useRef(arcade.connectionState === "open");
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => arcade.onState((next) => {
    setState((previous) => {
      if (wasOpen.current && previous !== "open" && next === "open") setReconnected(true);
      if (next === "open") wasOpen.current = true;
      return next;
    });
    if (next === "open") setSeenOpen(true);
  }), [arcade]);
  useEffect(() => {
    if (!reconnected) return;
    const timer = window.setTimeout(() => setReconnected(false), 1500);
    return () => window.clearTimeout(timer);
  }, [reconnected]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const reason = arcade.lastClose?.reason ?? "";
  const reconnecting = seenOpen && (state === "waiting" || state === "connecting");
  const deploying = reconnecting && reason === "deploy_restart";
  const worldReset = state === "closed" && reason === "world_reset";
  const exhausted = state === "closed" && reason === "reconnect_exhausted";
  const fatal = state === "closed" && (reason === "session_replaced" || reason === "session_invalid" || exhausted);
  const gated = state === "closed" && GATED.has(reason);
  useEffect(() => {
    if (!worldReset) return;
    const timer = window.setTimeout(() => window.location.reload(), 2500);
    return () => window.clearTimeout(timer);
  }, [worldReset]);
  const copyGroup = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
    } catch { /* Clipboard can be denied. */ }
  };
  return (
    <>
      {worldReset && (
        <main className="source-sys-veil" role="alert">
          <div className="source-sys-column">
            <div className="source-sys-mark" aria-hidden="true">
              <div className="source-sys-halo" />
              <img src="/icon.png" alt="" draggable={false} />
            </div>
            <div className="source-sys-copy">
              <strong>{t("connection.worldReset")}</strong>
              <p>{t("connection.worldResetRebooting")}</p>
            </div>
            <Spinner />
          </div>
        </main>
      )}
      {fatal && (
        <main className="source-sys-veil" role="alert">
          <div className="source-sys-column">
            <div className="source-sys-mark" aria-hidden="true">
              <div className="source-sys-halo" data-dim="" />
              <img src="/icon.png" alt="" draggable={false} />
            </div>
            <div className="source-sys-copy">
              <strong>{t("connection.failed")}</strong>
              <p>{t(exhausted ? "connection.failed" : reason === "session_replaced" ? "connection.sessionReplaced" : "connection.sessionInvalid")}</p>
            </div>
            <button type="button" className="source-sys-button" onClick={() => exhausted ? void arcade.connect().catch(() => {}) : window.location.reload()}>{t("connection.retry")}</button>
          </div>
        </main>
      )}
      {gated && (
        <main className="source-sys-veil" role="alert">
          <div className="source-sys-column">
            <img className="source-connection-chibi" src="/assets/surrender-chibi-CaxugmBX.gif" alt="" draggable={false} />
            <div className="source-sys-copy">
              <strong>抱歉，我们服务器炸了……</strong>
              <p>请一两分钟后重试，<br />或者加入 QQ 群：<span className="source-connection-qq">{GROUP_ONE}</span> 获取最新信息。</p>
              <p>如果 1 群已满，请加 2 群：<span className="source-connection-qq">{GROUP_TWO}</span>。</p>
            </div>
            <div className="source-connection-actions">
              <button type="button" className="source-sys-button" onClick={() => void copyGroup(GROUP_ONE)}>{copied === GROUP_ONE ? "已复制" : "复制1群号"}</button>
              <button type="button" className="source-sys-button" onClick={() => void copyGroup(GROUP_TWO)}>{copied === GROUP_TWO ? "已复制" : "复制2群号"}</button>
              <button type="button" className="source-sys-button" onClick={() => void arcade.connect()}>{t("connection.retry")}</button>
            </div>
          </div>
        </main>
      )}
      {reconnecting && (
        <>
          <div className="source-connection-toast corner">
            <div className="source-connection-card">
              <div className="source-connection-card-body" style={{ flexDirection: "row", padding: "12px 16px", gap: 10 }}>
                <Spinner />
                <span>{t(deploying ? "connection.serverUpdating" : "connection.reconnecting")}</span>
              </div>
            </div>
          </div>
          <Card>
            <Spinner size={28} />
            <div>
              <h2>{t(deploying ? "connection.serverUpdating" : "connection.reconnecting")}</h2>
              <p>{t(deploying ? "connection.serverUpdatingWait" : "connection.attemptingToReconnect")}</p>
            </div>
          </Card>
        </>
      )}
      {reconnected && !reconnecting && !fatal && !gated && !worldReset && (
        <div className="source-connection-toast recovered" role="status">
          <div className="source-connection-card">
            <div className="source-connection-card-body" style={{ flexDirection: "row", padding: "12px 16px", gap: 10 }}>
              <svg className="source-connection-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" d="M5 13l4 4L19 7" />
              </svg>
              <span>{t("connection.reconnected")}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
