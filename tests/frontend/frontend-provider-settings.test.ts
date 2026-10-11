import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function harness() {
  const events: any[] = [], sent: any[] = [];
  let attempts = 0, failSend = false;
  class Socket {
    static OPEN = 1;
    readyState = 1;
    addEventListener() {}
    send(data: unknown) {
      attempts++;
      if (failSend) throw new Error("transport failed");
      sent.push(typeof data === "string" ? JSON.parse(data) : data);
    }
  }
  const storage = () => {
    const values = new Map();
    return { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key) };
  };
  const context = vm.createContext({
    WebSocket: Socket, URL, console, structuredClone, localStorage: storage(), sessionStorage: storage(),
    window: { dispatchEvent: (event: any) => events.push(event), addEventListener() {} },
    document: { getElementById: () => ({}), querySelectorAll: () => [],
      documentElement: { lang: "en" }, addEventListener() {} },
    navigator: { language: "en" },
    CustomEvent: class { constructor(public type: string, public options: any) {} },
    MutationObserver: class { observe() {} },
  });
  for (const file of ["nori-ai-settings.js", "nori-tts-settings.js"]) {
    vm.runInContext(readFileSync(`public/${file}`, "utf8"), context, { filename: file });
  }
  return { context, sent, events, socket: new Socket(),
    attempts: () => attempts, fail: () => { failSend = true; } };
}
const dispatch = { type: "dispatch", cartridgeId: "chat", actor: "player", requestId: "one",
  expectedHeadVersion: 0, cmd: { type: "playerMessage", text: "hello" } };

test("settings scripts send the latest persona and TTS settings once per chat request", () => {
  const h = harness();
  vm.runInContext(`window.NoriAISettings.save({enabled:true,apiKey:"ai-secret",characterPrompt:"old persona"});
    window.NoriTTSSettings.save({enabled:true,provider:"openai-compatible",profiles:{"openai-compatible":{apiKey:"tts-secret"}},voice:"alloy"});`, h.context);
  h.socket.send(JSON.stringify(dispatch));
  vm.runInContext(`window.NoriAISettings.save({characterPrompt:"new persona"});
    window.NoriTTSSettings.save({voice:"nova"});`, h.context);
  h.socket.send(JSON.stringify({ ...dispatch, requestId: "two" }));
  assert.equal(h.attempts(), 2);
  assert.equal(h.sent[0].noriAiConfig.characterPrompt, "old persona");
  assert.equal(h.sent[1].noriAiConfig.characterPrompt, "new persona");
  assert.equal(h.sent[1].noriAiConfig.apiKey, "ai-secret");
  assert.equal(h.sent[1].noriTtsConfig.apiKey, "tts-secret");
  assert.equal(h.sent[1].noriTtsConfig.voice, "nova");
  h.socket.send(JSON.stringify({ ...dispatch, cmd: { type: "audioDone" } }));
  assert.equal(h.sent[2].noriAiConfig, undefined);
  assert.equal(h.sent[2].noriTtsConfig, undefined);
  assert.ok(!JSON.stringify(h.events).includes("ai-secret"));
  assert.ok(!JSON.stringify(h.events).includes("tts-secret"));
});

test("a transport exception is not swallowed or retried without credentials", () => {
  const h = harness();
  h.fail();
  assert.throws(() => h.socket.send(JSON.stringify(dispatch)), /transport failed/);
  assert.equal(h.attempts(), 1);
  assert.equal(h.sent.length, 0);
});

test("settings attachment errors report failure rather than sending a bare dispatch", () => {
  const h = harness();
  vm.runInContext(`localStorage.getItem = () => '{"characterPrompt":{}}';
    Object.prototype.toString = () => { throw new Error("invalid settings"); };`, h.context);
  assert.throws(() => h.socket.send(JSON.stringify(dispatch)), /invalid settings/);
  assert.equal(h.attempts(), 0);
  assert.ok(h.events.some(event => event.type === "nori:ai-status" && event.options.detail.kind === "error"));
});

test("both entry pages bypass previously cached AI and TTS scripts", () => {
  for (const path of ["public/index.html", "frontend-src/index.html"]) {
    const html = readFileSync(path, "utf8");
    for (const name of ["nori-ai-settings", "nori-tts-settings"]) {
      assert.ok(html.includes(`/${name}.js?v=per-dispatch-2`), `${path}: ${name}`);
    }
  }
});
