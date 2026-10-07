import test from "node:test";
import assert from "node:assert/strict";
import {
  ChipController,
  chipCharge,
  chipAvailability,
} from "../../frontend-src/runtime/chip-controller";
import type { ArcadeClient } from "../../frontend-src/runtime/arcade-client";
import { chipButtonLabel, localizeChipReadout } from "../../frontend-src/i18n/chip-readout";

test("chip readouts explain missing analyses without exposing scan IDs and preserve custom text", () => {
  const cases = [
    ["Fresh readout logged — key=file:test, row=28e79f55aca63c3d", "扫描完成。当前内容暂时没有可用的分析结论。", "Scan complete. No analysis is available for this content yet."],
    ["Archived scan replay — key=page:test, row=bb7d67907910d5d3", "这份内容之前已扫描过，暂时没有可用的分析结论。", "This content was scanned before. No analysis is available yet."],
    ["[signal:test] chip thermal lock — heat 5/5; wait for cooldown", "芯片过热，请等待冷却后再扫描。", "The chip is overheating. Wait for it to cool down before scanning again."],
    ["[chip] manifold link unavailable", "暂时无法连接分析芯片，请检查连接后重试。", "Cannot connect to the analysis chip. Check the connection and try again."],
  ];
  for (const [original, translated, english] of cases) {
    assert.equal(localizeChipReadout(original, "zh-CN"), translated);
    assert.equal(localizeChipReadout(original, "zh_CN"), translated);
    assert.equal(localizeChipReadout(original, "en"), english);
  }
  for (const text of ["自定义分析结果", "Custom readout", "扫描失败；建议重试。", ""]) {
    assert.equal(localizeChipReadout(text, "zh-CN"), text);
    assert.equal(localizeChipReadout(text, "en"), text);
  }
});

test("chip status distinguishes loading, disconnection, offline, ready and cooling", () => {
  assert.equal(chipButtonLabel(null, 0, 0, true, false, "zh-CN"), "正在获取芯片状态…");
  assert.equal(chipButtonLabel(null, 0, 0, false, false, "zh-CN"), "暂时无法连接分析芯片，请检查连接后重试。");
  assert.equal(chipButtonLabel(null, 0, 0, true, true, "zh-CN"), "分析芯片离线");
  const full = { capacity: 2, heat: 0, coolEveryMs: 60000, serverNowMs: 1000 };
  assert.equal(chipButtonLabel(full, 1000, 1000, true, false, "en"), "Chip charge: 2/2 scans");
  assert.equal(chipButtonLabel({ ...full, heat: 2, nextCoolAtMs: 61000 }, 1000, 1000, true, false, "zh-CN"), "散热中；约 1 分钟后可扫描");
});

