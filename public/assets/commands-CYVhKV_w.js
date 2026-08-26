import { I as o } from "./NormalApp-Cn6agT0F.js";
import "./i18n-DtIC1LRi.js";
async function i(n, a, r) {
  const s = await o(n, a, r);
  return s.ok ? (s.result ?? {}) : null;
}
async function c(n, a) {
  return i(n, "signal.recover", { recoveryCode: a });
}
async function l(n, a, r) {
  return i(n, "signal.login", { username: a, password: r });
}
export { c as a, l as s };
