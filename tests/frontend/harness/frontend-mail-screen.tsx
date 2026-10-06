import { useState } from "react";
import { createRoot } from "react-dom/client";
import { mail_artifacts } from "../../../backend/data/live_world_pack.json";
import { MailAppModel } from "../../../frontend-src/apps/mail";
import { MailScreen, type MailScreenRuntime } from "../../../frontend-src/screens/mail-screen";
import { createSourceTranslate } from "../../../frontend-src/i18n/translate";
import { ManifoldService } from "../../../frontend-src/services/manifold";
import "../../../frontend-src/styles/app.css";

const artifacts = mail_artifacts.filter((mail) => [
  "mail.help", "mail.act2_hinge", "mail.acq_strategic", "mail.researcher_decline",
].includes(mail.id));
const facts = new Set<string>();
const listeners = new Set<() => void>();
let locale = "en";
let failDownload = false;
const metrics = {
  commands: [] as Array<{ command: string; payload: any; at: number }>,
  cues: [] as string[],
  read: [] as string[],
  downloaded: [] as string[],
  contentKey: null as string | null,
};
const refresh = () => listeners.forEach((listener) => listener());
const manifold = new ManifoldService({
  call: async (_channel: string, { command, payload }: { command: string; payload: any }) => {
    metrics.commands.push({ command, payload, at: Date.now() });
    if (command === "client.emitFact" && failDownload) return { ok: false, error: "offline" };
    if (command === "mail.read") {
      const fact = artifacts.find((mail) => mail.id === payload.mailId)?.data.read_fact;
      if (fact) facts.add(fact);
    } else if (command === "client.emitFact") facts.add(payload.factId);
    refresh();
    return { ok: true, result: {} };
  },
} as never);
const runtime: MailScreenRuntime = {
  model: new MailAppModel({ mail: async () => artifacts } as never, manifold),
  hasFact: (fact) => facts.has(fact),
  locale: () => locale,
  translate: (key, values) => createSourceTranslate(locale)(key, values),
  subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  playCue: (cue) => metrics.cues.push(cue),
  onMailRead: (mailId) => metrics.read.push(mailId),
  onDownloaded: (factId) => metrics.downloaded.push(factId),
  setContentKey: (_instanceId, contentKey) => { metrics.contentKey = contentKey; },
};

function Harness() {
  const [mounted, setMounted] = useState(true);
  const [, rerender] = useState(0);
  Object.assign(window, { mailFixture: {
    metrics,
    mounted: setMounted,
    locale: (value: string) => { locale = value; rerender((value) => value + 1); },
    fact: (fact: string, present: boolean) => { if (present) facts.add(fact); else facts.delete(fact); refresh(); },
    failDownload: (value: boolean) => { failDownload = value; },
  } });
  return mounted ? <MailScreen runtime={runtime} instanceId="mail-fixture" /> : null;
}

createRoot(document.getElementById("root")!).render(<Harness />);
