import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  bindOsNotifications,
  computeCapForFacts,
  createArrivalTracker,
  formatComputeAmount,
  mailPreviewText,
  mailSenderName,
  DOWNLOAD_NOTIFICATION_TARGETS,
  QFR_COLD_VOLUME_FOLDER,
  type OsMailArtifact,
  type OsNotificationOptions,
  type OsRecoveredFile,
} from "../../frontend-src/runtime/os-notifications";
import { createNotificationStore, type NotificationInput } from "../../frontend-src/state/notification-store";
import { createParadigmRevealStore } from "../../frontend-src/state/paradigm-reveal-store";
import { RECOVERED_FEATURES } from "../../frontend-src/features/catalog";
import { idleInitializationCueSchedule } from "../../frontend-src/screens/idle-initialization-sequence";
import { idleGeneratorAccent } from "../../frontend-src/screens/idle-toasts";

const translate = (key: string, values: Readonly<Record<string, string | number>> = {}) =>
  Object.keys(values).length ? `${key}:${JSON.stringify(values)}` : key;

function harness(initialFacts: string[] = [], world: string | null = "w1") {
  let facts = new Set(initialFacts);
  let worldId = world;
  let exclusive = false;
  let idleVisible = false;
  let mail: OsMailArtifact[] = [];
  let files: OsRecoveredFile[] = [];
  const factListeners = new Set<() => void>();
  const artifactListeners = new Set<{ types: readonly string[]; listener: () => void }>();
  const exclusiveListeners = new Set<() => void>();
  const loads = { mail: 0, files: 0 };
  const pushed: NotificationInput[] = [];
  const dismissed: string[] = [];
  const opened: unknown[] = [];
  const activated: string[] = [];
  const focused: string[] = [];
  const paradigm: boolean[] = [];
  let decrypts = 0;
  const options: OsNotificationOptions = {
    translate,
    push: (input) => {
      pushed.push(input);
      return String(pushed.length);
    },
    dismissByKey: (key) => dismissed.push(key),
    getWorldId: () => worldId,
    getFacts: () => facts,
    subscribeFacts: (listener) => {
      factListeners.add(listener);
      return () => factListeners.delete(listener);
    },
    subscribeArtifactTypes: (types, listener) => {
      const entry = { types, listener };
      artifactListeners.add(entry);
      return () => artifactListeners.delete(entry);
    },
    isExclusive: () => exclusive,
    subscribeExclusive: (listener) => {
      exclusiveListeners.add(listener);
      return () => exclusiveListeners.delete(listener);
    },
    isStoryActive: () => false,
    isIdleVisible: () => idleVisible,
    activateApp: (appId) => activated.push(appId),
    openFiles: (target) => opened.push(target),
    focusMail: (mailId) => focused.push(mailId),
    showParadigmToast: (value) => paradigm.push(value.muteSound),
    startQfrDecrypt: () => {
      decrypts++;
    },
    loadMail: async () => {
      loads.mail++;
      return mail;
    },
    loadRecoveredFiles: async () => {
      loads.files++;
      return files;
    },
  };
  const binding = bindOsNotifications(options);
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  /** A world change or an unhinted fact invalidates every type; a hinted fact only its own. */
  const invalidate = async (types?: readonly string[]) => {
    for (const entry of [...artifactListeners])
      if (!types || entry.types.some((type) => types.includes(type))) entry.listener();
    await settle();
  };
  return {
    loads: () => ({ ...loads }),
    invalidate,
    binding,
    pushed,
    dismissed,
    opened,
    activated,
    focused,
    paradigm,
    decrypts: () => decrypts,
    settle,
    async setFacts(next: string[], nextWorld: string | null = worldId) {
      facts = new Set(next);
      worldId = nextWorld;
      for (const listener of factListeners) listener();
      await invalidate();
    },
    /** Facts whose `changedArtifactTypes` hint names only these artifact types. */
    async setHintedFacts(next: string[], types: readonly string[]) {
      facts = new Set(next);
      for (const listener of factListeners) listener();
      await invalidate(types);
    },
    setExclusive(value: boolean) {
      exclusive = value;
      for (const listener of exclusiveListeners) listener();
    },
    setIdleVisible(value: boolean) {
      idleVisible = value;
    },
    setMail(next: OsMailArtifact[]) {
      mail = next;
    },
    setFiles(next: OsRecoveredFile[]) {
      files = next;
    },
    facts: () => [...facts],
  };
}

test("arrival tracker baselines the first enabled observation per key", () => {
  const tracker = createArrivalTracker();
  assert.deepEqual(tracker.update("a", ["x"], false), []);
  assert.deepEqual(tracker.update("a", ["x"]), []);
  assert.deepEqual(tracker.update("a", ["x", "y"]), ["y"]);
  assert.deepEqual(tracker.update("a", ["x", "y"]), []);
  assert.deepEqual(tracker.update("b", ["x", "y", "z"]), [], "a new key is a new baseline");
  assert.deepEqual(tracker.update("b", ["z", "q"]), ["q"]);
});

