import { spawnSync } from "node:child_process";

const exportsToInspect = [
  "aS", "aM", "bT", "bU", "bV", "bW", "bX", "bY", "bZ", "b_", "b$",
  "c0", "c1", "c2", "c3", "aY", "c4", "c5", "c6", "c7", "c8", "c9",
  "ca", "cb", "cc", "cd",
].join(",");

const result = spawnSync(
  process.execPath,
  ["scripts/inspect_frontend_chunk.mjs", "NormalApp-"],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      FRONTEND_INSPECT_EXPORTS: exportsToInspect,
      FRONTEND_INSPECT_DEPTH: "2",
      FRONTEND_INSPECT_SNIPPET: "16000",
    },
  },
);

if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
process.stdout.write("\n--- Signal Messenger NormalApp evidence ---\n");
process.stdout.write(result.stdout);
