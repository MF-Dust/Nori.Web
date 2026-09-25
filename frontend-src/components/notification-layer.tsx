import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Bell } from "lucide-react";
import { getProductionDockIconPair } from "../apps/production-icons";
import type {
  NotificationRecord,
  NotificationStore,
} from "../state/notification-store";
import type { JsonValue } from "../runtime/protocol";

export type NotificationTranslate = (
  key: string,
  values?: Readonly<Record<string, string | number>>,
) => string;

export interface NotificationLayerProps {
  store: NotificationStore;
  translate?: NotificationTranslate;
  onOpenApp?: (appId: string, args?: Record<string, JsonValue>) => void;
}

function useAutoDismiss(
  durationMs: number | undefined,
  paused: boolean,
  onExpire: () => void,
) {
  const remaining = useRef<number | null>(durationMs ?? null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (durationMs === undefined || paused) return;
    const current = remaining.current ?? durationMs;
    if (current <= 0) {
      onExpire();
      return;
    }
    startedAt.current = Date.now();
    const timer = window.setTimeout(onExpire, current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, current - (Date.now() - startedAt.current));
    };
  }, [durationMs, onExpire, paused]);
}

function NotificationIcon({ notification }: { notification: NotificationRecord }) {
  if (notification.icon) return notification.icon;
  const pair = notification.appId ? getProductionDockIconPair(notification.appId) : null;
  return pair ? (
    <img src={pair.a} alt="" aria-hidden="true" />
  ) : (
    <Bell aria-hidden="true" />
  );
}

function NotificationCard({
  notification,
  store,
  translate,
  onOpenApp,
}: {
  notification: NotificationRecord;
  store: NotificationStore;
  translate: NotificationTranslate;
  onOpenApp?: NotificationLayerProps["onOpenApp"];
}) {
  const [paused, setPaused] = useState(false);
  const dismiss = useCallback(() => store.dismiss(notification.id), [notification.id, store]);
  useAutoDismiss(notification.durationMs, paused, dismiss);
  const action = notification.action;
  const actionable = typeof notification.onClick === "function" || action?.type === "open-app";

  const activate = useCallback(() => {
    if (!actionable) return;
    try {
      if (notification.onClick) notification.onClick();
      else if (action?.type === "open-app") onOpenApp?.(action.appId, action.args);
    } catch (error) {
      console.warn("[Notify] onClick threw:", error);
    }
    store.playCue("comms-notify-click-through");
    dismiss();
  }, [action, actionable, dismiss, notification.onClick, onOpenApp, store]);

  const style = {
    "--nori-accent": notification.accentColor,
  } as CSSProperties;

  return (
    <div
      className="nori-notification-card pointer-events-auto"
      style={style}
      data-notification-id={notification.id}
      data-notification-entering="true"
      role={actionable ? "button" : undefined}
      tabIndex={actionable ? 0 : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={activate}
      onKeyDown={(event) => {
        if (actionable && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          activate();
        }
      }}
    >
      <div className="nori-notification-icon">
        <NotificationIcon notification={notification} />
      </div>
      <div className="nori-notification-text">
        <div className="nori-notification-title">{notification.title}</div>
        {notification.subtitle ? (
          <div className="nori-notification-subtitle">{notification.subtitle}</div>
        ) : null}
        {notification.body ? <div className="nori-notification-body">{notification.body}</div> : null}
      </div>
      <button
        type="button"
        className="nori-notification-clear"
        aria-label={translate("os.notifications.clear")}
        onClick={(event) => {
          event.stopPropagation();
          dismiss();
        }}
      >
        {translate("os.notifications.clear")}
      </button>
    </div>
  );
}

export function NotificationLayer({
  store,
  translate = (key) => key,
  onOpenApp,
}: NotificationLayerProps) {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.snapshot,
  );
  const visible = snapshot.queue.slice(0, 5);
  const overflow = snapshot.queue.length - visible.length;
  if (!visible.length) return null;

  return (
    <div
      className="pointer-events-none fixed right-3 flex flex-col gap-2.5"
      style={{ top: 42, zIndex: 8500 }}
      data-notification-layer="true"
      aria-live="polite"
      aria-label="Notifications"
    >
      {visible.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          store={store}
          translate={translate}
          onOpenApp={onOpenApp}
        />
      ))}
      {(overflow > 0 || snapshot.queue.length > 1) && (
        <div className="pointer-events-none flex items-center justify-end gap-2">
          {overflow > 0 ? (
            <div className="nori-notification-overflow">
              {translate("os.notifications.more", { count: overflow })}
            </div>
          ) : null}
          {snapshot.queue.length > 1 ? (
            <button
              type="button"
              className="nori-notification-clear-all pointer-events-auto"
              onClick={() => store.dismissAll()}
            >
              {translate("os.notifications.clearAll")}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
