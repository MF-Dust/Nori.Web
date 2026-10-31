import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function worker() {
  const listeners = {};
  const entries = new Map();
  const fetched = [];
  const self = {
    location: { href: "https://app.example/sw.js?staticOrigin=https%3A%2F%2Fstatic.example", origin: "https://app.example" },
    addEventListener: (name, callback) => { listeners[name] = callback; },
  };
  vm.runInNewContext(source, {
    self, URL,
    caches: { open: async () => ({ match: async (key) => entries.get(key), put: (key, value) => entries.set(key, value) }) },
    fetch: async (request) => { fetched.push(request.url); return new Response("network"); },
  });
  function request(url, options) {
    let result;
    listeners.fetch({ request: new Request(url, options), respondWith: (promise) => { result = promise; } });
    return result;
  }
  return { entries, fetched, request };
}

test("worker reuses cross-origin boot downloads by full URL, never another origin's cache", async () => {
  const w = worker();
  const remote = "https://static.example/ARGNori_web/model.json";
  w.entries.set(remote, new Response("boot bytes"));
  assert.equal(await (await w.request(remote)).text(), "boot bytes");
  assert.equal(w.fetched.length, 0);
  assert.equal(w.request(remote, { cache: "no-store" }), undefined);
  assert.equal(w.request(remote, { headers: { "x-asset-loader": "1" } }), undefined);
  assert.equal(w.request("https://other.example/ARGNori_web/model.json"), undefined);
  assert.equal(w.request("https://static.example/api/auth"), undefined);
  assert.equal(w.request("https://app.example/api/auth"), undefined);
  assert.equal(w.request(remote, { headers: { range: "bytes=0-1" } }), undefined);
  assert.equal(w.request(remote, { method: "POST" }), undefined);
  const fresh = "https://static.example/ocean/water-normal.png";
  assert.equal(await (await w.request(fresh)).text(), "network");
  assert.ok(w.entries.has(fresh));
  assert.equal(w.entries.has("/ocean/water-normal.png"), false);
  w.entries.set("/ocean/water-normal.png", new Response("local bytes"));
  assert.equal(await (await w.request("https://app.example/ocean/water-normal.png")).text(), "local bytes");
});
