import { useCallback, useLayoutEffect, useState, type RefCallback } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

/** Recovered behavior from the shipped `useElementSize-*` helper chunk. */
export function useElementSize<T extends HTMLElement = HTMLDivElement>(): readonly [
  RefCallback<T>,
  ElementSize,
] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  const ref = useCallback<RefCallback<T>>((node) => setElement(node), []);

  useLayoutEffect(() => {
    if (!element) return;

    const measure = () => {
      const bounds = element.getBoundingClientRect();
      setSize((previous) =>
        previous.width === bounds.width && previous.height === bounds.height
          ? previous
          : { width: bounds.width, height: bounds.height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [ref, size] as const;
}
