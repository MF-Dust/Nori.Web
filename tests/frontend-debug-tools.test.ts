import test from "node:test";
import assert from "node:assert/strict";
import { HeadPat } from "../frontend-src/live2d/head-pat";
import { createSourceIdleRuntimeEngine } from "../frontend-src/state/idle-runtime-engine";
import {
  FLAKY_WEBSOCKET_STORAGE_KEY,
  NETWORK_FAULT_PRESETS,
  computeGrantToTarget,
  createNetworkFaultWebSocketFactory,
  identifyNetworkFaultPreset,
  normalizeNetworkFaultProfile,
  readNetworkFaultProfile,
  simulateQualifyingHeadPat,
  writeNetworkFaultProfile,
} from "../frontend-src/runtime/debug-tools";

class FakeSocket extends EventTarget {
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  binaryType: BinaryType = "blob";
  bufferedAmount = 0;
  extensions = "";
  protocol = "";
  readyState = this.OPEN;
  url = "ws://debug.test";
  sent: unknown[] = [];
  send(data: unknown) {
    this.sent.push(data);
  }
  close() {
    this.readyState = this.CLOSED;
    this.dispatchEvent(new Event("close"));
  }
}

test("debug network profiles preserve shipped presets and clamp custom values", () => {
  assert.equal(identifyNetworkFaultPreset(NETWORK_FAULT_PRESETS.mild), "mild");
  assert.deepEqual(
    normalizeNetworkFaultProfile({
      enabled: true,
      minLatencyMs: 900,
      maxLatencyMs: 100,
      dropIncomingRate: 2,
      dropOutgoingRate: -1,
      randomDisconnectChance: Number.NaN,
      randomDisconnectIntervalMs: 50,
    }),
    {
      enabled: true,
      log: true,
      minLatencyMs: 900,
      maxLatencyMs: 900,
      dropIncomingRate: 0.5,
      dropOutgoingRate: 0,
      randomDisconnectChance: 0,
      randomDisconnectIntervalMs: 1_000,
    },
  );
});

test("debug network persistence rejects malformed data and clears explicitly", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  values.set(FLAKY_WEBSOCKET_STORAGE_KEY, "{");
  assert.equal(readNetworkFaultProfile(storage), null);
  writeNetworkFaultProfile(storage, NETWORK_FAULT_PRESETS.severe);
  assert.equal(
    identifyNetworkFaultPreset(readNetworkFaultProfile(storage)),
    "severe",
  );
  writeNetworkFaultProfile(storage, null);
  assert.equal(values.has(FLAKY_WEBSOCKET_STORAGE_KEY), false);
});

test("compute targets only grant positive deltas and gesture simulation uses the real recognizer", () => {
  assert.equal(computeGrantToTarget(40, 100), 60);
  assert.equal(computeGrantToTarget(100, 40), 0);
  assert.equal(computeGrantToTarget(Number.NaN, 40), 0);
  assert.equal(simulateQualifyingHeadPat(new HeadPat()), true);
});

test("network fault socket applies outgoing and incoming drop decisions", async () => {
  const droppedSocket = new FakeSocket();
  const dropped = createNetworkFaultWebSocketFactory(
    {
      enabled: true,
      log: false,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      dropIncomingRate: 0.5,
      dropOutgoingRate: 0.5,
      randomDisconnectChance: 0,
      randomDisconnectIntervalMs: 1_000,
    },
    {
      createWebSocket: () => droppedSocket as unknown as WebSocket,
      random: () => 0,
    },
  )(droppedSocket.url);
  let incoming = 0;
  dropped.addEventListener("message", () => incoming++);
  dropped.send("outgoing");
  droppedSocket.dispatchEvent(
    new MessageEvent("message", { data: "incoming" }),
  );
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(droppedSocket.sent, []);
  assert.equal(incoming, 0);

  const deliveredSocket = new FakeSocket();
  const delivered = createNetworkFaultWebSocketFactory(
    {
      enabled: true,
      log: false,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      dropIncomingRate: 0,
      dropOutgoingRate: 0,
      randomDisconnectChance: 0,
      randomDisconnectIntervalMs: 1_000,
    },
    {
      createWebSocket: () => deliveredSocket as unknown as WebSocket,
      random: () => 0.75,
    },
  )(deliveredSocket.url);
  const messages: unknown[] = [];
  delivered.addEventListener("message", (event) =>
    messages.push((event as MessageEvent).data),
  );
  delivered.send("outgoing");
  deliveredSocket.dispatchEvent(
    new MessageEvent("message", { data: "incoming" }),
  );
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(deliveredSocket.sent, ["outgoing"]);
  assert.deepEqual(messages, ["incoming"]);
});

test("idle debug actions mutate the production run state and ledger", () => {
  const idle = createSourceIdleRuntimeEngine();
  idle.debug.grant(100);
  assert.equal(idle.debug.current(), 100);
  assert.equal(idle.snapshot().state.maxComputeThisRun, 100);

  idle.debug.grantFactionCoins(100);
  assert.deepEqual(idle.snapshot().state.factionCoins, {
    elf: 100,
    angel: 100,
    goblin: 100,
    demon: 100,
  });
  assert.equal(idle.snapshot().state.totalFactionCoinsFound, 400);

  idle.debug.maxAll();
  assert.ok(
    Object.values(idle.snapshot().state.owned).every((owned) => owned >= 50),
  );
  assert.equal(idle.snapshot().state.productiveClicks, 50);
  idle.debug.advanceTime(60);
  assert.equal(idle.snapshot().state.currentEraSeconds, 60);

  idle.debug.reset();
  assert.equal(idle.debug.current(), 0);
  assert.deepEqual(idle.snapshot().state.factionCoins, {});
  assert.equal(idle.snapshot().state.productiveClicks, 0);
  idle.dispose();
});
