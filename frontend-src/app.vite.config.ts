import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { pdfAssetsPlugin } from "./pdf-assets-plugin";
import { entryPreloadPlugin } from "./entry-preload-plugin";
import { defineConfig, loadEnv } from "vite";
import { normalizeStaticOrigin, staticAssetUrl } from "./runtime/static-assets";

const sourceRoot = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(sourceRoot, "../public");

/**
 * Application-mode build for the future production frontend entry.
 *
 * Dev mode serves the existing static asset tree so migrated screens can use
 * the real fonts/icons/models immediately. The application build deliberately
 * does not copy that large tree into .artifacts/build/app; Cloudflare continues
 * to own public/ directly.
 */
export default defineConfig(({ mode }) => {
  const origin = normalizeStaticOrigin(process.env.NORI_STATIC_ORIGIN ?? loadEnv(mode, process.cwd(), "NORI_").NORI_STATIC_ORIGIN ?? "");
  return {
    define: { __NORI_STATIC_ORIGIN__: JSON.stringify(origin) },
    root: sourceRoot,
    base: "/",
    publicDir: publicRoot,
    plugins: [
      {
        name: "nori-static-assets",
        transformIndexHtml: {
          order: "pre",
          handler: (html) => html.replace(/(href|src)="([^"]+)"/g, (_match, attr, path) => `${attr}="${staticAssetUrl(path, origin)}"`),
        },
      },
      react(),
      tailwindcss(),
      pdfAssetsPlugin(),
      entryPreloadPlugin({ module: "/source-app.tsx", skipPath: "/landing" }),
    ],
    server: {
      proxy: {
        "/api": {
          target: process.env.NORI_BACKEND_ORIGIN ?? "http://127.0.0.1:4173",
          ws: true,
        },
      },
    },
    build: {
      outDir: resolve(sourceRoot, "../.artifacts/build/app"),
      emptyOutDir: true,
      copyPublicDir: false,
      // Production source maps are not shipped with the Cloudflare asset tree.
      sourcemap: false,
      target: "es2022",
      assetsDir: "assets",
    },
  };
});
