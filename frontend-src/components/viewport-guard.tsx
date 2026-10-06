import { useSyncExternalStore } from "react";
import { createSourceTranslate, sourceLocale } from "../i18n/translate";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";

export function isNoriViewportTooSmall(width: number, height: number) {
  return width < 1024 || height < 512;
}
const subscribe = (listener: () => void) => {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
};
const snapshot = () => isNoriViewportTooSmall(window.innerWidth, window.innerHeight);

export function ViewportGuard() {
  const small = useSyncExternalStore(subscribe, snapshot, () => false);
  if (!small) return null;
  let locale = navigator.language;
  try { locale = localStorage.getItem("arcade-language") ?? locale; } catch { /* Browser storage may be unavailable. */ }
  const t = createSourceTranslate(sourceLocale(locale));
  return <div className="sys-veil fixed inset-0 flex items-center justify-center" role="alert" style={{ zIndex: NORI_SHELL_LAYERS.VIEWPORT_GUARD, background: "radial-gradient(120% 85% at 50% -12%, oklch(0.78 0.08 210 / 0.07), transparent 62%), radial-gradient(110% 80% at 50% 118%, oklch(0.45 0.05 245 / 0.10), transparent 58%), var(--background)" }}>
    <div className="relative flex max-w-md flex-col gap-1.5 px-6 text-center">
      <h2 className="text-base font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>{t("viewport.tooSmall")}</h2>
      <p className="text-balance text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{t("viewport.resizeHint")}</p>
    </div>
  </div>;
}
