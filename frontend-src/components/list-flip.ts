import { useCallback, useLayoutEffect, useRef } from "react";

interface LayoutPoint {
  x: number;
  y: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readTranslate(element: HTMLElement): LayoutPoint {
  const value = getComputedStyle(element).translate;
  if (!value || value === "none") return { x: 0, y: 0 };
  const [x = "0", y = "0"] = value.split(" ");
  return { x: Number.parseFloat(x) || 0, y: Number.parseFloat(y) || 0 };
}

/** Layout position inside `root`. Ignores the element's own transform/translate. */
function offsetWithin(element: HTMLElement, root: HTMLElement): LayoutPoint {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    x += current.offsetLeft;
    y += current.offsetTop;
    const parent = current.offsetParent as HTMLElement | null;
    if (!parent || parent === current) break;
    if (parent !== root && !root.contains(parent)) break;
    current = parent;
  }
  return { x, y };
}

/**
 * FLIP siblings when the list reflows.
 * Before/after positions come from `getBoundingClientRect` on the list root
 * plus `offsetLeft`/`offsetTop` (those ignore enter/exit transforms). The
 * inverse delta is applied on the `translate` property, then transitioned
 * back to `none`, so a CSS `transform` animation on the same node can still
 * play the enter/exit tween.
 */
/** Pull leaving rows out of flow without moving their border boxes. */
function pinExiting(root: HTMLElement, items: Iterable<HTMLElement>) {
  const pins: Array<{ element: HTMLElement; offset: LayoutPoint; width: number }> = [];
  for (const element of items) {
    if (!element.dataset.exiting || element.style.position === "absolute") continue;
    pins.push({
      element,
      offset: offsetWithin(element, root),
      width: element.offsetWidth,
    });
  }
  for (const pin of pins) {
    pin.element.style.position = "absolute";
    pin.element.style.left = `${pin.offset.x}px`;
    pin.element.style.top = `${pin.offset.y}px`;
    pin.element.style.width = `${pin.width}px`;
    pin.element.style.margin = "0";
    pin.element.style.zIndex = "1";
  }
}

function applyListFlip(
  root: HTMLElement,
  items: ReadonlyMap<string, HTMLElement>,
  offsets: Map<string, LayoutPoint>,
  previousRoot: LayoutPoint | null,
  reduced: boolean,
  durationMs: number,
  easing: string,
  includeRootShift: boolean,
): LayoutPoint {
  if (!reduced) pinExiting(root, items.values());
  const rootRect = root.getBoundingClientRect();
  const nextRoot = { x: rootRect.left, y: rootRect.top };
  const rootShiftX = includeRootShift && previousRoot ? previousRoot.x - nextRoot.x : 0;
  const rootShiftY = includeRootShift && previousRoot ? previousRoot.y - nextRoot.y : 0;
  const nextOffsets = new Map<string, LayoutPoint>();
  const moves: HTMLElement[] = [];

  for (const [id, element] of items) {
    const offset = offsetWithin(element, root);
    nextOffsets.set(id, offset);
    if (reduced) {
      element.style.transition = "";
      element.style.translate = "";
      continue;
    }
    const previous = offsets.get(id);
    if (!previous) continue;
    const live = readTranslate(element);
    const dx = previous.x - offset.x + rootShiftX + live.x;
    const dy = previous.y - offset.y + rootShiftY + live.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    element.style.transition = "none";
    element.style.translate = `${dx}px ${dy}px`;
    // A leaving row stays where it was. Siblings slide to the new layout.
    if (element.dataset.exiting) continue;
    moves.push(element);
  }

  if (moves.length) {
    root.getBoundingClientRect();
    const transition = `translate ${durationMs}ms ${easing}`;
    for (const element of moves) {
      element.style.transition = transition;
      element.style.translate = "none";
    }
  }

  offsets.clear();
  for (const [id, point] of nextOffsets) offsets.set(id, point);
  return nextRoot;
}

/**
 * `includeRootShift` folds viewport movement of a bottom-anchored stack into
 * the delta. A scrolling list leaves it off so a scroll does not replay as FLIP.
 * `rebaseKey` refreshes the cached root origin when the stack moves without
 * an id change (dock pin, margin lift).
 */
export function useListFlip(
  key: string,
  durationMs: number,
  easing: string,
  includeRootShift = false,
  rebaseKey = "",
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const offsets = useRef(new Map<string, LayoutPoint>());
  const rootPoint = useRef<LayoutPoint | null>(null);
  const callbacks = useRef(new Map<string, (element: HTMLDivElement | null) => void>());

  const setRoot = useCallback((element: HTMLDivElement | null) => {
    rootRef.current = element;
  }, []);

  const itemRef = useCallback((id: string) => {
    const cached = callbacks.current.get(id);
    if (cached) return cached;
    const callback = (element: HTMLDivElement | null) => {
      if (element) nodes.current.set(id, element);
      else nodes.current.delete(id);
    };
    callbacks.current.set(id, callback);
    return callback;
  }, []);

  const rebase = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    rootPoint.current = { x: rect.left, y: rect.top };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    rootPoint.current = applyListFlip(
      root,
      nodes.current,
      offsets.current,
      rootPoint.current,
      prefersReducedMotion(),
      durationMs,
      easing,
      includeRootShift,
    );
  }, [key, durationMs, easing, includeRootShift]);

  useLayoutEffect(() => {
    if (!includeRootShift) return;
    rebase();
  }, [includeRootShift, rebase, rebaseKey]);

  return { setRoot, itemRef, rebase };
}
