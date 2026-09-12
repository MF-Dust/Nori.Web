import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export const CAKEDUEL_CARD_PREVIEW_OPEN_DELAY_MS = 1_000;
export const CAKEDUEL_CARD_PREVIEW_CLOSE_DELAY_MS = 200;

interface PreviewCandidate {
  id: string;
  image: string;
  element: HTMLElement;
}

interface ActivePreview {
  id: string;
  image: string;
  rect: DOMRect;
}

export interface CakeDuelCardPreviewContextValue {
  activeCardId: string | null;
  reportHover(id: string, image: string, element: HTMLElement): void;
  reportUnhover(id: string): void;
  close(): void;
}

const CakeDuelCardPreviewContext = createContext<CakeDuelCardPreviewContextValue | null>(null);

function previewPosition(rect: DOMRect): { left: number; top: number; width: number; height: number } {
  const gap = 18;
  const width = Math.min(260, Math.max(190, rect.width * 2));
  const height = width * 150 / 110;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const rightCandidate = rect.right + gap;
  const left = rightCandidate + width <= viewportWidth - 12
    ? rightCandidate
    : Math.max(12, rect.left - gap - width);
  const top = Math.min(
    Math.max(12, rect.top + rect.height / 2 - height / 2),
    Math.max(12, viewportHeight - height - 12),
  );
  return { left, top, width, height };
}

/**
 * Source-owned equivalent of the shipped CardPreviewContext. A face-up card
 * must remain hovered for one second before the enlarged preview opens. Leaving
 * the card schedules a 200 ms close so the pointer may cross into the preview.
 */
export function CakeDuelCardPreviewProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActivePreview | null>(null);
  const candidateRef = useRef<PreviewCandidate | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOpen = useCallback(() => {
    if (openTimer.current !== null) clearTimeout(openTimer.current);
    openTimer.current = null;
  }, []);
  const clearClose = useCallback(() => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const close = useCallback(() => {
    clearOpen();
    clearClose();
    candidateRef.current = null;
    setActive(null);
  }, [clearClose, clearOpen]);

  const reportHover = useCallback((id: string, image: string, element: HTMLElement) => {
    clearClose();
    const current = candidateRef.current;
    if (current?.id === id) return;
    clearOpen();
    candidateRef.current = { id, image, element };
    openTimer.current = setTimeout(() => {
      const candidate = candidateRef.current;
      if (!candidate || candidate.id !== id || !candidate.element.isConnected) return;
      setActive({ id, image: candidate.image, rect: candidate.element.getBoundingClientRect() });
      openTimer.current = null;
    }, CAKEDUEL_CARD_PREVIEW_OPEN_DELAY_MS);
  }, [clearClose, clearOpen]);

  const reportUnhover = useCallback((id: string) => {
    if (candidateRef.current?.id === id) candidateRef.current = null;
    clearOpen();
    clearClose();
    closeTimer.current = setTimeout(() => {
      setActive((current) => current?.id === id ? null : current);
      closeTimer.current = null;
    }, CAKEDUEL_CARD_PREVIEW_CLOSE_DELAY_MS);
  }, [clearClose, clearOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (active) event.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, close]);

  useEffect(() => () => {
    clearOpen();
    clearClose();
  }, [clearClose, clearOpen]);

  const value = useMemo<CakeDuelCardPreviewContextValue>(() => ({
    activeCardId: active?.id ?? null,
    reportHover,
    reportUnhover,
    close,
  }), [active?.id, close, reportHover, reportUnhover]);

  const position = active ? previewPosition(active.rect) : null;
  return (
    <CakeDuelCardPreviewContext.Provider value={value}>
      {children}
      {active && position ? (
        <div className="fixed inset-0 z-[70] pointer-events-none" data-cakeduel-card-preview>
          <div className="absolute bg-black/45 backdrop-blur-[2px]" style={{ left: 0, top: 0, right: 0, height: active.rect.top }} />
          <div className="absolute bg-black/45 backdrop-blur-[2px]" style={{ left: 0, top: active.rect.top, width: active.rect.left, height: active.rect.height }} />
          <div className="absolute bg-black/45 backdrop-blur-[2px]" style={{ left: active.rect.right, right: 0, top: active.rect.top, height: active.rect.height }} />
          <div className="absolute bg-black/45 backdrop-blur-[2px]" style={{ left: 0, top: active.rect.bottom, right: 0, bottom: 0 }} />
          <div
            className="fixed overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/40"
            style={{ ...position, animation: "cakeduel-preview-in 180ms cubic-bezier(.2,.8,.2,1) both" }}
          >
            <img src={active.image} alt="" className="h-full w-full object-cover" draggable={false} />
          </div>
        </div>
      ) : null}
    </CakeDuelCardPreviewContext.Provider>
  );
}

export function useCakeDuelCardPreview(): CakeDuelCardPreviewContextValue | null {
  return useContext(CakeDuelCardPreviewContext);
}