test("compute cap and amount formatting follow the shipped Lj/Oy rules", () => {
  assert.equal(computeCapForFacts(() => false), 1e10);
  assert.equal(computeCapForFacts((fact) => fact === "arg.seal_released" || fact === "arg.honeypot_access"), 1e25);
  assert.equal(computeCapForFacts((fact) => fact === "arg.memory.shown"), 0);
  assert.equal(computeCapForFacts((fact) => fact === "arg.manifold_unlocked" || fact === "arg.memory.shown"), Infinity);
  assert.equal(formatComputeAmount(1234567.9), "1,234,567");
  assert.equal(formatComputeAmount(1e15), "1.00e15");
  assert.equal(formatComputeAmount(Infinity), "∞");
  assert.equal(formatComputeAmount(-5), "-5");
});

test("mail preview helpers match the shipped Yje/Zje", () => {
  assert.equal(mailSenderName("Ada Lovelace <ada@example.com>"), "Ada Lovelace");
  assert.equal(mailSenderName("<ops@example.com>"), "ops@example.com");
  assert.equal(mailSenderName("plain"), "plain");
  assert.equal(mailPreviewText("# Hi **there**\n> quoted [link](https://x)\n```\ncode\n```\n`tick`"), "Hi there quoted link tick");
});

test("existing facts are a baseline; new facts raise the shipped desktop notifications", async () => {
  const h = harness(["system.repaired", "arg.seal_released"]);
  await h.settle();
  assert.equal(h.pushed.length, 0, "facts present at bind time never notify");

  await h.setFacts([...h.facts(), "gesture.chess", "gesture.pictionary"]);
  const gesture = h.pushed.filter((item) => item.title === "os.gestureWarning.title");
  assert.equal(gesture.length, 2);
  assert.equal(gesture[1].subtitle, 'os.gestureWarning.subtitle:{"done":2,"total":4}');
  assert.equal(gesture[0].sfx, "arg-gesture-warning-toast");

  await h.setFacts([...h.facts(), "qfr.installed"]);
  const qfr = h.pushed.at(-1)!;
  assert.equal(qfr.title, "os.qfr.installedTitle");
  assert.equal(qfr.accentColor, "#4ee0c8");
  assert.equal(h.decrypts(), 1);
  assert.deepEqual(h.opened.at(-1), { folderPath: QFR_COLD_VOLUME_FOLDER });
  h.binding.dispose();
});

test("system.repaired after the baseline raises the repair toast", async () => {
  const h = harness(["mail.help.read"]);
  await h.setFacts(["mail.help.read", "system.repaired"]);
  assert.deepEqual(
    h.pushed.map((item) => [item.title, item.subtitle, item.accentColor]),
    [["os.repair.title", "os.repair.subtitle", "#5eead4"]],
  );
  h.binding.dispose();
});

test("cap bumps defer while an exclusive app runs and keep the cap from arrival time", async () => {
  const h = harness([]);
  h.setExclusive(true);
  await h.setFacts(["arg.cult_truth"]);
  assert.equal(h.pushed.length, 0);
  await h.setFacts(["arg.cult_truth", "arg.memory.shown"]);
  h.setExclusive(false);
  assert.equal(h.pushed.length, 1);
  assert.equal(h.pushed[0].title, 'os.capBump.title:{"cap":"1.00e15"}');
  h.pushed[0].onClick?.();
  assert.deepEqual(h.activated, ["idle"]);
  h.binding.dispose();
});

test("paradigm reveal fires on the due edge after Idle initialization", async () => {
  const h = harness(["act3.paradigm_reveal.due"]);
  await h.setFacts(["act3.paradigm_reveal.due", "compute.initialized"]);
  assert.equal(h.pushed.length, 0, "already-due at initialization is the baseline");

  const fresh = harness(["compute.initialized"]);
  fresh.setIdleVisible(true);
  await fresh.setFacts(["compute.initialized", "act3.paradigm_reveal.due"]);
  assert.equal(fresh.pushed.length, 1);
  assert.equal(fresh.pushed[0].sfx, null, "the in-screen toast owns the sound while Idle is visible");
  assert.deepEqual(fresh.paradigm, [false]);

  const hidden = harness(["compute.initialized"]);
  await hidden.setFacts(["compute.initialized", "act3.paradigm_reveal.due"]);
  assert.equal(hidden.pushed[0].sfx, undefined);
  assert.deepEqual(hidden.paradigm, [true]);

  const complete = harness(["compute.initialized", "idle.manifold_complete"]);
  await complete.setFacts(["compute.initialized", "idle.manifold_complete", "act3.paradigm_reveal.due"]);
  assert.equal(complete.pushed.length, 0);
  for (const item of [h, fresh, hidden, complete]) item.binding.dispose();
});

