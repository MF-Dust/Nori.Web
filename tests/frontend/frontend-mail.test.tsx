import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Children, isValidElement, type ReactNode } from "react";
import {
  MailAppModel,
  formatMailListDate,
  formatMailReaderDate,
  isMailRead,
  type MailMessage,
} from "../../frontend-src/apps/mail";
import { signalStoryTimestampFromEpoch } from "../../frontend-src/apps/signal-story-clock";
import { MarkdownBody } from "../../frontend-src/components/markdown-body";
import { VaultSheet } from "../../frontend-src/components/vault-sheet";
import { createSourceTranslate } from "../../frontend-src/i18n/translate";
import { ManifoldService } from "../../frontend-src/services/manifold";
import {
  MailComposeRefusal,
  MailReader,
  MailRow,
  scheduleMailDownload,
  type MailScreenRuntime,
} from "../../frontend-src/screens/mail-screen";

const pack = JSON.parse(readFileSync("backend/data/live_world_pack.json", "utf8"));
const t = createSourceTranslate("en");
const tick = async () => { for (let i = 0; i < 4; i++) await Promise.resolve(); };
const modelFor = (artifacts: unknown[]) => new MailAppModel({ mail: async () => artifacts } as never, {} as never);
const artifact = (id: string, data: object = {}, surfacedAt = 0) => ({
  id, type: "mail", surfacedAt,
  data: { from: "Ada <ada@example.test>", subject: id, body_md: id, ...data },
});
const message = (patch: Partial<MailMessage> = {}): MailMessage => ({
  id: "fixture", folder: "inbox", from: { name: "Ada", email: "ada@example.test" },
  to: "我 <me@manifold.institute>", date: "2026-08-31T09:05:00", subject: "Subject", body: "Body",
  self: false, read: false, readFact: "fixture.read", attachments: [], raw: {}, ...patch,
});

function elements(node: ReactNode): Array<{ type: unknown; props: any }> {
  const result: Array<{ type: unknown; props: any }> = [];
  Children.forEach(node, (child) => {
    if (isValidElement<{ children?: ReactNode }>(child)) result.push(child, ...elements(child.props.children));
  });
  return result;
}

function text(node: ReactNode): string {
  return Children.toArray(node).map((child) => isValidElement<{ children?: ReactNode }>(child)
    ? text(child.props.children) : String(child)).join("");
}

test("Mail normalizes shipped pack images, sender addresses, default recipient and missing dates", async () => {
  const mails = await modelFor(pack.mail_artifacts).messages((fact) => Object.hasOwn(pack.facts, fact));
  const help = mails.find((mail) => mail.id === "mail.help")!;
  assert.deepEqual(help.from, { name: "未知发件人", email: "???" });
  assert.equal(help.to, "我 <me@manifold.institute>");
  assert.deepEqual(help.attachments[0], {
    id: "mail.help:0", kind: "image", filename: "房间.jpg",
    src: "/webAssets/mail/unknown-room-4a1441343515.jpg", width: 650, height: 405,
  });
  const helpArtifact = pack.mail_artifacts.find((item: any) => item.id === help.id);
  assert.equal(help.date, signalStoryTimestampFromEpoch(helpArtifact.surfacedAt));
  assert.equal(help.read, true);
  for (const mail of mails) assert.ok(Number.isFinite(new Date(mail.date).getTime()), mail.id);
  const qfr = mails.find((mail) => mail.id === "mail.act2_hinge")!;
  assert.deepEqual(qfr.attachments[0], {
    id: "mail.act2_hinge:0", kind: "download", filename: "QFR-9000.exe", sizeBytes: 2415104,
    downloadFact: "qfr.downloaded",
  });
  const archive = mails.find((mail) => mail.id === "mail.acq_strategic")!;
  assert.deepEqual(archive.from, { name: "strategic@futurum.tech", email: "strategic@futurum.tech" });
  assert.equal(archive.read, true, "mail without read_fact is already read");
});

test("Mail parses empty sender names and falls back to the current story clock without surfacedAt", async (context) => {
  const epoch = new Date(2032, 2, 5, 15, 16, 17).getTime();
  context.mock.method(Date, "now", () => epoch);
  const [mail] = await modelFor([artifact("fallback", { from: " <only@example.test>" })]).messages();
  assert.deepEqual(mail.from, { name: "only@example.test", email: "only@example.test" });
  assert.equal(mail.date, signalStoryTimestampFromEpoch(epoch));
});

