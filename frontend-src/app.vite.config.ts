import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const sourceRoot = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(sourceRoot, "../public");

/**
 * Application-mode build for the future production frontend entry.
 *
 * Dev mode serves the existing static asset tree so migrated screens can use
 * the real fonts/icons/models immediately. The application build deliberately
 * does not copy that large tree into .frontend-app-build; Cloudflare continues
 * to own public/ directly.
 */
export default defineConfig({
  root: sourceRoot,
  base: "/",
  publicDir: publicRoot,
  plugins: [react()],
  build: {
    outDir: resolve(sourceRoot, "../.frontend-app-build"),
    emptyOutDir: true,
    copyPublicDir: false,
    sourcemap: true,
    target: "es2022",
    assetsDir: "assets",
  },
});
