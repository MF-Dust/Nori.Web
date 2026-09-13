import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

/** Ship PDF CMaps/fonts/codecs from the pinned package, including offline builds. */
export function pdfAssetsPlugin(): Plugin {
  const root = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../node_modules/pdfjs-dist",
  );
  const assets = new Map<string, string>();
  const discover = async () => {
    if (assets.size) return;
    assets.set("/assets/pdfjs/LICENSE", resolve(root, "LICENSE"));
    for (const folder of ["cmaps", "standard_fonts", "wasm"]) {
      for (const file of await readdir(resolve(root, folder))) {
        if (
          /\.(bcmap|pfb|ttf|wasm|js|mjs)$/.test(file) ||
          file.startsWith("LICENSE")
        )
          assets.set(
            `/assets/pdfjs/${folder}/${file}`,
            resolve(root, folder, file),
          );
      }
    }
  };
  return {
    name: "source-pdf-assets",
    async configureServer(server) {
      await discover();
      server.middlewares.use(async (request, response, next) => {
        const file = assets.get((request.url ?? "").split("?")[0]);
        if (!file) return next();
        try {
          response.setHeader(
            "Content-Type",
            file.endsWith(".wasm")
              ? "application/wasm"
              : /\.m?js$/.test(file)
                ? "text/javascript"
                : "application/octet-stream",
          );
          response.end(await readFile(file));
        } catch (error) {
          next(error);
        }
      });
    },
    async generateBundle() {
      await discover();
      for (const [url, file] of assets)
        this.emitFile({
          type: "asset",
          fileName: url.slice(1),
          source: await readFile(file),
        });
    },
  };
}