test("Mail ordering uses surfacedAt, then local story date, then reverse input index", async () => {
  const mails = await modelFor([
    artifact("archive", { date: "2030-01-01T00:00:00" }),
    artifact("surface-old", { date: "2030-01-01T00:00:00" }, 1),
    artifact("surface-new", { date: "2000-01-01T00:00:00" }, 2),
    artifact("date-old", { date: "2026-08-31T09:00:00-05:00" }, 1),
    artifact("tie-first", { date: "2026-08-31T09:01:00+05:00" }, 1),
    artifact("tie-last", { date: "2026-08-31T09:01:00+05:00" }, 1),
  ]).messages();
  assert.deepEqual(mails.map((mail) => mail.id), [
    "surface-new", "surface-old", "tie-last", "tie-first", "date-old", "archive",
  ]);
});

test("Mail read state follows world facts and local acknowledgement, not raw read flags", async () => {
  const facts = new Set<string>();
  const hasFact = (fact: string) => facts.has(fact);
  const model = modelFor([
    artifact("historic", { read: false }),
    artifact("unread", { read_fact: "unread.read", read: true }),
  ]);
  let mails = await model.messages(hasFact);
  assert.equal(mails.find((mail) => mail.id === "historic")!.read, true);
  const unread = mails.find((mail) => mail.id === "unread")!;
  assert.equal(unread.read, false);
  assert.equal(isMailRead(unread, hasFact, new Set([unread.id])), true);
  facts.add("unread.read");
  mails = await model.messages(hasFact);
  assert.equal(mails.find((mail) => mail.id === "unread")!.read, true);
  facts.clear();
  assert.equal(isMailRead(unread, hasFact), false, "fact-derived reads are not copied into local acknowledgements");
});

test("Mail list and reader dates use the shipped story calendar and localized formatting", () => {
  const now = new Date(2026, 7, 31, 14, 0);
  for (const [value, options] of [
    ["2026-08-31T09:05:00", { hour: "2-digit", minute: "2-digit" }],
    ["2026-08-28T09:05:00", { weekday: "short" }],
    ["2026-08-01T09:05:00", { month: "short", day: "numeric" }],
  ] as const) {
    const date = new Date(value);
    const expected = "hour" in options ? date.toLocaleTimeString(undefined, options) : date.toLocaleDateString(undefined, options);
    assert.equal(formatMailListDate(value, now), expected);
  }
  for (const locale of ["en", "zh-CN"]) {
    const date = new Date(2026, 7, 31, 9, 5);
    assert.equal(formatMailReaderDate("2026-08-31T09:05:00Z", locale),
      `${date.toLocaleDateString(locale, { month: "long", day: "numeric", weekday: "long" })}, ${date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: locale.startsWith("en") })}`);
  }
  assert.equal(formatMailListDate("not-a-date", now), "");
  assert.equal(formatMailReaderDate(""), "");
});

test("Mail rows translate shipped subjects and play only the real open-email cue on a new selection", () => {
  const cues: string[] = [], selected: string[] = [];
  const email = message({ subject: "mail.emails.techcorp.subject" });
  const props = { email, t, playCue: (cue: string) => cues.push(cue), onSelect: (id: string) => selected.push(id) };
  const row = MailRow({ ...props, selected: false });
  assert.ok(text(row).includes(t(email.subject)));
  assert.ok(text(row).includes(email.from.name));
  assert.ok(text(row).includes(email.from.email));
  assert.ok(elements(row).some(({ props }) => props.className === "size-2 rounded-full bg-primary"));
  row.props.onClick();
  MailRow({ ...props, selected: true }).props.onClick();
  assert.deepEqual(cues, ["comms-mail-open-email"]);
  assert.deepEqual(selected, [email.id, email.id]);
  assert.ok(text(MailRow({ ...props, email: message({ self: true }), selected: false })).includes(`To: ${email.to}`));
});

