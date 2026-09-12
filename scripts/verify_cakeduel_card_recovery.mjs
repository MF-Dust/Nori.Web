#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

async function findCakeDuelChunk() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  for (const file of assets.filter((name) => name.startsWith("GameScreen-") && name.endsWith(".js"))) {
    const content = await read(path.join("public", "assets", file));
    if (content.includes("cakeduel.game.turn_") && content.includes("cakeduel.game.action.callBluff")) {
      return content;
    }
  }
  throw new Error("missing shipped Cake Duel GameScreen chunk");
}

async function main() {
  const shipped = await findCakeDuelChunk();
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  const sizeHelperFile = assets.find(
    (file) => file.startsWith("useElementSize-") && file.endsWith(".js"),
  );
  assert(sizeHelperFile, "missing shipped Cake Duel palette/useElementSize chunk");
  const shippedSizeHelper = await read(path.join("public", "assets", sizeHelperFile));

  const source = await read("frontend-src/apps/cakeduel-card-presentation.ts");
  const context = await read("frontend-src/screens/cakeduel-layout-context.tsx");

  for (const marker of [
    "cardWidth: 110",
    "cardHeight: 150",
    "borderRadius: 12",
    "overlap: 38",
    "arc: { maxRotationDeg: 5, droopPx: 14 }",
    "hover: { liftPx: 8, scale: 1.05 }",
    "selectLiftPx: 10",
    'glowColor: "rgba(255,255,255,0.85)"',
    "function ge(e, n, r)",
    "function Me(e, n, r)",
    "function Bn(e, n)",
    "function be(e, n)",
    "const ne = F.cardWidth",
    "Gn = 57",
    "Un = 49",
    "zn = 2.45",
    "Wn = 138",
    "Vn = 1.25",
    "Kn = 132",
    "ke = 2",
    "Xn = 2",
    "Yn = 1.25",
    "qn = (q + it + F.selectLiftPx) / q",
    "function ct(e, n, r)",
    "function Zn(e, n)",
  ]) {
    assert(shipped.includes(marker), `shipped Cake Duel card/layout marker changed: ${marker}`);
  }

  for (const marker of [
    'peach: "#F8A678"',
    'peachDeep: "#D68B52"',
    'peachLight: "#ECBE80"',
    'cream: "#fff8ef"',
    'creamDark: "#f0e4d0"',
    'sky: "#8AB7E1"',
    'brown: "#6b4830"',
    'brownLight: "#a07050"',
    'pink: "#e899a8"',
    'gold: "#e8c73a"',
  ]) {
    assert(shippedSizeHelper.includes(marker), `shipped Cake Duel palette marker changed: ${marker}`);
  }

  for (const marker of [
    "CAKEDUEL_PALETTE",
    "CAKEDUEL_DEFAULT_HAND_CONFIG",
    "cardWidth: 110",
    "cardHeight: 150",
    "borderRadius: 12",
    "overlap: 38",
    "arc: { maxRotationDeg: 5, droopPx: 14 }",
    "hover: { liftPx: 8, scale: 1.05 }",
    "selectLiftPx: 10",
    "deriveCakeDuelResponsiveLayout",
    "tallHeightScale < 0.66",
    "compact ? 0.85 : 1",
    "Math.max(0.5",
    "MAX_HAND_SCALE = 2",
    "HAND_HIGH_RES_THRESHOLD = 1.25",
    "getCakeDuelHandArcPosition",
    "getCakeDuelCardShadow",
    "getCakeDuelHandIndex",
    "reorderCakeDuelCards",
    "reconcileCakeDuelCardOrder",
    "sameCakeDuelCardOrder",
  ]) {
    assert(source.includes(marker), `source Cake Duel card/layout recovery missing marker: ${marker}`);
  }

  for (const marker of [
    "CakeDuelLayoutContext",
    "CakeDuelLayoutProvider",
    "CakeDuelMeasuredLayout",
    "useElementSize<HTMLDivElement>()",
    "deriveCakeDuelResponsiveLayout(size.width, size.height)",
    "data-cakeduel-layout-root",
    "useCakeDuelLayout",
  ]) {
    assert(context.includes(marker), `source Cake Duel layout context missing marker: ${marker}`);
  }

  console.log("[ok] Cake Duel card geometry, hand ordering and responsive layout match shipped contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
