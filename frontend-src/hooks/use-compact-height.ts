import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export interface CompactHeightResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  compact: boolean;
}

/**
 * Tracks whether an element is shorter than the supplied layout threshold.
 *
 * Recovered from the shipped `useCompactHeight-*` chunk. Keeping this as a
 * small hook avoids scattering ResizeObserver-based breakpoint logic across
 * reconstructed screens.
 */
export function useCompactHeight<T extends HTMLElement = HTMLDivElement>(
  threshold: number,
): CompactHeightResult<T> {
  const ref = useRef<T | null>(null);
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = (height: number) => setCompact(height < threshold);
    update(element.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) update(entry.contentRect.height);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, compact };
}
