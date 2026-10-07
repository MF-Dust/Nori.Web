import test from "node:test";
import assert from "node:assert/strict";
import { WorldStore } from "../../frontend-src/runtime/world-store";
import { ChatRuntimeController } from "../../frontend-src/apps/chat-runtime";
import { GameCartridgeController } from "../../frontend-src/apps/game-cartridge-controller";
import { localizeVersionConflict } from "../../frontend-src/i18n/user-error";

function runtime(headVersion: number, state: Record<string, unknown> = { lines: [], presentationMode: "text" }) {
  return { visibilityFenceId: "ui", headVersion, visibleVersion: headVersion, state };
}
function harness(cartridgeId = "chat") {
  const world = new WorldStore(), sent: any[] = [];
  const arcade = { connectionState: "open", onState: () => () => {}, send() {},
    dispatch(cartridge: string, version: number, command: unknown) {
      const id = "r" + sent.length; sent.push({ id, cartridge, version, command }); return id;
    } };
  const join = () => world.consume({ type: "world_joined", world: { worldId: "world", mountedCartridges: [{ cartridgeId, runtimes: [runtime(7)] }] } } as any);
  return { world, sent, arcade, join };
}

test("head versions never regress and resynchronized snapshots fence already-applied patches", () => {
  const h = harness(); h.join();
  h.world.consume({ type: "visibility_fence_advanced_ack", cartridgeId: "chat", visibilityFenceId: "ui", headVersion: 10, visibleVersion: 7 } as any);
  h.world.consume({ type: "runtime_transition", cartridgeId: "chat", version: 8, transition: { patches: [{ op: "add", path: "/marker", value: 8 }] } } as any);
  assert.equal(h.world.runtime("chat")!.headVersion, 10);
  assert.equal(h.world.runtime("chat")!.state.marker, 8, "advertised head must not skip unapplied state");
  h.world.consume({ type: "visibility_fence_advanced_ack", cartridgeId: "chat", visibilityFenceId: "ui", headVersion: 7, visibleVersion: 6 } as any);
  assert.equal(h.world.runtime("chat")!.headVersion, 10);
  h.world.consume({ type: "dispatch_ack", cartridgeId: "chat", success: false, errorCode: "version_mismatch", runtimes: [runtime(12, { marker: 12 })] } as any);
  h.world.consume({ type: "runtime_transition", cartridgeId: "chat", version: 9, transition: { patches: [{ op: "replace", path: "/marker", value: 9 }] } } as any);
  h.world.consume({ type: "cartridge_mounted_ack", cartridgeId: "chat", runtimes: [runtime(7, { marker: 7 })] } as any);
  assert.equal(h.world.runtime("chat")!.headVersion, 12);
  assert.equal(h.world.runtime("chat")!.state.marker, 12);
});

test("chat retries an explicitly rejected version conflict once using the fresh snapshot", async t => {
  const h = harness(), chat = new ChatRuntimeController(h.world, h.arcade as any);
  t.after(() => chat.dispose()); h.join();
  const message = chat.send("hello");
  h.world.consume({ type: "dispatch_ack", cartridgeId: "chat", requestId: h.sent[0].id, success: false, errorCode: "version_mismatch", runtimes: [runtime(10)] } as any);
  assert.equal(h.sent.length, 2); assert.equal(h.sent[1].version, 10);
  assert.deepEqual(h.sent[1].command, { type: "playerMessage", text: "hello" });
  assert.equal(chat.snapshot().pending, true);
  h.world.consume({ type: "dispatch_ack", cartridgeId: "chat", requestId: h.sent[1].id, success: true } as any);
  assert.equal(await message, true); assert.equal(chat.snapshot().error, null);
  const second = chat.send("again");
  for (const version of [11, 12]) h.world.consume({ type: "dispatch_ack", cartridgeId: "chat", requestId: h.sent.at(-1).id, success: false, errorCode: "version_mismatch", error: "Version mismatch: internal detail", runtimes: [runtime(version)] } as any);
  assert.equal(await second, false); assert.equal(h.sent.length, 4, "retry is bounded");
  assert.equal(chat.snapshot().error, localizeVersionConflict("en"));
  assert.equal(localizeVersionConflict("zh-CN"), "状态已更新，请重试刚才的操作。");
});

test("a game refreshes a version conflict without replaying a move", async t => {
  const h = harness("pictionary"); h.join();
  const games = { dispatch: (_game: string, command: unknown) => h.arcade.dispatch("pictionary", h.world.runtime("pictionary")!.headVersion, command) };
  const game = new GameCartridgeController("pictionary", games as any, h.world, h.arcade as any, (state: any) => state);
  t.after(() => game.dispose());
  const move = game.dispatch({ type: "skipRound", atMs: 1 });
  h.world.consume({ type: "dispatch_ack", cartridgeId: "pictionary", requestId: h.sent[0].id, success: false, errorCode: "version_mismatch", runtimes: [runtime(10, { marker: 10 })] } as any);
  assert.equal(await move, false); assert.equal(h.sent.length, 1);
  assert.equal(game.snapshot().state.marker, 10);
  assert.equal(game.snapshot().error, localizeVersionConflict("en"));
});