class ChipTransport {
  connectionState = "open";
  messages = new Set<(message: any) => void>();
  states = new Set<(state: any) => void>();
  sent: any[] = [];
  onMessage(listener: (message: any) => void) {
    this.messages.add(listener);
    return () => {
      this.messages.delete(listener);
    };
  }
  onState(listener: (state: any) => void) {
    this.states.add(listener);
    listener(this.connectionState);
    return () => {
      this.states.delete(listener);
    };
  }
  send(message: any) {
    this.sent.push(message);
  }
  reply(request: any, payload: unknown) {
    this.messages.forEach((listener) =>
      listener({
        type: "event",
        channel: request.channel + ".result",
        requestId: request.requestId,
        payload,
      }),
    );
  }
}
const status = {
  capacity: 3,
  heat: 1,
  coolEveryMs: 1000,
  nextCoolAtMs: 5000,
  serverNowMs: 4500,
};
const target = {
  instanceId: "preview:1",
  appId: "preview",
  windowType: "main",
  contentKey: "file:test",
  title: "Test",
  x: 10,
  y: 20,
  width: 400,
  height: 300,
};
const tick = async () => {
  for (let index = 0; index < 8; index++) await Promise.resolve();
};
test("chip charge uses server skew, cools multiple slots and stops at capacity", () => {
  assert.deepEqual(chipCharge(status, 10000, 10200), {
    charges: 2,
    capacity: 3,
    nextChargeInMs: 300,
  });
  assert.deepEqual(chipCharge(status, 10000, 10500), {
    charges: 3,
    capacity: 3,
    nextChargeInMs: 0,
  });
  assert.equal(chipCharge({ ...status, heat: 3 }, 10000, 11500).charges, 2);
  assert.equal(chipCharge({ ...status, heat: 3 }, 10000, 20000).charges, 3);
  assert.equal(chipAvailability("browser", false), "low_power");
  assert.equal(chipAvailability("browser", true), "ready");
  assert.equal(chipAvailability("preview", false), "ready");
  assert.equal(chipAvailability("settings", true), "unscannable");
});
test("chip enforces scan/fried pacing, refreshes status and releases subscriptions", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 10000 });
  const transport = new ChipTransport();
  const controller = new ChipController(
    transport as unknown as ArcadeClient,
    () => "Failed",
  );
  t.after(() => controller.dispose());
  controller.configure("world-a", true);
  transport.reply(transport.sent.at(-1), status);
  await tick();
  assert.equal(controller.toggle(), true);
  const scan = controller.scan(target);
  assert.equal(controller.snapshot().phase, "scanning");
  await tick();
  assert.deepEqual(transport.sent.at(-1).payload, {
    appId: "preview",
    windowType: "main",
    contentKey: "file:test",
    title: "Test",
    content: "",
  });
  transport.reply(transport.sent.at(-1), { kind: "fried", text: "Overheated" });
  await tick();
  t.mock.timers.tick(1399);
  await tick();
  assert.equal(controller.snapshot().fried, false);
  t.mock.timers.tick(1);
  await tick();
  assert.equal(controller.snapshot().fried, true);
  t.mock.timers.tick(699);
  await tick();
  assert.equal(controller.snapshot().readout, null);
  t.mock.timers.tick(1);
  await scan;
  assert.equal(controller.snapshot().readout?.text, "Overheated");
  assert.equal(controller.snapshot().phase, "idle");
  assert.equal(transport.sent.at(-1).channel, "manifold.chip.status");
  controller.dispose();
  assert.equal(transport.messages.size, 0);
  assert.equal(transport.states.size, 0);
});
test("chip discards old scan/status replies after world switches and interruption", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 10000 });
  const transport = new ChipTransport();
  const controller = new ChipController(
    transport as unknown as ArcadeClient,
    () => "Failed",
  );
  t.after(() => controller.dispose());
  controller.configure("world-a", true);
  transport.reply(transport.sent.at(-1), status);
  await tick();
  controller.toggle();
  const scan = controller.scan(target);
  const oldScan = transport.sent.at(-1);
  controller.configure("world-b", true);
  transport.reply(oldScan, { kind: "readout", text: "Old world" });
  await scan;
  assert.equal(controller.snapshot().readout, null);
  assert.equal(controller.snapshot().status, null);
  transport.reply(transport.sent.at(-1), status);
  await tick();
  controller.toggle();
  const interrupted = controller.scan(target);
  const request = transport.sent.at(-1);
  controller.configure("world-b", false);
  transport.reply(request, { kind: "readout", text: "Interrupted" });
  await interrupted;
  assert.equal(controller.snapshot().readout, null);
  assert.equal(controller.toggle(), false);
});

test("a scene cancels an in-flight chip scan and prevents reentry until released", async t => {
  const { NoriSceneStore } = await import("../../frontend-src/state/nori-scene");
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 10000 });
  const scene = new NoriSceneStore(), transport = new ChipTransport();
  const controller = new ChipController(transport as unknown as ArcadeClient, () => "Failed", scene);
  t.after(() => controller.dispose());
  controller.configure("world", true); transport.reply(transport.sent.at(-1), status); await tick();
  assert.equal(controller.toggle(), true);
  const scan = controller.scan(target), request = transport.sent.at(-1);
  const lease = scene.acquire(); lease.set({ active: true });
  assert.equal(controller.snapshot().phase, "idle");
  assert.equal(controller.toggle(), false);
  transport.reply(request, { kind: "readout", text: "Late scene result" }); await scan;
  assert.equal(controller.snapshot().readout, null);
  lease.set({ active: false, chatMode: "bubbles" }); assert.equal(controller.toggle(), false);
  lease.release(); assert.equal(controller.toggle(), true);
});
