import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";
import { probeLaunchOptions } from "../../scripts/lib/probe_launch.mjs";

// Shipped MailScreen's two panes, reader and post-progress download against real pack artifacts.
test("Mail renders two panes, preserves fact reads, refuses compose and completes downloads only after progress", async (t) => {
  const vite = await createServer({
    configFile: "frontend-src/app.vite.config.ts",
    server: { host: "127.0.0.1", port: 0, hmr: false },
  });
  await vite.listen();
  t.after(() => vite.close());
  const browser = await chromium.launch(probeLaunchOptions());
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1000, height: 740 }, locale: "en-US" });
  page.setDefaultTimeout(15_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/mail-harness", (route) => route.fulfill({
    contentType: "text/html",
    body: `<html class="dark theme-nori"><body style="margin:0"><div id="root" style="width:900px;height:600px;margin:40px"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend/harness/frontend-mail-screen.tsx")}"></script></body></html>`,
  }));
  await page.goto(`${vite.resolvedUrls.local[0]}mail-harness`);
  const help = () => page.locator("aside button").filter({ hasText: "请帮帮我" });
  const qfr = () => page.locator("aside button").filter({ hasText: "你还好吗？" });
  await help().waitFor();
  assert.equal(await page.locator("#root > div > aside").count(), 1);
  assert.equal(await page.locator("#root > div > main").count(), 1);
  const sidebar = await page.locator("aside").boundingBox();
  const reader = await page.locator("main").boundingBox();
  assert.equal(sidebar.width, 256);
  assert.equal(reader.x, sidebar.x + sidebar.width, "no separate third pane");
  assert.ok((await page.locator("#root").innerText()).includes("Select an email to read"));
  assert.doesNotMatch(await page.locator("#root").innerText(), /Invalid Date|mail\.(?:selectEmail|messageCount|empty)/);
  assert.deepEqual(await page.evaluate(() => window.mailFixture.metrics.cues), []);

  await help().click();
  await page.locator("main h1").filter({ hasText: "请帮帮我" }).waitFor();
  await page.waitForFunction(() => window.mailFixture.metrics.read.includes("mail.help"));
  const image = page.locator('main img[src="/webAssets/mail/unknown-room-4a1441343515.jpg"]');
  await image.waitFor();
  await page.waitForFunction(() => document.querySelector("main img")?.naturalWidth === 650);
  assert.equal(await image.getAttribute("width"), "650");
  assert.equal(await image.getAttribute("height"), "405");
  assert.ok((await image.boundingBox()).height > 192, "image is not cropped to the old thumbnail row");
  assert.ok((await page.locator("main").innerText()).includes("To: 我 <me@manifold.institute>"));
  assert.equal(await page.locator("main hr").count(), 2);
  assert.equal(await page.locator('main div[aria-hidden="true"]').innerText(), "未");
  await help().click();
  assert.deepEqual(await page.evaluate(() => window.mailFixture.metrics.cues), ["comms-mail-open-email"]);
  assert.equal(await page.evaluate(() => window.mailFixture.metrics.commands.filter((item) => item.command === "mail.read" && item.payload.mailId === "mail.help").length), 1);

  await page.evaluate(() => window.mailFixture.mounted(false));
  await page.locator("aside").waitFor({ state: "detached" });
  await page.evaluate(() => window.mailFixture.mounted(true));
  await help().waitFor();
  assert.equal(await help().locator(".rounded-full.bg-primary").count(), 0, "world read_fact survives reopening");
  await page.evaluate(() => window.mailFixture.fact("mail.help.read", false));
  await help().locator(".rounded-full.bg-primary").waitFor();
  await page.evaluate(() => window.mailFixture.fact("mail.help.read", true));
  await help().locator(".rounded-full.bg-primary").waitFor({ state: "detached" });

  await page.getByRole("button", { name: "Compose", exact: true }).click();
  const sheet = () => page.getByRole("dialog", { name: "Network error" });
  await sheet().waitFor();
  assert.equal(await sheet().locator("input,textarea,form").count(), 0);
  assert.ok((await sheet().innerText()).includes("Couldn't connect to the mail server."));
  assert.equal(await page.locator(".nori-vault-sheet.gradient-border").count(), 1);
  await page.keyboard.press("Escape");
  await sheet().waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Compose", exact: true }).click();
  await sheet().waitFor();
  await page.keyboard.press("Enter");
  await sheet().waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Compose", exact: true }).click();
  await sheet().waitFor();
  await page.locator(".nori-vault-scrim").click({ position: { x: 5, y: 5 } });
  await sheet().waitFor({ state: "detached" });
  assert.equal(await page.evaluate(() => window.mailFixture.metrics.cues.filter((cue) => cue === "comms-mail-compose-refused").length), 3);

  await qfr().click();
  await page.getByRole("button", { name: "Download", exact: true }).waitFor();
  await page.clock.install({ time: new Date(2026, 7, 31, 12, 0, 0) });
  await page.clock.pauseAt(new Date(2026, 7, 31, 12, 0, 1));
  await page.getByRole("button", { name: "Download", exact: true }).click({ force: true });
  await page.getByRole("progressbar").waitFor();
  await page.clock.runFor(900);
  await help().click({ force: true });
  await page.locator("main h1").filter({ hasText: "请帮帮我" }).waitFor();
  await page.clock.runFor(1800);
  assert.equal(await page.evaluate(() => window.mailFixture.metrics.commands.filter((item) => item.command === "client.emitFact").length), 0, "reader cleanup cancels the pending fact");

  await qfr().click({ force: true });
  await page.getByRole("button", { name: "Download", exact: true }).waitFor();
  await page.evaluate(() => window.mailFixture.failDownload(true));
  await page.getByRole("button", { name: "Download", exact: true }).click({ force: true });
  await page.getByRole("progressbar").waitFor();
  await page.clock.runFor(1800);
  await page.getByRole("button", { name: "Download", exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.mailFixture.metrics.downloaded), [], "failed fact must not notify or show Downloaded");

  await page.evaluate(() => window.mailFixture.failDownload(false));
  const started = await page.evaluate(() => Date.now());
  await page.getByRole("button", { name: "Download", exact: true }).click({ force: true });
  await page.getByRole("progressbar").waitFor();
  await page.clock.runFor(1799);
  assert.deepEqual(await page.evaluate(() => window.mailFixture.metrics.downloaded), []);
  assert.equal(await page.evaluate(() => window.mailFixture.metrics.commands.filter((item) => item.command === "client.emitFact").length), 1, "the only emit so far is the earlier failure");
  await page.clock.runFor(1);
  await page.getByText("Downloaded", { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.mailFixture.metrics.downloaded), ["qfr.downloaded"]);
  const emitted = await page.evaluate(() => window.mailFixture.metrics.commands.filter((item) => item.command === "client.emitFact").at(-1));
  assert.equal(emitted.at - started, 1800);
  assert.deepEqual(emitted.payload, { factId: "qfr.downloaded" });
  assert.equal(await page.getByRole("button", { name: "Download", exact: true }).count(), 0);

  await page.evaluate(() => window.mailFixture.locale("zh-CN"));
  await page.getByRole("button", { name: "写邮件", exact: true }).waitFor();
  await page.getByRole("button", { name: "写邮件", exact: true }).click({ force: true });
  const chinese = page.getByRole("dialog", { name: "网络错误" });
  await chinese.waitFor();
  assert.ok((await chinese.innerText()).includes("无法连接到邮件服务器。"));
  assert.doesNotMatch(await page.locator("#root").innerText(), /Invalid Date|mail\.(?:selectEmail|messageCount|empty|networkError)/);
  assert.deepEqual(errors, []);
});
