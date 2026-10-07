import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { debugText, DEBUG_ZH } from "../../frontend-src/i18n/debug";
import { NetworkDebugLab, ComputeDebugLab, ScenarioDebugLab } from "../../frontend-src/screens/debug-labs";
import { SceneEditorChannels } from "../../frontend-src/screens/scene-editor-channels";
import { SceneEditorStructure } from "../../frontend-src/screens/scene-editor-structure";
import { SCENE_EDITOR_SAMPLE } from "../../frontend-src/story/scene-project";
import { DEBUG_GAME_SCENARIOS } from "../../frontend-src/runtime/debug-tools";
import { DEBUG_REACTION_GROUPS } from "../../frontend-src/screens/debug-reactions-tab";

function withChinese(run: () => void) {
  const document = Object.getOwnPropertyDescriptor(globalThis, "document");
  const storage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: { lang: "zh-CN" } } });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } });
  try { run(); } finally {
    if (document) Object.defineProperty(globalThis, "document", document); else delete globalThis.document;
    if (storage) Object.defineProperty(globalThis, "localStorage", storage); else delete globalThis.localStorage;
  }
}

test("Debug copy localizes Chinese and keeps English and technical identifiers", () => {
  assert.equal(debugText("Connection", "zh_CN"), "连接");
  assert.equal(debugText("Connection", "en"), "Connection");
  assert.equal(debugText("notification.debug.push", "zh-CN"), "notification.debug.push");
  for (const entry of DEBUG_GAME_SCENARIOS) assert.ok(DEBUG_ZH[entry.label], entry.label);
  for (const group of DEBUG_REACTION_GROUPS) {
    assert.ok(DEBUG_ZH[group.label], group.label);
    for (const entry of group.entries) {
      assert.ok(DEBUG_ZH[entry.label], entry.label);
      if (entry.note) assert.ok(DEBUG_ZH[entry.note], entry.note);
    }
  }
});

test("Debug panels render Chinese controls and scene select values remain protocol values", () => {
  withChinese(() => {
    const network = renderToStaticMarkup(<NetworkDebugLab />);
    assert.match(network, /网络测试/);
    assert.match(network, /应用并重新加载/);
    assert.doesNotMatch(network, /Network lab|Profiles apply/);
    assert.match(renderToStaticMarkup(<ComputeDebugLab />), /算力模块未加载/);
    const scenarios = renderToStaticMarkup(<ScenarioDebugLab />);
    assert.match(scenarios, /请选择游戏场景/);
    assert.match(scenarios, /当前方双重攻击对手/);
    const channels = renderToStaticMarkup(<SceneEditorChannels project={SCENE_EDITOR_SAMPLE} disabled={false} onChange={() => true} />);
    assert.match(channels, /摄像机与环境通道/);
    assert.match(channels, /value="inherit"[^>]*selected/);
    assert.doesNotMatch(channels, /value="继承"|value="自动"|value="指定值"/);
    const structure = renderToStaticMarkup(<SceneEditorStructure project={{ ...SCENE_EDITOR_SAMPLE, audio: [{ id: "test", src: "/audio/test.ogg", at: 0, until: 1, kind: "music" }] }} disabled={false} onChange={() => true} />);
    assert.match(structure, /阶段与音轨/);
    assert.match(structure, /value="music"/);
    assert.doesNotMatch(structure, /value="音乐"/);
  });
});
