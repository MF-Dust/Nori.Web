#!/usr/bin/env node
/**
 * Self-host the web fonts the original NoriOS client pulls from Google Fonts
 * and jsDelivr, then regenerate `public/fonts.css`.
 *
 * The reference client links these stylesheets from index.html or injects
 * them at runtime. Those CDNs can be slow or unreachable for local users, so
 * this script mirrors the same families/axes into `public/fonts/web/` and
 * keeps the original unicode-range subsetting, so browsers still download
 * only the slices a page actually renders.
 *
 * Usage: node scripts/fonts/sync_web_fonts.mjs
 */
import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = join(ROOT, "public");
const OUT_DIR = join(PUBLIC, "fonts", "web");
const CSS_OUT = join(PUBLIC, "fonts.css");

// A current desktop Chrome UA makes Google Fonts answer with woff2 +
// unicode-range subsets instead of a single legacy TTF.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

// Axis specs are the union of every request the reference client makes.
// Families the reference client links but never references in a
// font-family declaration (Chiron GoRound TC, Literata, Fusion Pixel 10px)
// are intentionally not mirrored.
const GOOGLE_FAMILIES = [
  { slug: "plus-jakarta-sans", query: "Plus+Jakarta+Sans:wght@400;500;600;700" },
  { slug: "noto-sans-sc", query: "Noto+Sans+SC:wght@400;500;600;700" },
  { slug: "noto-sans-jp", query: "Noto+Sans+JP:wght@400;500;600;700" },
  {
    slug: "bodoni-moda",
    query: "Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..700",
  },
  {
    slug: "newsreader",
    query: "Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600",
  },
  { slug: "ibm-plex-mono", query: "IBM+Plex+Mono:wght@400;500;600;700" },
  { slug: "fredoka", query: "Fredoka:wght@400;500;600;700" },
  { slug: "crimson-pro", query: "Crimson+Pro:wght@400;500;600" },
  { slug: "quicksand", query: "Quicksand:wght@400;500;600" },
  { slug: "nunito", query: "Nunito:wght@400;500;600;700;800" },
  { slug: "lilita-one", query: "Lilita+One" },
];

// zh-CN copy uses the simplified (GB) LXGW WenKai build, as in the reference.
const LXGW_BASE = "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/";
const LXGW_SHEETS = ["lxgwwenkai-regular.css", "lxgwwenkai-light.css"];

// Self-hosted faces that ship with the original client. These mirror the
// reference stylesheet exactly (discrete 400/700 weights, so a 600 request
// resolves to the bold Sarasa file just like the reference build).
const STATIC_FACES = `/* === Self-hosted faces shipped by the reference client === */
@font-face {
  font-family: "SarasaFixed";
  src: url("/fonts/sarasa-fixed-sc.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "SarasaFixed";
  src: url("/fonts/sarasa-fixed-sc-bold.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: "Fusion Pixel 12px Proportional SC";
  src: url("/fonts/fusion-pixel-12px-proportional-sc.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Fusion Pixel 12px Monospaced SC";
  src: url("/fonts/fusion-pixel-12px-monospaced-sc.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Press Start 2P";
  src: url("/fonts/press-start-2p-latin.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "VT323";
  src: url("/fonts/vt323-latin.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Silkscreen";
  src: url("/fonts/silkscreen-latin.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Silkscreen";
  src: url("/fonts/silkscreen-bold-latin.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}
`;

