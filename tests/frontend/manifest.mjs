import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { repoRoot } from "../../scripts/lib/paths.mjs";

/**
 * Every frontend node test belongs to exactly one group.
 * frontend-dock-presentation.test.tsx is executed by frontend-runtime.test.ts,
 * which re-exports it, so it has no entry of its own.
 */
export const groups = {
  games: ["tests/frontend/frontend-games.test.ts"],
  runtime: [
    "tests/frontend/frontend-runtime.test.ts",
    "tests/frontend/frontend-notifications.test.ts",
    "tests/frontend/frontend-subscriptions.test.ts",
    "tests/frontend/frontend-browser-extension.test.ts",
    "tests/frontend/frontend-browser-bounty.test.ts",
  ],
  stories: [
    "tests/frontend/frontend-production-stories.test.ts",
    "tests/frontend/frontend-memory-datasea.test.ts",
    "tests/frontend/frontend-monotone-spline.test.ts",
    "tests/frontend/frontend-story-clock.test.ts",
    "tests/frontend/frontend-story-ease.test.ts",
    "tests/frontend/farewell-ending.test.ts",
    "tests/frontend/frontend-cult.test.ts",
  ],
  suites: [
    "tests/frontend/frontend-antivirus.test.ts",
    "tests/frontend/frontend-audio.test.ts",
    "tests/frontend/frontend-chip.test.ts",
    "tests/frontend/frontend-cold-open.test.ts",
    "tests/frontend/frontend-debug-reactions-tab.test.ts",
    "tests/frontend/frontend-debug-system-tabs.test.ts",
    "tests/frontend/frontend-debug-tools.test.ts",
    "tests/frontend/frontend-drain-burst.test.ts",
    "tests/frontend/frontend-head-pat-audio.test.ts",
    "tests/frontend/frontend-idle-marginal-growth.test.ts",
    "tests/frontend/frontend-live2d-debug.test.ts",
    "tests/frontend/frontend-marginal-growth-cache.test.ts",
    "tests/frontend/frontend-marginal-growth-shader.test.ts",
    "tests/frontend/frontend-messenger-interactions.test.ts",
    "tests/frontend/frontend-messenger-model.test.ts",
    "tests/frontend/frontend-nori-scene.test.ts",
    "tests/frontend/frontend-pictionary-hints.test.ts",
    "tests/frontend/frontend-reaction-director.test.ts",
    "tests/frontend/frontend-recovery-gaps.test.ts",
    "tests/frontend/frontend-scene-editor.test.ts",
    "tests/frontend/frontend-scene-transport.test.ts",
    "tests/frontend/frontend-signal-story.test.ts",
    "tests/frontend/frontend-story-feedback.test.ts",
    "tests/frontend/frontend-voice-corruption.test.ts",
    "tests/frontend/frontend-window-localization.test.ts",
  ],
};

export const coveredByReexport = {
  "tests/frontend/frontend-dock-presentation.test.tsx": "tests/frontend/frontend-runtime.test.ts",
};

export function assertCoverage() {
  const files = readdirSync(resolve(repoRoot, "tests", "frontend"))
    .filter((name) => /\.test\.tsx?$/.test(name))
    .map((name) => `tests/frontend/${name}`);
  const listed = new Map();
  for (const [group, entries] of Object.entries(groups)) {
    for (const entry of entries) {
      if (listed.has(entry)) throw new Error(`${entry} is listed in ${listed.get(entry)} and ${group}`);
      listed.set(entry, group);
    }
  }
  for (const file of files) {
    if (!listed.has(file) && !coveredByReexport[file]) throw new Error(`${file} is not in any test group`);
  }
  for (const entry of listed.keys()) {
    if (!files.includes(entry)) throw new Error(`${entry} is listed but does not exist`);
  }
}

assertCoverage();
