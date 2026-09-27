import test from "node:test";
import assert from "node:assert/strict";
import { settleBountyExtensionInstall } from "../../frontend-src/apps/browser-extension-install";

test("bounty extension acceptance emits the shipped fact before resolving true", async () => {
  const facts: string[] = [];
  const result = await settleBountyExtensionInstall(
    {
      async emitFact(factId: string) {
        facts.push(factId);
      },
    },
    true,
  );
  assert.equal(result, true);
  assert.deepEqual(facts, ["bounty.ext_installed"]);
});

test("bounty extension cancellation emits no fact", async () => {
  let calls = 0;
  const result = await settleBountyExtensionInstall(
    {
      async emitFact() {
        calls++;
      },
    },
    false,
  );
  assert.equal(result, false);
  assert.equal(calls, 0);
});

test("accepted bounty install mirrors shipped best-effort persistence", async () => {
  const result = await settleBountyExtensionInstall(
    {
      async emitFact() {
        throw new Error("offline");
      },
    },
    true,
  );
  assert.equal(result, true);
});