async function fetchOk(url, init) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (error) {
      if (attempt >= 4) throw new Error(`${url}: ${error.message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

function parseFaces(css) {
  const faces = [];
  for (const block of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const props = {};
    for (const decl of block[1].split(";")) {
      const i = decl.indexOf(":");
      if (i < 0) continue;
      props[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
    }
    const src = props.src?.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1];
    if (!props["font-family"] || !src) throw new Error(`unparseable @font-face: ${block[0]}`);
    faces.push({
      family: props["font-family"].replace(/^['"]|['"]$/g, ""),
      style: props["font-style"] ?? "normal",
      weight: props["font-weight"] ?? "400",
      stretch: props["font-stretch"],
      range: props["unicode-range"],
      src,
    });
  }
  return faces;
}

/** Collapse faces that differ only by weight but share one variable file. */
function collapseWeights(faces) {
  const groups = new Map();
  for (const face of faces) {
    const key = [face.family, face.style, face.stretch, face.range, face.src].join("\u0000");
    const weights = face.weight.split(/\s+/).map(Number);
    const group = groups.get(key);
    if (group) {
      group.min = Math.min(group.min, ...weights);
      group.max = Math.max(group.max, ...weights);
    } else {
      groups.set(key, { ...face, min: Math.min(...weights), max: Math.max(...weights) });
    }
  }
  return [...groups.values()].map(({ min, max, ...face }) => ({
    ...face,
    weight: min === max ? String(min) : `${min} ${max}`,
  }));
}

const downloads = new Map(); // remote url -> public path

function localPathFor(slug, remote) {
  const name = posix.basename(new URL(remote).pathname);
  const local = `/fonts/web/${slug}/${name}`;
  const owner = [...downloads.entries()].find(([, p]) => p === local);
  if (owner && owner[0] !== remote) {
    const hash = createHash("sha1").update(remote).digest("hex").slice(0, 8);
    return `/fonts/web/${slug}/${hash}-${name}`;
  }
  return local;
}

function renderFace(face, local) {
  const lines = [
    `  font-family: "${face.family}";`,
    `  font-style: ${face.style};`,
    `  font-weight: ${face.weight};`,
  ];
  if (face.stretch) lines.push(`  font-stretch: ${face.stretch};`);
  lines.push("  font-display: swap;", `  src: url("${local}") format("woff2");`);
  if (face.range) lines.push(`  unicode-range: ${face.range};`);
  return `@font-face {\n${lines.join("\n")}\n}`;
}

async function collect() {
  const sections = [];
  for (const { slug, query } of GOOGLE_FAMILIES) {
    const url = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
    const css = await (await fetchOk(url, { headers: { "user-agent": UA } })).text();
    const faces = collapseWeights(parseFaces(css));
    const rendered = faces.map((face) => {
      const local = downloads.get(face.src) ?? localPathFor(slug, face.src);
      downloads.set(face.src, local);
      return renderFace(face, local);
    });
    sections.push(`/* ${faces[0].family} — ${url} */\n${rendered.join("\n")}`);
  }

  for (const sheet of LXGW_SHEETS) {
    const url = LXGW_BASE + sheet;
    const css = await (await fetchOk(url)).text();
    const faces = parseFaces(css).map((face) => ({ ...face, src: new URL(face.src, url).href }));
    const rendered = faces.map((face) => {
      const local = localPathFor("lxgw-wenkai", face.src);
      downloads.set(face.src, local);
      return renderFace(face, local);
    });
    sections.push(`/* LXGW WenKai (GB) — ${url} */\n${rendered.join("\n")}`);
  }
  return sections;
}

async function downloadAll() {
  const queue = [...downloads.entries()];
  let done = 0;
  let bytes = 0;
  const worker = async () => {
    while (queue.length) {
      const [remote, local] = queue.shift();
      const body = Buffer.from(await (await fetchOk(remote, { headers: { "user-agent": UA } })).arrayBuffer());
      if (body.subarray(0, 4).toString("latin1") !== "wOF2") throw new Error(`${remote}: not woff2`);
      const target = join(PUBLIC, ...local.split("/").filter(Boolean));
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
      bytes += body.length;
      if (++done % 100 === 0) console.log(`  ${done}/${downloads.size}`);
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  return bytes;
}

const sections = await collect();
await rm(OUT_DIR, { recursive: true, force: true });
const bytes = await downloadAll();

const header = `/* Local typography for NoriOS.
 *
 * GENERATED by scripts/fonts/sync_web_fonts.mjs — do not edit by hand.
 * Web fonts mirror the families the reference client loads from Google Fonts
 * and jsDelivr; files live under /fonts/web/ and keep their unicode-range
 * subsets. All mirrored fonts are SIL OFL 1.1 (see /legal/fonts/).
 */
`;
await writeFile(CSS_OUT, `${header}\n${STATIC_FACES}\n${sections.join("\n\n")}\n`);
console.log(`fonts.css: ${sections.length} sections, ${downloads.size} files, ${(bytes / 1048576).toFixed(1)} MiB`);
