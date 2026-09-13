import assert from "node:assert/strict";
import { resolve } from "node:path";

// A small authored, deterministic PDF. No external document fixture is needed.
function pdfFixture() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 600] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ...["Preview page one", "Preview page two"].map((text) => {
      const stream = `BT /F1 24 Tf 30 300 Td (${text}) Tj ET`;
      return `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    }),
  ];
  let content = "%PDF-1.4\n",
    offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(content.length);
    content += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = content.length;
  content +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((offset) => String(offset).padStart(10, "0") + " 00000 n \n")
      .join("");
  return Buffer.from(
    content +
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  );
}
export async function verifyPreview(browser, output) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
  });
  const errors = [],
    historical = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/PreviewScreen-|pdfRenderWorker-|pdf-o1CUHkl/.test(request.url()))
      historical.push(request.url());
  });
  await page.route("**/preview-fixture.pdf", (route) =>
    route.fulfill({ contentType: "application/pdf", body: pdfFixture() }),
  );
  await page.route("**/preview-harness*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html class="dark theme-nori"><body style="margin:0;background:#161a1e"><div id="root" style="width:850px;height:650px;margin:40px auto"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-preview-harness.tsx")}"></script></body></html>`,
    }),
  );
  try {
    await page.goto("http://127.0.0.1:47174/preview-harness");
    await page
      .locator('.pdf-page[data-page-number="1"] .textLayer')
      .getByText("Preview page one", { exact: true })
      .waitFor();
    assert.equal(await page.locator(".pdf-thumbnails button").count(), 2);
    assert.ok(
      await page
        .locator(".pdf-page canvas")
        .first()
        .evaluate((canvas) => {
          const data = canvas
            .getContext("2d")
            .getImageData(0, 0, canvas.width, canvas.height).data;
          let dark = 0;
          for (let i = 0; i < data.length; i += 4)
            if (data[i] < 100 && data[i + 3] > 0) dark++;
          return dark > 50;
        }),
      "PDF canvas must contain painted text",
    );
    await page.getByRole("textbox").fill("2");
    await page.getByRole("textbox").press("Enter");
    await page
      .locator('.pdf-page[data-page-number="2"] .textLayer')
      .getByText("Preview page two", { exact: true })
      .waitFor();
    const zoom = Number(
      (await page.locator(".pdf-percent").innerText()).replace("%", ""),
    );
    await page.locator(".pdf-toolbar button").nth(2).click();
    await page.waitForFunction(
      (old) =>
        Number(
          document.querySelector(".pdf-percent").textContent.replace("%", ""),
        ) > old,
      zoom,
    );
    await page.locator(".pdf-scroller").focus();
    await page.keyboard.press("Control+0");
    await page.waitForFunction(
      () => document.querySelector(".pdf-percent").textContent === "100%",
    );
    await page.screenshot({ path: resolve(output, "preview-pdf.png") });
    await page.locator(".pdf-toolbar button").first().click();
    assert.equal(await page.locator(".pdf-thumbnails").count(), 0);
    await page.goto("http://127.0.0.1:47174/preview-harness?kind=text");
    await page.locator(".preview-clue").waitFor();
    assert.equal(await page.locator(".preview-clue").innerText(), "clue");
    assert.ok(
      (await page.locator(".preview-text").innerText()).includes(
        "<script>literal</script>",
      ),
    );
    assert.equal(await page.locator(".preview-text script").count(), 0);
    await page.goto("http://127.0.0.1:47174/preview-harness?kind=training-log");
    await page.locator(".preview-training-turn").first().waitFor();
    assert.equal(
      await page.locator('.preview-training-turn[data-sender="agent"]').count(),
      1,
    );
    assert.equal(
      await page
        .locator('.preview-training-turn[data-sender="player"]')
        .count(),
      1,
    );
    assert.equal(
      await page.locator(".preview-training-poem").innerText(),
      "First line\nSecond line",
    );
    await page.screenshot({
      path: resolve(output, "preview-training-log.png"),
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(historical, []);
    console.log(
      "Preview probe passed: rendered PDF, selectable text, mixed page dimensions, navigation, zoom, sidebar, literal markers and training log.",
    );
  } catch (error) {
    console.error(
      "Preview errors",
      errors,
      await page.locator("body").innerText(),
    );
    await page.screenshot({ path: resolve(output, "preview-failure.png") });
    throw error;
  } finally {
    await page.close();
  }
}
export async function verifyChip(page, output) {
  await page.evaluate(() => {
    const socket = window.sourceSmoke.sockets.find(
      (item) =>
        item.url.endsWith("/api/arcade/web/v1") && item.readyState === 1,
    );
    socket.send(
      JSON.stringify({
        type: "event",
        channel: "manifold.command.request",
        requestId: "smoke-chip-repaired",
        payload: {
          command: "client.emitFact",
          payload: { factId: "system.repaired" },
        },
      }),
    );
  });
  const button = page.locator(".chip-button");
  await button.waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector(".chip-button")?.getAttribute("aria-disabled") ===
      "false",
  );
  await button.click();
  await page.locator('[data-phase="picking"]').waitFor();
  await page.keyboard.press("Escape");
  await page.locator(".chip-overlay").waitFor({ state: "detached" });
  await button.click();
  const target = page.locator('[data-chip-target="nori:self"]');
  assert.ok(
    (await target.boundingBox()).width < 900,
    "Nori scan target must follow model parts, not the full canvas",
  );
  await target.click();
  await page.locator('[data-phase="scanning"]').waitFor();
  await page.screenshot({ path: resolve(output, "chip-scanning.png") });
  await page.locator(".chip-readout").waitFor();
  await page.locator(".chip-overlay").waitFor({ state: "detached" });
  assert.ok(
    (await page.locator(".chip-readout").getAttribute("aria-label")).length > 0,
  );
  await page.waitForFunction(() => {
    const box = document.querySelector(".chip-readout");
    return (
      box?.querySelector("span")?.textContent ===
      box?.getAttribute("aria-label")
    );
  });
  await page.screenshot({ path: resolve(output, "chip-readout.png") });
  const before = await page.evaluate(
    () =>
      window.sourceSmoke.sent.filter(
        (item) => item.channel === "manifold.artifacts.request",
      ).length,
  );
  await page.locator('[data-nori-dock] [data-app-id="mail"]').click();
  await page.getByRole("button", { name: "Compose", exact: true }).waitFor();
  await button.click();
  const mail = page.locator('.chip-target[aria-label="Mail"]');
  await mail.click();
  await page.waitForFunction(() =>
    window.sourceSmoke.sent.some(
      (item) =>
        item.channel === "manifold.chip.scan" &&
        item.payload.contentKey.startsWith("mail:"),
    ),
  );
  await page.locator(".chip-overlay").waitFor({ state: "detached" });
  const after = await page.evaluate(
    () =>
      window.sourceSmoke.sent.filter(
        (item) => item.channel === "manifold.artifacts.request",
      ).length,
  );
  assert.ok(
    after - before < 12,
    "artifact responses must not cause a reload loop",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  console.log(
    "Chip probe passed: fact unlock, status, Escape cancellation, target scan and backend readout.",
  );
}
