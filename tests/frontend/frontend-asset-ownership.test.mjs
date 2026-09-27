import { test } from "node:test";
import assert from "node:assert/strict";
import { historicalAssetReferences } from "../../scripts/lib/frontend_asset_ownership.mjs";

const assets = ["OtherScreen-abc.js", "app-old.css"];
test("ownership rejects arbitrary historical chunks, dynamic imports and query suffixes", () => {
  assert.deepEqual(historicalAssetReferences('import("/assets/OtherScreen-abc.js?v=1");', assets), ["OtherScreen-abc.js"]);
  assert.deepEqual(historicalAssetReferences('const script = "/assets/OtherScreen-abc.js";', assets), ["OtherScreen-abc.js"]);
});
test("ownership checks CSS and HTML entry points", () => {
  assert.deepEqual(historicalAssetReferences('<link href="/assets/app-old.css"><script src="/assets/OtherScreen-abc.js"></script>', assets), assets.slice().sort());
  assert.deepEqual(historicalAssetReferences('@import "/assets/app-old.css";', assets), ["app-old.css"]);
});
test("provenance comments and independent model assets remain allowed", () => {
  assert.deepEqual(historicalAssetReferences('// Reference: OtherScreen-abc.js\nconst model = "/ARGNori_web/ARGNori.model3.json";', assets), []);
});
