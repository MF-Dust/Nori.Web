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

function contextAround(source, marker, radius = 280) {
  const index = source.indexOf(marker);
  if (index < 0) return `<missing ${marker}>`;
  return source.slice(Math.max(0, index - radius), Math.min(source.length, index + marker.length + radius));
}

async function main() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  const normalAppFile = assets.find((file) => file.startsWith("NormalApp-") && file.endsWith(".js"));
  assert(normalAppFile, "missing shipped NormalApp chunk for Cake Duel transient recovery");

  const shipped = await read(path.join("public", "assets", normalAppFile));
  const runtime = await read("frontend-src/apps/cakeduel-runtime.ts");
  const presentation = await read("frontend-src/apps/cakeduel-presentation.tsx");
  const cutover = await read("frontend-src/migration/cutover-status.ts");

  for (const marker of [
    'case "claim_made"',
    'case "pass_made"',
    'case "wolfy_taunt"',
    'case "bout_started"',
    'case "bout_ended"',
    "CHALLENGE_PRE_REVEAL_PAUSE",
    "CHALLENGE_REVEAL_HOLD",
    "revealPileCards",
    "navigateToResults",
    "cakeduel.banner.reason.caughtBluffing",
    "cakeduel.banner.reason.wonChallenge",
    "cakeduel.banner.reason.stoleCakes",
    "cakeduel.banner.reason.bothPassed",
    "cakeduel.banner.reason.mostCakes",
  ]) {
    assert(shipped.includes(marker), `shipped Cake Duel transient marker changed: ${marker}`);
  }

  console.log(`[cakeduel-challenge-flow] ${contextAround(shipped, 'case "challenge_made"', 1_800)}`);

  for (const marker of [
    "CakeDuelTransientBanner",
    "CAKE_DUEL_BANNER_HOLD_MS",
    "CAKE_DUEL_WOLFY_TAUNT_MS",
    "engineEvents(message",
    'raw.type !== "runtime_transition"',
    "transition.events",
    'event.type === "challenge_made"',
    'event.type === "claim_made"',
    'event.type === "pass_made"',
    'event.type === "wolfy_taunt"',
    'event.type === "bout_started"',
    'event.type === "bout_ended"',
    "boutEndReason(events, winner)",
    "this.enqueueBanner({ type: \"challenge\" })",
    "this.showWolfyTaunt()",
    'derivedRoute === "results" && (this.banner !== null || this.bannerQueue.length > 0)',
    "banner: this.banner",
    "wolfyTauntActive: this.wolfyTauntActive",
  ]) {
    assert(runtime.includes(marker), `source Cake Duel transient runtime missing marker: ${marker}`);
  }

  for (const marker of [
    "presentCakeDuelBanner(",
    "cakeDuelPlayerLabel(",
    "buildCakeDuelChallengeRevealBoards(",
    "CAKEDUEL_CHALLENGE_SETTLE_MS",
    "previousSnapshot",
    "challengeRevealBoards",
    "revealedName: game.cardList[card.entityId]",
    "challengeBoards.revealed",
    "suppressBoutEndBanner",
    "banner={displayBanner}",
    "snapshot.wolfyTauntActive && runtime.assets.wolfyFrames",
    "frameImages: runtime.assets.wolfyFrames",
  ]) {
    assert(presentation.includes(marker), `source Cake Duel transient presentation missing marker: ${marker}`);
  }

  assert(cutover.includes('{ id: "games", complete: false'), "Games cutover boundary must remain incomplete");
  assert(cutover.includes("transition-driven banner/Wolfy wiring"), "Cake Duel cutover note must record transient event ownership");

  console.log("[ok] Cake Duel transition events drive source-owned transient banners, challenge reveal pacing and Wolfy presentation");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
