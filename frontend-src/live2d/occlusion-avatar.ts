import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import type { WindowRect, WindowStore } from "../state/window-types";
import { getNoriDockReservedHeight, NORI_DOCK_BOTTOM_OFFSET, NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { noriIdleFromFacts } from "./idle-controller";

export const NORI_AVATAR = { width: 144, maskHeight: 308, restY: 116, barOverlap: 16, centerFromRight: 220, cropW: 0.44, idleU: 0.516, idleV: 0, kneelV: 0.409, cameraMs: 600, delayMs: 200 } as const;

/** Sample the union of covering windows, rather than adding overlapping areas twice. */
export function noriOcclusionFraction(rect: WindowRect, windows: readonly WindowRect[]): number {
  if (rect.width <= 0 || rect.height <= 0) return 0;
  let covered = 0;
  const cells = 12;
  for (let row = 0; row < cells; row++) for (let col = 0; col < cells; col++) {
    const x = rect.x + (col + 0.5) * rect.width / cells;
    const y = rect.y + (row + 0.5) * rect.height / cells;
    if (windows.some((window) => x >= window.x && x < window.x + window.width && y >= window.y && y < window.y + window.height)) covered++;
  }
  return covered / (cells * cells);
}

/** Reuse the live model texture and the stage's existing pat input; no second model/session. */
export function bindOcclusionAvatar(source: HTMLCanvasElement, frontend: NoriFrontendRuntime, store: WindowStore) {
  const host = document.createElement("div");
  host.className = "nori-occlusion-avatar";
  host.dataset.noriAvatar = "true";
  host.hidden = true;
  Object.assign(host.style, { position: "fixed", right: `${NORI_AVATAR.centerFromRight - NORI_AVATAR.width / 2}px`, width: `${NORI_AVATAR.width}px`, height: `${NORI_AVATAR.maskHeight + NORI_AVATAR.barOverlap}px`, zIndex: String(NORI_SHELL_LAYERS.DOCK_TOOLTIP - 1), pointerEvents: "none" });
  const mask = document.createElement("div");
  Object.assign(mask.style, { position: "absolute", inset: "0", overflow: "hidden" });
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(NORI_AVATAR.width * dpr);
  canvas.height = Math.round(NORI_AVATAR.width * 2 * dpr);
  Object.assign(canvas.style, { width: `${NORI_AVATAR.width}px`, height: `${NORI_AVATAR.width * 2}px`, display: "block", transform: `translateY(${NORI_AVATAR.restY}px)` });
  const waterline = document.createElement("div");
  Object.assign(waterline.style, { position: "absolute", left: "-15px", bottom: "7px", width: "174px", height: "18px", background: "radial-gradient(56px 3.5px at 50% 62%,rgba(220,250,246,.6),transparent 100%),radial-gradient(closest-side,rgba(202,245,241,.28),transparent 74%)" });
  mask.append(canvas);
  host.append(mask, waterline);
  document.body.append(host);
  const context = canvas.getContext("2d");
  let visible = false, want = false, wantedAt = 0, lastCheck = -Infinity;
  let v = 0, fromV = 0, toV = 0, movedAt = 0;
  return {
    /** `measure` is only sampled on the 100 ms occlusion check, never per frame. */
    update(now: number, measure: () => WindowRect) {
      const scene = frontend.scene.snapshot();
      const state = store.getState();
      const blocked = scene.active || scene.chatMode !== "normal" || state.exclusiveWindowId !== null;
      if (blocked) { visible = false; want = false; }
      else if (now - lastCheck >= 100) {
        lastCheck = now;
        const windows = Object.values(state.windows).filter((window) => !window.minimized);
        const next = noriOcclusionFraction(measure(), windows) >= 0.8;
        if (next !== want) { want = next; wantedAt = now; }
        if (visible !== want && now - wantedAt >= NORI_AVATAR.delayMs) {
          visible = want;
          if (visible && !matchMedia("(prefers-reduced-motion: reduce)").matches) canvas.animate([{ transform: "translateY(324px) rotate(-6deg)" }, { transform: `translateY(${NORI_AVATAR.restY}px) rotate(0)` }], { duration: 340, easing: "cubic-bezier(.34,1.5,.64,1)" });
        }
      }
      host.hidden = !visible;
      if (!visible || !context || !source.width || !source.height) return null;
      host.style.bottom = `${NORI_DOCK_BOTTOM_OFFSET + getNoriDockReservedHeight({ width: window.innerWidth, height: window.innerHeight }) / 2 + 23 - NORI_AVATAR.barOverlap}px`;
      const idle = noriIdleFromFacts(frontend.world.facts());
      host.dataset.noriIdle = idle;
      const targetV = idle === "kneel" || idle === "kneelCalm" ? NORI_AVATAR.kneelV : NORI_AVATAR.idleV;
      if (targetV !== toV) { fromV = v; toV = targetV; movedAt = now; }
      const t = Math.min(1, (now - movedAt) / NORI_AVATAR.cameraMs);
      const ease = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      v = fromV + (toV - fromV) * ease;
      const u0 = Math.max(0, Math.min(1 - NORI_AVATAR.cropW, NORI_AVATAR.idleU - NORI_AVATAR.cropW / 2));
      const v0 = Math.max(0, Math.min(1 - NORI_AVATAR.cropW, v - NORI_AVATAR.cropW / 2));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, u0 * source.width, v0 * source.height, NORI_AVATAR.cropW * source.width, NORI_AVATAR.cropW * source.height, 0, 0, canvas.width, canvas.height);
      return { host, rect: { x: -u0 * NORI_AVATAR.width / NORI_AVATAR.cropW, y: NORI_AVATAR.restY - v0 * NORI_AVATAR.width * 2 / NORI_AVATAR.cropW, width: NORI_AVATAR.width / NORI_AVATAR.cropW, height: NORI_AVATAR.width * 2 / NORI_AVATAR.cropW } };
    },
    dispose() { host.remove(); },
  };
}
