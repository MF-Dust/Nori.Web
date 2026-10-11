import type { Plugin } from "vite";

interface BundleChunk {
  type: "chunk";
  fileName: string;
  facadeModuleId: string | null;
  moduleIds: string[];
  imports: string[];
  viteMetadata?: { importedCss: Set<string> };
}

/**
 * `main.tsx` selects its screen with a top-level dynamic import, so the desktop
 * chunk is normally requested only after the entry chunk (React DOM) has been
 * downloaded and evaluated. This injects a tiny route-aware inline script that
 * starts the desktop chunk graph and its CSS in parallel with the entry. The
 * `/landing` route is excluded so it never downloads the desktop. The hints are
 * the exact files Vite's own preload helper requests later, so nothing new is
 * executed and no presentation changes.
 */
export function entryPreloadPlugin(options: { module: string; skipPath: string }): Plugin {
  let base = "/";
  return {
    name: "source-entry-preload",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const bundle = context.bundle;
        const htmlEntry = context.chunk as unknown as BundleChunk | undefined;
        if (!bundle || !htmlEntry) return;
        const chunks = Object.values(bundle).filter((item) => item.type === "chunk") as unknown as BundleChunk[];
        const entry = chunks.find((chunk) => chunk.fileName === htmlEntry.fileName);
        // Dynamic-entry chunks can report a null facade here; match their module list instead.
        const target = chunks.find((chunk) =>
          [chunk.facadeModuleId, ...chunk.moduleIds].some((id) => id?.replace(/\\/g, "/").endsWith(options.module)));
        if (!entry || !target) throw new Error(`entry preload target not found: ${options.module}`);
        const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
        const collect = (chunk: BundleChunk, into: Set<string>) => {
          if (into.has(chunk.fileName)) return;
          into.add(chunk.fileName);
          for (const name of chunk.imports) {
            const dependency = byName.get(name);
            if (dependency) collect(dependency, into);
          }
        };
        const loaded = new Set<string>();
        collect(entry, loaded);
        const graph = new Set<string>();
        collect(target, graph);
        const scripts = [...graph].filter((name) => !loaded.has(name));
        const loadedCss = new Set([...loaded].flatMap((name) => [...(byName.get(name)?.viteMetadata?.importedCss ?? [])]));
        const styles = [...new Set([...graph].flatMap((name) => [...(byName.get(name)?.viteMetadata?.importedCss ?? [])]))]
          .filter((name) => !loadedCss.has(name));
        const files = [...scripts.map((name) => [`${base}${name}`, 0] as const), ...styles.map((name) => [`${base}${name}`, 1] as const)];
        if (!files.length) return;
        const skip = JSON.stringify(options.skipPath.toLowerCase());
        const script =
          `<script>(function(){if(location.pathname.replace(/\\/+$/,"").toLowerCase()===${skip})return;` +
          `${JSON.stringify(files)}.forEach(function(f){var l=document.createElement("link");` +
          `if(f[1]){l.rel="preload";l.as="style"}else l.rel="modulepreload";` +
          `l.crossOrigin="";l.href=f[0];document.head.appendChild(l)})})()</script>`;
        // Run right after the document metadata and before any stylesheet, so the
        // inline script never waits on CSS and the requests start immediately.
        if (!html.includes("</title>")) throw new Error("entry preload needs a <title> anchor in index.html");
        return html.replace("</title>", `</title>\n    ${script}`);
      },
    },
  };
}