test("download notifications use the shipped table and already flag", async () => {
  const h = harness([]);
  h.binding.download("unknown.fact");
  h.binding.download(42);
  assert.equal(h.pushed.length, 0);
  h.binding.download("qfr.downloaded");
  h.binding.commandCompleted("client.emitFact", { factId: "paper.downloaded" }, { ok: true, emitted: false });
  h.binding.commandCompleted("client.emitFact", { factId: "ftclr.downloaded" }, { ok: true }, true);
  h.binding.commandCompleted("client.emitFact", { factId: "cult.zip.downloaded" }, { ok: true });
  h.binding.commandCompleted("browser.navigate", { factId: "qfr.downloaded" }, {});
  assert.deepEqual(
    h.pushed.map((item) => [item.title, item.subtitle]),
    [
      ["os.download.title", "QFR-9000.exe"],
      ["os.download.already", "MI-substrate-preprint.pdf"],
      ["os.download.already", "FT-CLR-Q3-311.pdf"],
      ["os.download.title", "宇宙真相.zip"],
    ],
  );
  assert.equal(h.pushed[0].sfx, "webapps-browser-download-complete");
  h.pushed[3].onClick?.();
  assert.deepEqual(h.opened, [DOWNLOAD_NOTIFICATION_TARGETS["cult.zip.downloaded"].target]);
  h.binding.dispose();
});

test("mail arrivals notify after the first load and drop when read", async () => {
  const h = harness([]);
  const mail = (id: string, readFact?: string): OsMailArtifact => ({
    id,
    data: { subject: `S ${id}`, from: `Sender ${id} <${id}@x>`, body_md: `**Body** ${id}`, ...(readFact ? { read_fact: readFact } : {}) },
  });
  h.setMail([mail("m1", "mail.m1.read")]);
  await h.setFacts([]);
  assert.equal(h.pushed.length, 0, "the first mail list is the baseline");

  h.setMail([mail("m1", "mail.m1.read"), mail("m2", "mail.m2.read"), { id: "bad", data: { subject: 1 } }]);
  await h.setFacts(["tick"]);
  assert.equal(h.pushed.length, 1);
  assert.deepEqual(
    [h.pushed[0].appId, h.pushed[0].title, h.pushed[0].subtitle, h.pushed[0].body, h.pushed[0].dismissKey, h.pushed[0].sfx],
    ["mail", "Sender m2", "S m2", "Body m2", "mail:m2", "comms-mail-arrival"],
  );
  h.pushed[0].onClick?.();
  assert.deepEqual(h.focused, ["m2"]);

  h.binding.mailRead("m2");
  assert.ok(h.dismissed.includes("mail:m2"));
  await h.setFacts(["tick", "mail.m1.read"]);
  assert.ok(h.dismissed.includes("mail:m1"));
  h.binding.dispose();
});

test("file recovery notifications are silenced between Manifold unlock and completion", async () => {
  const h = harness([]);
  h.setFiles([{ id: "a", name: "A", folderPath: "docs" }]);
  await h.setFacts([]);
  h.setFiles([{ id: "a", name: "A", folderPath: "docs" }, { id: "b", name: "B", folderPath: "docs" }]);
  await h.setFacts(["arg.manifold_unlocked"]);
  assert.equal(h.pushed.length, 0);
  h.setFiles([...[{ id: "a", name: "A", folderPath: "docs" }, { id: "b", name: "B", folderPath: "docs" }], { id: "c", name: "C", folderPath: "x" }]);
  await h.setFacts(["arg.manifold_unlocked", "idle.manifold_complete"]);
  assert.equal(h.pushed.length, 1);
  assert.equal(h.pushed[0].subtitle, 'files.recovery.notifySubtitle:{"name":"C"}');
  h.pushed[0].onClick?.();
  assert.deepEqual(h.opened, [{ folderPath: "x", selectKey: "file:c" }]);
  h.binding.dispose();
});

test("a world change starts a new baseline", async () => {
  const h = harness([]);
  await h.setFacts(["system.repaired"], "w2");
  assert.equal(h.pushed.length, 0);
  await h.setFacts(["system.repaired", "gesture.chess"], "w2");
  assert.equal(h.pushed.length, 1);
  h.binding.dispose();
});

