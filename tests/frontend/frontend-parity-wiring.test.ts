import assert from "node:assert/strict";
import test from "node:test";
import { createSignalAuthentication, SIGNAL_ACCOUNT_NAME } from "../../frontend-src/apps/signal-auth";
import { noriOcclusionFraction, NORI_AVATAR } from "../../frontend-src/live2d/occlusion-avatar";
import { isNoriViewportTooSmall } from "../../frontend-src/components/viewport-guard";

test("Signal unlock authenticates a mounted login and resets on world change", () => {
  let worldId: string | null = "first";
  let unlocked = false;
  const worldListeners = new Set<() => void>();
  const authentication = createSignalAuthentication({
    getWorldId: () => worldId,
    authSignalPresent: () => unlocked,
    subscribe: (listener) => { worldListeners.add(listener); return () => { worldListeners.delete(listener); }; },
  });
  let observed = false;
  const release = authentication.subscribe(() => { observed = authentication.snapshot(); });
  assert.equal(authentication.snapshot(), false);
  unlocked = true;
  worldListeners.forEach((listener) => listener());
  assert.equal(observed, true);
  unlocked = false;
  assert.equal(authentication.snapshot(), true, "login lasts for the current world");
  worldId = "second";
  worldListeners.forEach((listener) => listener());
  assert.equal(observed, false);
  authentication.setAuthenticated(true);
  assert.equal(observed, true);
  worldId = null;
  assert.equal(authentication.snapshot(), false);
  release();
  assert.equal(worldListeners.size, 0);
  assert.equal(SIGNAL_ACCOUNT_NAME, "+1 (555) 0••-••••");
});

test("Nori occlusion samples the window union and has the shipped avatar dimensions", () => {
  const model = { x: 100, y: 100, width: 120, height: 240 };
  const left = { ...model, width: 60 };
  const right = { ...model, x: 160, width: 60 };
  assert.equal(noriOcclusionFraction(model, []), 0);
  assert.equal(noriOcclusionFraction(model, [left, left]), 0.5);
  assert.equal(noriOcclusionFraction(model, [left, right]), 1);
  assert.equal(noriOcclusionFraction({ ...model, width: 0 }, [model]), 0);
  assert.equal(NORI_AVATAR.width, 144);
  assert.equal(NORI_AVATAR.delayMs, 200);
});

test("viewport guard uses the shipped 1024 by 512 minimum", () => {
  assert.equal(isNoriViewportTooSmall(1024, 512), false);
  assert.equal(isNoriViewportTooSmall(1023, 900), true);
  assert.equal(isNoriViewportTooSmall(1366, 511), true);
});
