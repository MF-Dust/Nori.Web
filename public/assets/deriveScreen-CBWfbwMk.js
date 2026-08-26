import { j as t } from "./NormalApp-Cn6agT0F.js";
function s(r, e, a) {
  return r
    ? a || r.phase !== t.GAME_OVER || (e && e.phase !== t.GAME_OVER)
      ? "game"
      : "results"
    : e
      ? "game"
      : "start";
}
export { s as d };
