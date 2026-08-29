import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const sourceRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Build the maintainable clean-room source as an ES module library while the
 * production shell is still served from the historical hashed bundles.
 *
 * This gives recovered modules a real bundling contract without claiming the
 * whole legacy UI has already migrated. Once the React root is fully restored,
 * this config can be promoted from library mode to the production app entry.
 */
export default defineConfig({
  root: sourceRoot,
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(sourceRoot, "index.ts"),
      formats: ["es"],
      fileName: "nori-web-recovered",
    },
    outDir: resolve(sourceRoot, "../.frontend-build"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [
        "@xterm/xterm",
        "canvas-confetti",
        "lucide-react",
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "zod",
        "zustand",
      ],
    },
  },
});
