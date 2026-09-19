import React from "react";
import { createRoot } from "react-dom/client";
import { PreviewScreen } from "../frontend-src/screens/preview-screen";
import type { FilesAppModel } from "../frontend-src/apps/files";
import "../frontend-src/styles/app.css";

const kind = new URLSearchParams(location.search).get("kind") ?? "pdf";
const model = {
  presentation: async () => ({
    files: [
      {
        id: "fixture",
        kind,
        content:
          "**bold** <clue>clue</clue> <red>red</red>\n<script>literal</script>",
        items: [
          { nori: true, t: "A source-owned log entry." },
          { nori: false, t: "A second entry." },
          { k: "poem", t: "First line\nSecond line" },
        ],
        name: "Preview fixture",
        pdfSrc: "/preview-fixture.pdf",
      },
    ],
    vaults: [],
  }),
  emitFact: async () => {},
} as unknown as FilesAppModel;
createRoot(document.getElementById("root")!).render(
  <PreviewScreen
    model={model}
    locale="en"
    fileId="fixture"
    instanceId="preview:test"
    appId="preview"
    windowType="main"
    setTitle={(title) => {
      document.title = title;
    }}
    focus={() => {}}
    close={() => {}}
  />,
);
