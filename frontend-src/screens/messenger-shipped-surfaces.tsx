import {
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  MessengerScreen as BaseMessengerScreen,
  type MessengerScreenRuntime,
} from "./messenger-screen";

export type { MessengerScreenRuntime };

const MESSENGER_SEALED_ERROR_TRANSITION_MS = 180;
const MESSENGER_SEALED_DETAILS_TRANSITION_MS = 160;
const MESSENGER_SEALED_ERROR_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

const SHIPPED_SURFACE_CSS = String.raw`
[data-messenger-shipped-surfaces] .flex.justify-start > .relative.rounded-bl-sm.border {
  background: color-mix(in oklab, var(--secondary-foreground) 10%, var(--secondary));
  border-color: color-mix(in oklab, var(--secondary-foreground) 16%, transparent);
  box-shadow: var(--shadow-sm);
}

[data-messenger-shipped-surfaces] .flex.justify-end > .relative.rounded-br-sm.bg-primary {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

[data-messenger-shipped-surfaces] header + div > div.rounded-md.border {
  background: color-mix(in oklab, var(--background) 60%, transparent);
  border-color: color-mix(in oklab, var(--secondary-foreground) 12%, transparent);
}

[data-messenger-shipped-surfaces]
  div.relative.shrink-0.border-t
  > div.flex.items-end
  > div.min-w-0.flex-1.items-center.rounded-2xl.border {
  background: color-mix(in oklab, var(--background) 60%, transparent);
  border-color: color-mix(in oklab, var(--secondary-foreground) 12%, transparent);
}

[data-messenger-shipped-surfaces] button.cursor-zoom-in:focus-visible,
[data-messenger-shipped-surfaces] button.rounded-full:has(> img.rounded-full):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 60%, transparent);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2 {
  border-bottom-color: color-mix(in oklab, var(--border) 50%, transparent);
  border-left-color: transparent;
  transition-duration: 150ms;
  outline: none;
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2:focus-visible {
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ring) 60%, transparent);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2[aria-current="true"] {
  border-left-color: var(--primary);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2[aria-current="true"]:hover {
  background: color-mix(in oklab, var(--primary) 18%, transparent);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2[aria-current="true"]:active {
  background: color-mix(in oklab, var(--primary) 24%, transparent);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2:not([aria-current="true"]):active {
  background: color-mix(in oklab, var(--muted) 60%, transparent);
}

[data-messenger-shipped-surfaces]
  button.w-full.border-b.border-l-2[aria-current="true"]:not(:has(span[aria-label]))
  > div.min-w-0.flex-1
  > div:first-child
  > span:last-child {
  color: color-mix(in oklab, var(--foreground) 70%, transparent);
}

[data-messenger-shipped-surfaces]
  button.w-full.border-b.border-l-2[aria-current="true"]:not(:has(span[aria-label]))
  > div.min-w-0.flex-1
  > div:nth-child(2)
  > span:first-child {
  color: color-mix(in oklab, var(--foreground) 80%, transparent);
}

[data-messenger-shipped-surfaces] [data-messenger-sealed-alert="true"] {
  animation: messenger-sealed-error-enter ${MESSENGER_SEALED_ERROR_TRANSITION_MS}ms ${MESSENGER_SEALED_ERROR_EASING} both;
}

[data-messenger-shipped-surfaces] [data-messenger-sealed-alert="true"][data-messenger-sealed-exiting="true"] {
  animation: messenger-sealed-error-exit ${MESSENGER_SEALED_ERROR_TRANSITION_MS}ms ${MESSENGER_SEALED_ERROR_EASING} both;
  pointer-events: none;
}

[data-messenger-shipped-surfaces] [data-messenger-sealed-details-button="true"] {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

[data-messenger-shipped-surfaces] [data-messenger-sealed-error-code="true"] {
  display: inline-flex;
  align-items: center;
}

[data-messenger-shipped-surfaces] [data-messenger-sealed-details-state="entering"] {
  overflow: hidden;
  animation: messenger-sealed-details-enter ${MESSENGER_SEALED_DETAILS_TRANSITION_MS}ms ease both;
}

[data-messenger-shipped-surfaces] [data-messenger-sealed-details-state="open"] {
  overflow: hidden;
  height: auto;
  opacity: 1;
}

[data-messenger-shipped-surfaces] [data-messenger-sealed-details-state="exiting"] {
  overflow: hidden;
  animation: messenger-sealed-details-exit ${MESSENGER_SEALED_DETAILS_TRANSITION_MS}ms ease both;
}

@keyframes messenger-sealed-error-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes messenger-sealed-error-exit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes messenger-sealed-details-enter {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: var(--messenger-sealed-details-height);
    opacity: 1;
  }
}

@keyframes messenger-sealed-details-exit {
  from {
    height: var(--messenger-sealed-details-height);
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0;
  }
}
`;

function getAlertButtons(alert: HTMLElement): {
  detailsButton?: HTMLButtonElement;
  dismissButton?: HTMLButtonElement;
} {
  const buttons = Array.from(
    alert.querySelectorAll<HTMLButtonElement>('button[type="button"]'),
  );
  return {
    detailsButton: buttons[0],
    dismissButton: buttons.at(-1),
  };
}

