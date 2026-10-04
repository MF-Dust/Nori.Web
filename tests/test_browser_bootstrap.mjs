// Browser-level smoke test: the restored public frontend reaches the local
// ticket endpoint and opens both verified Arcade sockets without page errors.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startBackend } from "../scripts/lib/backend_launch.mjs";

const port = Number(process.env.NORI_E2E_PORT || 4183);
const base = `http://127.0.0.1:${port}`;
const server = await startBackend({
  port,
  stdio: "ignore",
  readyTimeoutMs: 10_000,
});
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const sockets = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("websocket", (socket) => sockets.push(socket.url()));

  const response = await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  if (!response?.ok()) throw new Error(`Page load returned ${response?.status()}`);
  const notice = page.locator("#nori-community-notice");
  assert.equal(await notice.isVisible(), true);
  assert.equal(await notice.getAttribute("href"), "/legal/index.html");
  const popupPromise = context.waitForEvent("page");
  await notice.click();
  const legalPage = await popupPromise;
  await legalPage.waitForLoadState("domcontentloaded");
  assert.match(await legalPage.title(), /非官方/);
  assert.equal((await legalPage.request.get(`${base}/legal/LICENSE`)).ok(), true);
  await legalPage.close();
  const bypass = page.getByText("仍要进入");
  if (await bypass.count()) await bypass.click();
  await page.waitForFunction(
    () => performance.getEntriesByType("resource").some((entry) => entry.name.includes("/api/arcade/ws-ticket")),
    undefined,
    { timeout: 15_000 },
  );
  const opened = (suffix) => sockets.some((url) => url.endsWith(suffix));
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline && !(opened("/api/arcade/web/v1") && opened("/api/arcade/web/v1/media"))) {
    await page.waitForTimeout(100);
  }
  // Exercise the shipped auth plugin's credentials: omit through the shim,
  // then verify a normal cookie-based ticket request uses the same principal.
  const sessionFor = (target) => target.evaluate(async () => {
    const response = await fetch("/api/auth/get-session", { credentials: "omit" });
    return response.json();
  });
  const ticketUserFor = (target) => target.evaluate(async () => {
    const { ticket } = await (await fetch("/api/arcade/ws-ticket", { method: "POST" })).json();
    const payload = ticket.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).u;
  });
  const sessionA = await sessionFor(page);
  assert.equal(await ticketUserFor(page), sessionA.user.id);
  const cookieA = (await page.context().cookies()).find((cookie) => cookie.name === "arcade-auth.session_token");
  assert.equal(cookieA?.value, sessionA.session.token);
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await otherPage.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  const sessionB = await sessionFor(otherPage);
  assert.notEqual(sessionA.user.id, sessionB.user.id);
  assert.equal(await ticketUserFor(otherPage), sessionB.user.id);
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal((await sessionFor(page)).user.id, sessionA.user.id);
  const newTab = await context.newPage();
  await newTab.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  assert.equal((await sessionFor(newTab)).user.id, sessionA.user.id);
  if (!sockets.some((url) => url.endsWith("/api/arcade/web/v1"))) throw new Error("Main Arcade socket did not open");
  if (!sockets.some((url) => url.endsWith("/api/arcade/web/v1/media"))) throw new Error("Media Arcade socket did not open");
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.log("[ok] shipped frontend bootstraps with isolated browser identities stable across reloads/tabs");
} finally {
  await browser?.close();
  await server.stop();
}
