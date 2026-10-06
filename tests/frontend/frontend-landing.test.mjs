import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";
import { createServer } from "vite";
import { probeLaunchOptions } from "../../scripts/lib/probe_launch.mjs";

// Run directly: node --test tests/frontend/frontend-landing.test.mjs
// Read the reference as text only; never execute or import the historical app.
const reference = (await readFile("public/assets/IntroPage-BO45BFI5.js", "utf8")).split("  h = x(),")[0];
const historicalAssets = new Set((await readdir("public/assets")).filter((name) => /\.(?:js|css)$/.test(name)));
const windowsAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const macAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

test("source landing preserves the shipped intro without starting the desktop", { timeout: 120_000 }, async (t) => {
  let vite, browser;
  t.after(async () => {
    await browser?.close();
    await vite?.close();
  });
  vite = await createServer({
    configFile: "frontend-src/app.vite.config.ts",
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, hmr: false },
  });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  browser = await chromium.launch(probeLaunchOptions());
  const context = await browser.newContext({
    viewport: { width: 1000, height: 800 }, locale: "en-US", userAgent: windowsAgent, reducedMotion: "reduce",
  });
  // Third-party font/widget availability is not part of this regression.
  // The real iframe src and external link destination are checked below.
  await context.route("**/*", (route) => {
    const request = route.request();
    if (new URL(request.url()).origin === origin) return route.continue();
    return route.fulfill({
      contentType: request.resourceType() === "stylesheet" ? "text/css" : "text/html",
      body: request.resourceType() === "document" ? "<!doctype html><title>External fixture</title>" : "",
    });
  });
  await context.addInitScript(() => {
    if (window === window.top) localStorage.setItem("arcade-language", "en");
  });
  const page = await context.newPage();
  const errors = [], historical = [], desktopImports = [], sockets = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (historicalAssets.has(path.split("/").at(-1))) historical.push(path);
    if (path.endsWith("/source-app.tsx")) desktopImports.push(path);
  });
  page.on("websocket", (socket) => {
    if (new URL(socket.url()).pathname.startsWith("/api/")) sockets.push(socket.url());
  });
  page.setDefaultTimeout(15_000);

  await t.test("original Chinese story, Steam, contact, warnings, assets and styling", async () => {
    assert.ok((await page.goto(`${origin}/landing`, { waitUntil: "domcontentloaded" })).ok());
    await page.locator(".intro-root").waitFor();
    assert.equal(await page.title(), "NORI_OS");
    assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
    assert.equal(await page.evaluate(() => localStorage.getItem("arcade-language")), "en", "landing does not replace the desktop's saved language");
    assert.deepEqual(await page.locator(".intro-section h2").allTextContents(), ["故事导入", "Steam", "联系", "游玩须知"]);
    const text = await page.locator("main").textContent();
    const nonTextKeys = new Set(["pageTitle", "logoAlt", "mobileTitle", "mobileBody", "photo", "photoAlt", "widgetUrl", "bilibiliUrl", "copied"]);
    for (const [, key, quoted] of reference.matchAll(/(\w+):\s*("(?:[^"\\]|\\.)*")/g)) {
      if (!nonTextKeys.has(key)) assert.ok(text.includes(JSON.parse(quoted)), `missing shipped intro text: ${key}`);
    }
    assert.equal(await page.locator(".intro-kbd").textContent(), "Ctrl+D");
    const logo = page.getByRole("img", { name: "I_NORI", exact: true });
    assert.equal(await logo.getAttribute("src"), "/inori-logo.png");
    assert.equal(await logo.getAttribute("draggable"), "false");
    const photo = page.locator(".intro-clip-photo");
    assert.equal(await photo.getAttribute("src"), "/webAssets/meridian_post/pexels-34774346.jpg");
    assert.equal(await photo.getAttribute("alt"), "弗图姆科技产业技术日，演讲者站在巨幅屏幕前。");
    assert.equal(await photo.getAttribute("width"), "1200");
    assert.equal(await photo.getAttribute("height"), "627");
    assert.equal(await photo.getAttribute("loading"), "lazy");
    await photo.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".intro-clip-photo").naturalWidth > 0);
    const widget = page.locator("iframe.intro-steam-widget");
    assert.equal(await widget.getAttribute("src"), "https://store.steampowered.com/widget/4996280/");
    assert.equal(await widget.getAttribute("title"), "Steam");
    assert.equal(await widget.getAttribute("loading"), "lazy");
    assert.equal(await widget.evaluate((element) => getComputedStyle(element).height), "190px");
    assert.deepEqual(await page.evaluate(() => ({
      maxWidth: getComputedStyle(document.querySelector(".intro-page")).maxWidth,
      paddingTop: getComputedStyle(document.querySelector(".intro-page")).paddingTop,
      sectionMargin: getComputedStyle(document.querySelector(".intro-section")).marginTop,
      background: getComputedStyle(document.body).backgroundColor,
      userSelect: getComputedStyle(document.querySelector(".intro-root")).userSelect,
      animation: getComputedStyle(document.querySelector(".intro-rise")).animationName,
    })), { maxWidth: "640px", paddingTop: "104px", sectionMargin: "84px", background: "rgb(5, 7, 10)", userSelect: "text", animation: "none" });
    const bilibili = page.getByRole("link", { name: /space.bilibili.com\/326505494/ });
    assert.equal(await bilibili.getAttribute("href"), "https://space.bilibili.com/326505494");
    assert.equal(await bilibili.getAttribute("target"), "_blank");
    assert.equal(await bilibili.getAttribute("rel"), "noreferrer");
    const [popup] = await Promise.all([page.waitForEvent("popup"), bilibili.click()]);
    await popup.waitForURL("https://space.bilibili.com/326505494");
    assert.equal(await popup.evaluate(() => window.opener), null);
    await popup.close();
    assert.deepEqual(desktopImports, []);
    assert.deepEqual(sockets, []);
    assert.deepEqual(historical, []);
  });

  await t.test("QQ and email copy through Clipboard API with 1800ms feedback", async () => {
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.evaluate(() => {
      window.contactCopies = [];
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: async (value) => { window.contactCopies.push(value); },
      } });
    });
    for (const value of ["1041616195", "1107531061", "info@inori.ai"]) {
      const row = page.locator("button.intro-row").filter({ hasText: value });
      if (value === "1041616195") {
        await row.focus();
        await page.keyboard.press("Enter");
      } else await row.click();
      await page.waitForFunction((value) => Array.from(document.querySelectorAll("button.intro-row")).some((row) =>
        row.querySelector(".intro-row-value").textContent === value && row.querySelector(".intro-row-hint").dataset.copied === "true"), value);
      assert.equal(await row.locator(".intro-row-hint").textContent(), "已复制");
      assert.equal(await page.locator('[data-copied="true"]').count(), 1);
    }
    assert.deepEqual(await page.evaluate(() => window.contactCopies), ["1041616195", "1107531061", "info@inori.ai"]);
    await page.clock.fastForward(1799);
    assert.equal(await page.locator('[data-copied="true"]').count(), 1);
    await page.clock.fastForward(1);
    assert.equal(await page.locator('[data-copied="true"]').count(), 0);
    assert.deepEqual(await page.locator("button.intro-row .intro-row-hint").allTextContents(), ["点击复制", "点击复制", "点击复制"]);
  });

  await t.test("denied or missing Clipboard API falls back without false success or leaked textareas", async () => {
    await page.evaluate(() => {
      window.legacyCopies = [];
      navigator.clipboard.writeText = async () => { throw new Error("denied"); };
      document.execCommand = (command) => {
        const textarea = document.activeElement;
        window.legacyCopies.push({ command, value: textarea.value, readonly: textarea.hasAttribute("readonly"), selected: textarea.selectionEnd - textarea.selectionStart });
        return true;
      };
    });
    await page.locator("button.intro-row").filter({ hasText: "1041616195" }).click();
    assert.equal(await page.locator('[data-copied="true"]').count(), 1);
    assert.equal(await page.locator("textarea").count(), 0);
    await page.clock.fastForward(1800);
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }));
    await page.locator("button.intro-row").filter({ hasText: "1107531061" }).click();
    assert.equal(await page.locator('[data-copied="true"]').count(), 1);
    assert.deepEqual(await page.evaluate(() => window.legacyCopies), [
      { command: "copy", value: "1041616195", readonly: true, selected: 10 },
      { command: "copy", value: "1107531061", readonly: true, selected: 10 },
    ]);
    await page.clock.fastForward(1800);
    for (const throws of [false, true]) {
      await page.evaluate((throws) => {
        document.execCommand = () => { if (throws) throw new Error("copy failed"); return false; };
      }, throws);
      await page.locator("button.intro-row").filter({ hasText: "info@inori.ai" }).click();
      assert.equal(await page.locator('[data-copied="true"]').count(), 0);
      assert.equal(await page.locator("textarea").count(), 0);
    }
  });

  await t.test("case/trailing-slash route, Mac bookmark and START preserve the other-path desktop bootstrap", async () => {
    // Stub only the desktop module, not main.tsx, to verify its original export
    // is selected on other paths without starting backend/GPU story machinery.
    const mac = await browser.newContext({ viewport: { width: 1000, height: 800 }, userAgent: macAgent, reducedMotion: "reduce" });
    await mac.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/source-app.tsx")) return route.fulfill({ contentType: "text/javascript", body: 'export function SourceApp() { return "desktop bootstrap sentinel"; }' });
      if (url.origin !== origin) return route.fulfill({ contentType: route.request().resourceType() === "stylesheet" ? "text/css" : "text/html", body: "" });
      return route.continue();
    });
    const other = await mac.newPage();
    other.on("pageerror", (error) => errors.push(error.message));
    await other.goto(`${origin}/LaNdInG///?entry=regression`, { waitUntil: "domcontentloaded" });
    await other.locator(".intro-root").waitFor();
    assert.equal(await other.locator(".intro-kbd").textContent(), "⌘+D");
    await other.setViewportSize({ width: 1366, height: 900 });
    await Promise.all([other.waitForURL(`${origin}/`), other.getByRole("button", { name: "START", exact: true }).click()]);
    await other.getByText("desktop bootstrap sentinel", { exact: true }).waitFor();
    assert.equal(await other.locator(".intro-root").count(), 0);
    for (const path of ["/landing/child", "/desktop"]) {
      await other.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
      await other.getByText("desktop bootstrap sentinel", { exact: true }).waitFor();
      assert.equal(await other.locator(".intro-root").count(), 0);
    }
    await mac.close();
  });
  assert.deepEqual(errors, [], "landing raised browser errors");
  assert.deepEqual(historical, [], "landing requested a historical bundle");
});
