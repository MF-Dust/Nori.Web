import { createSourceTranslate } from "./translate";

/** Translate the local backend's fixed readouts without rewriting custom scan text. */
export function localizeChipReadout(text: string, locale: string): string {
  const t = createSourceTranslate(locale);
  const logged = /^(Fresh readout logged|Archived scan replay) — key=(.*), row=(.*)$/s.exec(text);
  if (logged)
    return t(logged[1] === "Fresh readout logged" ? "chip.readout_fresh" : "chip.readout_archived", {
      key: logged[2], row: logged[3],
    });
  const thermal = /^\[(.*)\] chip thermal lock — heat (\d+)\/(\d+); wait for cooldown$/s.exec(text);
  if (thermal)
    return t("chip.readout_thermal_lock", {
      key: thermal[1], heat: thermal[2], capacity: thermal[3],
    });
  if (text === "[chip] manifold link unavailable")
    return t("chip.readout_unavailable");
  return text;
}
