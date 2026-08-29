import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  [
    "scripts/inspect_frontend_identifier.mjs",
    "NormalApp-",
    "KL",
    "gV",
    "Ktt",
    "Xtt",
    "cY",
    "MY",
    "wHe",
    "pHe",
    "yHe",
    "xHe",
  ],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      FRONTEND_IDENTIFIER_CONTEXT: "8000",
      FRONTEND_IDENTIFIER_STATEMENT: "30000",
      FRONTEND_IDENTIFIER_MATCHES: "160",
    },
  },
);

if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
process.stdout.write("\n--- Signal Messenger helper evidence ---\n");
process.stdout.write(result.stdout);
