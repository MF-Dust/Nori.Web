import { createPortal } from "react-dom";
import { computeSnapRect } from "../state/window-geometry";
import { NORI_SHELL_LAYERS, type WindowLayoutRuntime } from "../state/window-layout-runtime";
import type { WindowRect, WindowSnap } from "../state/window-store";

export interface WindowInteractionShieldProps {
  active: boolean;
  cursor: string;
}

/** Full-page pointer shield used while a drag or resize owns the mouse. */
export function WindowInteractionShield({
  active,
  cursor,
}: WindowInteractionShieldProps) {
  if (typeof document === "undefined" || !active) return null;
  return createPortal(
    <div
      className="fixed inset-0 bg-transparent"
      style={{
        zIndex: NORI_SHELL_LAYERS.DOCK_TOOLTIP - 1,
        cursor,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      aria-hidden="true"
    />,
    document.body,
  );
}

export interface WindowSnapPreviewProps {
  snap: WindowSnap | null;
  windowRect: WindowRect;
  layout: WindowLayoutRuntime;
}

/**
 * Portal preview for the target snap rectangle. Motion is deliberately kept
 * in CSS so the clean-room window core does not depend on the historical
 * animation package.
 */
export function WindowSnapPreview({
  snap,
  windowRect,
  layout,
}: WindowSnapPreviewProps) {
  if (typeof document === "undefined" || !snap || snap === "none") return null;
  const rect = computeSnapRect(snap, layout.getBounds(false), windowRect);
  if (!rect) return null;

  return createPortal(
    <div
      className="nori-snap-preview fixed pointer-events-none"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: NORI_SHELL_LAYERS.ALWAYS_ON_TOP - 1,
        borderRadius: 12,
        background: "rgba(120, 180, 255, 0.18)",
        border: "2px solid rgba(120, 180, 255, 0.6)",
        backdropFilter: "blur(4px)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.1), 0 16px 40px rgba(0,0,0,0.2)",
      }}
      aria-hidden="true"
    />,
    document.body,
  );
}
