// Browser-level smoke test: the restored public frontend reaches the local
// ticket endpoint and opens both verified Arcade sockets without page errors.
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPy = path.resolve(__dirname, "../server.py");

const port = Number(process.env.NORI_E2E_PORT || 4183);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.env.PYTHON || "python", [serverPy], {
  env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
  stdio: "ignore",
});

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/entry-status`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Local server did not start");
}

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
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
  await browser.close();

  if (!sockets.some((url) => url.endsWith("/api/arcade/web/v1"))) throw new Error("Main Arcade socket did not open");
  if (!sockets.some((url) => url.endsWith("/api/arcade/web/v1/media"))) throw new Error("Media Arcade socket did not open");
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.log("[ok] shipped frontend bootstraps with isolated browser identities stable across reloads/tabs");
} finally {
  server.kill("SIGTERM");
}