function setDetailsChevron(button: HTMLButtonElement, expanded: boolean): void {
  const namespace = "http://www.w3.org/2000/svg";
  let icon = button.querySelector<SVGSVGElement>(
    '[data-messenger-details-chevron="true"]',
  );
  if (!icon) {
    icon = document.createElementNS(namespace, "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("class", "size-3");
    icon.dataset.messengerDetailsChevron = "true";
    const path = document.createElementNS(namespace, "path");
    icon.append(path);
    button.append(icon);
  }
  icon.querySelector("path")?.setAttribute(
    "d",
    expanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6",
  );
}

export function MessengerScreen(
  props: Parameters<typeof BaseMessengerScreen>[0],
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef(new Set<number>());
  const allowedClicksRef = useRef(new WeakSet<HTMLButtonElement>());
  const detailsSettleTimersRef = useRef(new WeakMap<HTMLPreElement, number>());

  const schedule = (callback: () => void, delay: number): number => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  };

  const cancelDetailsSettle = (details: HTMLPreElement): void => {
    const timer = detailsSettleTimersRef.current.get(details);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(timer);
      detailsSettleTimersRef.current.delete(details);
    }
  };

  const markDetailsExiting = (
    details: HTMLPreElement,
    detailsButton?: HTMLButtonElement,
  ): void => {
    cancelDetailsSettle(details);
    details.style.setProperty(
      "--messenger-sealed-details-height",
      `${details.scrollHeight}px`,
    );
    details.dataset.messengerSealedDetailsState = "exiting";
    if (detailsButton) setDetailsChevron(detailsButton, false);
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const decorateAlert = (alert: HTMLElement): void => {
      alert.dataset.messengerSealedAlert = "true";
      const { detailsButton } = getAlertButtons(alert);
      const errorCode = alert.querySelector<HTMLSpanElement>(
        ".mt-2.flex.items-center.gap-2 > span",
      );
      if (errorCode) errorCode.dataset.messengerSealedErrorCode = "true";
      if (!detailsButton) return;

      detailsButton.dataset.messengerSealedDetailsButton = "true";
      const details = alert.querySelector<HTMLPreElement>("pre");
      setDetailsChevron(
        detailsButton,
        Boolean(details && details.dataset.messengerSealedDetailsState !== "exiting"),
      );

      if (
        details &&
        (!details.dataset.messengerSealedDetailsState ||
          (details.dataset.messengerSealedDetailsState === "entering" &&
            !detailsSettleTimersRef.current.has(details)))
      ) {
        details.style.setProperty(
          "--messenger-sealed-details-height",
          `${details.scrollHeight}px`,
        );
        details.dataset.messengerSealedDetailsState = "entering";
        const timer = schedule(() => {
          if (details.isConnected && details.dataset.messengerSealedDetailsState === "entering") {
            details.dataset.messengerSealedDetailsState = "open";
          }
          detailsSettleTimersRef.current.delete(details);
        }, MESSENGER_SEALED_DETAILS_TRANSITION_MS);
        detailsSettleTimersRef.current.set(details, timer);
      }
    };

    const decorateAlerts = (): void => {
      root
        .querySelectorAll<HTMLElement>('[role="alert"]')
        .forEach(decorateAlert);
    };

    decorateAlerts();
    const observer = new MutationObserver(decorateAlerts);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current.clear();
      detailsSettleTimersRef.current = new WeakMap<HTMLPreElement, number>();
    };
  }, []);

  const handleSealedComposerClickCapture = (
    event: ReactMouseEvent<HTMLDivElement>,
  ): void => {
    const root = rootRef.current;
    const target = event.target;
    if (!root || !(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('button[type="button"]');
    if (!button || !root.contains(button)) return;
    if (allowedClicksRef.current.has(button)) {
      allowedClicksRef.current.delete(button);
      return;
    }

    const alert = button.closest<HTMLElement>(
      '[data-messenger-sealed-alert="true"]',
    );
    if (!alert) return;
    const { detailsButton, dismissButton } = getAlertButtons(alert);

    if (button === dismissButton) {
      event.preventDefault();
      event.stopPropagation();
      alert.dataset.messengerSealedExiting = "true";
      const details = alert.querySelector<HTMLPreElement>("pre");
      if (details) markDetailsExiting(details, detailsButton);
      schedule(() => {
        if (!button.isConnected) return;
        allowedClicksRef.current.add(button);
        button.click();
      }, MESSENGER_SEALED_ERROR_TRANSITION_MS);
      return;
    }

    if (button === detailsButton) {
      const details = alert.querySelector<HTMLPreElement>("pre");
      if (!details) return;
      event.preventDefault();
      event.stopPropagation();
      if (details.dataset.messengerSealedDetailsState === "exiting") return;
      markDetailsExiting(details, detailsButton);
      schedule(() => {
        if (!button.isConnected) return;
        allowedClicksRef.current.add(button);
        button.click();
      }, MESSENGER_SEALED_DETAILS_TRANSITION_MS);
    }
  };

  return (
    <div
      ref={rootRef}
      className="contents"
      data-messenger-shipped-surfaces
      onClickCapture={handleSealedComposerClickCapture}
    >
      <style>{SHIPPED_SURFACE_CSS}</style>
      <BaseMessengerScreen {...props} />
    </div>
  );
}
