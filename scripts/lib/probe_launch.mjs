import process from "node:process";

/**
 * One WebGL launch policy for every browser probe.
 *
 * The cold-open renderer, the Datasea temporal/TAA chain and Cubism are GPU
 * bound. Forcing `--use-angle=swiftshader` moves all of that onto the CPU and is
 * slow enough to starve the host, so local Windows runs use the real adapter via
 * ANGLE D3D11. CI runners have no GPU, so they keep the software path.
 *
 * `NORI_TEST_ANGLE=d3d11|gl|swiftshader` overrides the choice;
 * `scripts/inspect/probe_webgl_backend.mjs` reports what each backend actually resolves to.
 */
export function probeLaunchOptions() {
  const angle =
    process.env.NORI_TEST_ANGLE ?? (process.platform === "win32" ? "d3d11" : "swiftshader");
  const backends = {
    d3d11: ["--use-gl=angle", "--use-angle=d3d11"],
    gl: ["--use-gl=angle", "--use-angle=gl"],
    swiftshader: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  };
  if (!Object.hasOwn(backends, angle))
    throw new Error(`NORI_TEST_ANGLE must be one of ${Object.keys(backends).join(", ")}`);
  return {
    headless: true,
    executablePath: process.env.NORI_TEST_CHROMIUM || undefined,
    args: backends[angle],
  };
}
