import { noriScanBounds } from "../live2d/scan-bounds";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Cpu } from "lucide-react";
import {
  ChipController,
  chipAvailability,
  chipCharge,
  type ChipTarget,
} from "../runtime/chip-controller";
import type { WindowStore } from "../state/window-types";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { createSourceTranslate } from "../i18n/translate";
import "./chip-overlay.css";

type ChipProps = { controller: ChipController; locale: string };
export function ChipButton({
  controller,
  locale,
  offline,
  playCue,
}: ChipProps & { offline: boolean; playCue(cue: string): void }) {
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  const [now, setNow] = useState(Date.now);
  const [refused, setRefused] = useState(false);
  const t = useMemo(() => createSourceTranslate(locale), [locale]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const charge = chipCharge(state.status, state.receivedAt, now);
  const label = offline
    ? t("chip.offline")
    : charge.charges > 0
      ? t("chip.charge", charge)
      : t("chip.cooling", {
          minutes: Math.ceil(charge.nextChargeInMs / 60000),
        });
  return (
    <button
      type="button"
      className="chip-button"
      aria-label={t("chip.analyze")}
      title={label}
      aria-pressed={state.phase === "picking"}
      aria-disabled={offline || !charge.charges}
      data-refused={refused || undefined}
      data-offline={offline || undefined}
      onAnimationEnd={() => setRefused(false)}
      onClick={() => {
        if (offline) {
          const readout = state.readout;
          if (
            !readout ||
            readout.text !== t("chip.offline_line") ||
            now - readout.receivedAt > 30000
          )
            controller.readout(t("chip.offline_line"));
          return;
        }
        const accepted = controller.toggle();
        playCue(
          accepted
            ? "comms-norichat-chip-toggle"
            : "comms-norichat-chip-refuse",
        );
        if (!accepted) setRefused(true);
      }}
    >
      <Cpu size={17} />
      <span
        className="chip-charge-meter"
        style={{
          opacity: charge.capacity
            ? 0.5 + (0.5 * charge.charges) / charge.capacity
            : 0.5,
        }}
        aria-hidden="true"
      >
        {charge.charges}
      </span>
    </button>
  );
}
export function ChipReadout({ controller, locale }: ChipProps) {
  const { readout } = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
  );
  const [count, setCount] = useState(0);
  const [expired, setExpired] = useState(false);
  const t = useMemo(() => createSourceTranslate(locale), [locale]);
  const characters = useMemo(() => Array.from(readout?.text ?? ""), [readout]);
  useEffect(() => {
    setExpired(false);
    setCount(0);
    if (!readout) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let interval: ReturnType<typeof setInterval> | undefined;
    if (reduced) setCount(characters.length);
    else {
      const start = Date.now();
      interval = setInterval(() => {
        const next = Math.min(
          characters.length,
          Math.floor((Date.now() - start) / 28),
        );
        setCount(next);
        if (next === characters.length) clearInterval(interval);
      }, 28);
    }
    const timer = setTimeout(
      () => setExpired(true),
      Math.max(0, readout.receivedAt + 30000 - Date.now()),
    );
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [readout, characters]);
  if (!readout || expired) return null;
  return (
    <div className="chip-readout" role="status" aria-label={readout.text}>
      <div>{t("chip.readout_header")}</div>
      <span aria-hidden="true">
        {characters.slice(0, count).join("")}
        {count < characters.length && "▌"}
      </span>
    </div>
  );
}
export function ChipOverlay({
  controller,
  locale,
  store,
  upgraded,
  playCue,
}: ChipProps & {
  store: WindowStore;
  upgraded: boolean;
  playCue(cue: string): void;
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  const windows = store((snapshot) => snapshot.windows);
  const order = store((snapshot) => snapshot.windowOrder);
  const exclusive = store((snapshot) => snapshot.exclusiveWindowId);
  const [hover, setHover] = useState<ChipTarget | null>(null);
  const [nori, setNori] = useState<ChipTarget | null>(null);
  const t = useMemo(() => createSourceTranslate(locale), [locale]);
  useEffect(() => {
    if (state.phase !== "picking") {
      setHover(null);
      return;
    }
    const update = () => {
      const canvas = document.querySelector(".nori-stage canvas");
      const rect = canvas ? noriScanBounds(canvas) : null;
      if (rect)
        setNori({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          instanceId: "nori:self",
          appId: "nori",
          windowType: "billboard",
          contentKey: "nori:self",
          title: t("chip.nori"),
        });
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        controller.cancel();
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("keydown", key, true);
    };
  }, [state.phase, controller, t]);
  if (state.phase === "idle") return null;
  const targets = order.flatMap((id) => {
    const window = windows[id];
    return !window || window.minimized || id === exclusive
      ? []
      : [
          {
            ...window,
            contentKey: controller.contentKeys.get(id) ?? `app:${window.appId}`,
          },
        ];
  });
  const target = state.phase === "scanning" ? state.target : hover;
  const availability = target
    ? chipAvailability(target.appId, upgraded)
    : "ready";
  return (
    <div
      className="chip-overlay"
      data-phase={state.phase}
      data-fried={state.fried || undefined}
      style={{ zIndex: NORI_SHELL_LAYERS.SCAN_OVERLAY }}
      onPointerDown={() => {
        if (state.phase === "picking") controller.cancel();
      }}
    >
      {state.phase === "picking" &&
        [...(nori ? [{ ...nori, zIndex: 1 }] : []), ...targets].map(
          (target) => (
            <button
              key={target.instanceId}
              className="chip-target"
              data-chip-target={target.instanceId}
              data-chip-scannable={
                chipAvailability(target.appId, upgraded) === "ready" ||
                undefined
              }
              aria-label={target.title}
              aria-disabled={
                chipAvailability(target.appId, upgraded) !== "ready"
              }
              style={{
                left: target.x,
                top: target.y,
                width: target.width,
                height: target.height,
                zIndex: target.zIndex,
              }}
              onFocus={() => setHover(target)}
              onBlur={() => setHover(null)}
              onPointerEnter={() => setHover(target)}
              onPointerLeave={() => setHover(null)}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                if (chipAvailability(target.appId, upgraded) !== "ready") {
                  playCue("comms-norichat-chip-refuse");
                  return;
                }
                void controller.scan(target);
              }}
            />
          ),
        )}
      <div className="chip-overlay-effects">
        {target ? (
          <div
            className="chip-target-outline"
            data-availability={availability}
            style={{
              left: target.x,
              top: target.y,
              width: target.width,
              height: target.height,
            }}
          >
            {state.phase === "scanning" && <div className="chip-scan-line" />}
            <span>
              {target.title}
              {availability !== "ready" &&
                ` · ${t(availability === "low_power" ? "chip.low_power" : "chip.cannot_analyze")}`}
            </span>
          </div>
        ) : (
          <div className="chip-pick-shade" />
        )}
        <p className="chip-pick-hint">
          {state.phase === "picking" ? t("chip.pick_hint") : t("chip.scanning")}
          {state.phase === "picking" && " · Esc"}
        </p>
      </div>
    </div>
  );
}

export function ChipUpgradeNotice({
  controller,
  locale,
  lastNoriAt,
}: ChipProps & { lastNoriAt: number }) {
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  const [acknowledged, setAcknowledged] = useState(() => {
    try {
      return localStorage.getItem("nori.chip.upgrade_notice.ack") === "1";
    } catch {
      return true;
    }
  });
  const [ready, setReady] = useState(false);
  const t = useMemo(() => createSourceTranslate(locale), [locale]);
  useEffect(() => {
    setReady(false);
    const timer = setTimeout(
      () => setReady(true),
      Math.max(0, lastNoriAt + 8000 - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [lastNoriAt]);
  if (acknowledged || !ready || state.phase === "picking") return null;
  return (
    <aside className="chip-upgrade-notice">
      <p>{t("chip.upgraded_notice")}</p>
      <button
        type="button"
        onClick={() => {
          setAcknowledged(true);
          try {
            localStorage.setItem("nori.chip.upgrade_notice.ack", "1");
          } catch {
            /* Session acknowledgement still applies. */
          }
        }}
      >
        {t("chip.upgraded_ack")}
      </button>
    </aside>
  );
}
