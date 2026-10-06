import { useEffect, useRef, type ReactNode } from "react";

export interface VaultSheetProps {
  children: ReactNode;
  onClose?: (() => void) | null;
  closeOnScrim?: boolean;
  onEnter?: () => void;
  label?: string;
  role?: "dialog" | "alertdialog";
  className?: string;
  frameClassName?: string;
  sheetClassName?: string;
  /** Change this key to replay the wrong-password shake. */
  shakeKey?: string | number;
  playCue?: (cue: string) => void;
  sfx?: boolean;
}

/** Source-owned shared sheet frame from NormalApp's u2e. */
export function VaultSheet({
  children,
  onClose,
  closeOnScrim = true,
  onEnter,
  label,
  role = "dialog",
  className = "",
  frameClassName = "",
  sheetClassName = "",
  shakeKey,
  playCue,
  sfx = true,
}: VaultSheetProps) {
  const scrim = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sfx) playCue?.("primitives-sheet-open");
    const backdrop = scrim.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
    const entrance = frame.current?.animate?.([
      { opacity: 0, transform: "translateY(-14px) scale(0.985)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ], { duration: 340, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" });
    return () => { backdrop?.cancel(); entrance?.cancel(); };
  }, []);

  useEffect(() => {
    if (shakeKey === undefined) return;
    const shake = sheet.current?.animate?.(
      [0, -8, 8, -6, 6, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 420, easing: "ease-in-out" },
    );
    return () => shake?.cancel();
  }, [shakeKey]);

  const dismiss = () => {
    if (!onClose) return;
    if (sfx) playCue?.("primitives-sheet-dismiss");
    onClose();
  };

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape" && onClose) {
        event.preventDefault();
        dismiss();
      } else if (event.key === "Enter" && onEnter) {
        event.preventDefault();
        onEnter();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onClose, onEnter, playCue, sfx]);

  return (
    <div className={`absolute inset-0 z-50 flex items-start justify-center px-6 pt-6 ${className}`}>
      <div ref={scrim} className="nori-vault-scrim" onClick={closeOnScrim ? dismiss : undefined} />
      <div ref={frame} className={`relative w-[min(24rem,calc(100%-1rem))] ${frameClassName}`}>
        <div
          ref={sheet}
          role={role}
          aria-modal="true"
          aria-label={label}
          className={`nori-vault-sheet gradient-border rounded-[18px] p-5 ${sheetClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
