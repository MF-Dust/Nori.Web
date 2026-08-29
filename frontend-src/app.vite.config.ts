import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const sourceRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Application-mode build for the future production frontend entry.
 *
 * Unlike vite.config.ts, this bundles React and all runtime dependencies into a
 * deployable application graph. It deliberately writes outside public/ until
 * the migration gate reaches zero pending boundaries.
 */
export default defineConfig({
  root: sourceRoot,
  base: "/",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: resolve(sourceRoot, "../.frontend-app-build"),
    emptyOutDir: true,
    sourcemap: true,
    target: "es2022",
    assetsDir: "assets",
  },
});
