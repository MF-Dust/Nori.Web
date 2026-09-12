import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  deriveCakeDuelResponsiveLayout,
  type CakeDuelResponsiveLayout,
} from "../apps/cakeduel-card-presentation";
import { useElementSize } from "../hooks/use-element-size";

const CAKEDUEL_FALLBACK_LAYOUT = deriveCakeDuelResponsiveLayout(
  Number.POSITIVE_INFINITY,
  Number.POSITIVE_INFINITY,
);

const CakeDuelLayoutContext = createContext<CakeDuelResponsiveLayout>(CAKEDUEL_FALLBACK_LAYOUT);

export interface CakeDuelLayoutProviderProps {
  layout: CakeDuelResponsiveLayout;
  children: ReactNode;
}

export function CakeDuelLayoutProvider({ layout, children }: CakeDuelLayoutProviderProps) {
  return <CakeDuelLayoutContext.Provider value={layout}>{children}</CakeDuelLayoutContext.Provider>;
}

export interface CakeDuelMeasuredLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Recreates the shipped Cake Duel GameScreen measurement boundary: one full
 * game column is measured with ResizeObserver and its width/height feed the
 * recovered responsive card model exposed through context.
 */
export function CakeDuelMeasuredLayout({
  children,
  className = "relative z-10 flex h-full w-full flex-col",
}: CakeDuelMeasuredLayoutProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const layout = useMemo(
    () => deriveCakeDuelResponsiveLayout(size.width, size.height),
    [size.height, size.width],
  );

  return (
    <CakeDuelLayoutContext.Provider value={layout}>
      <div ref={ref} className={className} data-cakeduel-layout-root>
        {children}
      </div>
    </CakeDuelLayoutContext.Provider>
  );
}

export function useCakeDuelLayout(): CakeDuelResponsiveLayout {
  return useContext(CakeDuelLayoutContext);
}
