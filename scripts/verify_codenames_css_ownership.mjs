#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const sources = await Promise.all(
    [
      "frontend-src/screens/codenames-board.tsx",
      "frontend-src/screens/codenames-clue-overlay.tsx",
      "frontend-src/screens/codenames-flying-card.tsx",
      "frontend-src/screens/codenames-help-overlay.tsx",
      "frontend-src/screens/codenames-key-card.tsx",
    ].map(async (relativePath) => [relativePath, await read(relativePath)]),
  );

  // css-ownership is still incomplete and the source app consumes the shipped
  // stylesheet. Keep presentation-only colors that were not emitted by that
  // stylesheet out of Codenames until the project owns CSS generation itself.
  const unownedUtilities = [
    "bg-emerald-950",
    "bg-emerald-950/50",
    "bg-stone-950/70",
    "text-stone-100",
    "text-amber-200",
    "text-amber-300",
    "text-amber-400",
    "text-amber-950",
    "border-amber-300/30",
    "border-amber-900/30",
    "border-amber-950/30",
    "border-emerald-700/40",
    "border-red-950/60",
    "border-slate-400/30",
    "bg-red-800",
    "bg-slate-950/70",
    "bg-amber-100",
    "bg-amber-200/60",
    "bg-amber-400/40",
    "bg-emerald-700/60",
    "text-amber-50",
    "text-red-900",
  ];

  for (const [relativePath, source] of sources) {
    for (const utility of unownedUtilities) {
      assert(!source.includes(utility), `${relativePath} reintroduced unowned shipped-CSS utility: ${utility}`);
    }
  }

  const keyCard = sources.find(([relativePath]) => relativePath.endsWith("codenames-key-card.tsx"))?.[1] ?? "";
  const help = sources.find(([relativePath]) => relativePath.endsWith("codenames-help-overlay.tsx"))?.[1] ?? "";
  const clue = sources.find(([relativePath]) => relativePath.endsWith("codenames-clue-overlay.tsx"))?.[1] ?? "";

  for (const marker of [
    "linear-gradient(175deg, oklch(0.48 0.06 60)",
    "linear-gradient(145deg, oklch(0.78 0.12 80)",
    "disabled={!active}",
  ]) {
    assert(keyCard.includes(marker), `Codenames key card shipped-style marker missing: ${marker}`);
  }
  for (const marker of [
    'canopy: "#1a2418"',
    'undergrowth: "#243320"',
    'background: "rgba(16, 24, 14, 0.55)"',
    "blur(10px) saturate(110%)",
  ]) {
    assert(help.includes(marker), `Codenames help shipped-style marker missing: ${marker}`);
  }
  for (const marker of [
    "ClueCountSeal",
    "linear-gradient(to bottom, hsl(145 40% 50%), hsl(145 35% 40%))",
    "radial-gradient(ellipse 80% 70% at 30% 25%",
  ]) {
    assert(clue.includes(marker), `Codenames clue shipped-style marker missing: ${marker}`);
  }

  console.log("[ok] Codenames presentation avoids utilities unavailable in the shipped stylesheet");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
