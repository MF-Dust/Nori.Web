import assert from "node:assert/strict";
import test from "node:test";
import {
  createBrowserFrameBridge,
  fetchBrowserAssetData,
} from "../../frontend-src/apps/browser-page-runtime";

test("asset bridge rejects URL escapes before fetch and returns legitimate assets", async (t) => {
  const host = Object.assign(new EventTarget(), {
    location: new URL("https://nori.test/app/"),
  });
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: host });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else delete (globalThis as any).window;
  });
  const fetched: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    fetched.push(String(url));
    return new Response("asset", { headers: { "content-type": "image/png" } });
  });
  const replies: unknown[] = [];
  const frame = { postMessage: (message: unknown) => replies.push(message) };
  const bridge = createBrowserFrameBridge({
    iframe: { contentWindow: frame } as unknown as HTMLIFrameElement,
    hostWindow: host as unknown as Window,
    allowedCommands: [],
    invokeCommand: async () => assert.fail("unexpected command"),
    onNavigate: () => assert.fail("unexpected navigation"),
  });
  t.after(() => bridge.dispose());
  const request = (urls: unknown[]) => {
    const event = new MessageEvent("message", {
      data: { __arcade: true, type: "assets-request", urls },
    });
    Object.defineProperty(event, "source", { value: frame });
    host.dispatchEvent(event);
  };

  const denied = [
    "/webAssets/../api/entry-status",
    "/webAssets/%2e%2e/api/entry-status",
    "/webAssets/%2E%2E/api/entry-status",
    "/webAssets/.%2e/api/entry-status",
    "/webAssets/%2e./api/entry-status",
    "/webAssets/%2e%2e%2fapi/entry-status",
    "/webAssets/%2E%2E%5Capi/entry-status",
    "/webAssets/%2fapi/entry-status",
    "/webAssets/%5capi/entry-status",
    "/webAssets/%252e%252e/api/entry-status",
    "/webAssets/%252e%252e%252fapi/entry-status",
    "/webAssets/%25252e%25252e%25255capi/entry-status",
    "/webAssets/%25%32%65%25%32%65/api/entry-status",
    "/webAssets/\\%2e%2e\\api/entry-status",
    "/webAssets-elsewhere/image.png",
    "/api/entry-status",
    "//other.test/webAssets/image.png",
    "https://other.test/webAssets/image.png",
  ];
  request([...denied, null, 42]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(fetched, [], "iframe requests must not fetch outside the allowlist");
  assert.deepEqual(replies, [], "denied requests must not return API bodies to the iframe");
  for (const url of denied) assert.equal(await fetchBrowserAssetData(url), null, url);
  assert.deepEqual(fetched, [], "direct asset callers must use the same guard");

  const allowed = [
    "/webAssets/image.png",
    "/webAssets/icons/./logo%2Epng",
    "/webAssets/%E7%8C%AB%20photo.png?v=1&label=%25%2F",
  ];
  request(allowed);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(fetched, allowed.map((url) => new URL(url, host.location).href));
  assert.deepEqual(replies, allowed.map((url) => ({
    __arcade: true,
    type: "asset-data",
    url,
    dataUri: `data:image/png;base64,${btoa("asset")}`,
  })));
});