test("mail and file artifacts reload only when their own type is invalidated", async () => {
  const h = harness([]);
  await h.settle();
  const base = h.loads();
  assert.deepEqual(base, { mail: 1, files: 1 }, "the first load of each part happens at bind time");

  await h.invalidate(["mail"]);
  assert.deepEqual(h.loads(), { mail: 2, files: 1 });
  await h.invalidate(["file"]);
  assert.deepEqual(h.loads(), { mail: 2, files: 2 });
  await h.invalidate(["signal_thread", "signal_message", "app"]);
  assert.deepEqual(h.loads(), { mail: 2, files: 2 });
  await h.invalidate();
  assert.deepEqual(h.loads(), { mail: 3, files: 3 }, "an unhinted change reloads both");
  h.binding.dispose();
});

test("a hinted fact dismisses read mail at once and reloads only the hinted artifact type", async () => {
  const h = harness([]);
  h.setMail([{ id: "m1", data: { subject: "S", from: "Sender <s@x>", body_md: "b", read_fact: "mail.m1.read" } }]);
  await h.setFacts([]);
  const before = h.loads();
  await h.setHintedFacts(["mail.m1.read"], ["mail"]);
  assert.ok(h.dismissed.includes("mail:m1"), "the facts subscription dismisses the toast without a reload");
  assert.deepEqual(h.loads(), { mail: before.mail + 1, files: before.files });
  h.binding.dispose();
});

test("a mail reload and a file reload in flight together do not cancel each other", async () => {
  const h = harness([]);
  const mail = (id: string): OsMailArtifact => ({ id, data: { subject: id, from: `S <${id}@x>`, body_md: id } });
  const file = (id: string): OsRecoveredFile => ({ id, name: id, folderPath: "docs" });
  h.setMail([mail("m1")]);
  h.setFiles([file("a")]);
  await h.setFacts([]);
  assert.equal(h.pushed.length, 0, "the first lists are the baseline");
  h.setMail([mail("m1"), mail("m2")]);
  h.setFiles([file("a"), file("b")]);
  await h.invalidate(["mail", "file"]);
  assert.deepEqual(h.pushed.map((item) => item.appId).sort(), ["files", "mail"]);
  h.binding.dispose();
});

test("notification sfx null is silent and keyed dismissal does not cue", () => {
  const cues: string[] = [];
  const store = createNotificationStore({ playCue: (cue) => cues.push(cue), now: () => 0 });
  store.push({ title: "silent", sfx: null, dismissKey: "k" });
  store.push({ title: "default" });
  store.dismissByKey("k");
  assert.deepEqual(cues, ["comms-notify-toast-in"]);
  assert.equal(store.snapshot().queue.length, 1);
});

test("paradigm reveal store mutes only the next sound and clears its own token", () => {
  const store = createParadigmRevealStore();
  store.show({ muteSound: true });
  store.show();
  assert.equal(store.snapshot().token, 2);
  assert.equal(store.consumeSoundMute(), true);
  assert.equal(store.consumeSoundMute(), false);
  store.clear(1);
  assert.equal(store.snapshot().token, 2);
  store.clear(2);
  assert.equal(store.snapshot().token, 0);
});

test("Idle initialization cues follow the shipped Js schedule", () => {
  const schedule = idleInitializationCueSchedule();
  assert.deepEqual(schedule[0], { at: 0.06, cue: "idle-boot-tick", options: { pitch: 0.8 } });
  assert.ok(schedule.every((item, index) => index === 0 || schedule[index - 1].at <= item.at));
  assert.deepEqual(schedule.filter((item) => item.cue === "idle-boot-line").map((item) => item.at), [0.52, 1.02, 1.46]);
  assert.deepEqual(
    schedule.filter((item) => item.cue !== "idle-boot-tick" && item.cue !== "idle-boot-line").map((item) => [item.at, item.cue]),
    [[1.86, "idle-boot-charge"], [2.28, "idle-boot-ignite"], [2.46, "idle-boot-shine"], [2.62, "idle-boot-stamp"], [3.18, "idle-boot-out"]],
  );
  const steps = schedule.filter((item) => item.cue === "idle-boot-tick").slice(1);
  assert.ok(steps.length > 1);
  assert.equal(steps[0].options?.pitch, 0.9);
  assert.ok(steps.every((item) => item.options?.volume === 0.8));
  assert.equal(idleGeneratorAccent({ alignment: "universal" }), "#94a3b8");
  assert.equal(idleGeneratorAccent({ alignment: "accelerate" }), "#f87171");
});

test("every shipped chunk has a feature owner and every listed module exists", () => {
  const chunks = readdirSync("public/assets").filter((name) => /\.(?:js|css)$/.test(name));
  const unowned = chunks.filter(
    (chunk) => !RECOVERED_FEATURES.some((feature) => feature.shippedChunkPatterns.some((pattern) => pattern.test(chunk))),
  );
  assert.deepEqual(unowned, []);
  const missing = RECOVERED_FEATURES.flatMap((feature) =>
    feature.maintenanceModules.filter((module) => !existsSync(join("frontend-src", module))),
  );
  assert.deepEqual(missing, []);
});
