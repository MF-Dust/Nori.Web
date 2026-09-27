import { chromium } from "playwright";

/**
 * Reports the real WebGL renderer string per ANGLE backend so the probe
 * launch flags are chosen from measurement instead of guesswork.
 * The cold-open renderer is GPU-bound; forcing swiftshader here starves the host.
 */
const candidates = [
  { name: "d3d11", args: ["--use-gl=angle", "--use-angle=d3d11"] },
  { name: "d3d11+gl-dcomp", args: ["--use-gl=angle", "--use-angle=d3d11", "--use-gl-dcomp"] },
  { name: "desktop-gl", args: ["--use-gl=desktop"] },
  { name: "angle-gl", args: ["--use-gl=angle", "--use-angle=gl"] },
  { name: "default", args: [] },
  {
    name: "d3d11-unsafe-swiftshader",
    args: ["--use-gl=angle", "--use-angle=d3d11", "--enable-unsafe-swiftshader"],
  },
];

for (const candidate of candidates) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: candidate.args });
    const page = await browser.newPage();
    const info = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) return { ok: false, reason: "no webgl context" };
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        ok: true,
        version: gl.getParameter(gl.VERSION),
        renderer: ext
          ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          : gl.getParameter(gl.RENDERER),
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : "",
      };
    });
    console.log(candidate.name.padEnd(26), JSON.stringify(info));
  } catch (error) {
    console.log(candidate.name.padEnd(26), "launch failed:", error.message.split("\n")[0]);
  } finally {
    await browser?.close();
  }
}
