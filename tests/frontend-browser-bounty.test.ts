import test from "node:test";
import assert from "node:assert/strict";
import { BrowserAppModel } from "../frontend-src/apps/browser";
import {
  BOUNTY_TARGET_COUNT,
  browserBountyProgress,
} from "../frontend-src/screens/browser-bounty-extension";

test("bounty progress mirrors the shipped six-fact pool with a five-order cap", () => {
  assert.deepEqual(browserBountyProgress(new Set()), {
    count: 0,
    complete: false,
  });
  assert.deepEqual(
    browserBountyProgress(
      new Set([
        "dirt.jack",
        "dirt.daniel",
        "dirt.frank",
        "dirt.maggie",
      ]),
    ),
    { count: 4, complete: false },
  );
  const complete = browserBountyProgress(
    new Set([
      "dirt.jack",
      "dirt.daniel",
      "dirt.frank",
      "dirt.maggie",
      "dirt.hanyue_ssh",
      "dirt.futurum_aleph_obs",
    ]),
  );
  assert.equal(complete.count, BOUNTY_TARGET_COUNT);
  assert.equal(complete.complete, true);
  assert.deepEqual(
    browserBountyProgress(new Set(["arg.honeypot_access"])),
    { count: 0, complete: true },
  );
});

test("BrowserAppModel normalizes bounty submit responses", async () => {
  const model = new BrowserAppModel(
    { files: async () => [] } as never,
    {
      submitBounty: async () => ({ ok: true, fact: "dirt.jack" }),
    } as never,
  );
  assert.deepEqual(await model.submitBounty({ fileId: "receipt.pdf" }), {
    ok: true,
    fact: "dirt.jack",
  });

  const failed = new BrowserAppModel(
    { files: async () => [] } as never,
    { submitBounty: async () => ({ ok: false }) } as never,
  );
  assert.deepEqual(await failed.submitBounty({ url: "https://bad.test/" }), {
    ok: false,
  });
});

test("bounty file picker keeps recovered files and marks unavailable recovery artifacts", async () => {
  const model = new BrowserAppModel(
    {
      files: async () => [
        {
          id: "file-receipt",
          type: "file",
          data: {
            display_path: "下载/receipt.pdf",
            mime: "application/pdf",
            binary_asset_path: "/files/receipt.pdf",
          },
        },
        {
          id: "file-locked",
          type: "file",
          data: {
            display_path: "RSRCH-COLD-VOL/locked.txt",
            mime: "text/plain",
            threshold: 1000000,
          },
        },
      ],
    } as never,
    { submitBounty: async () => ({ ok: false }) } as never,
  );
  assert.deepEqual(await model.bountyFiles(), [
    {
      id: "file-locked",
      name: "locked.txt",
      path: "RSRCH-COLD-VOL/locked.txt",
      locked: true,
    },
    {
      id: "file-receipt",
      name: "receipt.pdf",
      path: "下载/receipt.pdf",
      locked: false,
    },
  ]);
});
