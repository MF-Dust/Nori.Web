import { chipCharge, type ChipStatus } from "../runtime/chip-controller";
import { createSourceTranslate } from "./translate";

export function chipButtonLabel(
  status: ChipStatus | null, receivedAt: number, now: number,
  connected: boolean, offline: boolean, locale: string,
): string {
  const t = createSourceTranslate(locale);
  if (offline) return t("chip.offline");
  if (!connected) return t("chip.readout_unavailable");
  if (!status) return t("chip.loading");
  const charge = chipCharge(status, receivedAt, now);
  return charge.charges > 0 ? t("chip.charge", charge)
    : t("chip.cooling", { minutes: Math.ceil(charge.nextChargeInMs / 60000) });
}

/** Translate the local backend's fixed readouts without rewriting custom scan text. */
export function localizeChipReadout(text: string, locale: string): string {
  const t = createSourceTranslate(locale);
  const logged = /^(Fresh readout logged|Archived scan replay) — key=(.*), row=(.*)$/s.exec(text);
  if (logged)
    return t(logged[1] === "Fresh readout logged" ? "chip.readout_fresh" : "chip.readout_archived");
  const thermal = /^\[(.*)\] chip thermal lock — heat (\d+)\/(\d+); wait for cooldown$/s.exec(text);
  if (thermal)
    return t("chip.readout_thermal_lock", {
      heat: thermal[2], capacity: thermal[3],
    });
  if (text === "[chip] manifold link unavailable")
    return t("chip.readout_unavailable");
  return text;
}