test("Mail reader restores sender avatar, recipient, separator, prose and mail.* body translations", () => {
  const email = message({ subject: "mail.emails.techcorp.subject", body: "mail.emails.techcorp.body" });
  const reader = MailReader({ email, runtime: { locale: () => "zh-CN" } as MailScreenRuntime, t });
  assert.ok(text(reader).includes(`To: ${email.to}`));
  assert.ok(text(reader).includes(formatMailReaderDate(email.date, "zh-CN")));
  const rendered = elements(reader);
  assert.ok(rendered.some(({ props }) => props["aria-hidden"] === "true" && props.children === "A"));
  assert.equal(rendered.filter(({ type }) => type === "hr").length, 1);
  const body = rendered.find(({ type }) => type === MarkdownBody)!;
  assert.equal(body.props.markdown, t(email.body));
  assert.match(body.props.className, /prose.*select-text/);
});

test("Mail compose is only the shared refusal sheet with valid localized strings and no form", () => {
  for (const locale of ["en", "zh-CN"]) {
    const translate = createSourceTranslate(locale);
    let closed = 0;
    const onClose = () => closed++;
    const refusal = MailComposeRefusal({ t: translate, onClose });
    assert.equal(refusal.type, VaultSheet);
    assert.equal(refusal.props.sfx, false);
    assert.equal(refusal.props.onClose, onClose);
    assert.equal(refusal.props.onEnter, onClose);
    const content = text(refusal);
    for (const key of ["mail.networkError.title", "mail.networkError.body", "mail.networkError.dismiss"]) {
      assert.notEqual(translate(key), key);
      assert.ok(content.includes(translate(key)));
    }
    const rendered = elements(refusal);
    assert.ok(!rendered.some(({ type }) => ["form", "input", "textarea"].includes(String(type))));
    rendered.find(({ type }) => type === "button")!.props.onClick();
    assert.equal(closed, 1);
  }
});

test("Mail download fact waits the full 1800 ms, then notification waits for command success", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const events: string[] = [];
  let finish!: () => void;
  scheduleMailDownload({
    model: { emitDownloadFact: (fact: string) => { events.push(`emit:${fact}`); return new Promise<void>((resolve) => { finish = resolve; }); } } as MailAppModel,
    onDownloaded: (fact, already) => events.push(`notify:${fact}:${already}`),
  }, "qfr.downloaded", () => events.push("complete"), () => assert.fail("unexpected download error"));
  context.mock.timers.tick(1799);
  assert.deepEqual(events, []);
  context.mock.timers.tick(1);
  assert.deepEqual(events, ["emit:qfr.downloaded"]);
  finish();
  await tick();
  assert.deepEqual(events, ["emit:qfr.downloaded", "notify:qfr.downloaded:false", "complete"]);
});

test("Mail cancels a pending download on reader cleanup and does not notify on a failed emission", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const events: string[] = [];
  const runtime = {
    model: { emitDownloadFact: async () => { events.push("emit"); throw new Error("offline"); } } as MailAppModel,
    attachmentDownloadDurationMs: 100,
    onDownloaded: () => assert.fail("failed downloads must not notify"),
  };
  const schedule = () => scheduleMailDownload(runtime, "qfr.downloaded", () => assert.fail("failed download completed"), () => events.push("error"));
  schedule()();
  context.mock.timers.tick(100);
  assert.deepEqual(events, []);
  schedule();
  context.mock.timers.tick(100);
  await tick();
  assert.deepEqual(events, ["emit", "error"]);
});

test("Mail read/download commands preserve shipped payloads and reject backend failure envelopes", async () => {
  const requests: unknown[][] = [];
  let ok = true;
  const manifold = new ManifoldService({ call: async (...args: unknown[]) => {
    requests.push(args); return ok ? { ok: true, result: {} } : { ok: false, error: "offline" };
  } } as never);
  const model = new MailAppModel({} as never, manifold);
  await model.markRead(message());
  await model.emitDownloadFact("qfr.downloaded");
  assert.deepEqual(requests, [
    ["manifold.command.request", { command: "mail.read", payload: { mailId: "fixture" } }, "manifold.command.response"],
    ["manifold.command.request", { command: "client.emitFact", payload: { factId: "qfr.downloaded" } }, "manifold.command.response"],
  ]);
  ok = false;
  await assert.rejects(model.markRead("fixture"), /offline/);
  await assert.rejects(model.emitDownloadFact("qfr.downloaded"), /offline/);
});
