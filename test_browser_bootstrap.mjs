// Browser-level smoke test: the restored public frontend reaches the local
// ticket endpoint and opens both verified Arcade sockets without page errors.
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const port = Number(process.env.NORI_E2E_PORT || 4183);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.env.PYTHON || "python", ["server.py"], {
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
  const page = await browser.newPage();
  const errors = [];
  const sockets = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("websocket", (socket) => sockets.push(socket.url()));

  const response = await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  if (!response?.ok()) throw new Error(`Page load returned ${response?.status()}`);
  const bypass = page.getByText("仍要进入");
  if (await bypass.count()) await bypass.click();
  await page.waitForFunction(
    () => performance.getEntriesByType("resource").some((entry) => entry.name.includes("/api/arcade/ws-ticket")),
    undefined,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(1_500);
  await browser.close();

  if (!sockets.some((url) => url.endsWith("/api/arcade/web/v1"))) throw new Error("Main Arcade socket did not open");
  if (!sockets.some((url) => url.endsWith("/api/arcade/web/v1/media"))) throw new Error("Media Arcade socket did not open");
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.log("[ok] shipped frontend bootstraps against the local Arcade service");
} finally {
  server.kill("SIGTERM");
}
