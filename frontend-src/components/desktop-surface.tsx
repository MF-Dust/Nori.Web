import type { ReactNode } from "react";

export interface DesktopSurfaceProps {
  children?: ReactNode;
  className?: string;
}

/** Exact maintainable counterpart of NormalApp's H8e desktop icon surface. */
export function DesktopSurface({ children, className = "" }: DesktopSurfaceProps) {
  return (
    <div
      className={`absolute inset-0 bottom-8 p-4 grid grid-cols-[repeat(auto-fill,72px)] grid-rows-[repeat(auto-fill,80px)] grid-flow-col gap-2 content-start ${className}`.trim()}
      data-nori-desktop-surface="true"
    >
      {children}
    </div>
  );
}
