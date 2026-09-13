import type { Live2DModel } from "./engine.js";
import type { WindowRect } from "../state/window-types";
const models = new WeakMap<Element, Live2DModel>();
const parts = [
  "Part",
  "Part3",
  "Part5",
  "Part6",
  "Part7",
  "Part8",
  "Part9",
  "Part42",
  "Part43",
  "Part44",
  "Part61",
  "Part2",
  "Part45",
  "Part47",
  "Part48",
  "Part49",
  "Part50",
  "Part51",
  "Part52",
  "Part53",
  "Part54",
  "Part57",
  "Part58",
  "Part59",
  "Part60",
  "Part63",
  "Part64",
  "Part66",
  "Part67",
];
export function registerScanModel(element: Element, model: Live2DModel) {
  models.set(element, model);
  return () => {
    if (models.get(element) === model) models.delete(element);
  };
}
/** NormalApp Uet: project the original part set and add 14 CSS pixels of padding. */
export function noriScanBounds(element: Element): WindowRect {
  const rect = element.getBoundingClientRect();
  const model = models.get(element);
  const bounds = model?.getPartsBounds(parts);
  const first = bounds && model?.modelToCanvasUV(bounds.left, bounds.top);
  const last = bounds && model?.modelToCanvasUV(bounds.right, bounds.bottom);
  if (!first || !last) return rect;
  const left = Math.max(0, Math.min(first.u, last.u)),
    top = Math.max(0, Math.min(first.v, last.v));
  const right = Math.min(1, Math.max(first.u, last.u)),
    bottom = Math.min(1, Math.max(first.v, last.v));
  if (right <= left || bottom <= top) return rect;
  return {
    x: rect.x + left * rect.width - 14,
    y: rect.y + top * rect.height - 14,
    width: (right - left) * rect.width + 28,
    height: (bottom - top) * rect.height + 28,
  };
}
