import {
  useGraphicsSettings,
  type GraphicsMode,
} from "../state/graphics-store";

export interface GpuInfo {
  renderer: string;
  tier: "low" | "mid" | "high";
  software: boolean;
}
const softwarePattern = /swiftshader|llvmpipe|software|basic render/;

/** Shipped index aS/oS classification, including the empty-renderer fallback. */
export function classifyGpu(renderer: string): GpuInfo {
  const name = renderer.toLowerCase();
  const software = softwarePattern.test(name);
  const tier = !name
    ? "high"
    : software || /\bmali\b|adreno|videocore|powervr/.test(name)
      ? "low"
      : /intel/.test(name)
        ? /\barc\b/.test(name)
          ? "mid"
          : "low"
        : /radeon\(tm\) graphics|amd.*vega \d/.test(name)
          ? "mid"
          : "high";
  return { renderer, tier, software };
}

let cached: GpuInfo | undefined;
export function detectGpu(): GpuInfo {
  if (cached) return cached;
  let renderer = "";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (gl) {
      try {
        const extension = gl.getExtension("WEBGL_debug_renderer_info");
        renderer = String(
          gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER) ??
            "",
        );
      } finally {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    }
  } catch {}
  return (cached = classifyGpu(renderer));
}

export function automaticGraphicsMode(gpu: GpuInfo): GraphicsMode {
  return gpu.software
    ? "ultra-performance"
    : gpu.tier !== "low"
      ? "quality"
      : /\b(?:uhd|hd) graphics\b/.test(gpu.renderer.toLowerCase())
        ? "ultra-performance"
        : "performance";
}

export function initializeGraphics() {
  try {
    localStorage.removeItem("adaptive-quality");
  } catch {}
  const settings = useGraphicsSettings.getState();
  if (settings.source === "auto")
    settings.setModeAuto(automaticGraphicsMode(detectGpu()));
}
