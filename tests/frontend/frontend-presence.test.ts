import test from "node:test";
import assert from "node:assert/strict";
import { PresenceClient, PRESENCE_PATH } from "../../frontend-src/runtime/presence";

test("presence heartbeats publish the online count and survive failures", async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  let reply: unknown = { online: 3, intervalMs: 60_000 };
  const client = new PresenceClient((async (path: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ path: String(path), init });
    if (reply instanceof Error) throw reply;
    return reply;
  }) as never);
  const seen: Array<number | null> = [];
  client.subscribe(() => seen.push(client.snapshot().online));
  assert.equal(client.snapshot().online, null);
  await client.refresh();
  assert.equal(calls.length, 0, "nothing is sent before start()");
  client.start();
  await client.refresh();
  assert.equal(calls[0].path, PRESENCE_PATH);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(client.snapshot().online, 3);
  assert.equal(client.snapshot().status, "ok");
  reply = new Error("offline");
  await client.refresh();
  assert.equal(client.snapshot().online, 3, "a failed heartbeat keeps the last count");
  assert.equal(client.snapshot().status, "failed");
  reply = { online: -2.5 };
  await client.refresh();
  assert.equal(client.snapshot().online, 0);
  assert.deepEqual(seen, [3, 3, 0]);
  client.dispose();
});
