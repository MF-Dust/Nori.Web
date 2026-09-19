import { useEffect, type RefObject } from "react";

/** Keep keyboard navigation inside an active full-screen story and restore it on exit. */
export function useStoryFocus(host: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const previous = document.activeElement;
    root.focus({ preventScroll: true });
    const candidates = () =>
      [
        ...root.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter(
        (element) =>
          element.getClientRects().length &&
          !element.closest('[inert],[aria-hidden="true"]'),
      );
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = candidates(),
        first = items[0],
        last = items.at(-1);
      if (!first) {
        event.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      if (
        !root.contains(document.activeElement) ||
        document.activeElement === root ||
        (event.shiftKey
          ? document.activeElement === first
          : document.activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", keydown, true);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [host]);
}
