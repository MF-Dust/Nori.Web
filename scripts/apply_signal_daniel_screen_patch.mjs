import fs from "node:fs";

function replaceExact(path, label, before, after) {
  const source = fs.readFileSync(path, "utf8");
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  fs.writeFileSync(path, source.replace(before, after));
}

replaceExact(
  "frontend-src/features/catalog.ts",
  "messenger catalog boundary",
`    maintenanceModules: [
      "apps/messenger.ts",
      "apps/signal-presentation.tsx",
      "components/markdown-body.tsx",
      "screens/messenger-screen.tsx",
      "services/artifacts.ts",
      "services/manifold.ts",
    ],
    status: "ui-partial",
  },
  {
    feature: "signal",`,
`    maintenanceModules: [
      "apps/messenger.ts",
      "apps/signal-daniel.ts",
      "apps/signal-presentation.tsx",
      "components/markdown-body.tsx",
      "screens/messenger-screen.tsx",
      "services/artifacts.ts",
      "services/manifold.ts",
    ],
    status: "ui-recovered",
  },
  {
    feature: "signal",`,
);

replaceExact(
  "frontend-src/features/catalog.ts",
  "signal catalog boundary",
`    maintenanceModules: [
      "apps/signal-presentation.tsx",
      "services/signal.ts",
      "screens/messenger-screen.tsx",
      "screens/signal-login-screen.tsx",
      "screens/signal-reset-screen.tsx",
      "screens/signal-temp-password-screen.tsx",
    ],
    status: "ui-partial",
  },`,
`    maintenanceModules: [
      "apps/signal-daniel.ts",
      "apps/signal-presentation.tsx",
      "services/signal.ts",
      "screens/messenger-screen.tsx",
      "screens/signal-login-screen.tsx",
      "screens/signal-reset-screen.tsx",
      "screens/signal-temp-password-screen.tsx",
    ],
    status: "ui-recovered",
  },`,
);

replaceExact(
  "frontend-src/migration/cutover-status.ts",
  "Signal Messenger cutover boundary",
`  { id: "signal-messenger", complete: false, note: "Signal Messenger and broader chat/media presentation still need migration." },`,
`  { id: "signal-messenger", complete: true, note: "Signal Messenger presentation and the Daniel service-thread state machine are source-owned; story facts and jump cursor remain explicit host inputs." },`,
);

replaceExact(
  "package.json",
  "cutover check command",
`    "frontend:cutover:check": "node scripts/verify_frontend_cutover.mjs && node scripts/inspect_signal_messenger_runtime.mjs",`,
`    "frontend:cutover:check": "node scripts/verify_frontend_cutover.mjs",`,
);

replaceExact(
  ".github/workflows/cloudflare-worker.yml",
  "Daniel inspection artifact",
`          FRONTEND_IDENTIFIER_CONTEXT=8000 FRONTEND_IDENTIFIER_STATEMENT=30000 FRONTEND_IDENTIFIER_MATCHES=160 node scripts/inspect_frontend_identifier.mjs NormalApp- KL gV Ktt Xtt cY MY wHe pHe yHe xHe > frontend-cutover-inspection/signal-messenger-runtime.json
`,
``,
);

for (const path of [
  "scripts/inspect_signal_messenger_runtime.mjs",
  "scripts/apply_signal_daniel_screen_patch.mjs",
  ".github/workflows/apply-signal-daniel.yml",
]) {
  if (fs.existsSync(path)) fs.unlinkSync(path);
}

console.log("Signal Messenger recovery boundary finalized and temporary evidence tooling removed.");
